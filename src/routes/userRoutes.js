const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');

// Importar controladores y middleware
const userController = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

/**
 * @route   GET /api/users/search
 * @desc    Buscar usuarios (con filtros)
 * @access  Private (solo admin)
 */
router.get(
  '/search',
  authenticateToken,
  isAdmin,
  [
    query('email')
      .optional()
      .isEmail().withMessage('Email inválido'),
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'blocked']).withMessage('Estado inválido'),
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Página inválida'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Límite inválido'),
    handleValidationErrors
  ],
  userController.searchUsers
);

/**
 * @route   GET /api/users/:userId
 * @desc    Obtener información de un usuario específico
 * @access  Private (solo admin o el mismo usuario)
 */
router.get(
  '/:userId',
  authenticateToken,
  [
    param('userId')
      .trim()
      .notEmpty().withMessage('El ID del usuario es requerido'),
    handleValidationErrors
  ],
  userController.getUserById
);

module.exports = router;