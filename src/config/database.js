/**
 * Base de datos en memoria para almacenar usuarios y transacciones
 * En una aplicación real se sustituiría por una conexión a una base de datos como SQL, MongoDB, etc
 */

// Almacenamiento en memoria
const users = new Map();
const transactions = new Map();

/**
 * Base de datos simulada en memoria
 */
const db = {
  // Operaciones para usuarios
  users: {
    /**
     * Guarda un usuario en la base de datos
     * @param {User} user - Usuario a guardar
     * @returns {Promise<User>} Usuario guardado
     */
    async save(user) {
      users.set(user.id, user);
      return user;
    },

    /**
     * Encuentra un usuario por ID
     * @param {string} id - ID del usuario
     * @returns {Promise<User|null>} Usuario encontrado o null
     */
    async findById(id) {
      return users.get(id) || null;
    },

    /**
     * Encuentra un usuario por email
     * @param {string} email - Email del usuario
     * @returns {Promise<User|null>} Usuario encontrado o null
     */
    async findByEmail(email) {
      for (const user of users.values()) {
        if (user.email === email.toLowerCase()) {
          return user;
        }
      }
      return null;
    },

    /**
     * Encuentra usuarios con filtros
     * @param {Object} filter - Filtros para buscar
     * @returns {Promise<User[]>} Array de usuarios encontrados
     */
    async find(filter = {}) {
      let userArray = Array.from(users.values());

      if (filter.email) {
        userArray = userArray.filter((user) => user.email === filter.email.toLowerCase());
      }

      if (filter.status) {
        userArray = userArray.filter((user) => user.status === filter.status);
      }

      return userArray;
    },

    /**
     * Actualiza un usuario
     * @param {string} id - ID del usuario
     * @param {Object} update - Datos a actualizar
     * @returns {Promise<User|null>} Usuario actualizado o null
     */
    async update(id, update) {
      const user = users.get(id);
      if (user) {
        Object.assign(user, update);
        user.updateTimestamp();
        return user;
      }
      return null;
    },

    /**
     * Elimina un usuario
     * @param {string} id - ID del usuario
     * @returns {Promise<boolean>} true si se eliminó correctamente
     */
    async delete(id) {
      return users.delete(id);
    }
  },

  // Operaciones para transacciones
  transactions: {
    /**
     * Guarda una transacción en la base de datos
     * @param {Transaction} transaction - Transacción a guardar
     * @returns {Promise<Transaction>} Transacción guardada
     */
    async save(transaction) {
      transactions.set(transaction.id, transaction);
      return transaction;
    },

    /**
     * Encuentra una transacción por ID
     * @param {string} id - ID de la transacción
     * @returns {Promise<Transaction|null>} Transacción encontrada o null
     */
    async findById(id) {
      return transactions.get(id) || null;
    },

    /**
     * Encuentra transacciones de un usuario
     * @param {string} userId - ID del usuario
     * @param {Object} filter - Filtros adicionales
     * @returns {Promise<Transaction[]>} Array de transacciones encontradas
     */
    async findByUserId(userId, filter = {}) {
      let transactionArray = Array.from(transactions.values());

      // Filtrar por usuario (ya sea sender o receiver)
      transactionArray = transactionArray.filter(
        (transaction) =>
          transaction.senderUserId === userId || transaction.receiverUserId === userId
      );

      // Aplicar filtros adicionales
      if (filter.status) {
        transactionArray = transactionArray.filter(
          (transaction) => transaction.status === filter.status
        );
      }

      if (filter.type) {
        transactionArray = transactionArray.filter(
          (transaction) => transaction.type === filter.type
        );
      }

      // Ordenar por fecha de creación (más recientes primero)
      transactionArray.sort((a, b) => b.createdAt - a.createdAt);

      return transactionArray;
    },

    /**
     * Encuentra transacciones con filtros
     * @param {Object} filter - Filtros para buscar
     * @returns {Promise<Transaction[]>} Array de transacciones encontradas
     */
    async find(filter = {}) {
      let transactionArray = Array.from(transactions.values());

      if (filter.senderUserId) {
        transactionArray = transactionArray.filter(
          (transaction) => transaction.senderUserId === filter.senderUserId
        );
      }

      if (filter.receiverUserId) {
        transactionArray = transactionArray.filter(
          (transaction) => transaction.receiverUserId === filter.receiverUserId
        );
      }

      if (filter.status) {
        transactionArray = transactionArray.filter(
          (transaction) => transaction.status === filter.status
        );
      }

      if (filter.type) {
        transactionArray = transactionArray.filter(
          (transaction) => transaction.type === filter.type
        );
      }

      // Ordenar por fecha de creación
      transactionArray.sort((a, b) => b.createdAt - a.createdAt);

      return transactionArray;
    },

    /**
     * Actualiza una transacción
     * @param {string} id - ID de la transacción
     * @param {Object} update - Datos a actualizar
     * @returns {Promise<Transaction|null>} Transacción actualizada o null
     */
    async update(id, update) {
      const transaction = transactions.get(id);
      if (transaction) {
        Object.assign(transaction, update);
        return transaction;
      }
      return null;
    }
  },

  /**
   * Limpia toda la base de datos (útil para testing)
   */
  clear() {
    users.clear();
    transactions.clear();
  },

  /**
   * Obtiene las estadísticas de la base de datos
   * @returns {Object} Estadísticas de la base de datos
   */
  getStats() {
    return {
      users: users.size,
      transactions: transactions.size,
      memoryUsage: process.memoryUsage()
    };
  }
};

module.exports = db;
