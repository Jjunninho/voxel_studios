// shapes_core.js
window.ShapeRegistry = {};

// Utilitários globais para os geradores
window.ShapeUtils = {
    randomRange: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    // Se precisar de Perlin Noise, coloque aqui
};
console.log("🧩 ShapeRegistry Core inicializado.");