/**
 * Middleware de manejo de errores global
 * @param {Error} err - Error ocurrido
 * @param {Request} req - Objeto de request de Express
 * @param {Response} res - Objeto de response de Express
 * @param {Function} next - Función para pasar al siguiente middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log del error
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Determinar el código de estado
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  // Manejar tipos específicos de errores
  switch (err.name) {
    case 'ValidationError':
      statusCode = 400;
      message = 'Error de validación';
      break;
    case 'UnauthorizedError':
    case 'JsonWebTokenError':
      statusCode = 401;
      message = 'No autorizado';
      break;
    case 'ForbiddenError':
      statusCode = 403;
      message = 'Acceso prohibido';
      break;
    case 'NotFoundError':
      statusCode = 404;
      message = 'Recurso no encontrado';
      break;
  }

  // Preparar la respuesta
  const response = {
    success: false,
    message: message,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  };

  // Enviar respuesta
  res.status(statusCode).json(response);
};

/**
 * Wrapper para funciones asíncronas
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Clases de errores personalizados
 */
class CustomError extends Error {
  constructor(message, statusCode = 500, code = 'CUSTOM_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;
  }
}

class NotFoundError extends CustomError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends CustomError {
  constructor(message = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ValidationError extends CustomError {
  constructor(message = 'Error de validación') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class ConflictError extends CustomError {
  constructor(message = 'Conflicto de recursos') {
    super(message, 409, 'CONFLICT');
  }
}

class ForbiddenError extends CustomError {
  constructor(message = 'Acceso prohibido') {
    super(message, 403, 'FORBIDDEN');
  }
}

class InsufficientFundsError extends CustomError {
  constructor(message = 'Fondos insuficientes') {
    super(message, 400, 'INSUFFICIENT_FUNDS');
  }
}

class PaymentError extends CustomError {
  constructor(message = 'Error de pago') {
    super(message, 400, 'PAYMENT_ERROR');
  }
}

module.exports = {
  errorHandler,
  asyncHandler,
  CustomError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ConflictError,
  ForbiddenError,
  InsufficientFundsError,
  PaymentError
};