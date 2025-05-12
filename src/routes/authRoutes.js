const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Importar controladores y middleware
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateLogin,
  handleValidationErrors
} = require('../middleware/validation');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post('/register', validateUserRegistration, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario autenticado
 * @access  Private
 */
router.put(
  '/profile',
  authenticateToken,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
    
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(),
    
    body('password')
      .optional()
      .trim()
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('La contraseña debe contener al menos una letra minúscula, una mayúscula y un número'),
    
    handleValidationErrors
  ],
  authController.updateProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
router.post(
  '/change-password',
  authenticateToken,
  [
    body('currentPassword')
      .trim()
      .notEmpty().withMessage('La contraseña actual es requerida'),
    body('newPassword')
      .trim()
      .notEmpty().withMessage('La nueva contraseña es requerida')
      .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('La nueva contraseña debe contener al menos una letra minúscula, una mayúscula y un número'),
    handleValidationErrors
  ],
  authController.changePassword
);

/**
 * @route   GET /api/auth/balance
 * @desc    Obtener balance del usuario autenticado
 * @access  Private
 */
router.get('/balance', authenticateToken, authController.getBalance);

module.exports = router;