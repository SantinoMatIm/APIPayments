# Payment System API

API REST para un sistema de pagos que permite registrar usuarios, iniciar transacciones, consultar historiales y validar autorizaciones.

## 🚀 Características

- ✅ Registro y autenticación de usuarios
- ✅ Creación y gestión de transacciones de pago
- ✅ Histórico de transacciones por usuario
- ✅ Validación y autorización de transacciones
- ✅ Sistema de balance para usuarios
- ✅ Middleware de autenticación JWT
- ✅ Rate limiting para protección contra abuso
- ✅ Validación de datos de entrada
- ✅ Manejo centralizado de errores
- ✅ Tests unitarios e integración
- ✅ CI/CD con GitHub Actions

## 📋 Requisitos

- Node.js >= 16.0.0
- npm >= 7.0.0

## 🛠 Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/payment-system-api.git
cd payment-system-api
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus configuraciones
```

Variables de entorno necesarias:
```env
PORT=3000
JWT_SECRET=tu_clave_secreta_super_segura
JWT_EXPIRES_IN=1d
NODE_ENV=development
```

4. Iniciar el servidor:
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 🔧 Scripts Disponibles

```bash
npm start          # Inicia el servidor en producción
npm run dev        # Inicia el servidor en desarrollo con nodemon
npm test           # Ejecuta todos los tests
npm run test:watch # Ejecuta tests en modo watch
npm run test:coverage # Ejecuta tests con cobertura
npm run lint       # Ejecuta el linter
npm run lint:fix   # Corrige problemas de lint automáticamente
npm run format     # Formatea el código con Prettier
```

## 📚 Estructura del Proyecto

```
payment-system-api/
├── src/
│   ├── config/          # Configuraciones (base de datos, etc.)
│   ├── controllers/     # Controladores de rutas
│   ├── middleware/      # Middleware personalizado
│   ├── models/          # Modelos de datos
│   ├── routes/          # Definición de rutas
│   ├── utils/           # Utilidades y helpers
│   ├── app.js          # Configuración de Express
│   └── index.js        # Punto de entrada
├── tests/
│   ├── unit/           # Tests unitarios
│   ├── integration/    # Tests de integración
│   └── setup/          # Configuración de tests
├── .github/
│   └── workflows/      # CI/CD pipelines
├── .env.example        # Ejemplo de variables de entorno
├── .eslintrc.js       # Configuración de ESLint
├── .prettierrc.js     # Configuración de Prettier
├── jest.config.js     # Configuración de Jest
└── package.json       # Dependencias y scripts
```

## 🔌 API Endpoints

### Autenticación

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| POST | `/api/auth/register` | Registrar nuevo usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| GET | `/api/auth/profile` | Obtener perfil del usuario | Sí |
| PUT | `/api/auth/profile` | Actualizar perfil | Sí |
| POST | `/api/auth/change-password` | Cambiar contraseña | Sí |
| GET | `/api/auth/balance` | Obtener balance | Sí |

### Transacciones

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| POST | `/api/transactions` | Crear nueva transacción | Sí |
| GET | `/api/transactions` | Listar transacciones del usuario | Sí |
| GET | `/api/transactions/:id` | Obtener detalles de transacción | Sí |
| POST | `/api/transactions/:id/authorize` | Autorizar transacción | Sí |
| POST | `/api/transactions/:id/process` | Procesar transacción | Sí |
| POST | `/api/transactions/:id/cancel` | Cancelar transacción | Sí |
| GET | `/api/transactions/:id/validate` | Validar autorización | Sí |

### Usuarios

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| GET | `/api/users/:id` | Obtener usuario por ID | Sí (admin) |
| GET | `/api/users/search` | Buscar usuarios | Sí (admin) |

## 📝 Ejemplos de Uso

### Registrar un usuario

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "Password123"
  }'
```

### Iniciar sesión

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "Password123"
  }'
```

### Crear una transacción

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "receiverUserId": "USER_ID",
    "amount": 100,
    "description": "Pago de servicios"
  }'
```

### Autorizar una transacción

```bash
curl -X POST http://localhost:3000/api/transactions/TRANSACTION_ID/authorize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "authorizationCode": "AUTH_CODE"
  }'
```

## 🧪 Testing

El proyecto incluye tests unitarios y de integración:

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch

# Solo tests unitarios
npm run test:unit

# Solo tests de integración
npm run test:integration
```

## 🔒 Seguridad

- **Autenticación JWT**: Todas las rutas protegidas requieren un token válido
- **Hashing de contraseñas**: Usando bcrypt con salt factor 12
- **Rate limiting**: Límite de 100 requests por 15 minutos por IP
- **Validación de entrada**: Usando express-validator
- **Headers de seguridad**: Implementados con Helmet
- **CORS**: Configurado para permitir orígenes autorizados

## 🚦 CI/CD

El proyecto usa GitHub Actions para:

1. Ejecutar tests en cada push
2. Verificar el linting
3. Generar reporte de cobertura
4. Build de la aplicación
5. Deploy automático en rama main

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autor

- **Santino Matias Im** - [GitHub]