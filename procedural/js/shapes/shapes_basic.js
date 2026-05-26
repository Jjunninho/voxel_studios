// js/shapes/shapes_basic.js
// Básicos e Geometria:

if (window.ShapeRegistry) {
	
	window.ShapeRegistry.star = {
		icon: '⭐',
		name: 'Estrela',
		category: "basic",
		subcat: "basic",
		params: [
			{ name: 'points', label: 'Pontas', default: 5, min: 3, max: 12 },
			{ name: 'radius', label: 'Raio', default: 4, min: 2, max: 8 }
		],
		generate: (params) => {
			const points = params.points;
			const outerR = params.radius;
			const innerR = Math.floor(outerR * 0.4);
			const cx = 0, cy = 1, cz = 0;
			const color = '#FFD700';
			
			// Desenhar estrela preenchida no plano XZ
			for (let i = 0; i < points * 2; i++) {
				const angle = (Math.PI * 2 * i) / (points * 2);
				const isOuter = i % 2 === 0;
				const r = isOuter ? outerR : innerR;
				
				const x = Math.round(cx + r * Math.cos(angle));
				const z = Math.round(cz + r * Math.sin(angle));
				
				// Linha até próximo ponto
				const nextI = (i + 1) % (points * 2);
				const nextAngle = (Math.PI * 2 * nextI) / (points * 2);
				const nextIsOuter = nextI % 2 === 0;
				const nextR = nextIsOuter ? outerR : innerR;
				const nextX = Math.round(cx + nextR * Math.cos(nextAngle));
				const nextZ = Math.round(cz + nextR * Math.sin(nextAngle));
				
				const steps = Math.max(Math.abs(nextX - x), Math.abs(nextZ - z)) || 1;
				for (let s = 0; s <= steps; s++) {
					const t = s / steps;
					const ix = Math.round(x + (nextX - x) * t);
					const iz = Math.round(z + (nextZ - z) * t);
					addBlockAt(ix, cy, iz, color, 'cube');
				}
			}
			
			// Preencher centro
			for (let x = -innerR; x <= innerR; x++) {
				for (let z = -innerR; z <= innerR; z++) {
					if (x*x + z*z <= innerR * innerR) {
						addBlockAt(cx + x, cy, cz + z, '#FFA500', 'cube');
					}
				}
			}
		}
	},

	// Primitivas: cube, plane, sphere, cylinder, cone, torus.
    // --- CUBO ---
    window.ShapeRegistry.cube = {
        name: "Cubo Sólido",
        icon: "📦",
        category: "basic",
		subcat: "basic",
        params: [
            { name: "size", label: "Tamanho", default: 5, min: 1, max: 20 }
        ],
        generate: function(p) {
            const s = p.size;
            const offset = -Math.floor(s/2);
            for(let x=0; x<s; x++) {
                for(let y=0; y<s; y++) {
                    for(let z=0; z<s; z++) {
                        addBlockAt(x+offset, y, z+offset, "#3498db", "cube");
                    }
                }
            }
        }
    },	
	
     window.ShapeRegistry.plane = {
        icon: '⬜',
        name: 'Plano',
		category: "basic",
        params: [
            { name: 'width', label: 'Largura', default: 8, min: 2, max: 20 },
            { name: 'depth', label: 'Profundidade', default: 8, min: 2, max: 20 }
        ],
        generate: (params) => {
            const hw = Math.floor(params.width / 2);
            const hd = Math.floor(params.depth / 2);
            for (let x = -hw; x <= hw; x++) {
                for (let z = -hd; z <= hd; z++) {
                    addBlockAt(x, 0.5, z, currentColor, 'cube');
                }
            }
        }
    },	
	
    // --- ESFERA (VOXELIZADA) ---
    window.ShapeRegistry.sphere = {
        name: "Esfera Voxel",
        icon: "⚪",
        category: "basic",
		subcat: "basic",
		params: [
            { name: "radius", label: "Raio", default: 8, min: 2, max: 20 }
        ],
        generate: function(p) {
            const r = p.radius;
            const r2 = r * r;
            for(let x=-r; x<=r; x++) {
                for(let y=-r; y<=r; y++) {
                    for(let z=-r; z<=r; z++) {
                        if (x*x + y*y + z*z <= r2) {
                            addBlockAt(x, y + r, z, "#e74c3c", "cube");
                        }
                    }
                }
            }
        }
    },
	
    window.ShapeRegistry.cylinder = {
        icon: '🛢️',
        name: 'Cilindro',
		category: "basic",
		subcat: "basic",
		params: [
            { name: 'radius', label: 'Raio', default: 3, min: 1, max: 8 },
            { name: 'height', label: 'Altura', default: 6, min: 2, max: 15 }
        ],
        generate: (params) => {
            const r = params.radius;
            const h = params.height;
            const rSquared = r * r;
            for (let x = -r; x <= r; x++) {
                for (let z = -r; z <= r; z++) {
                    const distSquared = x*x + z*z;
                    if (distSquared <= rSquared) {
                        for (let y = 0; y < h; y++) {
                            addBlockAt(x, y + 0.5, z, currentColor, 'cylinder');
                        }
                    }
                }
            }
        }
    },	
	
    window.ShapeRegistry.cone = {
        icon: '🔺',
        name: 'Cone',
		category: "basic",
		subcat: "basic",
		params: [
            { name: 'radius', label: 'Raio Base', default: 4, min: 2, max: 10 },
            { name: 'height', label: 'Altura', default: 8, min: 3, max: 15 }
        ],
        generate: (params) => {
            const baseR = params.radius;
            const h = params.height;
            for (let y = 0; y < h; y++) {
                const ratio = 1 - (y / h);
                const currentR = baseR * ratio;
                const rSquared = currentR * currentR;
                for (let x = -baseR; x <= baseR; x++) {
                    for (let z = -baseR; z <= baseR; z++) {
                        const distSquared = x*x + z*z;
                        if (distSquared <= rSquared) {
                            addBlockAt(x, y + 0.5, z, currentColor, 'cone');
                        }
                    }
                }
            }
        }
    },
	
    window.ShapeRegistry.torus = {
        icon: '🍩',
        name: 'Toro',
		category: "basic",
		subcat: "basic",
		params: [
            { name: 'majorRadius', label: 'Raio Maior', default: 5, min: 3, max: 10 },
            { name: 'minorRadius', label: 'Raio Menor', default: 2, min: 1, max: 4 }
        ],
        generate: (params) => {
            const R = params.majorRadius;
            const r = params.minorRadius;
            const maxDist = R + r;
            for (let x = -maxDist; x <= maxDist; x++) {
                for (let y = -r; y <= r; y++) {
                    for (let z = -maxDist; z <= maxDist; z++) {
                        const distFromCenter = Math.sqrt(x*x + z*z);
                        const distFromTube = Math.sqrt((distFromCenter - R)**2 + y*y);
                        if (distFromTube <= r) {
                            addBlockAt(x, y + r + 0.5, z, currentColor, 'torus');
                        }
                    }
                }
            }
        }
    },
	
	// Fim das formas Básicas...
	// Sólidos Platônicos: tetrahedron, hexahedron, octahedron, dodecahedron, icosahedron.
		// Inicio da Insersão dos sólidos platonicos
	
	window.ShapeRegistry.tetrahedron = {
        icon: '▲',
        name: 'Tetraedro',
		category: "basic",
		subcat: "basic",
		params: [
            { name: 'radius', label: 'Raio', default: 8, min: 4, max: 15 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const r = params.radius;
            const color = currentColor || '#FF4500';
            
            // O Tetraedro é definido por 4 planos
            // Para voxel art, centralizamos em 0
            const scale = r; 

            for (let i = -r; i <= r; i++) {
                for (let j = -r; j <= r; j++) {
                    for (let k = -r; k <= r; k++) {
                        // Equações dos 4 planos do tetraedro
                        // x + y + z <= r
                        // x - y - z <= r
                        // -x + y - z <= r
                        // -x - y + z <= r
                        
                        const c1 = i + j + k <= scale;
                        const c2 = i - j - k <= scale;
                        const c3 = -i + j - k <= scale;
                        const c4 = -i - j + k <= scale;

                        if (c1 && c2 && c3 && c4) {
                            addBlockAt(x + i, y + j + 0.5, z + k, color, 'pyramid'); // Pyramid combina visualmente
                        }
                    }
                }
            }
        }
    },

    window.ShapeRegistry.hexahedron = {
        icon: '🧊',
        name: 'Hexaedro (Cubo)',
		category: "basic",
		subcat: "basic",
		params: [
            { name: 'size', label: 'Tamanho da Aresta', default: 8, min: 2, max: 20 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const s = params.size;
            const half = Math.floor(s / 2);
            const color = currentColor || '#4682B4';

            // O cubo é o mais simples: limites em X, Y e Z
            for (let i = -half; i <= half; i++) {
                for (let j = -half; j <= half; j++) {
                    for (let k = -half; k <= half; k++) {
                        addBlockAt(x + i, y + j + 0.5, z + k, color, 'cube');
                    }
                }
            }
        }
    },

    window.ShapeRegistry.octahedron = {
        icon: '◆',
        name: 'Octaedro',
		category: "basic",
		subcat: "basic",
		params: [
            { name: 'radius', label: 'Raio', default: 8, min: 4, max: 16 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const r = params.radius;
            const color = currentColor || '#32CD32';

            // O Octaedro é definido pela Distância de Manhattan
            // |x| + |y| + |z| <= r
            
            for (let i = -r; i <= r; i++) {
                for (let j = -r; j <= r; j++) {
                    for (let k = -r; k <= r; k++) {
                        
                        const manhattanDist = Math.abs(i) + Math.abs(j) + Math.abs(k);
                        
                        if (manhattanDist <= r) {
                            addBlockAt(x + i, y + j + 0.5, z + k, color, 'octahedron');
                        }
                    }
                }
            }
        }
    },

    window.ShapeRegistry.dodecahedron = {
        icon: '⬟',
        name: 'Dodecaedro',
		category: "basic",
		subcat: "basic",
		params: [
            { name: 'radius', label: 'Raio', default: 7, min: 4, max: 14 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const r = params.radius;
            const color = currentColor || '#9370DB';
            const phi = 1.61803398875; // Proporção Áurea
            const limit = r * 1.2; // Bounding box um pouco maior

            for (let i = -limit; i <= limit; i++) {
                for (let j = -limit; j <= limit; j++) {
                    for (let k = -limit; k <= limit; k++) {
                        
                        // O Dodecaedro é a interseção de 12 planos baseados em Phi
                        // Definição geométrica simplificada para voxels:
                        
                        // 1. Deve estar dentro de um cubo delimitador (esfera aproximada)
                        // x^2 + y^2 + z^2 < r^2 * 1.3 (Otimização)
                        if (i*i + j*j + k*k > r*r * 1.4) continue;

                        const absX = Math.abs(i);
                        const absY = Math.abs(j);
                        const absZ = Math.abs(k);

                        // As 12 faces do dodecaedro são definidas por:
                        // φ * |x| + |y| <= r * φ^2
                        // φ * |y| + |z| <= r * φ^2
                        // φ * |z| + |x| <= r * φ^2
                        // (Nota: Ajustamos a constante para voxel art ficar preenchido)
                        const scaleFactor = r * (phi * phi) * 0.85; // 0.85 para ajustar visualmente

                        const c1 = phi * absX + absY <= scaleFactor;
                        const c2 = phi * absY + absZ <= scaleFactor;
                        const c3 = phi * absZ + absX <= scaleFactor;
                        
                        // Também limitado pelas faces de um cubo interno maior
                        const c4 = absX <= r;
                        const c5 = absY <= r;
                        const c6 = absZ <= r;

                        if (c1 && c2 && c3) {
                             addBlockAt(x + i, y + j + 0.5, z + k, color, 'dodecahedron');
                        }
                    }
                }
            }
        }
    },

    window.ShapeRegistry.icosahedron = {
        icon: '◈',
        name: 'Icosaedro',
		category: "basic",
		subcat: "basic",
		params: [
            { name: 'radius', label: 'Raio', default: 7, min: 4, max: 14 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const r = params.radius;
            const color = currentColor || '#00CED1';
            const phi = 1.61803398875;
            const limit = r;

            for (let i = -limit; i <= limit; i++) {
                for (let j = -limit; j <= limit; j++) {
                    for (let k = -limit; k <= limit; k++) {
                        
                        // Otimização esférica
                        if (i*i + j*j + k*k > r*r * 1.2) continue;

                        const absX = Math.abs(i);
                        const absY = Math.abs(j);
                        const absZ = Math.abs(k);

                        // O Icosaedro é a interseção de 20 planos.
                        // As condições principais envolvem a Proporção Áurea:
                        
                        // Fator de escala visual
                        const S = r * 0.85;

                        // Condição 1: Planos do Octaedro (pyramidais)
                        // |x| + |y| + |z| <= r * constante
                        const cOcta = (absX + absY + absZ) <= S * phi * 1.7;

                        // Condição 2: Planos Áureos
                        // |x| + phi * |z| <= S * phi^2
                        // |y| + phi * |x| <= S * phi^2
                        // |z| + phi * |y| <= S * phi^2
                        const limitGolden = S * (phi * phi);
                        
                        const c1 = absX + phi * absZ <= limitGolden;
                        const c2 = absY + phi * absX <= limitGolden;
                        const c3 = absZ + phi * absY <= limitGolden;

                        if (cOcta && c1 && c2 && c3) {
                            addBlockAt(x + i, y + j + 0.5, z + k, color, 'icosahedron');
                        }
                    }
                }
            }
        }
    },	
	// Final da inserção dos sólidos platônicos (conferido até aqui)
	// Variações Geométricas: hollowSphere, hollowCone, hollowCylinder, rectangularPrism, hexagon, superquadric, pyramid.
	
		window.ShapeRegistry.hollowSphere = {
        icon: '🔮',
        name: 'Esfera Oca',
		category: "basic",
		subcat: "basic",
		params: [
            { name: 'radius', label: 'Raio Externo', default: 6, min: 4, max: 15 },
            { name: 'thickness', label: 'Espessura', default: 1, min: 1, max: 4 }
        ],
        generate: (params) => {
            const cx = 0, cy = 0, cz = 0;
            const r = params.radius;
            const t = params.thickness;
            const color = currentColor || '#FFFFFF';

            // Cálculos dos raios ao quadrado para performance (evita Raiz Quadrada no loop)
            const rOuterSq = r * r;
            
            // Raio interno = Raio - Espessura. 
            // Math.max garante que não fique negativo.
            const rInner = Math.max(0, r - t);
            const rInnerSq = rInner * rInner;

            for (let x = -r; x <= r; x++) {
                for (let y = -r; y <= r; y++) {
                    for (let z = -r; z <= r; z++) {
                        
                        const distSq = x*x + y*y + z*z;

                        // Lógica da Casca:
                        // 1. Deve estar DENTRO do raio externo (distSq <= rOuterSq)
                        // 2. Deve estar FORA do raio interno (distSq >= rInnerSq)
                        if (distSq <= rOuterSq && distSq >= rInnerSq) {
                            addBlockAt(
                                cx + x, 
                                cy + r + y + 0.5, // Eleva para ficar acima do chão
                                cz + z, 
                                color, 
                                'sphere', // Usa esferas para acabamento suave (ou mude para 'cube')
                                1 // Escala
                            );
                        }
                    }
                }
            }
        }
    },
	
	window.ShapeRegistry.hollowCone = {
        icon: '🌪️',
        name: 'Cone Oco',
		category: "basic",
		subcat: "basic",
		params: [
            { name: 'radius', label: 'Raio Base', default: 8, min: 3, max: 15 },
            { name: 'height', label: 'Altura', default: 12, min: 5, max: 25 },
            { name: 'thickness', label: 'Espessura', default: 1, min: 1, max: 3 }
        ],
        generate: (params) => {
            const cx = 0, cy = 0, cz = 0;
            const r = params.radius;
            const h = params.height;
            const t = params.thickness;
            const color = currentColor || '#FFD700';

            for (let y = 0; y < h; y++) {
                // Calcula o raio do cone nessa altura específica (Linear)
                // Na base (y=0) é 100%, no topo (y=h) é 0%
                const ratio = 1 - (y / h);
                
                // Raio Externo atual
                const currentROuter = r * ratio;
                const rOuterSq = currentROuter * currentROuter;

                // Raio Interno atual (Raio externo - Espessura)
                // Math.max(0) impede raio negativo no topo
                const currentRInner = Math.max(0, currentROuter - t);
                const rInnerSq = currentRInner * currentRInner;

                // Otimização: Limita o loop X/Z ao raio atual
                const limit = Math.ceil(currentROuter);

                for (let x = -limit; x <= limit; x++) {
                    for (let z = -limit; z <= limit; z++) {
                        
                        const distSq = x*x + z*z;

                        // Lógica da Casca Cônica:
                        // 1. Deve estar dentro do cone externo
                        // 2. Deve estar fora do cone interno (buraco)
                        if (distSq <= rOuterSq && distSq >= rInnerSq) {
                            addBlockAt(
                                cx + x, 
                                cy + y + 0.5, // Base no chão
                                cz + z, 
                                color, 
                                'cube', // Cubo preenche melhor paredes finas inclinadas
                                1
                            );
                        }
                    }
                }
            }
        }
    },
	
    window.ShapeRegistry.hollowCylinder = {
        icon: '⭕',
        name: 'Cilindro Oco',
		category: "basic",
		subcat: "basic",
        params: [
            { name: 'outerRadius', label: 'Raio Externo', default: 4, min: 3, max: 10 },
            { name: 'thickness', label: 'Espessura', default: 1, min: 1, max: 3 },
            { name: 'height', label: 'Altura', default: 8, min: 3, max: 15 }
        ],
        generate: (params) => {
            const outerR = params.outerRadius;
            const thickness = params.thickness;
            const innerR = outerR - thickness;
            const h = params.height;
            
            const outerSquared = outerR * outerR;
            const innerSquared = innerR * innerR;
            
            for (let x = -outerR; x <= outerR; x++) {
                for (let z = -outerR; z <= outerR; z++) {
                    const distSquared = x*x + z*z;
                    if (distSquared <= outerSquared && distSquared >= innerSquared) {
                        for (let y = 0; y < h; y++) {
                            addBlockAt(x, y + 0.5, z, currentColor, 'cylinder');
                        }
                    }
                }
            }
        }
    },
    
    window.ShapeRegistry.rectangularPrism = {
        icon: '⬜',
        name: 'Paralelepípedo',
		category: "basic",
		subcat: "basic",
        params: [
            { name: 'width', label: 'Largura', default: 8, min: 3, max: 15 },
            { name: 'height', label: 'Altura', default: 5, min: 3, max: 12 },
            { name: 'depth', label: 'Profundidade', default: 4, min: 3, max: 15 }
        ],
        generate: (params) => {
            const w = params.width;
            const h = params.height;
            const d = params.depth;
            
            const hw = Math.floor(w / 2);
            const hd = Math.floor(d / 2);
            
            for (let x = -hw; x <= hw; x++) {
                for (let y = 0; y < h; y++) {
                    for (let z = -hd; z <= hd; z++) {
                        addBlockAt(x, y + 0.5, z, currentColor, 'cube');
                    }
                }
            }
        }
    },
	
	window.ShapeRegistry.hexagon = {
		icon: '⬢',
		name: 'Prisma Hexagonal',
		category: "basic",
		subcat: "basic",
        params: [
			{ name: 'radius', label: 'Raio', default: 6, min: 2, max: 15 },
			{ name: 'height', label: 'Altura', default: 4, min: 1, max: 10 },
			{ name: 'hollow', label: 'Oco (0-0.9)', default: 0, min: 0, max: 0.9 }
		],
		generate: (params) => {
			const cx = 0, cy = 0, cz = 0;
			const r = params.radius;
			const h = params.height;
			const hollowFactor = params.hollow;
			const color = currentColor || '#00BCD4';

			// Constante matemática para o Hexágono
			// Usaremos orientação "Flat-Topped" (lados planos na esquerda/direita)
			const sqrt3_2 = 0.866025; // Aproximadamente √3 / 2

			// Loop pela Bounding Box (Quadrado que contém o hexágono)
			// Otimização: O limite em Z é r * √3/2, mas usamos r pra garantir
			for (let x = -r; x <= r; x++) {
				for (let z = -r; z <= r; z++) {
					
					// --- MATEMÁTICA DO HEXÁGONO ---
					// A distância do centro (0,0) em um hexágono é:
					// d = max( |x|, |x|/2 + |z|*√3/2 )
					
					const absX = Math.abs(x);
					const absZ = Math.abs(z);
					
					// Calcula a "distância hexagonal"
					const hexDist = Math.max(absX, (absX * 0.5) + (absZ * sqrt3_2));

					// Lógica de Renderização
					// 1. O bloco está DENTRO do hexágono externo?
					if (hexDist <= r + 0.1) { // +0.1 para arredondamento suave nas bordas
						
						// 2. Se for OCO, o bloco está DENTRO do buraco?
						// Se sim, pulamos (continue)
						if (hollowFactor > 0) {
							const innerRadius = r * hollowFactor;
							// Subtraímos 0.5 do raio interno para garantir que a parede tenha espessura mínima
							if (hexDist < innerRadius - 0.5) {
								continue; 
							}
						}

						// Constrói a coluna
						for (let y = 0; y < h; y++) {
							addBlockAt(
								cx + x, 
								cy + y + 0.5, 
								cz + z, 
								color, 
								'cube', // Cubo preenche melhor (estilo Minecraft)
								1
							);
						}
					}
				}
			}
		}
	},    
    // --- PIRÂMIDE ---
    window.ShapeRegistry.pyramid = {
        icon: '🔺',
        name: 'Pirâmide',
		category: "basic",
		subcat: "basic",
		params: [
            { name: 'baseSize', label: 'Tamanho Base', default: 7, min: 3, max: 15 },
            { name: 'height', label: 'Altura', default: 7, min: 3, max: 15 }
        ],
        generate: (params) => {
            const base = params.baseSize;
            const h = params.height;
            for (let y = 0; y < h; y++) {
                const ratio = 1 - (y / h);
                const currentSize = Math.ceil(base * ratio);
                const half = Math.floor(currentSize / 2);
                for (let x = -half; x <= half; x++) {
                    for (let z = -half; z <= half; z++) {
                        addBlockAt(x, y + 0.5, z, currentColor, 'pyramid');
                    }
                }
            }
        }
    },
	
	// 🗼 TORRE EXATA (replica 100% o JSON fornecido)
// Esta função recria EXATAMENTE a estrutura do arquivo JSON

	window.ShapeRegistry.throne = {
		icon: '👑',
		name: 'Trono',
		category: "objects",
		subcat: "obj-furniture",
		params: [
			{ name: 'scale', label: 'Escala', default: 1, min: 0.5, max: 3, step: 0.5 },
			{ name: 'offsetX', label: 'Offset X', default: 0, min: -10, max: 10, step: 1 },
			{ name: 'offsetZ', label: 'Offset Z', default: 0, min: -10, max: 10, step: 1 }
		],
		generate: (params) => {
			const scale = params.scale;
			const ox = params.offsetX;
			const oz = params.offsetZ;
			const color = currentColor || '#8b4513';
			
			// Helper para adicionar bloco com escala e offset
			const add = (x, y, z) => {
				addBlockAt(
					x * scale + ox, 
					y * scale, 
					z * scale + oz, 
					color, 
					'cube',
					scale
				);
			};
			
			// ========================================
			// NÍVEL 1: Y = 0.5 (Base - 4 colunas)
			// ========================================
			add(-1, 0.5, 3);
			add(-1, 0.5, 0);
			add(2, 0.5, 3);
			add(2, 0.5, 0);
			
			// ========================================
			// NÍVEL 2: Y = 1.5 (4 colunas)
			// ========================================
			add(2, 1.5, 3);
			add(-1, 1.5, 3);
			add(-1, 1.5, 0);
			add(2, 1.5, 0);
			
			// ========================================
			// NÍVEL 3: Y = 2.5 (4 colunas)
			// ========================================
			add(2, 2.5, 3);
			add(-1, 2.5, 3);
			add(-1, 2.5, 0);
			add(2, 2.5, 0);
			
			// ========================================
			// NÍVEL 4: Y = 3.5 (Piso completo - 16 blocos)
			// ========================================
			add(1, 3.5, 0);
			add(0, 3.5, 0);
			add(1, 3.5, 3);
			add(0, 3.5, 3);
			add(2, 3.5, 2);
			add(2, 3.5, 1);
			add(1, 3.5, 2);
			add(1, 3.5, 1);
			add(0, 3.5, 2);
			add(-1, 3.5, 2);
			add(0, 3.5, 1);
			add(-1, 3.5, 1);
			add(-1, 3.5, 3);
			add(-1, 3.5, 0);
			add(2, 3.5, 0);
			add(2, 3.5, 3);
			
			// ========================================
			// NÍVEL 5: Y = 4.5 (Torre direita - 4 blocos)
			// ========================================
			add(2, 4.5, 3);
			add(2, 4.5, 2);
			add(2, 4.5, 1);
			add(2, 4.5, 0);
			
			// ========================================
			// NÍVEL 6: Y = 5.5 (Torre - 2 blocos)
			// ========================================
			add(2, 5.5, 3);
			add(2, 5.5, 0);
			
			// ========================================
			// NÍVEL 7: Y = 6.0 (Torre - 2 blocos)
			// ========================================
			add(2, 6.0, 2);
			add(2, 6.0, 1);
			
			// ========================================
			// NÍVEL 8: Y = 6.5 (Torre - 2 blocos)
			// ========================================
			add(2, 6.5, 3);
			add(2, 6.5, 0);
			
			// ========================================
			// NÍVEL 9: Y = 7.5 (Torre - 4 blocos)
			// ========================================
			add(2, 7.5, 0);
			add(2, 7.5, 3);
			add(2, 7.5, 2);
			add(2, 7.5, 1);
			
			// ========================================
			// NÍVEL 10: Y = 8.0 (Torre - 2 blocos)
			// ========================================
			add(2, 8.0, 3);
			add(2, 8.0, 0);
			
			// ========================================
			// NÍVEL 11: Y = 8.5 (Pináculo - 1 bloco)
			// ========================================
			add(2, 8.5, 3);
		}
	},
	
	window.ShapeRegistry.chair = {
		icon: '🪑',
		name: 'Cadeira',
		category: "objects",
		subcat: "obj-furniture",
		params: [
			{ name: 'scale', label: 'Escala', default: 1, min: 0.5, max: 3, step: 0.5 },
			{ name: 'offsetX', label: 'Offset X', default: 0, min: -10, max: 10 },
			{ name: 'offsetZ', label: 'Offset Z', default: 0, min: -10, max: 10 }
		],

		generate: (params) => {
			const s = params.scale;
			const ox = params.offsetX;
			const oz = params.offsetZ;
			const color = currentColor || '#8b4513';

			const add = (x, y, z) => {
				addBlockAt(
					x * s + ox,
					y * s,
					z * s + oz,
					color,
					'cube',
					s
				);
			};

			// ==========================
			// PERNAS (4 colunas)
			// ==========================
			const legs = [
				[-1, 0],
				[1, 0],
				[-1, 2],
				[1, 2]
			];

			legs.forEach(([x, z]) => {
				add(x, 0.5, z);
				add(x, 1.5, z);
				add(x, 2.5, z);
			});

			// ==========================
			// ASSENTO (3x3)
			// Y = 3.5
			// ==========================
			for (let x = -1; x <= 1; x++) {
				for (let z = 0; z <= 2; z++) {
					add(x, 3.5, z);
				}
			}

			// ==========================
			// ENCOSTO (plano vertical)
			// atrás do assento
			// ==========================
			for (let x = -1; x <= 1; x++) {
				add(x, 4.5, 2);
				add(x, 5.5, 2);
			}
		}
	},
	
	window.ShapeRegistry.table = {
		icon: '🍽️',
		name: 'Mesa',
		category: "objects",
		subcat: "obj-furniture",
		params: [
			{ name: 'scale', label: 'Escala', default: 1, min: 0.5, max: 3, step: 0.5 },
			{ name: 'offsetX', label: 'Offset X', default: 0, min: -10, max: 10 },
			{ name: 'offsetZ', label: 'Offset Z', default: 0, min: -10, max: 10 }
		],

		generate: (params) => {
			const s = params.scale;
			const ox = params.offsetX;
			const oz = params.offsetZ;
			const color = currentColor || '#8b4513';

			const add = (x, y, z) => {
				addBlockAt(
					x * s + ox,
					y * s,
					z * s + oz,
					color,
					'cube',
					s
				);
			};

			// ==========================
			// PERNAS (4 colunas)
			// ==========================
			const legs = [
				[-2, 0],
				[ 2, 0],
				[-2, 3],
				[ 2, 3]
			];

			legs.forEach(([x, z]) => {
				add(x, 0.5, z);
				add(x, 1.5, z);
				add(x, 2.5, z);
			});

			// ==========================
			// TAMPO (5x4)
			// Y = 3.5
			// ==========================
			for (let x = -2; x <= 2; x++) {
				for (let z = 0; z <= 3; z++) {
					add(x, 3.5, z);
				}
			}
		}
	},
	
	window.ShapeRegistry.bed = {
		icon: '🛏️',
		name: 'Cama (Genérica)',
		category: "architecture",
		subcat: "furniture-basic",
		params: [
			{ name: 'scale', label: 'Escala', default: 1, min: 0.5, max: 3, step: 0.5 },
			{ name: 'offsetX', label: 'Offset X', default: 0, min: -10, max: 10, step: 1 },
			{ name: 'offsetZ', label: 'Offset Z', default: 0, min: -10, max: 10, step: 1 }
		],
		generate: (params) => {
			const s = params.scale;
			const ox = params.offsetX;
			const oz = params.offsetZ;

			const wood = '#8b4513';
			const mattress = '#e8e8e8';

			const add = (x, y, z, color = wood) => {
				addBlockAt(
					x * s + ox,
					y * s,
					z * s + oz,
					color,
					'cube',
					s
				);
			};

			// =========================
			// BASE MACIÇA (plataforma)
			// =========================
			for (let x = 0; x < 3; x++) {
				for (let z = 0; z < 5; z++) {
					add(x, 0.5, z, wood);
				}
			}

			// =========================
			// COLCHÃO (uma camada)
			// =========================
			for (let x = 0; x < 3; x++) {
				for (let z = 0; z < 5; z++) {
					add(x, 1.5, z, mattress);
				}
			}

			// =========================
			// CABECEIRA SIMBÓLICA
			// =========================
			for (let x = 0; x < 3; x++) {
				add(x, 2.5, 4, wood);
			}
		}
	},

	
	window.ShapeRegistry.chest = {
		icon: '🧰',
		name: 'Baú',
		category: "objects",
		subcat: "obj-furniture",
		params: [
			{ name: 'scale', label: 'Escala', default: 1, min: 0.5, max: 3, step: 0.5 },
			{ name: 'offsetX', label: 'Offset X', default: 0, min: -20, max: 20 },
			{ name: 'offsetZ', label: 'Offset Z', default: 0, min: -20, max: 20 }
		],

		generate: (params) => {
			const s  = params.scale;
			const ox = params.offsetX;
			const oz = params.offsetZ;

			const wood  = '#8b4513';
			const dark  = '#5a2e0f';
			const metal = '#b7b7b7';

			const add = (x, y, z, color, scaleY = 1) => {
				addBlockAt(
					x * s + ox,
					y * s,
					z * s + oz,
					color,
					'cube',
					{ x: s, y: s * scaleY, z: s }
				);
			};

			// ==========================
			// BASE (estrutura inferior)
			// ==========================
			for (let x = -1; x <= 1; x++) {
				for (let z = 0; z <= 2; z++) {
					add(x, 0.5, z, dark);
				}
			}

			// ==========================
			// PAREDES (caixa)
			// ==========================
			for (let y = 1.5; y <= 2.5; y++) {
				for (let x = -1; x <= 1; x++) {
					add(x, y, 0, wood);
					add(x, y, 2, wood);
				}
				add(-1, y, 1, wood);
				add( 1, y, 1, wood);
			}

			// ==========================
			// TAMPA (ligeiramente elevada)
			// ==========================
			for (let x = -1; x <= 1; x++) {
				for (let z = 0; z <= 2; z++) {
					add(x, 3.5, z, wood, 0.6);
				}
			}

			// ==========================
			// FECHO FRONTAL (metal)
			// ==========================
			add(0, 2.0, 0, metal, 0.5);

			// ==========================
			// REFORÇOS METÁLICOS (laterais)
			// ==========================
			add(-1, 2.0, 1, metal, 0.3);
			add( 1, 2.0, 1, metal, 0.3);
		}
	},
	
	window.ShapeRegistry.bookshelf = {
		icon: '📚',
		name: 'Estante',
		category: "objects",
		subcat: "obj-furniture",
		params: [
			{ name: 'scale', label: 'Escala', default: 1, min: 0.5, max: 3, step: 0.5 },
			{ name: 'offsetX', label: 'Offset X', default: 0, min: -20, max: 20 },
			{ name: 'offsetZ', label: 'Offset Z', default: 0, min: -20, max: 20 }
		],

		generate: (params) => {
			const s  = params.scale;
			const ox = params.offsetX;
			const oz = params.offsetZ;

			const wood  = '#8b4513';
			const books = [
				'#c0392b', '#2980b9', '#27ae60',
				'#f1c40f', '#8e44ad', '#d35400',
				'#16a085', '#7f8c8d'
			];

			const add = (x, y, z, color, scaleY = 1) => {
				addBlockAt(
					x * s + ox,
					y * s,
					z * s + oz,
					color,
					'cube',
					{ x: s, y: s * scaleY, z: s }
				);
			};

			// ==========================
			// LATERAIS (estrutura)
			// ==========================
			for (let y = 0.5; y <= 5.5; y += 1) {
				add(-1, y, 0, wood);
				add( 1, y, 0, wood);
			}

			// ==========================
			// PRATELEIRAS
			// ==========================
			const shelves = [1.5, 3.0, 4.5];

			shelves.forEach(y => {
				for (let x = -1; x <= 1; x++) {
					add(x, y, 0, wood, 0.3);
				}
			});

			// ==========================
			// LIVROS (conteúdo)
			// ==========================
			shelves.forEach(y => {
				for (let x = -1; x <= 1; x++) {
					const color = books[Math.floor(Math.random() * books.length)];
					add(x, y + 0.5, 0, color, 0.8);
				}
			});

			// ==========================
			// TAMPO SUPERIOR
			// ==========================
			for (let x = -1; x <= 1; x++) {
				add(x, 6.5, 0, wood, 0.4);
			}
		}
	};

    console.log("🧩 Shapes Básicas Carregadas");
}