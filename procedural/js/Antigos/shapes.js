// js/shapes.js - VERSÃO CORRIGIDA E COMPLETA


    
    tree: {
        icon: '🌲',
        name: 'Árvore',
        params: [
            { name: 'height', label: 'Altura', default: 10, min: 6, max: 20 }
        ],
        generate: (params) => {
            const h = params.height;
            const trunkHeight = Math.floor(h * 0.5);
            const crownHeight = h - trunkHeight;
            
            // Tronco
            for (let y = 0; y < trunkHeight; y++) {
                addBlockAt(0, y + 0.5, 0, '#8B4513', 'cylinder'); // Marrom
            }
            
            // Copa (formato cônico)
            const maxRadius = Math.max(2, Math.floor(crownHeight * 0.6));
            for (let y = 0; y < crownHeight; y++) {
                const ratio = 1 - (y / crownHeight);
                const currentR = Math.ceil(maxRadius * ratio);
                const rSquared = currentR * currentR;
                
                for (let x = -currentR; x <= currentR; x++) {
                    for (let z = -currentR; z <= currentR; z++) {
                        const distSquared = x*x + z*z;
                        if (distSquared <= rSquared) {
                            // Densidade aleatória para parecer mais natural
                            if (Math.random() > 0.3) {
                                addBlockAt(x, trunkHeight + y + 0.5, z, '#228B22', 'sphere'); // Verde
                            }
                        }
                    }
                }
            }
        }
    },
    
    castle: {
        icon: '🏰',
        name: 'Castelo',
        params: [
            { name: 'size', label: 'Tamanho', default: 8, min: 6, max: 15 }
        ],
        generate: (params) => {
            const size = params.size;
            const wallHeight = Math.floor(size * 0.6);
            const towerHeight = Math.floor(size * 0.9);
            const towerRadius = Math.max(2, Math.floor(size * 0.15));
            
            // Paredes externas (oco)
            const half = Math.floor(size / 2);
            for (let y = 0; y < wallHeight; y++) {
                for (let x = -half; x <= half; x++) {
                    for (let z = -half; z <= half; z++) {
                        // Apenas bordas
                        if (x === -half || x === half || z === -half || z === half) {
                            addBlockAt(x, y + 0.5, z, currentColor, 'cube');
                        }
                    }
                }
            }
            
            // Torres nos 4 cantos
            const corners = [
                [-half, -half],
                [half, -half],
                [-half, half],
                [half, half]
            ];
            
            corners.forEach(([cx, cz]) => {
                const rSquared = towerRadius * towerRadius;
                for (let x = cx - towerRadius; x <= cx + towerRadius; x++) {
                    for (let z = cz - towerRadius; z <= cz + towerRadius; z++) {
                        const distSquared = (x - cx)**2 + (z - cz)**2;
                        if (distSquared <= rSquared) {
                            for (let y = 0; y < towerHeight; y++) {
                                // Torres ocas
                                if (distSquared >= (towerRadius-1)**2 || y === 0) {
                                    addBlockAt(x, y + 0.5, z, currentColor, 'cylinder');
                                }
                            }
                            
                            // Topo cônico
                            for (let y = 0; y < towerRadius; y++) {
                                const ratio = 1 - (y / towerRadius);
                                const currentR = towerRadius * ratio;
                                const coneDistSquared = (x - cx)**2 + (z - cz)**2;
                                if (coneDistSquared <= currentR * currentR) {
                                    addBlockAt(x, towerHeight + y + 0.5, z, currentColor, 'cone');
                                }
                            }
                        }
                    }
                }
            });
            
            // Portão (entrada)
            const gateWidth = Math.max(2, Math.floor(size * 0.2));
            const gateHeight = Math.max(3, Math.floor(wallHeight * 0.6));
            for (let x = -Math.floor(gateWidth/2); x <= Math.floor(gateWidth/2); x++) {
                for (let y = 1; y < gateHeight; y++) {
                    addBlockAt(x, y + 0.5, -half, '#8B4513', 'cube'); // Portão marrom
                }
            }
        }
    },
    

    

    
    figurine: {
        icon: '🕴️',
        name: 'Estatueta',
        params: [
            { name: 'height', label: 'Altura', default: 10, min: 6, max: 20 }
        ],
        generate: (params) => {
            const h = params.height;
            const headRadius = Math.max(1, Math.floor(h / 10));
            const bodyHeight = Math.floor(h * 0.5);
            const legHeight = Math.floor(h * 0.3);
            const armSpan = Math.floor(h * 0.4);
            
            // Cabeça (esfera)
            const headY = bodyHeight + legHeight;
            for (let x = -headRadius; x <= headRadius; x++) {
                for (let y = 0; y <= headRadius*2; y++) {
                    for (let z = -headRadius; z <= headRadius; z++) {
                        const dist = Math.sqrt(x*x + (y-headRadius)*(y-headRadius) + z*z);
                        if (dist <= headRadius) {
                            addBlockAt(x, headY + y + 0.5, z, currentColor, 'sphere');
                        }
                    }
                }
            }
            
            // Corpo
            for (let y = 0; y < bodyHeight; y++) {
                for (let x = -1; x <= 1; x++) {
                    for (let z = -1; z <= 1; z++) {
                        if (Math.abs(x) + Math.abs(z) <= 2) {
                            addBlockAt(x, legHeight + y + 0.5, z, currentColor, 'cube');
                        }
                    }
                }
            }
            
            // Pernas
            for (let y = 0; y < legHeight; y++) {
                addBlockAt(-1, y + 0.5, 0, currentColor, 'cube');
                addBlockAt(1, y + 0.5, 0, currentColor, 'cube');
            }
            
            // Braços
            const armHeight = Math.floor(bodyHeight * 0.7) + legHeight;
            for (let x = -armSpan; x <= armSpan; x++) {
                if (Math.abs(x) > 1) {
                    addBlockAt(x, armHeight + 0.5, 0, currentColor, 'cube');
                }
            }
        }
    },
    

    

	

    

    

    

    

    

    


	
    // ============================================
    // FUNÇÕES NOVAS
    // ============================================


	

	


	

	

,
	


	

	

	
	// Inicio das novas funções
	







	
	// Inicio das novas funções natureza
	
	// ========================================
// NATUREZA - TIER 2 (Formato ShapeRegistry Correto)
// Cole dentro do objeto ShapeRegistry
// ========================================





	








    fallenLog: {
        icon: '🪵',
        name: 'Tronco Caído',
        params: [
            { name: 'length', label: 'Comprimento', default: 6, min: 3, max: 12 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const length = params.length;
            const color = currentColor || '#8B4513';

            // SEÇÃO 1: Corpo do tronco (horizontal)
            for (let i = 0; i < length; i++) {
                addBlockAt(
                    x + i - length/2,
                    y + 0.3,
                    z,
                    color,
                    'cylinder',
                    0.6,
                    { x: 0, y: 0, z: Math.PI / 2 }
                );
            }

            // SEÇÃO 2: Extremidades
            addBlockAt(x - length/2 - 0.3, y + 0.3, z, '#A0522D', 'disc', 0.6);
            addBlockAt(x + length/2 + 0.3, y + 0.3, z, '#A0522D', 'disc', 0.6);
        }
    },


	// INICIO DAS NOVAS FUNÇÕES MATEMÁTICAS













	
// ========================================
// GEOMETRIA SAGRADA - 5 Formas Místicas
// Cole dentro do objeto ShapeRegistry
// ========================================









	
}; // 🔥 FECHAMENTO CORRETO DO OBJETO ShapeRegistry
	


// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Função para verificar se um ponto está dentro de um polígono
function isPointInPolygon(x, z, vertices) {
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

// ============================================
// FUNÇÃO MESTRA DE GERAÇÃO (COM INTERCEPTOR)
// ============================================

function generateSelectedShape() {
    console.group("🚀 [MASTER] Iniciando Geração Procedural");

    if (!currentShape || !ShapeRegistry[currentShape]) {
        console.error("Erro: Nenhuma forma válida selecionada.");
        return;
    }

    // 1. CAPTURA AS CONFIGURAÇÕES DO USUÁRIO (OVERRIDE)
    const overrideTypeElement = document.getElementById('masterBlockType');
    const overrideScaleElement = document.getElementById('masterBlockScale');
    
    // Se os elementos não existirem no HTML, usa padrões seguros
    const overrideType = overrideTypeElement ? overrideTypeElement.value : 'default';
    const overrideScale = overrideScaleElement ? parseFloat(overrideScaleElement.value) : 1.0;

    console.log(`🔧 Config: Tipo=${overrideType}, Escala=${overrideScale}`);

    // 2. TÉCNICA DE INTERCEPTAÇÃO (PROXY)
    // Guardamos a função original 'addBlockAt' numa variável segura
    const originalAddBlockAt = window.addBlockAt;

    // Criamos uma função temporária que vai "mentir" para o gerador
    window.addBlockAt = function(x, y, z, color, type, scale, rotation) {
        
        // LÓGICA DE DECISÃO:
        // Se o usuário escolheu "default", usamos o 'type' que a forma pediu.
        // Se escolheu outra coisa (ex: sphere), forçamos 'sphere'.
        const finalType = (overrideType === 'default') ? type : overrideType;
        
        // Multiplicamos a escala original da forma pela escala Mestra
        // (Se a forma pede scale 1 e o mestre pede 0.5, o resultado é 0.5)
        // Tratamos se scale for objeto ou número
        let finalScale;
        if (typeof scale === 'object') {
             finalScale = { 
                 x: scale.x * overrideScale, 
                 y: scale.y * overrideScale, 
                 z: scale.z * overrideScale 
             };
        } else {
             finalScale = (scale || 1) * overrideScale;
        }

        // Chama a função REAL com os dados alterados
        originalAddBlockAt(x, y, z, color, finalType, finalScale, rotation);
    };

    // 3. EXECUÇÃO
    // Limpa a cena mantendo texturas (opcional, pode remover se preferir acumular)
    clearScene(true); 

    try {
        const shape = ShapeRegistry[currentShape];
        // O gerador vai rodar achando que está chamando o addBlockAt normal,
        // mas está chamando nosso interceptador!
        shape.generate(currentParams);
        
        showStatus(`✅ ${shape.name} gerado com sucesso!`, 'success');
    } catch (error) {
        console.error("Erro na geração:", error);
        showStatus("Erro ao gerar forma.", 'error');
    } finally {
        // 4. RESTAURAÇÃO (CRUCIAL!)
        // Devolvemos a função original para o window, senão o editor quebra depois
        window.addBlockAt = originalAddBlockAt;
        console.log("🔄 Função original addBlockAt restaurada.");
    }

    updateJSON();
    closeShapeModal();
    console.groupEnd();
}