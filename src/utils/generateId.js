/**
 * Genera un ID único basado en timestamp y caracteres aleatorios
 * @returns {string} ID único generado
 */

const generateId = () => {
  //Horario de generación del ID
  //Se obtiene el timestamp actual en base 36 para hacer más compacto el segmento
  const timestamp = Date.now().toString(36);

  //Se genera un string aleatorio con letras y números para el siguiente segmento
  const randomPart = Math.random().toString(36).substring(2, 15);

  //Se genera otra parte aleatoria para el último segmento
  const randomPart2 = Math.random().toString(36).substring(2, 15);

  //Combinamos los segmentos para el ID
  return `${timestamp}_${randomPart}_${randomPart2}`;
};

/**
 * Genera un código de autorización para transacciones
 * @returns {string} Código de autorización
 */

const generateAuthorizationCode = () => {
  // Se genera un código más corto y fácil de leer
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

/**
 * Valida si un ID tiene el formato correcto
 * @param {string} id - ID a validar
 * @returns {boolean} true si el ID es válido
 */

const isValidId = (id) => {
  if (typeof id !== 'string') return false;

  // El ID debe contener al menos dos guiones bajos (tiene tres segmentos)
  const parts = id.split('_');
  if (parts.length < 3) return false;

  // Revisar si solo contiene caracteres alfanuméricos
  return parts.every((part) => /^[a-z0-9]+$/i.test(part));
};

module.exports = generateId; //Función principal
module.exports.generateAuthorizationCode = generateAuthorizationCode; //Función extra 1
module.exports.isValidId = isValidId; //Función extra 2
