// shapes_core.js
window.ShapeRegistry = {};

// Utilitários globais para os geradores
window.ShapeUtils = {
    randomRange: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    // Se precisar de Perlin Noise, coloque aqui
	
	    // 🔥 ADICIONAR AQUI
    isPointInPolygon: function(x, z, vertices) {
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const [xi, zi] = vertices[i];
            const [xj, zj] = vertices[j];
            
            const intersect = ((zi > z) !== (zj > z)) &&
                (x < (xj - xi) * (z - zi) / (zj - zi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
};

	console.log("🧩 ShapeRegistry Core inicializado.");