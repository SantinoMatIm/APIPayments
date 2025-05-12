const request = require('supertest');
const app = require('../../../src/app');
const db = require('../../../src/config/database');

describe('Transaction Controller', () => {
  let senderToken;
  let senderId;
  let receiverId;
  let receiverToken;

  beforeEach(async () => {
    // Crear usuario remitente
    const senderResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sender User',
        email: 'sender@example.com',
        password: 'SenderPass123'
      });

    senderToken = senderResponse.body.data.token;
    senderId = senderResponse.body.data.user.id;

    // Crear usuario receptor
    const receiverResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Receiver User',
        email: 'receiver@example.com',
        password: 'ReceiverPass123'
      });

    receiverToken = receiverResponse.body.data.token;
    receiverId = receiverResponse.body.data.user.id;
  });

  describe('POST /api/transactions', () => {
    it('debe crear una nueva transacción exitosamente', async () => {
      const transactionData = {
        receiverUserId: receiverId,
        amount: 100,
        description: 'Pago de prueba'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Transacción creada exitosamente. Requiere autorización para completarse.');
      expect(response.body.data.transaction.amount).toBe(transactionData.amount);
      expect(response.body.data.transaction.status).toBe('pending');
      expect(response.body.data.transaction.isAuthorized).toBe(false);
    });

    it('debe fallar si el receptor no existe', async () => {
      const transactionData = {
        receiverUserId: 'non-existent-user',
        amount: 100,
        description: 'Pago de prueba'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderToken}`)
        .send(transactionData)
        .expect(404);

      expect(response.body.success).toBe(false);
      // El middleware convierte NotFoundError en "Recurso no encontrado"
      expect(response.body.message).toBe('Recurso no encontrado');
    });

    it('debe fallar si se intenta enviar a sí mismo', async () => {
      const transactionData = {
        receiverUserId: senderId, // Mismo ID que el remitente
        amount: 100,
        description: 'Pago a mí mismo'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      // El middleware convierte ValidationError en "Error de validación"
      expect(response.body.message).toBe('Error de validación');
    });

    it('debe fallar con fondos insuficientes', async () => {
      const transactionData = {
        receiverUserId: receiverId,
        amount: 2000, // Más del balance inicial (1000)
        description: 'Pago grande'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderToken}`)
        .send(transactionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Saldo insuficiente');
    });
  });

  describe('POST /api/transactions/:transactionId/authorize', () => {
    let transactionId;
    let authorizationCode;

    beforeEach(async () => {
      // Crear una transacción
      const transactionResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverUserId: receiverId,
          amount: 100,
          description: 'Pago de prueba'
        });

      transactionId = transactionResponse.body.data.transaction.id;
      authorizationCode = transactionResponse.body.data.transaction.authorizationCode;
    });

    it('debe autorizar una transacción exitosamente', async () => {
      const response = await request(app)
        .post(`/api/transactions/${transactionId}/authorize`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ authorizationCode })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Transacción autorizada exitosamente');
      expect(response.body.data.transaction.isAuthorized).toBe(true);
    });

    it('debe fallar si no es el remitente', async () => {
      const response = await request(app)
        .post(`/api/transactions/${transactionId}/authorize`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .send({ authorizationCode })
        .expect(403);

      expect(response.body.success).toBe(false);
      // El middleware convierte ForbiddenError en "Acceso prohibido"
      expect(response.body.message).toBe('Acceso prohibido');
    });
  });

  describe('POST /api/transactions/:transactionId/process', () => {
    let transactionId;

    beforeEach(async () => {
      // Crear y autorizar una transacción
      const transactionResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverUserId: receiverId,
          amount: 100,
          description: 'Pago de prueba'
        });

      transactionId = transactionResponse.body.data.transaction.id;
      const authCode = transactionResponse.body.data.transaction.authorizationCode;

      // Autorizar la transacción
      await request(app)
        .post(`/api/transactions/${transactionId}/authorize`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ authorizationCode: authCode });
    });

    it('debe procesar una transacción autorizada exitosamente', async () => {
      const response = await request(app)
        .post(`/api/transactions/${transactionId}/process`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Transacción completada exitosamente');
      expect(response.body.data.transaction.status).toBe('completed');
      expect(response.body.data.senderBalance).toBe(900); // 1000 - 100
      expect(response.body.data.receiverBalance).toBe(1100); // 1000 + 100
    });
  });

  describe('GET /api/transactions', () => {
    beforeEach(async () => {
      // Crear algunas transacciones
      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverUserId: receiverId,
          amount: 50,
          description: 'Pago 1'
        });

      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverUserId: receiverId,
          amount: 75,
          description: 'Pago 2'
        });
    });

    it('debe obtener el historial de transacciones del usuario', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toBeDefined();
      expect(response.body.data.transactions.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('debe filtrar transacciones por estado', async () => {
      const response = await request(app)
        .get('/api/transactions?status=pending')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toBeDefined();
      response.body.data.transactions.forEach(transaction => {
        expect(transaction.status).toBe('pending');
      });
    });
  });

  describe('GET /api/transactions/:transactionId', () => {
    let transactionId;

    beforeEach(async () => {
      // Crear una transacción
      const transactionResponse = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverUserId: receiverId,
          amount: 100,
          description: 'Pago de prueba'
        });

      transactionId = transactionResponse.body.data.transaction.id;
    });

    it('debe obtener los detalles de una transacción específica', async () => {
      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.id).toBe(transactionId);
      expect(response.body.data.transaction.sender).toBeDefined();
      expect(response.body.data.transaction.receiver).toBeDefined();
      expect(response.body.data.transaction.userRole).toBe('sender');
    });

    it('debe fallar si el usuario no es parte de la transacción', async () => {
      // Crear un tercer usuario
      const thirdUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Third User',
          email: 'third@example.com',
          password: 'ThirdPass123'
        });

      const thirdUserToken = thirdUserResponse.body.data.token;

      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${thirdUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      // El middleware convierte ForbiddenError en "Acceso prohibido"
      expect(response.body.message).toBe('Acceso prohibido');
    });
  });
});