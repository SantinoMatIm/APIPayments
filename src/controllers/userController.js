const db = require('../config/database');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');

/**
 * Obtiene un usuario por ID (solo admin o el mismo usuario)
 */
const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Buscar el usuario por ID
  const user = await db.users.findById(userId);
  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Responder con el usuario (sin información sensible)
  res.status(200).json({
    success: true,
    data: {
      user: user.toSafeObject()
    }
  });
});

/**
 * Busca usuarios por criterios (solo admin)
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { email, status, page = 1, limit = 10 } = req.query;

  // Construir filtros
  const filter = {};
  if (email) filter.email = email;
  if (status) filter.status = status;

  // Buscar usuarios
  const users = await db.users.find(filter);

  // Aplicar paginación
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedUsers = users.slice(startIndex, endIndex);

  // Preparar metadata de paginación
  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total: users.length,
    totalPages: Math.ceil(users.length / limit),
    hasMore: endIndex < users.length
  };

  // Responder con los usuarios (sin información sensible)
  res.status(200).json({
    success: true,
    data: {
      users: paginatedUsers.map((user) => user.toSafeObject()),
      pagination
    }
  });
});

module.exports = {
  getUserById,
  searchUsers
};
