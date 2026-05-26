// js/shapes/shapes_dungeon.js
if (window.ShapeRegistry) {


// --- PORTARIA / GATEHOUSE ---
    window.ShapeRegistry.gatehouse = {
        name: "Portaria Medieval",
        icon: "⛩️",
        category: "architecture",
        params: [
            { name: "width", label: "Largura Total", default: 15, min: 11, max: 25 },
            { name: "height", label: "Altura Torre", default: 10, min: 8, max: 20 },
            { name: "depth", label: "Profundidade", default: 5, min: 4, max: 8 }
        ],
        generate: function(p) {
            const w = p.width;
            const h = p.height;
            const d = p.depth;
            const ox = -Math.floor(w/2);
            const oz = -Math.floor(d/2);
            
            // Tamanho das torres laterais (quadradas, baseadas na profundidade)
            const towerSize = d; 
            
            // Altura do Muro (menor que a torre)
            const wallH = Math.floor(h * 0.7);
            
            // Altura do Arco
            const archH = Math.floor(wallH * 0.6);

            for (let x = 0; x < w; x++) {
                for (let z = 0; z < d; z++) {
                    const trueX = ox + x;
                    const trueZ = oz + z;

                    // Identifica se é área de Torre ou Muro Central
                    const isLeftTower = x < towerSize;
                    const isRightTower = x >= w - towerSize;
                    const isWall = !isLeftTower && !isRightTower;

                    if (isLeftTower || isRightTower) {
                        // --- TORRES ---
                        for (let y = 0; y < h; y++) {
                            // Paredes da torre (oco por dentro opcional, aqui faremos maciço ou paredes grossas)
                            const isTowerEdge = (x === 0 || x === towerSize-1 || x === w-towerSize || x === w-1 || z === 0 || z === d-1);
                            
                            if (isTowerEdge || y === 0 || y === h-1) { // Paredes e teto/chão
                                addBlockAt(trueX, y, trueZ, "#7f8c8d", "cube");
                            } else if (y % 4 === 0) {
                                // Janelinhas de tiro
                                addBlockAt(trueX, y, trueZ, "#2c3e50", "cube"); 
                            }
                        }
                        
                        // Ameias da Torre (Topo)
                        if ((x + z) % 2 === 0) {
                            addBlockAt(trueX, h, trueZ, "#95a5a6", "cube");
                        }
                    } 
                    else if (isWall) {
                        // --- MURO CENTRAL & ARCO ---
                        const centerX = Math.floor(w/2);
                        const distFromCenter = Math.abs(x - centerX);
                        
                        // Largura do buraco do portão (3 blocos total: centro, esq, dir)
                        const isGate = distFromCenter <= 1; 

                        for (let y = 0; y < wallH; y++) {
                            if (isGate) {
                                // Lógica do Arco
                                if (y >= archH) {
                                    // Fecha o arco em cima
                                    addBlockAt(trueX, y, trueZ, "#7f8c8d", "cube");
                                } else if (z === Math.floor(d/2) && y < archH - 1) {
                                    // Grade (Portcullis) no meio, levantada
                                    if (y % 2 !== 0 || x % 2 !== 0) {
                                        addBlockAt(trueX, y, trueZ, "#34495e", "cylinder", {x:0.2, y:1, z:0.2}); // Grades de ferro
                                    }
                                }
                            } else {
                                // Muro Sólido
                                addBlockAt(trueX, y, trueZ, "#95a5a6", "cube");
                            }
                        }

                        // Passarela em cima do muro
                        if (z === 0 || z === d-1) {
                            // Parapeito do muro
                            if (x % 2 === 0) addBlockAt(trueX, wallH, trueZ, "#bdc3c7", "cube");
                        } else {
                            // Chão da passarela
                            addBlockAt(trueX, wallH, trueZ, "#7f8c8d", "plane");
                        }
                    }
                }
            }
        }
    };

    console.log("⛩️ Shape Gatehouse Carregada");
}