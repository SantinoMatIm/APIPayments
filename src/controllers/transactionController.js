const db = require('../config/database');
const { Transaction, TransactionType, TransactionStatus } = require('../models/Transaction');
const {
  asyncHandler,
  NotFoundError,
  ValidationError,
  PaymentError,
  InsufficientFundsError,
  ForbiddenError
} = require('../middleware/errorHandler');

/**
 * Crea una nueva transacción de pago
 */
const createTransaction = asyncHandler(async (req, res) => {
  const { receiverUserId, amount, description, type = TransactionType.PAYMENT } = req.body;
  const senderUserId = req.user.id;

  // Validar que el remitente no sea el receptor
  if (senderUserId === receiverUserId) {
    throw new ValidationError('No puedes realizarte una transacción a ti mismo');
  }

  // Verificar que el receptor existe
  const receiver = await db.users.findById(receiverUserId);
  if (!receiver) {
    throw new NotFoundError('El receptor no existe');
  }

  // Verificar que el receptor esté activo
  if (receiver.status !== 'active') {
    throw new ValidationError('El receptor no tiene una cuenta activa');
  }

  // Verificar que el remitente tenga fondos suficientes
  const sender = req.user;
  if (!sender.hasSufficientBalance(amount)) {
    throw new InsufficientFundsError(`Saldo insuficiente. Tu saldo actual es $${sender.balance}`);
  }

  // Crear la transacción
  const transaction = new Transaction(senderUserId, receiverUserId, amount, description, type);

  // Guardar la transacción
  await db.transactions.save(transaction);

  // Responder con éxito
  res.status(201).json({
    success: true,
    message: 'Transacción creada exitosamente. Requiere autorización para completarse.',
    data: {
      transaction: transaction.toObject()
    }
  });
});

/**
 * Autoriza una transacción pendiente
 */
const authorizeTransaction = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { authorizationCode } = req.body;
  const userId = req.user.id;

  // Buscar la transacción
  const transaction = await db.transactions.findById(transactionId);
  if (!transaction) {
    throw new NotFoundError('Transacción no encontrada');
  }

  // Verificar que el usuario sea el remitente
  if (transaction.senderUserId !== userId) {
    throw new ForbiddenError('Solo el remitente puede autorizar esta transacción');
  }

  // Verificar que la transacción esté pendiente
  if (transaction.status !== TransactionStatus.PENDING || transaction.isAuthorized) {
    throw new ValidationError('La transacción ya fue autorizada o no está pendiente');
  }

  // Verificar el código de autorización si fue proporcionado
  if (authorizationCode && authorizationCode !== transaction.authorizationCode) {
    throw new ValidationError('Código de autorización inválido');
  }

  // Verificar nuevamente los fondos del remitente
  const sender = await db.users.findById(transaction.senderUserId);
  if (!sender.hasSufficientBalance(transaction.amount)) {
    transaction.fail('Fondos insuficientes');
    await db.transactions.save(transaction);
    throw new InsufficientFundsError('Fondos insuficientes para completar la transacción');
  }

  // Autorizar la transacción
  transaction.authorize();
  await db.transactions.save(transaction);

  // Responder con éxito
  res.status(200).json({
    success: true,
    message: 'Transacción autorizada exitosamente',
    data: {
      transaction: transaction.toObject()
    }
  });
});

/**
 * Procesa una transacción autorizada
 */
const processTransaction = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const userId = req.user.id;

  // Buscar la transacción
  const transaction = await db.transactions.findById(transactionId);
  if (!transaction) {
    throw new NotFoundError('Transacción no encontrada');
  }

  // Verificar que el usuario sea parte de la transacción
  if (transaction.senderUserId !== userId && transaction.receiverUserId !== userId) {
    throw new ForbiddenError('No tienes permiso para procesar esta transacción');
  }

  // Verificar que la transacción pueda ser procesada
  if (!transaction.canBeProcessed()) {
    throw new ValidationError('La transacción no puede ser procesada en su estado actual');
  }

  // Buscar a los usuarios involucrados
  const sender = await db.users.findById(transaction.senderUserId);
  const receiver = await db.users.findById(transaction.receiverUserId);

  if (!sender || !receiver) {
    transaction.fail('Usuario no encontrado');
    await db.transactions.save(transaction);
    throw new NotFoundError('Uno de los usuarios involucrados no existe');
  }

  // Verificar nuevamente los fondos del remitente
  if (!sender.hasSufficientBalance(transaction.amount)) {
    transaction.fail('Fondos insuficientes');
    await db.transactions.save(transaction);
    throw new InsufficientFundsError('Fondos insuficientes para completar la transacción');
  }

  try {
    // Realizar la transferencia de fondos
    sender.updateBalance(-transaction.amount);
    receiver.updateBalance(transaction.amount);

    // Guardar los cambios de los usuarios
    await db.users.save(sender);
    await db.users.save(receiver);

    // Completar la transacción
    transaction.complete();
    await db.transactions.save(transaction);

    // Responder con éxito
    res.status(200).json({
      success: true,
      message: 'Transacción completada exitosamente',
      data: {
        transaction: transaction.toObject(),
        senderBalance: sender.balance,
        receiverBalance: receiver.balance
      }
    });
  } catch (error) {
    // Si algo falla, revertir los cambios y marcar la transacción como fallida
    transaction.fail(error.message);
    await db.transactions.save(transaction);
    throw new PaymentError(`Error al procesar la transacción: ${error.message}`);
  }
});

/**
 * Cancela una transacción pendiente
 */
const cancelTransaction = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const userId = req.user.id;

  // Buscar la transacción
  const transaction = await db.transactions.findById(transactionId);
  if (!transaction) {
    throw new NotFoundError('Transacción no encontrada');
  }

  // Verificar que el usuario sea el remitente
  if (transaction.senderUserId !== userId) {
    throw new ForbiddenError('Solo el remitente puede cancelar esta transacción');
  }

  try {
    // Cancelar la transacción
    transaction.cancel();
    await db.transactions.save(transaction);

    // Responder con éxito
    res.status(200).json({
      success: true,
      message: 'Transacción cancelada exitosamente',
      data: {
        transaction: transaction.toObject()
      }
    });
  } catch (error) {
    throw new ValidationError(error.message);
  }
});

/**
 * Obtiene el historial de transacciones del usuario autenticado
 */
const getTransactionHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, type, startDate, endDate } = req.query;
  const userId = req.user.id;

  // Construir filtros
  const filter = { status, type };

  // Obtener transacciones del usuario
  let transactions = await db.transactions.findByUserId(userId, filter);

  // Filtrar por fechas si se proporcionan
  if (startDate || endDate) {
    transactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.createdAt);
      if (startDate && transactionDate < new Date(startDate)) return false;
      if (endDate && transactionDate > new Date(endDate)) return false;
      return true;
    });
  }

  // Aplicar paginación
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  // Preparar metadata de paginación
  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total: transactions.length,
    totalPages: Math.ceil(transactions.length / limit),
    hasMore: endIndex < transactions.length
  };

  // Agregar información sobre si el usuario es sender o receiver
  const enrichedTransactions = await Promise.all(
    paginatedTransactions.map(async (transaction) => {
      const transactionObj = transaction.toObject();

      // Agregar información del otro usuario
      let otherUser;
      if (transaction.senderUserId === userId) {
        otherUser = await db.users.findById(transaction.receiverUserId);
        transactionObj.role = 'sender';
      } else {
        otherUser = await db.users.findById(transaction.senderUserId);
        transactionObj.role = 'receiver';
      }

      if (otherUser) {
        transactionObj.otherParty = {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email
        };
      }

      return transactionObj;
    })
  );

  // Responder con el historial
  res.status(200).json({
    success: true,
    data: {
      transactions: enrichedTransactions,
      pagination
    }
  });
});

/**
 * Obtiene los detalles de una transacción específica
 */
const getTransactionById = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const userId = req.user.id;

  // Buscar la transacción
  const transaction = await db.transactions.findById(transactionId);
  if (!transaction) {
    throw new NotFoundError('Transacción no encontrada');
  }

  // Verificar que el usuario sea parte de la transacción
  if (transaction.senderUserId !== userId && transaction.receiverUserId !== userId) {
    throw new ForbiddenError('No tienes permiso para ver esta transacción');
  }

  // Obtener información de los usuarios involucrados
  const sender = await db.users.findById(transaction.senderUserId);
  const receiver = await db.users.findById(transaction.receiverUserId);

  // Enriquecer la transacción con información adicional
  const enrichedTransaction = {
    ...transaction.toObject(),
    sender: sender ? sender.toSafeObject() : null,
    receiver: receiver ? receiver.toSafeObject() : null,
    userRole: transaction.senderUserId === userId ? 'sender' : 'receiver'
  };

  // Responder con los detalles
  res.status(200).json({
    success: true,
    data: {
      transaction: enrichedTransaction
    }
  });
});

/**
 * Valida que una transacción esté autorizada antes de procesarla
 */
const validateTransactionAuthorization = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  // Buscar la transacción
  const transaction = await db.transactions.findById(transactionId);
  if (!transaction) {
    throw new NotFoundError('Transacción no encontrada');
  }

  // Verificar que esté autorizada
  const isAuthorized = transaction.isAuthorized;

  res.status(200).json({
    success: true,
    data: {
      isAuthorized,
      transactionId: transaction.id,
      status: transaction.status
    }
  });
});

module.exports = {
  createTransaction,
  authorizeTransaction,
  processTransaction,
  cancelTransaction,
  getTransactionHistory,
  getTransactionById,
  validateTransactionAuthorization
};
