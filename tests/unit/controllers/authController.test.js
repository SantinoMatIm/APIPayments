const request = require('supertest');
const app = require('../../../src/app');
const db = require('../../../src/config/database');
const bcrypt = require('bcryptjs');

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    it('debe registrar un nuevo usuario exitosamente', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Usuario registrado exitosamente');
      expect(response.body.data.user.email).toBe(userData.email.toLowerCase());
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.token).toBeDefined();
      
      // Verificar que la contraseña no se devuelve
      expect(response.body.data.user.password).toBeUndefined();
      
      // Verificar que el usuario se guardó en la base de datos
      const savedUser = await db.users.findByEmail(userData.email);
      expect(savedUser).toBeDefined();
      expect(savedUser.email).toBe(userData.email.toLowerCase());
    });

    it('debe fallar si el email ya está registrado', async () => {
      const userData = {
        name: 'Test User',
        email: 'duplicate@example.com',
        password: 'TestPass123'
      };

      // Registrar el primer usuario
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Intentar registrar con el mismo email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('El email ya está registrado');
    });

    it('debe fallar con datos inválidos', async () => {
      const invalidData = {
        name: 'T', // Nombre muy corto
        email: 'invalid-email', // Email inválido
        password: '123' // Contraseña muy corta
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crear un usuario de prueba
      const hashedPassword = await bcrypt.hash('TestPass123', 12);
      const user = {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        status: 'active',
        balance: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        toSafeObject: function() {
          const { password, ...safeUser } = this;
          return safeUser;
        }
      };
      await db.users.save(user);
    });

    it('debe permitir login con credenciales válidas', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sesión iniciada exitosamente');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('debe fallar con credenciales inválidas', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      // El middleware de manejo de errores genérico devuelve "No autorizado"
      expect(response.body.message).toBe('No autorizado');
    });

    it('debe fallar si el usuario no existe', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPass123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      // El middleware de manejo de errores genérico devuelve "No autorizado"
      expect(response.body.message).toBe('No autorizado');
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;
    let userId;

    beforeEach(async () => {
      // Registrar un usuario y obtener el token
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'TestPass123'
        });

      token = response.body.data.token;
      userId = response.body.data.user.id;
    });

    it('debe obtener el perfil del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(userId);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('debe fallar sin token de autenticación', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Acceso denegado. Token no proporcionado.');
    });

    it('debe fallar con token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token inválido.');
    });
  });

  describe('GET /api/auth/balance', () => {
    let token;

    beforeEach(async () => {
      // Registrar un usuario y obtener el token
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'TestPass123'
        });

      token = response.body.data.token;
    });

    it('debe obtener el balance del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/balance')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBe(1000); // Balance inicial
      expect(response.body.data.currency).toBe('USD');
    });
  });
});