const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const User = require('../models/User');
const { 
  asyncHandler, 
  ConflictError, 
  UnauthorizedError,
  NotFoundError 
} = require('../middleware/errorHandler');

/**
 * Genera un token JWT para un usuario
 * @param {string} userId - ID del usuario
 * @returns {string} Token JWT
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

/**
 * Registra un nuevo usuario
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Verificar si el usuario ya existe
  const existingUser = await db.users.findByEmail(email);
  if (existingUser) {
    throw new ConflictError('El email ya está registrado');
  }

  // Hashear la contraseña
  const hashedPassword = await bcrypt.hash(password, 12);

  // Crear el nuevo usuario
  const newUser = new User(name, email, hashedPassword);
  
  // Agregar un balance inicial
  newUser.balance = 1000; // Balance inicial de $1000
  
  // Guardar el usuario en la base de datos
  await db.users.save(newUser);

  // Generar token
  const token = generateToken(newUser.id);

  // Responder con éxito
  res.status(201).json({
    success: true,
    message: 'Usuario registrado exitosamente',
    data: {
      user: newUser.toSafeObject(),
      token
    }
  });
});

/**
 * Inicia sesión de un usuario
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Buscar el usuario por email
  const user = await db.users.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  // Verificar la contraseña
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  // Verificar que el usuario esté activo
  if (user.status !== 'active') {
    throw new UnauthorizedError('Cuenta inactiva o bloqueada');
  }

  // Generar token
  const token = generateToken(user.id);

  // Responder con éxito
  res.status(200).json({
    success: true,
    message: 'Sesión iniciada exitosamente',
    data: {
      user: user.toSafeObject(),
      token
    }
  });
});

/**
 * Obtiene el perfil del usuario autenticado
 */
const getProfile = asyncHandler(async (req, res) => {
  // El usuario ya está disponible en req.user gracias al middleware de autenticación
  const user = req.user;

  res.status(200).json({
    success: true,
    data: {
      user: user.toSafeObject()
    }
  });
});

/**
 * Actualiza el perfil del usuario autenticado
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userId = req.user.id;

  // Buscar el usuario
  const user = await db.users.findById(userId);
  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Actualizar los campos proporcionados
  if (name) {
    user.name = name;
  }

  if (email) {
    // Verificar si el nuevo email ya está en uso
    const existingUser = await db.users.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictError('El email ya está en uso por otro usuario');
    }
    user.email = email.toLowerCase();
  }

  if (password) {
    // Hashear la nueva contraseña
    user.password = await bcrypt.hash(password, 12);
  }

  // Guardar los cambios
  await db.users.save(user);

  // Responder con éxito
  res.status(200).json({
    success: true,
    message: 'Perfil actualizado exitosamente',
    data: {
      user: user.toSafeObject()
    }
  });
});

/**
 * Cambia la contraseña del usuario autenticado
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Buscar el usuario
  const user = await db.users.findById(userId);
  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Verificar la contraseña actual
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Contraseña actual incorrecta');
  }

  // Hashear la nueva contraseña
  user.password = await bcrypt.hash(newPassword, 12);

  // Guardar los cambios
  await db.users.save(user);

  // Responder con éxito
  res.status(200).json({
    success: true,
    message: 'Contraseña cambiada exitosamente'
  });
});

/**
 * Obtiene el balance del usuario autenticado
 */
const getBalance = asyncHandler(async (req, res) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    data: {
      balance: user.balance,
      currency: 'USD'
    }
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getBalance
};