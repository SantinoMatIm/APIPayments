const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Importar controladores y middleware
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateCreateTransaction,
  handleValidationErrors
} = require('../middleware/validation');

/**
 * @route   POST /api/transactions
 * @desc    Crear una nueva transacción
 * @access  Private
 */
router.post(
  '/',
  authenticateToken,
  validateCreateTransaction,
  transactionController.createTransaction
);

/**
 * @route   POST /api/transactions/:transactionId/authorize
 * @desc    Autorizar una transacción pendiente
 * @access  Private (solo el remitente)
 */
router.post(
  '/:transactionId/authorize',
  authenticateToken,
  [
    param('transactionId')
      .trim()
      .notEmpty().withMessage('El ID de la transacción es requerido'),
    body('authorizationCode')
      .optional()
      .trim()
      .notEmpty().withMessage('El código de autorización no puede estar vacío'),
    handleValidationErrors
  ],
  transactionController.authorizeTransaction
);

/**
 * @route   POST /api/transactions/:transactionId/process
 * @desc    Procesar una transacción autorizada
 * @access  Private (participantes de la transacción)
 */
router.post(
  '/:transactionId/process',
  authenticateToken,
  [
    param('transactionId')
      .trim()
      .notEmpty().withMessage('El ID de la transacción es requerido'),
    handleValidationErrors
  ],
  transactionController.processTransaction
);

/**
 * @route   POST /api/transactions/:transactionId/cancel
 * @desc    Cancelar una transacción pendiente
 * @access  Private (solo el remitente)
 */
router.post(
  '/:transactionId/cancel',
  authenticateToken,
  [
    param('transactionId')
      .trim()
      .notEmpty().withMessage('El ID de la transacción es requerido'),
    handleValidationErrors
  ],
  transactionController.cancelTransaction
);

/**
 * @route   GET /api/transactions
 * @desc    Obtener historial de transacciones del usuario autenticado
 * @access  Private
 */
router.get(
  '/',
  authenticateToken,
  [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser entre 1 y 100')
      .toInt(),
    
    query('status')
      .optional()
      .isIn(['pending', 'completed', 'failed', 'cancelled', 'refunded'])
      .withMessage('Estado de transacción inválido'),
    
    query('type')
      .optional()
      .isIn(['payment', 'refund', 'deposit', 'withdrawal'])
      .withMessage('Tipo de transacción inválido'),
    
    handleValidationErrors
  ],
  transactionController.getTransactionHistory
);

/**
 * @route   GET /api/transactions/:transactionId
 * @desc    Obtener detalles de una transacción específica
 * @access  Private (participantes de la transacción)
 */
router.get(
  '/:transactionId',
  authenticateToken,
  [
    param('transactionId')
      .trim()
      .notEmpty().withMessage('El ID de la transacción es requerido'),
    handleValidationErrors
  ],
  transactionController.getTransactionById
);

/**
 * @route   GET /api/transactions/:transactionId/validate
 * @desc    Validar si una transacción está autorizada
 * @access  Private
 */
router.get(
  '/:transactionId/validate',
  authenticateToken,
  [
    param('transactionId')
      .trim()
      .notEmpty().withMessage('El ID de la transacción es requerido'),
    handleValidationErrors
  ],
  transactionController.validateTransactionAuthorization
);

module.exports = router;