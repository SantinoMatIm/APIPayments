// Crea un archivo temporal src/test.js
const express = require('express');
const app = express();

// Probar ruta simple
app.get('/test', (req, res) => {
  res.json({ message: 'Test works' });
});

// Probar ruta con parámetro
app.get('/test/:id', (req, res) => {
  res.json({ id: req.params.id });
});

app.listen(3000, () => {
  console.log('Test server running on port 3000');
});