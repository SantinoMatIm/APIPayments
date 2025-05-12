// tests/setup/jest.setup.js

// 1. CARGAR VARIABLES DE ENTORNO DE TESTING
// Esto asegura que usemos las variables correctas para los tests
// El archivo .env.test contiene configuraciones específicas para testing
require('dotenv').config({ path: '.env.test' });

// 2. IMPORTAR LA BASE DE DATOS
// Necesitamos acceso a la BD para limpiarla entre tests
const db = require('../../src/config/database');

// 3. CONFIGURAR HOOKS DE TESTING
// beforeEach se ejecuta antes de CADA test individual
beforeEach(() => {
  // Limpiar la base de datos en memoria antes de cada test
  // Esto garantiza que cada test comience con un estado limpio
  // Evita que los datos de un test afecten a otro
  db.clear();
});

// 4. CONFIGURAR LIMPIEZA DESPUÉS DE TODOS LOS TESTS
// afterAll se ejecuta una vez cuando terminan TODOS los tests
afterAll((done) => {
  // done es un callback que le indica a Jest que terminamos
  // Útil para cerrar conexiones, limpiar recursos, etc.
  done();
});

// 5. CONFIGURAR TIMEOUT GLOBAL
// Por defecto Jest tiene un timeout de 5000ms (5 segundos)
// Lo aumentamos a 10000ms (10 segundos) para tests más lentos
jest.setTimeout(10000);

// 6. CONFIGURAR MOCKS GLOBALES
// Esto evita que los logs aparezcan durante los tests
// Mantiene la salida de los tests limpia
global.console = {
  // Preservamos el objeto console original
  ...console,
  
  // Silenciamos estos métodos durante los tests
  log: jest.fn(),    // console.log no mostrará nada
  info: jest.fn(),   // console.info no mostrará nada
  debug: jest.fn(),  // console.debug no mostrará nada
  
  // IMPORTANTE: Mantenemos error y warn para debugging
  // Si algo sale mal, queremos ver los errores
  // error: console.error (heredado del ...console)
  // warn: console.warn (heredado del ...console)
};