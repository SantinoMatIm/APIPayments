// Importamos la utilidad para generar IDs únicos
const generateId = require('../utils/generateId');

/**
 * Enum para los estados de transacción
 */
const TransactionStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

/**
 * Enum para los tipos de transacción
 */
const TransactionType = {
  PAYMENT: 'payment',
  REFUND: 'refund',
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal'
};

/**
 * Clase que representa una transacción en el sistema
 */
class Transaction {
  /**
   * Constructor de la clase Transaction
   * @param {string} senderUserId - ID del usuario que envía
   * @param {string} receiverUserId - ID del usuario que recibe
   * @param {number} amount - Cantidad de la transacción
   * @param {string} description - Descripción de la transacción
   * @param {string} type - Tipo de transacción
   */
  constructor(senderUserId, receiverUserId, amount, description, type = TransactionType.PAYMENT) {
    this.id = generateId(); // Generamos un ID único para la transacción
    this.senderUserId = senderUserId;
    this.receiverUserId = receiverUserId;
    this.amount = amount;
    this.description = description;
    this.type = type;
    this.status = TransactionStatus.PENDING;
    this.createdAt = new Date();
    this.completedAt = null;
    this.authorizationCode = generateId(); // Código de autorización único
    this.isAuthorized = false;
    this.failureReason = null;
  }

  /**
   * Autoriza la transacción
   */
  authorize() {
    this.isAuthorized = true;
    this.status = TransactionStatus.PENDING;
  }

  /**
   * Marca la transacción como completada
   */
  complete() {
    if (!this.isAuthorized) {
      throw new Error('La transacción debe estar autorizada antes de completarse');
    }
    this.status = TransactionStatus.COMPLETED;
    this.completedAt = new Date();
  }

  /**
   * Marca la transacción como fallida
   * @param {string} reason - Razón del fallo
   */
  fail(reason) {
    this.status = TransactionStatus.FAILED;
    this.failureReason = reason;
  }

  /**
   * Marca la transacción como cancelada
   */
  cancel() {
    if (this.status === TransactionStatus.COMPLETED) {
      throw new Error('No se puede cancelar una transacción completada');
    }
    this.status = TransactionStatus.CANCELLED;
  }

  /**
   * Marca la transacción como reembolsada
   */
  refund() {
    if (this.status !== TransactionStatus.COMPLETED) {
      throw new Error('Solo se pueden reembolsar transacciones completadas');
    }
    this.status = TransactionStatus.REFUNDED;
  }

  /**
   * Valida si la transacción puede procesarse
   * @returns {boolean} true si la transacción puede procesarse
   */
  canBeProcessed() {
    return this.isAuthorized && this.status === TransactionStatus.PENDING;
  }

  /**
   * Convierte la transacción a un objeto para la respuesta
   * @returns {Object} Objeto con los datos de la transacción
   */
  toObject() {
    return {
      id: this.id,
      senderUserId: this.senderUserId,
      receiverUserId: this.receiverUserId,
      amount: this.amount,
      description: this.description,
      type: this.type,
      status: this.status,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      authorizationCode: this.authorizationCode,
      isAuthorized: this.isAuthorized,
      failureReason: this.failureReason
    };
  }
}

module.exports = {
  Transaction,
  TransactionStatus,
  TransactionType
};
