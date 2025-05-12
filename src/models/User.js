// Importación de la utilidad para generar IDs únicos
const generateId = require('../utils/generateId');

/**
 * Clase que representa un usuario en el sistema
 */

class User {
  /**
   * Constructor de la clase User
   * @param {string} name - Nombre del usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña hasheada del usuario
   */
  constructor(name, email, password) {
    this.id = generateId(); // Generamos un ID único para el usuario
    this.name = name;
    this.email = email.toLowerCase(); // Se conviert el email a minúsculas
    this.password = password; // Asumimos que está hasheada
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.balance = 0; //Balance inicial del usuario
    this.status = 'active'; // Estado del usuario (active, inactive, blocked)
    this.role = 'user'; //Por seguridad por defecto es user
  }

  /**
   * Actualiza la fecha de última modificación
   */
  updateTimestamp() {
    this.updatedAt = new Date();
  }

  /**
   * Actualiza el balance del usuario
   * @param {number} amount - Cantidad a sumar o restar del balance
   * @throws {Error} Si el balance resultante fuera negativo
   */
  updateBalance(amount) {
    const newBalance = this.balance + amount;
    if (newBalance < 0) {
      throw new Error('Saldo insuficiente');
    }
    this.balance = newBalance;
    this.updateTimestamp();
  }

  /**
   * Convierte el usuario en un objeto seguro (sin contraseña)
   * @returns {Object} Objeto con los datos del usuario sin información sensible
   */
  toSafeObject() {
    // eslint-disable-next-line no-unused-vars
    const { password, ...safeUser } = this;
    return safeUser;
  }

  /**
   * Valida si el usuario tiene saldo suficiente para una transacción
   * @param {number} amount - Cantidad a validar
   * @returns {boolean} true si tiene saldo suficiente, false si es lo contrario
   */
  hasSufficientBalance(amount) {
    return this.balance >= amount;
  }
}

module.exports = User;
