// js/shapes/shapes_math.js
//Matemática, Fractais e Místico:

    //icon: '🎨',           // sempre primeiro
    //name: 'Nome Legível', // sempre segundo
    //category: 'basic',    // sempre terceiro
    //subcat: 'geometry',   // opcional, quarto
	
	//params: [...

if (window.ShapeRegistry) {
	
	//Curvas Complexas: helix, dnaHelix, spiral2D, knot, mobius, klein_bottle, wave, heart.
	
	    window.ShapeRegistry.helix = {
        icon: '🌀',
        name: 'Hélice',
		category: "abstract",
        subcat: "math-geometry",
        params: [
            { name: 'radius', label: 'Raio', default: 4, min: 2, max: 8 },
            { name: 'height', label: 'Altura', default: 12, min: 5, max: 20 },
            { name: 'turns', label: 'Voltas', default: 3, min: 1, max: 6 }
        ],
        generate: (params) => {
            const r = params.radius;
            const h = params.height;
            const turns = params.turns;
            const steps = h * 10;
            
            for (let i = 0; i < steps; i++) {
                const t = (i / steps) * turns * Math.PI * 2;
                const x = Math.round(r * Math.cos(t));
                const z = Math.round(r * Math.sin(t));
                const y = Math.round((i / steps) * h);
                addBlockAt(x, y + 0.5, z, currentColor, 'sphere');
            }
        }
    },
    // --- DNA ---
    window.ShapeRegistry.dna = {
        icon: "🧬",
		name: "DNA Duplo",
        category: "abstract",
        subcat: "math-geometry",
        params: [
            { name: "height", label: "Altura", default: 20, min: 10, max: 50 },
            { name: "radius", label: "Raio", default: 4, min: 2, max: 8 }
        ],
        generate: function(p) {
            const h = p.height;
            const r = p.radius;
            const frequency = 0.5; // Frequência da volta
            
            for(let y=0; y<h; y++) {
                const angle = y * frequency;
                
                // Hélice 1
                const x1 = Math.cos(angle) * r;
                const z1 = Math.sin(angle) * r;
                addBlockAt(x1, y, z1, "#3498db", "sphere", 0.8); // Esfera azul, escala 0.8
                
                // Hélice 2 (Deslocada 180 graus / PI)
                const x2 = Math.cos(angle + Math.PI) * r;
                const z2 = Math.sin(angle + Math.PI) * r;
                addBlockAt(x2, y, z2, "#e74c3c", "sphere", 0.8); // Esfera vermelha
                
                // Ligações (Degraus) a cada 2 blocos
                if (y % 2 === 0) {
                    const steps = Math.floor(r * 2);
                    for(let i=1; i<steps; i++) {
                        // Interpolação linear entre x1 e x2
                        const t = i / steps;
                        const lx = x1 + (x2 - x1) * t;
                        const lz = z1 + (z2 - z1) * t;
                        addBlockAt(lx, y, lz, "#ecf0f1", "cylinder", 0.4); // Cilindro fino
                    }
                }
            }
        }
    },
	
	window.ShapeRegistry.spiral2D = {
        icon: '🌀',
        name: 'Espiral 2D',
		category: "abstract",
        subcat: "math-geometry",
        params: [
            { name: 'coils', label: 'Voltas', default: 3, min: 1, max: 6 },
            { name: 'radius', label: 'Raio', default: 8, min: 4, max: 15 }
        ],
        generate: (params) => {
            const coils = params.coils;
            const radius = params.radius;
            const steps = 200;
            
            for (let i = 0; i <= steps; i++) {
                const t = (i / steps) * coils * Math.PI * 2;
                const r = (radius * i) / steps;
                const x = Math.round(Math.cos(t) * r);
                const z = Math.round(Math.sin(t) * r);
                addBlockAt(x, 0.5, z, currentColor, 'sphere');
            }
        }
    },
	
	window.ShapeRegistry.knot = {
		icon: '🎗️',
		name: 'Nó Toroidal',
		category: "abstract",
		subcat: "math-topology",
        params: [
			{ name: 'radius', label: 'Raio Principal', default: 8, min: 5, max: 15 },
			{ name: 'tube', label: 'Espessura do Tubo', default: 2, min: 1, max: 5 },
			{ name: 'turns', label: 'Voltas', default: 3, min: 2, max: 8 },
			{ name: 'resolution', label: 'Resolução', default: 100, min: 50, max: 300 }
		],
		generate: (params) => {
			const x = 0, y = 0, z = 0;
			const R = params.radius;
			const r = params.tube;
			const p = params.turns;
			const q = 2;
			const steps = params.resolution;
			const color = currentColor || '#00FFFF';

			// SEÇÃO 1: Curva do nó paramétrica
			for (let i = 0; i < steps; i++) {
				const t = (i / steps) * Math.PI * 2;
				const xt = (R + r * Math.cos(q * t)) * Math.cos(p * t);
				const yt = (R + r * Math.cos(q * t)) * Math.sin(p * t);
				const zt = r * Math.sin(q * t);
				
				addBlockAt(x + xt, y + yt, z + zt, color, 'sphere', 0.35);
			}

			// SEÇÃO 2: Tubo ao redor da curva (opcional)
			for (let i = 0; i < steps; i += 2) {
				const t = (i / steps) * Math.PI * 2;
				const xt = (R + r * Math.cos(q * t)) * Math.cos(p * t);
				const yt = (R + r * Math.cos(q * t)) * Math.sin(p * t);
				const zt = r * Math.sin(q * t);
				
				// Adiciona pequenas esferas para dar volume
				addBlockAt(x + xt * 1.05, y + yt * 1.05, z + zt, color, 'sphere', 0.25);
				addBlockAt(x + xt * 0.95, y + yt * 0.95, z + zt, color, 'sphere', 0.25);
			}
		}
	},
	
	window.ShapeRegistry.mobius = {
		icon: '🌀',
		name: 'Fita de Möbius',
		category: "abstract",
		subcat: "math-topology",
        params: [
			{ name: 'radius', label: 'Raio', default: 6, min: 4, max: 12 },
			{ name: 'width', label: 'Largura', default: 2, min: 1, max: 4 },
			{ name: 'twists', label: 'Torções', default: 1, min: 1, max: 3 }
		],
		generate: (params) => {
			const x = 0, y = 0, z = 0;
			const R = params.radius;
			const W = params.width;
			const twists = params.twists;
			const color = currentColor || '#FF00FF';

			// SEÇÃO 1: Superfície de Möbius
			for (let u = 0; u < 24; u++) {
				for (let v = 0; v < 12; v++) {
					const uRad = (u / 24) * Math.PI * 2;
					const vRad = (v / 12) * 2 - 1; // -1 a 1
					
					const xPos = (R + W * vRad * Math.cos(twists * uRad / 2)) * Math.cos(uRad);
					const yPos = (R + W * vRad * Math.cos(twists * uRad / 2)) * Math.sin(uRad);
					const zPos = W * vRad * Math.sin(twists * uRad / 2);
					
					addBlockAt(x + xPos, y + yPos, z + zPos, color, 'cube', 0.3);
				}
			}

			// SEÇÃO 2: Borda destacada
			for (let u = 0; u < 48; u += 2) {
				const uRad = (u / 48) * Math.PI * 2;
				const xPos = R * Math.cos(uRad);
				const yPos = R * Math.sin(uRad);
				const zPos = 0;
				
				addBlockAt(x + xPos * 1.1, y + yPos * 1.1, z + zPos, '#FFFFFF', 'sphere', 0.4);
			}
		}
	},
	
	window.ShapeRegistry.klein_bottle = {
		icon: '🧪',
		name: 'Garrafa de Klein',
		category: "abstract",
		subcat: "math-topology",
        params: [
			{ name: 'scale', label: 'Escala', default: 5, min: 3, max: 10 },
			{ name: 'resolution', label: 'Resolução', default: 20, min: 10, max: 40 }
		],
		generate: (params) => {
			const x = 0, y = 0, z = 0;
			const scale = params.scale;
			const res = params.resolution;
			const color = currentColor || '#00FFFF';

			// SEÇÃO 1: Superfície paramétrica da Garrafa de Klein
			for (let u = 0; u < res; u++) {
				for (let v = 0; v < res; v++) {
					const uRad = (u / res) * Math.PI * 2;
					const vRad = (v / res) * Math.PI * 2;
					
					let xPos, yPos, zPos;
					
					if (uRad < Math.PI) {
						xPos = 6 * Math.cos(uRad) * (1 + Math.sin(uRad)) + 
							   4 * (1 - Math.cos(uRad) / 2) * Math.cos(uRad) * Math.cos(vRad);
						yPos = 16 * Math.sin(uRad) + 
							   4 * (1 - Math.cos(uRad) / 2) * Math.sin(uRad) * Math.cos(vRad);
					} else {
						xPos = 6 * Math.cos(uRad) * (1 + Math.sin(uRad)) + 
							   4 * (1 - Math.cos(uRad) / 2) * Math.cos(vRad + Math.PI);
						yPos = 16 * Math.sin(uRad);
					}
					
					zPos = 4 * (1 - Math.cos(uRad) / 2) * Math.sin(vRad);
					
					// Aplicar escala
					xPos *= scale / 20;
					yPos *= scale / 20;
					zPos *= scale / 20;
					
					addBlockAt(x + xPos, y + yPos, z + zPos, color, 'sphere', 0.4);
				}
			}

			// SEÇÃO 2: Estrutura de suporte (base)
			for (let i = -3; i <= 3; i++) {
				for (let j = -3; j <= 3; j++) {
					addBlockAt(x + i * 0.8, y - 4, z + j * 0.8, '#808080', 'cube', 0.7);
				}
			}
		}
	},
	
	window.ShapeRegistry.wave = {
        icon: '🌊',
        name: 'Onda',
		category: "abstract",
        subcat: "math-geometry",
        params: [
            { name: 'length', label: 'Comprimento', default: 12, min: 6, max: 20 },
            { name: 'amplitude', label: 'Amplitude', default: 3, min: 2, max: 6 },
            { name: 'frequency', label: 'Frequência', default: 2, min: 1, max: 4 }
        ],
        generate: (params) => {
            const len = params.length;
            const amp = params.amplitude;
            const freq = params.frequency;
            
            for (let x = 0; x < len; x++) {
                const t = (x / len) * freq * Math.PI * 2;
                const y = Math.round(amp * Math.sin(t) + amp);
                for (let z = -2; z <= 2; z++) {
                    addBlockAt(x - Math.floor(len/2), y + 0.5, z, currentColor, 'sphere');
                }
            }
        }
    },
	
    window.ShapeRegistry.heart = {
        icon: '❤️',
        name: 'Coração',
		category: "abstract",
        subcat: "math-geometry",
        params: [
            { name: 'size', label: 'Tamanho', default: 6, min: 4, max: 12 }
        ],
        generate: (params) => {
            const size = params.size;
            const scale = size / 6;
            
            for (let y = 0; y < size; y++) {
                for (let x = -size; x <= size; x++) {
                    for (let z = -size; z <= size; z++) {
                        const nx = x / scale;
                        const ny = (size - y) / scale;
                        const nz = z / scale;
                        
                        // Equação do coração em 3D
                        const value = Math.pow(nx*nx + (9/4)*(ny*ny) + nz*nz - 1, 3) - nx*nx*nz*nz*nz - (9/80)*(ny*ny)*nz*nz*nz;
                        
                        if (value <= 0) {
                            addBlockAt(x, y + 0.5, z, currentColor, 'sphere');
                        }
                    }
                }
            }
        }
    },
	
// Fractais: fractal_cube (Menger), sierpinski_pyramid, dragon_curve_3d, hilbert_curve, julia_set, apollonian_gasket, spiral_log.

	window.ShapeRegistry.fractal_cube = {
		icon: '🧊',
		name: 'Cubo de Menger',
		category: "abstract",
		subcat: "math-fractal",
        params: [
			{ name: 'size', label: 'Tamanho', default: 9, min: 3, max: 27 },
			{ name: 'iterations', label: 'Iterações', default: 2, min: 1, max: 3 }
		],
		generate: (params) => {
			const x = 0, y = 0, z = 0;
			const size = params.size;
			const iterations = params.iterations;
			const color = currentColor || '#C0C0C0';

			// Função recursiva para criar fractal
			function createMenger(cx, cy, cz, s, iter) {
				if (iter === 0) {
					// Cubo sólido no nível mais baixo
					const half = s / 2;
					for (let dx = -half; dx <= half; dx += 1) {
						for (let dy = -half; dy <= half; dy += 1) {
							for (let dz = -half; dz <= half; dz += 1) {
								addBlockAt(cx + dx, cy + dy, cz + dz, color, 'cube', 0.95);
							}
						}
					}
				} else {
					const newSize = s / 3;
					// Criar 20 subcubos (removendo o centro e centros das faces)
					for (let dx = -1; dx <= 1; dx++) {
						for (let dy = -1; dy <= 1; dy++) {
							for (let dz = -1; dz <= 1; dz++) {
								// Contar quantas coordenadas são zero
								const zeros = (dx === 0 ? 1 : 0) + 
											 (dy === 0 ? 1 : 0) + 
											 (dz === 0 ? 1 : 0);
								
								// Manter apenas subcubos que não estão no centro nem nos centros das faces
								if (zeros <= 1) {
									createMenger(
										cx + dx * newSize,
										cy + dy * newSize,
										cz + dz * newSize,
										newSize,
										iter - 1
									);
								}
							}
						}
					}
				}
			}

			// SEÇÃO 1: Base do fractal
			createMenger(x, y, z, size, iterations);

			// SEÇÃO 2: Plataforma de suporte
			const platformSize = size + 2;
			for (let px = -platformSize; px <= platformSize; px++) {
				for (let pz = -platformSize; pz <= platformSize; pz++) {
					if (Math.abs(px) <= size && Math.abs(pz) <= size) continue;
					
					addBlockAt(x + px, y - size/2 - 1, z + pz, '#808080', 'cube', 0.9);
				}
			}
		}
	},
	
// NOVAS FUNÇÕES
	window.ShapeRegistry.sierpinski_pyramid = {
		icon: '🔺',
		name: 'Pirâmide de Sierpinski',
		category: "abstract",
		subcat: "math-fractal",
        params: [
			{ name: 'size', label: 'Tamanho Base', default: 16, min: 8, max: 32 },
			{ name: 'iterations', label: 'Iterações', default: 3, min: 1, max: 5 },
			{ name: 'heightScale', label: 'Escala Altura', default: 1.0, min: 0.5, max: 2.0 }
		],
		generate: (params) => {
			const x = 0, y = 0, z = 0;
			const baseSize = params.size;
			const iterations = params.iterations;
			const heightScale = params.heightScale;
			const color = currentColor || '#FFA500';
			
			// Função recursiva para criar pirâmide de Sierpinski
			function sierpinski(cx, cy, cz, size, level, maxLevel) {
				if (level >= maxLevel) {
					// Desenhar tetraedro (pirâmide triangular)
					const height = size * heightScale;
					
					// Base triangular
					const points = [
						{x: cx, y: cy, z: cz + size},
						{x: cx - size * 0.866, y: cy, z: cz - size * 0.5},
						{x: cx + size * 0.866, y: cy, z: cz - size * 0.5}
					];
					
					// Preencher base triangular
					for (let i = 0; i <= size; i++) {
						for (let j = 0; j <= i; j++) {
							const px = cx - size/2 + j;
							const pz = cz - size/2 + i;
							
							// Verificar se está dentro do triângulo
							if (isInTriangle(px, pz, points[0].x, points[0].z, 
											 points[1].x, points[1].z, 
											 points[2].x, points[2].z)) {
								for (let h = 0; h < 1; h++) {
									addBlockAt(px, cy + h, pz, color, 'cube', 0.95);
								}
							}
						}
					}
					
					// Lados triangulares da pirâmide
					const apex = {x: cx, y: cy + height, z: cz};
					
					// Criar cada face lateral
					for (let face = 0; face < 3; face++) {
						const p1 = points[face];
						const p2 = points[(face + 1) % 3];
						
						// Criar superfície triangular
						for (let i = 0; i <= size; i++) {
							for (let j = 0; j <= i; j++) {
								const t1 = j / size;
								const t2 = (i - j) / size;
								const t3 = 1 - t1 - t2;
								
								if (t3 >= 0) {
									const px = p1.x * t1 + p2.x * t2 + apex.x * t3;
									const py = p1.y * t1 + p2.y * t2 + apex.y * t3;
									const pz = p1.z * t1 + p2.z * t2 + apex.z * t3;
									
									addBlockAt(px, py, pz, color, 'cube', 0.95);
								}
							}
						}
					}
				} else {
					// Dividir em 4 pirâmides menores
					const newSize = size / 2;
					const newHeight = newSize * heightScale;
					
					// Pirâmide do topo
					sierpinski(cx, cy + newHeight, cz, newSize, level + 1, maxLevel);
					
					// Três pirâmides da base
					const baseY = cy;
					sierpinski(cx, baseY, cz + newSize, newSize, level + 1, maxLevel);
					sierpinski(cx - newSize * 0.866, baseY, cz - newSize * 0.5, newSize, level + 1, maxLevel);
					sierpinski(cx + newSize * 0.866, baseY, cz - newSize * 0.5, newSize, level + 1, maxLevel);
				}
			}
			
			// Função auxiliar para verificar ponto em triângulo
			function isInTriangle(px, pz, ax, az, bx, bz, cx, cz) {
				const area = 0.5 * (-bz * cx + az * (-bx + cx) + ax * (bz - cz) + bx * cz);
				const s = 1/(2*area) * (az * cx - ax * cz + (cz - az) * px + (ax - cx) * pz);
				const t = 1/(2*area) * (ax * bz - az * bx + (az - bz) * px + (bx - ax) * pz);
				return s >= 0 && t >= 0 && (1 - s - t) >= 0;
			}
			
			// Iniciar a recursão
			sierpinski(x, y, z, baseSize, 0, iterations);
		}
	},

	window.ShapeRegistry.dragon_curve_3d = {
		icon: '🐉',
		name: 'Curva do Dragão 3D',
		category: "abstract",
		subcat: "math-organic",
        params: [
			{ name: 'iterations', label: 'Iterações', default: 8, min: 4, max: 12 },
			{ name: 'size', label: 'Tamanho', default: 6, min: 3, max: 10 },
			{ name: 'height', label: 'Altura 3D', default: 2, min: 1, max: 4 }
		],
		generate: (params) => {
			const x = 0, y = 0, z = 0;
			const iterations = params.iterations;
			const size = params.size;
			const heightScale = params.height;
			const color = currentColor || '#FF0000';

			// Função recursiva para gerar curva do dragão
			function dragonCurve(depth, startX, startY, endX, endY, sign, points) {
				if (depth === 0) {
					points.push({ x: endX, y: endY });
				} else {
					// Calcular ponto médio rotacionado 45°
					const midX = (startX + endX) / 2 + sign * (startY - endY) / 2;
					const midY = (startY + endY) / 2 + sign * (endX - startX) / 2;
					
					// Recursão
					dragonCurve(depth - 1, startX, startY, midX, midY, 1, points);
					dragonCurve(depth - 1, endX, endY, midX, midY, -1, points);
				}
			}

			// Gerar pontos 2D
			const points = [{ x: 0, y: 0 }];
			dragonCurve(iterations, 0, 0, size, 0, 1, points);

			// SEÇÃO 1: Desenhar curva 3D (otimizado)
			for (let i = 0; i < points.length - 1; i += 2) { // ← Pula pontos (otimização)
				const p1 = points[i];
				const p2 = points[i + 1];
				
				// Altura ondulada
				const zHeight = Math.sin(i * 0.2) * heightScale;
				
				// Interpolar entre pontos (menos steps = mais rápido)
				const steps = 3; // ← Reduzido de 8 para 3
				for (let t = 0; t <= steps; t++) {
					const ratio = t / steps;
					const px = p1.x + (p2.x - p1.x) * ratio;
					const py = p1.y + (p2.y - p1.y) * ratio;
					const pz = zHeight + Math.sin(ratio * Math.PI) * heightScale * 0.3;
					
					// Criar segmento
					addBlockAt(x + px, y + pz, z + py, color, 'sphere', 0.4);
				}
			}

			// SEÇÃO 2: Pontos de destaque (menos pontos)
			for (let i = 0; i < points.length; i += 8) { // ← A cada 8 pontos
				const p = points[i];
				const zHeight = Math.sin(i * 0.2) * heightScale;
				addBlockAt(x + p.x, y + zHeight, z + p.y, '#FFD700', 'sphere', 0.6);
			}

			// SEÇÃO 3: Base simples (otimizada)
			const baseSize = size * 0.8;
			for (let i = -baseSize; i <= baseSize; i += 1.5) { // ← Espaçamento maior
				for (let j = -baseSize; j <= baseSize; j += 1.5) {
					if (Math.random() < 0.3) { // ← Apenas 30% dos blocos
						addBlockAt(x + i, y - heightScale - 1, z + j, '#808080', 'cube', 0.8);
					}
				}
			}
		}
	},

	window.ShapeRegistry.hilbert_curve = {
		icon: '🔄',
		name: 'Curva de Hilbert 3D',
		category: "abstract",
		subcat: "math-fractal",
        params: [
			{ name: 'order', label: 'Ordem', default: 3, min: 1, max: 5 },
			{ name: 'size', label: 'Tamanho', default: 10, min: 5, max: 20 },
			{ name: 'thickness', label: 'Espessura', default: 0.5, min: 0.2, max: 1.0 }
		],
		generate: (params) => {
			const x = 0, y = 0, z = 0;
			const order = params.order;
			const size = params.size;
			const thickness = params.thickness;
			const color = currentColor || '#00FF00';
			
			// Gerar pontos da curva de Hilbert 3D
			function hilbert3D(index, order, x, y, z, size, points) {
				if (order === 0) {
					points.push({
						x: x * size,
						y: y * size,
						z: z * size
					});
					return;
				}
				
				const halfSize = size / 2;
				
				// Mapeamento dos subcubos
				const vertices = [
					[0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1],
					[1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1]
				];
				
				const sequence = [
					0, 1, 3, 2, 6, 7, 5, 4
				];
				
				for (let i = 0; i < 8; i++) {
					const vertex = vertices[sequence[i]];
					hilbert3D(
						index + i * Math.pow(8, order - 1),
						order - 1,
						x + vertex[0] * halfSize,
						y + vertex[1] * halfSize,
						z + vertex[2] * halfSize,
						halfSize,
						points
					);
				}
			}
			
			// Gerar todos os pontos
			const points = [];
			hilbert3D(0, order, 0, 0, 0, 1, points);
			
			// Escalar os pontos
			const scaledPoints = points.map(p => ({
				x: p.x * size / Math.pow(2, order),
				y: p.y * size / Math.pow(2, order),
				z: p.z * size / Math.pow(2, order)
			}));
			
			// Desenhar a curva 3D
			for (let i = 0; i < scaledPoints.length - 1; i++) {
				const p1 = scaledPoints[i];
				const p2 = scaledPoints[i + 1];
				
				// Criar segmento
				const steps = 5;
				for (let t = 0; t <= steps; t++) {
					const ratio = t / steps;
					const px = p1.x + (p2.x - p1.x) * ratio;
					const py = p1.y + (p2.y - p1.y) * ratio;
					const pz = p1.z + (p2.z - p1.z) * ratio;
					
					addBlockAt(x + px, y + py, z + pz, color, 'sphere', thickness);
					
					// Criar conectores
					if (t < steps) {
						const nextRatio = (t + 1) / steps;
						const nextPx = p1.x + (p2.x - p1.x) * nextRatio;
						const nextPy = p1.y + (p2.y - p1.y) * nextRatio;
						const nextPz = p1.z + (p2.z - p1.z) * nextRatio;
						
						// Distância entre pontos
						const dx = nextPx - px;
						const dy = nextPy - py;
						const dz = nextPz - pz;
						const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
						
						if (dist > 0.1) {
							addBlockAt(
								x + (px + nextPx) / 2,
								y + (py + nextPy) / 2,
								z + (pz + nextPz) / 2,
								color,
								'cylinder',
								{x: thickness/2, y: dist, z: thickness/2},
								{x: Math.atan2(dz, Math.sqrt(dx*dx + dy*dy)), y: Math.atan2(dy, dx), z: 0}
							);
						}
					}
				}
			}
			
			// Adicionar cubo delimitador
			const cubeSize = size * 1.1;
			const cubeColor = '#444444';
			for (let i = 0; i <= cubeSize; i++) {
				for (let j = 0; j <= cubeSize; j++) {
					for (let k = 0; k <= cubeSize; k++) {
						if (i === 0 || i === cubeSize || j === 0 || j === cubeSize || k === 0 || k === cubeSize) {
							if (Math.random() < 0.05) {
								addBlockAt(
									x + i - cubeSize/2,
									y + j - cubeSize/2,
									z + k - cubeSize/2,
									cubeColor,
									'cube',
									0.4
								);
							}
						}
					}
				}
			}
		}
	},

	window.ShapeRegistry.julia_set = {
		icon: '🌊',
		name: 'Conjunto de Julia 3D',
		category: "abstract",
		subcat: "math-fractal",
        params: [
			{ name: 'real', label: 'Parte Real (c)', default: -0.7, min: -1.0, max: 1.0 },
			{ name: 'imag', label: 'Parte Imaginária (c)', default: 0.27015, min: -1.0, max: 1.0 },
			{ name: 'iterations', label: 'Iterações', default: 50, min: 20, max: 100 },
			{ name: 'scale', label: 'Escala', default: 8, min: 4, max: 16 }
		],
		generate: (params) => {
			const x = 0, y = 0, z = 0;
			const cReal = params.real;
			const cImag = params.imag;
			const maxIter = params.iterations;
			const scale = params.scale;
			const color = currentColor || '#FF00FF';
			
			// Constantes do fractal
			const escapeRadius = 4.0;
			const bailout = 16.0;
			
			// Gerar fractal 2D e extruir para 3D
			const gridSize = 20;
			const step = 2.0 / gridSize;
			
			for (let i = -gridSize; i <= gridSize; i++) {
				for (let j = -gridSize; j <= gridSize; j++) {
					let zReal = i * step;
					let zImag = j * step;
					
					let iteration = 0;
					while (iteration < maxIter) {
						const zReal2 = zReal * zReal;
						const zImag2 = zImag * zImag;
						
						if (zReal2 + zImag2 > bailout) break;
						
						const newZReal = zReal2 - zImag2 + cReal;
						const newZImag = 2 * zReal * zImag + cImag;
						
						zReal = newZReal;
						zImag = newZImag;
						
						iteration++;
					}
					
					// Se o ponto está no conjunto de Julia
					if (iteration < maxIter) {
						// Calcular altura baseada na iteração
						const height = (iteration / maxIter) * scale * 2;
						
						// Criar coluna 3D
						for (let h = 0; h < height; h++) {
							// Interpolar cor baseada na iteração
							const hue = (iteration / maxIter) * 360;
							const saturation = 80 + (h / height) * 20;
							const lightness = 40 + (iteration % 20) * 2;
							
							// Converter HSL para RGB (simplificado)
							const colorIntensity = iteration / maxIter;
							const r = Math.floor(255 * colorIntensity);
							const g = Math.floor(128 * (1 - colorIntensity));
							const b = Math.floor(255 * (0.5 + 0.5 * Math.sin(iteration * 0.1)));
							
							const finalColor = `rgb(${r}, ${g}, ${b})`;
							
							addBlockAt(
								x + zReal * scale,
								y + h - scale,
								z + zImag * scale,
								finalColor,
								'cube',
								0.8
							);
						}
						
						// Adicionar topo com formato especial
						const topHeight = height;
						addBlockAt(
							x + zReal * scale,
							y + topHeight - scale,
							z + zImag * scale,
							color,
							'sphere',
							0.5 + (iteration % 5) * 0.1
						);
					}
				}
			}
			
			// Adicionar base
			const baseSize = scale * 1.5;
			for (let i = -baseSize; i <= baseSize; i += 2) {
				for (let j = -baseSize; j <= baseSize; j += 2) {
					addBlockAt(
						x + i,
						y - scale - 1,
						z + j,
						'#333333',
						'cube',
						1.8
					);
				}
			}
		}
	},
	
	window.ShapeRegistry.apollonian_gasket = {
		icon: '⚪',
		name: 'Gasket Apoloniano',
		category: "abstract",
		subcat: "math-fractal",
        params: [
			{ name: 'iterations', label: 'Iterações', default: 3, min: 1, max: 5 },
			{ name: 'baseRadius', label: 'Raio Base', default: 8, min: 4, max: 16 },
			{ name: 'thickness', label: 'Espessura', default: 0.5, min: 0.2, max: 1.0 }
		],
		generate: (params) => {
			const x = 0, y = 0, z = 0;
			const maxIterations = params.iterations;
			const baseRadius = params.baseRadius;
			const thickness = params.thickness;
			const color = currentColor || '#00FFFF';
			
			// Representar círculo como {x, y, z, radius}
			const circles = [];
			
			// Círculos externos (três grandes tangentes)
			const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
			
			// Criar círculo central grande
			circles.push({
				x: 0, y: 0, z: 0,
				radius: baseRadius,
				color: colors[0]
			});
			
			// Criar círculos tangentes ao central
			const smallRadius = baseRadius / 2.0;
			for (let i = 0; i < 3; i++) {
				const angle = (i * 120) * Math.PI / 180;
				const circleX = Math.cos(angle) * (baseRadius - smallRadius);
				const circleZ = Math.sin(angle) * (baseRadius - smallRadius);
				
				circles.push({
					x: circleX, y: 0, z: circleZ,
					radius: smallRadius,
					color: colors[(i + 1) % colors.length]
				});
			}
			
			// Função recursiva para adicionar círculos menores
			function addApollonian(existingCircles, depth) {
				if (depth >= maxIterations) return;
				
				const newCircles = [];
				
				for (let i = 0; i < existingCircles.length; i++) {
					for (let j = i + 1; j < existingCircles.length; j++) {
						for (let k = j + 1; k < existingCircles.length; k++) {
							const c1 = existingCircles[i];
							const c2 = existingCircles[j];
							const c3 = existingCircles[k];
							
							// Calcular círculo de Soddy (tangente aos três)
							// Usando fórmula de Descartes para círculos tangentes
							const k1 = 1 / c1.radius;
							const k2 = 1 / c2.radius;
							const k3 = 1 / c3.radius;
							
							// Solução para curvatura do círculo tangente
							const k4 = k1 + k2 + k3 + 2 * Math.sqrt(k1 * k2 + k2 * k3 + k3 * k1);
							const newRadius = 1 / k4;
							
							// Calcular centro usando coordenadas complexas
							const z1 = complex(c1.x, c1.z);
							const z2 = complex(c2.x, c2.z);
							const z3 = complex(c3.x, c3.z);
							
							// Fórmula de Descartes complexa simplificada
							const z4 = complexMult(
								complexAdd(
									complexAdd(
										complexMult(complex(k1), z1),
										complexMult(complex(k2), z2)
									),
									complexMult(complex(k3), z3)
								),
								complex(1/(k1 + k2 + k3), 0)
							);
							
							const newCircle = {
								x: z4.re,
								y: 0,
								z: z4.im,
								radius: newRadius,
								color: colors[depth % colors.length]
							};
							
							// Verificar se o círculo é válido e não muito pequeno
							if (newRadius > thickness * 0.5 && newRadius < baseRadius) {
								newCircles.push(newCircle);
							}
						}
					}
				}
				
				// Adicionar novos círculos
				existingCircles.push(...newCircles);
				
				// Continuar recursão
				addApollonian(existingCircles, depth + 1);
			}
			
			// Funções auxiliares para números complexos
			function complex(re, im) {
				return { re, im };
			}
			
			function complexAdd(a, b) {
				return complex(a.re + b.re, a.im + b.im);
			}
			
			function complexMult(a, b) {
				return complex(
					a.re * b.re - a.im * b.im,
					a.re * b.im + a.im * b.re
				);
			}
			
			// Gerar fractal
			addApollonian(circles, 1);
			
			// Desenhar todos os círculos como esferas 3D
			circles.forEach(circle => {
				// Desenhar anel principal
				const steps = Math.max(8, Math.floor(circle.radius * 2));
				for (let a = 0; a < 360; a += 360/steps) {
					const angle = a * Math.PI / 180;
					const px = circle.x + Math.cos(angle) * circle.radius;
					const pz = circle.z + Math.sin(angle) * circle.radius;
					
					// Criar anel 3D
					for (let h = -thickness; h <= thickness; h += 0.3) {
						addBlockAt(
							x + px,
							y + h,
							z + pz,
							circle.color,
							'sphere',
							thickness * 0.8
						);
					}
				}
				
				// Desenhar esfera central para círculos maiores
				if (circle.radius > baseRadius * 0.3) {
					addBlockAt(
						x + circle.x,
						y,
						z + circle.z,
						circle.color,
						'sphere',
						Math.max(thickness, circle.radius * 0.2)
					);
				}
			});
			
			// Adicionar plano base
			const planeSize = baseRadius * 2.5;
			for (let i = -planeSize; i <= planeSize; i += 2) {
				for (let j = -planeSize; j <= planeSize; j += 2) {
					const dist = Math.sqrt(i*i + j*j);
					const alpha = 1.0 - Math.min(1.0, dist / planeSize);
					
					if (alpha > 0.3) {
						addBlockAt(
							x + i,
							y - thickness - 1,
							z + j,
							'#222222',
							'cube',
							1.8
						);
					}
				}
			}
		}
	},
	
    // --- ESPIRAL LOGARÍTMICA ---
    window.ShapeRegistry.spiral_log = {
        name: "Espiral Áurea",
        icon: "🐚",
		category: "abstract",
        subcat: "math-geometry",
        params: [
            { name: "loops", label: "Voltas", default: 3, min: 1, max: 6 }
        ],
        generate: function(p) {
            const points = p.loops * 50; // Resolução
            let a = 0.5;
            let b = 0.2;
            
            for(let i=0; i<points; i++) {
                const angle = 0.2 * i;
                const r = a * Math.exp(b * angle); // Fórmula espiral log
                
                const x = r * Math.cos(angle);
                const z = r * Math.sin(angle);
                
                // A altura sobe levemente
                const y = i * 0.1;
                
                // A cor varia com a altura (arco-íris)
                const hue = (i % 360);
                const color = `hsl(${hue}, 70%, 50%)`; // Nota: engine precisa converter HSL se não suportar nativo, mas a maioria dos browsers aceita.
                // Se der erro de cor, use Hex fixo.
                
                // O tamanho do bloco aumenta com o raio
                const scale = Math.min(2.5, 0.5 + (r * 0.1));
                
                addBlockAt(x, y, z, "#f39c12", "cube", scale, {x:0, y: -angle, z:0});
            }
        }
    },

	//Geometria Sagrada: metatrons_cube, flower_of_life, seed_of_life, sri_yantra, vesica_piscis, mandala, pentagram, star, tessellation, 

    window.ShapeRegistry.metatrons_cube = {
        icon: '🔯',
        name: 'Cubo de Metatron',
		category: "abstract",
        subcat: "math-sacred",
        params: [
            { name: 'radius', label: 'Raio', default: 6, min: 4, max: 12 },
            { name: 'showPlatonics', label: 'Mostrar Sólidos', default: 1, min: 0, max: 1 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const radius = params.radius;
            const showPlatonics = params.showPlatonics;
            const color = currentColor || '#FFD700';

            // SEÇÃO 1: 13 Esferas Sagradas
            // 1 esfera central
            addBlockAt(x, y + radius, z, color, 'sphere', 0.8);

            // 6 esferas ao redor (hexágono horizontal)
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const ex = Math.cos(angle) * radius;
                const ez = Math.sin(angle) * radius;
                addBlockAt(x + ex, y + radius, z + ez, color, 'sphere', 0.8);
            }

            // 3 esferas acima (triângulo)
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
                const ex = Math.cos(angle) * radius * 0.577; // raio interno
                const ez = Math.sin(angle) * radius * 0.577;
                addBlockAt(x + ex, y + radius + radius * 0.816, z + ez, color, 'sphere', 0.8);
            }

            // 3 esferas abaixo (triângulo invertido)
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
                const ex = Math.cos(angle) * radius * 0.577;
                const ez = Math.sin(angle) * radius * 0.577;
                addBlockAt(x + ex, y + radius - radius * 0.816, z + ez, color, 'sphere', 0.8);
            }

            // SEÇÃO 2: Linhas Conectoras (Energia)
            const spherePositions = [
                { x: 0, y: radius, z: 0 }, // Centro
            ];

            // Adicionar posições das 12 esferas externas
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                spherePositions.push({
                    x: Math.cos(angle) * radius,
                    y: radius,
                    z: Math.sin(angle) * radius
                });
            }

            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
                spherePositions.push({
                    x: Math.cos(angle) * radius * 0.577,
                    y: radius + radius * 0.816,
                    z: Math.sin(angle) * radius * 0.577
                });
            }

            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
                spherePositions.push({
                    x: Math.cos(angle) * radius * 0.577,
                    y: radius - radius * 0.816,
                    z: Math.sin(angle) * radius * 0.577
                });
            }

            // Conectar centro com todas as outras
            for (let i = 1; i < spherePositions.length; i++) {
                const steps = 10;
                for (let t = 0; t <= steps; t++) {
                    const ratio = t / steps;
                    const px = spherePositions[0].x + (spherePositions[i].x - spherePositions[0].x) * ratio;
                    const py = spherePositions[0].y + (spherePositions[i].y - spherePositions[0].y) * ratio;
                    const pz = spherePositions[0].z + (spherePositions[i].z - spherePositions[0].z) * ratio;
                    addBlockAt(x + px, y + py, z + pz, '#00FFFF', 'sphere', 0.15);
                }
            }

            // SEÇÃO 3: Sólidos Platônicos (opcional)
            if (showPlatonics === 1) {
                // Tetraedro (no topo)
                addBlockAt(x, y + radius * 2.5, z, '#FF00FF', 'tetrahedron', 1.2);
                
                // Cubo
                addBlockAt(x + radius * 1.5, y + radius, z, '#00FF00', 'cube', 0.8);
                
                // Octaedro
                addBlockAt(x - radius * 1.5, y + radius, z, '#FF0000', 'octahedron', 1);
                
                // Dodecaedro
                addBlockAt(x, y + radius, z + radius * 1.5, '#FFFF00', 'dodecahedron', 0.9);
                
                // Icosaedro
                addBlockAt(x, y + radius, z - radius * 1.5, '#00FFFF', 'icosahedron', 1);
            }
        }
    },
	
    window.ShapeRegistry.flower_of_life = {
        icon: '🌸',
        name: 'Flor da Vida',
		category: "abstract",
        subcat: "math-sacred",
        params: [
            { name: 'radius', label: 'Raio dos Círculos', default: 2, min: 1, max: 4 },
            { name: 'rings', label: 'Anéis', default: 2, min: 1, max: 4 },
            { name: 'height', label: 'Altura 3D', default: 3, min: 1, max: 6 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const radius = params.radius;
            const rings = params.rings;
            const height = params.height;
            const color = currentColor || '#9370DB';

            // SEÇÃO 1: Círculo Central
            const centerPositions = [{ x: 0, z: 0 }];

            for (let h = 0; h < height; h++) {
                // Anel do círculo central
                for (let a = 0; a < 360; a += 10) {
                    const angle = a * Math.PI / 180;
                    const cx = Math.cos(angle) * radius;
                    const cz = Math.sin(angle) * radius;
                    addBlockAt(x + cx, y + h, z + cz, color, 'sphere', 0.3);
                }
            }

            // SEÇÃO 2: Anéis de Círculos ao Redor
            for (let ring = 1; ring <= rings; ring++) {
                const circlesInRing = 6 * ring;
                
                for (let i = 0; i < circlesInRing; i++) {
                    // Posição do centro de cada círculo
                    const angle = (i / circlesInRing) * Math.PI * 2;
                    const distance = radius * 2 * ring;
                    
                    // Ajuste para padrão hexagonal perfeito
                    let cx, cz;
                    if (ring === 1) {
                        // Primeiro anel - 6 círculos
                        cx = Math.cos(angle) * radius;
                        cz = Math.sin(angle) * radius;
                    } else {
                        // Anéis externos - padrão mais denso
                        const hexAngle = Math.floor(i / ring) * (Math.PI / 3);
                        const offset = (i % ring) / ring;
                        cx = Math.cos(hexAngle) * radius * ring + Math.cos(hexAngle + Math.PI / 2) * radius * 2 * offset;
                        cz = Math.sin(hexAngle) * radius * ring + Math.sin(hexAngle + Math.PI / 2) * radius * 2 * offset;
                    }

                    centerPositions.push({ x: cx, z: cz });

                    // Desenhar o círculo
                    for (let h = 0; h < height; h++) {
                        for (let a = 0; a < 360; a += 10) {
                            const circleAngle = a * Math.PI / 180;
                            const px = cx + Math.cos(circleAngle) * radius;
                            const pz = cz + Math.sin(circleAngle) * radius;
                            addBlockAt(x + px, y + h, z + pz, color, 'sphere', 0.3);
                        }
                    }
                }
            }

            // SEÇÃO 3: Vesica Piscis nas Interseções (destaque)
            for (let i = 0; i < Math.min(centerPositions.length, 7); i++) {
                const pos = centerPositions[i];
                addBlockAt(x + pos.x, y + height / 2, z + pos.z, '#FFD700', 'sphere', 0.5);
            }
        }
    },

    window.ShapeRegistry.seed_of_life = {
        icon: '🌼',
        name: 'Semente da Vida',
		category: "abstract",
        subcat: "math-sacred",
        params: [
            { name: 'radius', label: 'Raio', default: 3, min: 2, max: 6 },
            { name: 'height', label: 'Altura', default: 4, min: 2, max: 8 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const radius = params.radius;
            const height = params.height;
            const color = currentColor || '#FF1493';

            // SEÇÃO 1: Círculo Central
            for (let h = 0; h < height; h++) {
                for (let a = 0; a < 360; a += 8) {
                    const angle = a * Math.PI / 180;
                    const cx = Math.cos(angle) * radius;
                    const cz = Math.sin(angle) * radius;
                    addBlockAt(x + cx, y + h, z + cz, color, 'sphere', 0.35);
                }
                // Centro brilhante
                addBlockAt(x, y + h, z, '#FFFF00', 'sphere', 0.4);
            }

            // SEÇÃO 2: 6 Círculos ao Redor (Padrão Hexagonal)
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const centerX = Math.cos(angle) * radius;
                const centerZ = Math.sin(angle) * radius;

                for (let h = 0; h < height; h++) {
                    // Círculo completo
                    for (let a = 0; a < 360; a += 8) {
                        const circleAngle = a * Math.PI / 180;
                        const px = centerX + Math.cos(circleAngle) * radius;
                        const pz = centerZ + Math.sin(circleAngle) * radius;
                        addBlockAt(x + px, y + h, z + pz, color, 'sphere', 0.35);
                    }
                    // Centro de cada círculo
                    addBlockAt(x + centerX, y + h, z + centerZ, '#00FFFF', 'sphere', 0.4);
                }
            }

            // SEÇÃO 3: Vesica Piscis (Interseções Sagradas)
            const vesicaColor = '#FFFFFF';
            for (let i = 0; i < 6; i++) {
                const angle1 = (i / 6) * Math.PI * 2;
                const angle2 = ((i + 1) / 6) * Math.PI * 2;
                
                const x1 = Math.cos(angle1) * radius;
                const z1 = Math.sin(angle1) * radius;
                const x2 = Math.cos(angle2) * radius;
                const z2 = Math.sin(angle2) * radius;
                
                // Ponto médio entre dois círculos
                const mx = (x1 + x2) / 2;
                const mz = (z1 + z2) / 2;
                
                for (let h = 0; h < height; h++) {
                    addBlockAt(x + mx, y + h, z + mz, vesicaColor, 'sphere', 0.5);
                }
            }

            // SEÇÃO 4: Conexões energéticas (linhas douradas)
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const centerX = Math.cos(angle) * radius;
                const centerZ = Math.sin(angle) * radius;
                
                // Linha do centro até cada círculo externo
                const steps = 8;
                for (let t = 0; t <= steps; t++) {
                    const ratio = t / steps;
                    const lx = centerX * ratio;
                    const lz = centerZ * ratio;
                    addBlockAt(x + lx, y + height / 2, z + lz, '#FFD700', 'sphere', 0.2);
                }
            }
        }
    },

    window.ShapeRegistry.sri_yantra = {
        icon: '🕉️',
        name: 'Sri Yantra',
		category: "abstract",
        subcat: "math-sacred",
        params: [
            { name: 'size', label: 'Tamanho', default: 8, min: 5, max: 15 },
            { name: 'height', label: 'Altura', default: 5, min: 2, max: 10 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const size = params.size;
            const height = params.height;
            const color = currentColor || '#FF4500';

            // SEÇÃO 1: Bindu (Ponto Central)
            addBlockAt(x, y + height, z, '#FFD700', 'sphere', 0.6);
            
            // Pilar central
            for (let h = 0; h < height; h++) {
                addBlockAt(x, y + h, z, '#FFD700', 'cylinder', 0.3);
            }

            // SEÇÃO 2: 9 Triângulos Entrelaçados
            // 4 triângulos apontando para cima (Shiva - masculino)
            const upTriangles = [
                { radius: size * 0.9, rotation: 0, color: '#FF0000' },
                { radius: size * 0.7, rotation: Math.PI / 9, color: '#FF4500' },
                { radius: size * 0.5, rotation: Math.PI / 6, color: '#FF6347' },
                { radius: size * 0.3, rotation: Math.PI / 4, color: '#FF7F50' }
            ];

            // 5 triângulos apontando para baixo (Shakti - feminino)
            const downTriangles = [
                { radius: size * 0.95, rotation: Math.PI, color: '#00CED1' },
                { radius: size * 0.75, rotation: Math.PI + Math.PI / 10, color: '#20B2AA' },
                { radius: size * 0.6, rotation: Math.PI + Math.PI / 7, color: '#48D1CC' },
                { radius: size * 0.45, rotation: Math.PI + Math.PI / 5, color: '#40E0D0' },
                { radius: size * 0.25, rotation: Math.PI + Math.PI / 3, color: '#7FFFD4' }
            ];

            // Desenhar triângulos para cima
            upTriangles.forEach((tri, idx) => {
                const layerHeight = y + (idx + 1) * (height / 5);
                
                for (let i = 0; i < 3; i++) {
                    const angle = tri.rotation + (i / 3) * Math.PI * 2;
                    const v1 = {
                        x: Math.cos(angle) * tri.radius,
                        z: Math.sin(angle) * tri.radius
                    };
                    const nextAngle = tri.rotation + ((i + 1) / 3) * Math.PI * 2;
                    const v2 = {
                        x: Math.cos(nextAngle) * tri.radius,
                        z: Math.sin(nextAngle) * tri.radius
                    };
                    
                    // Linha entre vértices
                    const steps = 15;
                    for (let t = 0; t <= steps; t++) {
                        const ratio = t / steps;
                        const px = v1.x + (v2.x - v1.x) * ratio;
                        const pz = v1.z + (v2.z - v1.z) * ratio;
                        addBlockAt(x + px, layerHeight, z + pz, tri.color, 'cylinder', 0.25);
                    }
                }
            });

            // Desenhar triângulos para baixo
            downTriangles.forEach((tri, idx) => {
                const layerHeight = y + (idx + 1) * (height / 6);
                
                for (let i = 0; i < 3; i++) {
                    const angle = tri.rotation + (i / 3) * Math.PI * 2;
                    const v1 = {
                        x: Math.cos(angle) * tri.radius,
                        z: Math.sin(angle) * tri.radius
                    };
                    const nextAngle = tri.rotation + ((i + 1) / 3) * Math.PI * 2;
                    const v2 = {
                        x: Math.cos(nextAngle) * tri.radius,
                        z: Math.sin(nextAngle) * tri.radius
                    };
                    
                    // Linha entre vértices
                    const steps = 15;
                    for (let t = 0; t <= steps; t++) {
                        const ratio = t / steps;
                        const px = v1.x + (v2.x - v1.x) * ratio;
                        const pz = v1.z + (v2.z - v1.z) * ratio;
                        addBlockAt(x + px, layerHeight, z + pz, tri.color, 'cylinder', 0.25);
                    }
                }
            });

            // SEÇÃO 3: Círculos Concêntricos (Quadrados)
            const circles = [size * 1.1, size * 1.3, size * 1.5];
            circles.forEach((circleRadius, idx) => {
                for (let a = 0; a < 360; a += 5) {
                    const angle = a * Math.PI / 180;
                    const cx = Math.cos(angle) * circleRadius;
                    const cz = Math.sin(angle) * circleRadius;
                    addBlockAt(x + cx, y + 0.5, z + cz, '#8B4513', 'cube', 0.3);
                }
            });

            // SEÇÃO 4: Lótus Externa (Pétalas)
            const petalCount = 8;
            for (let i = 0; i < petalCount; i++) {
                const angle = (i / petalCount) * Math.PI * 2;
                const petalX = Math.cos(angle) * size * 1.8;
                const petalZ = Math.sin(angle) * size * 1.8;
                
                // Pétala
                for (let p = 0; p < 5; p++) {
                    const petalAngle = angle + (p - 2) * 0.1;
                    const px = Math.cos(petalAngle) * (size * 1.6 + p * 0.3);
                    const pz = Math.sin(petalAngle) * (size * 1.6 + p * 0.3);
                    addBlockAt(x + px, y + 0.3, z + pz, '#FF69B4', 'sphere', 0.4);
                }
            }
        }
    },

    window.ShapeRegistry.vesica_piscis = {
        icon: '♓',
        name: 'Vesica Piscis',
		category: "abstract",
        subcat:"math-sacred",
        params: [
            { name: 'radius', label: 'Raio das Esferas', default: 5, min: 3, max: 10 },
            { name: 'separation', label: 'Separação', default: 0.5, min: 0.3, max: 0.9 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const radius = params.radius;
            const separation = params.separation;
            const color = currentColor || '#4169E1';

            // SEÇÃO 1: Duas Esferas Intersecionadas
            const offset = radius * separation;

            // Esfera da esquerda
            for (let i = -radius; i <= radius; i++) {
                for (let j = -radius; j <= radius; j++) {
                    for (let k = -radius; k <= radius; k++) {
                        const dist = Math.sqrt(i*i + j*j + k*k);
                        if (dist <= radius && dist >= radius - 0.5) {
                            addBlockAt(x - offset + i, y + radius + j, z + k, color, 'sphere', 0.3);
                        }
                    }
                }
            }

            // Esfera da direita
            for (let i = -radius; i <= radius; i++) {
                for (let j = -radius; j <= radius; j++) {
                    for (let k = -radius; k <= radius; k++) {
                        const dist = Math.sqrt(i*i + j*j + k*k);
                        if (dist <= radius && dist >= radius - 0.5) {
                            addBlockAt(x + offset + i, y + radius + j, z + k, color, 'sphere', 0.3);
                        }
                    }
                }
            }

            // SEÇÃO 2: Região de Interseção (Vesica)
            // A forma da "bexiga de peixe" onde as esferas se sobrepõem
            const vesicaColor = '#FFD700';
            
            for (let i = -radius; i <= radius; i++) {
                for (let j = -radius; j <= radius; j++) {
                    for (let k = -radius; k <= radius; k++) {
                        const dist1 = Math.sqrt((i + offset)*(i + offset) + j*j + k*k);
                        const dist2 = Math.sqrt((i - offset)*(i - offset) + j*j + k*k);
                        
                        // Dentro de ambas as esferas
                        if (dist1 <= radius && dist2 <= radius) {
                            addBlockAt(x + i, y + radius + j, z + k, vesicaColor, 'sphere', 0.4);
                        }
                    }
                }
            }

            // SEÇÃO 3: Centros das Esferas (marcados)
            addBlockAt(x - offset, y + radius, z, '#FF0000', 'sphere', 0.8);
            addBlockAt(x + offset, y + radius, z, '#00FF00', 'sphere', 0.8);

            // SEÇÃO 4: Eixo da Proporção Áurea
            // Linha conectando os centros
            const steps = Math.floor(offset * 2 * 5);
            for (let t = 0; t <= steps; t++) {
                const ratio = t / steps;
                const px = -offset + (offset * 2) * ratio;
                addBlockAt(x + px, y + radius, z, '#FFFFFF', 'cylinder', 0.2);
            }

            // SEÇÃO 5: Geometria Derivada (Triângulo Equilátero)
            // A vesica piscis forma a base de um triângulo equilátero perfeito
            const triHeight = radius * Math.sqrt(3);
            
            // Vértice superior do triângulo
            addBlockAt(x, y + radius + triHeight - offset, z, '#FF00FF', 'sphere', 0.7);
            
            // Linhas do triângulo
            const triSteps = 20;
            for (let t = 0; t <= triSteps; t++) {
                const ratio = t / triSteps;
                
                // Lado esquerdo
                const lx1 = -offset + offset * ratio;
                const ly1 = (triHeight - offset) * ratio;
                addBlockAt(x + lx1, y + radius + ly1, z, '#9370DB', 'sphere', 0.25);
                
                // Lado direito
                const lx2 = offset - offset * ratio;
                const ly2 = (triHeight - offset) * ratio;
                addBlockAt(x + lx2, y + radius + ly2, z, '#9370DB', 'sphere', 0.25);
            }

            // SEÇÃO 6: Círculo Circunscrito
            for (let a = 0; a < 360; a += 5) {
                const angle = a * Math.PI / 180;
                const circleRadius = radius * 1.1;
                const cx = Math.cos(angle) * circleRadius;
                const cz = Math.sin(angle) * circleRadius;
                addBlockAt(x + cx, y + radius, z + cz, '#00FFFF', 'sphere', 0.25);
            }
        }
    },
	
		//Geometria Sagrada:  mandala, pentagram, star, tessellation.
		
	window.ShapeRegistry.mandala = {
		icon: '☸️',
		name: 'Mandala 3D',
		category: "abstract",
		subcat: "math-sacred",
        params: [
			{ name: 'radius', label: 'Raio', default: 8, min: 5, max: 15 },
			{ name: 'layers', label: 'Camadas', default: 5, min: 3, max: 8 },
			{ name: 'elements', label: 'Elementos', default: 12, min: 6, max: 24 }
		],
		generate: (params) => {
			const x = 0, y = 0, z = 0;
			const radius = params.radius;
			const layers = params.layers;
			const elements = params.elements;
			const color = currentColor || '#FF00FF';

			// SEÇÃO 1: Camadas concêntricas
			for (let layer = 1; layer <= layers; layer++) {
				const layerRadius = (radius / layers) * layer;
				const layerHeight = layer * 1.5;
				
				for (let i = 0; i < elements * layer; i++) {
					const angle = (i / (elements * layer)) * Math.PI * 2;
					const elementType = i % 3;
					
					const ex = Math.cos(angle) * layerRadius;
					const ez = Math.sin(angle) * layerRadius;
					
					// Alterna entre diferentes formas
					if (elementType === 0) {
						addBlockAt(x + ex, y + layerHeight, z + ez, color, 'sphere', 0.5);
					} else if (elementType === 1) {
						addBlockAt(x + ex, y + layerHeight - 0.5, z + ez, color, 'cylinder', {
							x: 0.4, y: 1.2, z: 0.4
						});
					} else {
						addBlockAt(x + ex, y + layerHeight + 0.5, z + ez, '#00FFFF', 'cone', 0.6);
					}
					
					// Linhas conectando elementos
					if (i % 2 === 0) {
						const nextAngle = ((i + 1) / (elements * layer)) * Math.PI * 2;
						const nex = Math.cos(nextAngle) * layerRadius;
						const nez = Math.sin(nextAngle) * layerRadius;
						
						for (let t = 0; t <= 5; t++) {
							const ratio = t / 5;
							const tx = ex + (nex - ex) * ratio;
							const tz = ez + (nez - ez) * ratio;
							
							addBlockAt(x + tx, y + layerHeight - 0.2, z + tz, '#FFFFFF', 'cube', 0.2);
						}
					}
				}
			}

			// SEÇÃO 2: Centro da mandala
			addBlockAt(x, y + 1, z, '#FFD700', 'sphere', 1.5);
			addBlockAt(x, y + 3, z, '#FFD700', 'cylinder', { x: 1, y: 2, z: 1 });
			addBlockAt(x, y + 5, z, '#FF00FF', 'cone', 1.2);
		}
	},
	
	window.ShapeRegistry.pentagram = {
		icon: '⭐',
		name: 'Pentagrama 3D',
		category: "abstract",
		subcat: "math-sacred",
        params: [
			{ name: 'radius', label: 'Raio', default: 6, min: 3, max: 12 },
			{ name: 'height', label: 'Altura', default: 8, min: 4, max: 16 }
		],
		generate: (params) => {
			const x = 0, y = 0, z = 0;
			const radius = params.radius;
			const height = params.height;
			const color = currentColor || '#FFD700';

			// SEÇÃO 1: Pontas do pentagrama (5 pontos)
			const points = [];
			for (let i = 0; i < 5; i++) {
				const angle = (i * 72 - 90) * Math.PI / 180;
				const px = Math.cos(angle) * radius;
				const pz = Math.sin(angle) * radius;
				points.push({ x: px, z: pz });
				
				// Coluna em cada ponta
				for (let h = 0; h < height; h++) {
					addBlockAt(x + px, y + h, z + pz, color, 'cylinder', 0.4);
				}
				
				// Esfera no topo
				addBlockAt(x + px, y + height, z + pz, '#FFD700', 'sphere', 0.6);
			}

			// SEÇÃO 2: Conexões entre pontas (formando estrela)
			const connections = [[0, 2], [2, 4], [4, 1], [1, 3], [3, 0]];
			
			connections.forEach(([start, end]) => {
				const p1 = points[start];
				const p2 = points[end];
				const steps = 15;
				
				for (let t = 0; t <= steps; t++) {
					const ratio = t / steps;
					const px = p1.x + (p2.x - p1.x) * ratio;
					const pz = p1.z + (p2.z - p1.z) * ratio;
					const py = y + height * 0.7;
					
					addBlockAt(x + px, py, z + pz, color, 'cylinder', {
						x: 0.3, y: 0.8, z: 0.3
					});
				}
			});

			// SEÇÃO 3: Base circular
			for (let a = 0; a < 360; a += 15) {
				const angle = a * Math.PI / 180;
				const bx = Math.cos(angle) * (radius * 0.7);
				const bz = Math.sin(angle) * (radius * 0.7);
				
				addBlockAt(x + bx, y, z + bz, '#8B4513', 'cylinder', 0.5);
			}
		}
	},
	
	window.ShapeRegistry.tessellation = {
		icon: '🧩',
		name: 'Tesselação (Lite)',
		category: "abstract",
		subcat: "math-geometry",
        params: [
			{ name: 'pattern', label: 'Padrão', default: 1, min: 1, max: 2 },
			{ name: 'size', label: 'Escala Hex', default: 5, min: 3, max: 8 },
			{ name: 'height', label: 'Altura', default: 2, min: 1, max: 5 }
		],
		generate: (params) => {
			const x = 0, y = 0, z = 0;
			const pattern = Math.floor(params.pattern);
			const size = params.size;
			const height = params.height;
			const color = currentColor || '#00FF00';

			const patterns = [
				// Padrão 1: Colmeia Otimizada (Apenas Vértices e Centros de Aresta)
				(i, j) => {
					const radius = size * 0.8;
					const hexWidth = Math.sqrt(3) * radius;
					const hexZSpacing = radius * 1.5;
					
					// Offset para alinhar linhas pares/ímpares
					const xOffset = (Math.abs(j) % 2 === 1) ? (hexWidth / 2) : 0;
					
					const centerX = (i * hexWidth) + xOffset;
					const centerZ = j * hexZSpacing;
					
					// Desenha os 6 cantos (Pilares)
					for (let a = 0; a < 6; a++) {
						const angle1 = a * Math.PI / 3;
						const angle2 = ((a + 1) % 6) * Math.PI / 3;
						
						// Vértices (Cantos)
						const vx1 = centerX + Math.cos(angle1) * radius;
						const vz1 = centerZ + Math.sin(angle1) * radius;
                        
                        // Próximo vértice
						const vx2 = centerX + Math.cos(angle2) * radius;
						const vz2 = centerZ + Math.sin(angle2) * radius;

						// Pilar no vértice
                        for(let h = 0; h < height; h++) {
						    addBlockAt(x + vx1, y + h + 0.5, z + vz1, color, 'cylinder', 0.5);
                        }

                        // Conexão (Barra Horizontal) - REDUZIDA A DENSIDADE
                        // Em vez de desenhar 10 blocos, desenhamos só o necessário baseado no tamanho
                        const dist = Math.sqrt((vx2-vx1)**2 + (vz2-vz1)**2);
                        const steps = Math.max(1, Math.floor(dist / 0.8)); // 1 bloco a cada 0.8 unidades

						for (let t = 1; t < steps; t++) {
							const ratio = t / steps;
							const px = vx1 + (vx2 - vx1) * ratio;
							const pz = vz1 + (vz2 - vz1) * ratio;
							
                            // Desenha apenas no topo e na base para economizar processamento
                            addBlockAt(x + px, y + 0.5, z + pz, color, 'cube', 0.4); // Base
                            if (height > 1) {
                                addBlockAt(x + px, y + height - 0.5, z + pz, color, 'cube', 0.4); // Topo
                            }
						}
					}
				},
				
				// Padrão 2: Grid Triangular Leve
				(i, j) => {
                    const spacing = size * 1.5;
                    const px = i * spacing;
                    const pz = j * spacing;
                    
                    // Pilar central
                    for(let h=0; h<height; h++) {
                        addBlockAt(x + px, y + h + 0.5, z + pz, color, 'cylinder', 0.6);
                    }
                    
                    // Conexões em X e Z
                    if (i < 1) { // Conecta com o da direita
                        for(let k=1; k<spacing; k+=0.8) {
                             addBlockAt(x + px + k, y + height - 0.5, z + pz, color, 'cube', 0.3);
                        }
                    }
                    if (j < 1) { // Conecta com o de baixo
                        for(let k=1; k<spacing; k+=0.8) {
                             addBlockAt(x + px, y + height - 0.5, z + pz + k, color, 'cube', 0.3);
                        }
                    }
				}
			];

			// Grid reduzido (2 em vez de 3 ou 4) para evitar explosão exponencial
			const gridSize = 2; 
			
			for (let i = -gridSize; i <= gridSize; i++) {
				for (let j = -gridSize; j <= gridSize; j++) {
					const selectedPattern = patterns[(pattern - 1) % patterns.length];
					if (selectedPattern) selectedPattern(i, j);
				}
			}
		}
	},
	
	window.ShapeRegistry.implicitSurface = {
		icon: '∿',
		name: 'Superfície Implícita',
		category: "abstract",
		subcat: "math-geometry",
        params: [
			{ name: 'size', label: 'Tamanho', default: 8, min: 5, max: 15 }
		],
		generate: (p) => {
			for (let x = -p.size; x <= p.size; x++) {
				for (let y = -p.size; y <= p.size; y++) {
					for (let z = -p.size; z <= p.size; z++) {
						const v = Math.sin(x) + Math.sin(y) + Math.sin(z);
						if (v > 1.5) {
							addBlockAt(x, y + p.size + 0.5, z, currentColor, 'sphere');
						}
					}
				}
			}
		}
	},
	
	window.ShapeRegistry.gyroid = {
		icon: '🧠',
		name: 'Gyroid',
		category: "abstract",
		subcat: "math-geometry",
        params: [
			{ name: 'size', label: 'Tamanho', default: 8, min: 5, max: 15 }
		],
		generate: (p) => {
			for (let x = -p.size; x <= p.size; x++) {
				for (let y = -p.size; y <= p.size; y++) {
					for (let z = -p.size; z <= p.size; z++) {
						const v =
							Math.sin(x) * Math.cos(y) +
							Math.sin(y) * Math.cos(z) +
							Math.sin(z) * Math.cos(x);
						if (Math.abs(v) < 0.5) {
							addBlockAt(x, y + p.size + 0.5, z, currentColor, 'sphere');
						}
					}
				}
			}
		}
	},
	
	window.ShapeRegistry.sticks_pile = {
        icon: '🥢',
        name: 'Pilha de Varetas',
		category: "abstract",
        subcat: "math-geometry",
        params: [
            { name: 'count', label: 'Qtd. Varetas', default: 50, min: 20, max: 150 },
            { name: 'length', label: 'Comprimento', default: 8, min: 4, max: 15 },
            { name: 'thickness', label: 'Espessura', default: 0.15, min: 0.05, max: 0.4 },
            { name: 'chaos', label: 'Espalhamento', default: 1.5, min: 0.5, max: 4 }
        ],
        generate: (params) => {
            const cx = 0, cy = 0, cz = 0;
            
            const count = params.count;
            const baseLength = params.length;
            const thickness = params.thickness;
            const spread = params.chaos; // Quão longe do centro elas podem nascer

            const baseColorHex = currentColor || '#8B4513'; // Marrom sela padrão

            for (let i = 0; i < count; i++) {
                // 1. Variação de Cor (para parecer madeira real)
                // Clareia ou escurece ligeiramente a cor base
                let color = baseColorHex;
                if (Math.random() > 0.5) {
                     // Uma forma simples de variar a cor sem bibliotecas complexas:
                     // Se quiser algo mais sofisticado, podemos usar HSL depois.
                     // Por enquanto, alterna entre a cor escolhida e um tom de madeira fixo.
                     color = Math.random() > 0.7 ? '#A0522D' : (Math.random() > 0.4 ? '#CD853F' : baseColorHex);
                }

                // 2. Comprimento Variável (nem todas as varetas são iguais)
                const currentLength = baseLength * (0.8 + Math.random() * 0.4);

                // 3. Posição Central (Deslocada aleatoriamente para criar o "bolo")
                // Elevamos um pouco cy + spread*0.5 para que o centro da pilha não fique enterrado no chão
                const px = cx + (Math.random() - 0.5) * spread;
                const py = cy + Math.random() * spread * 0.8 + (currentLength/2 * 0.1); 
                const pz = cz + (Math.random() - 0.5) * spread;

                // 4. Rotação Caótica (O segredo do jogo de varetas)
                // Rotação completa de 0 a 360 graus (2 * PI radianos) em todos os eixos
                const rotX = Math.random() * Math.PI * 2;
                const rotY = Math.random() * Math.PI * 2;
                const rotZ = Math.random() * Math.PI * 2;

                addBlockAt(
                    px, py, pz,
                    color,
                    'cylinder',
                    { 
                        x: thickness, 
                        y: currentLength, 
                        z: thickness 
                    },
                    { 
                        x: rotX, 
                        y: rotY, 
                        z: rotZ 
                    }
                );
            }
        }
    },
	
	window.ShapeRegistry.superquadric = {
		icon: '🔷',
		name: 'Superquadric',
		category: "abstract",
		subcat: "math-geometry",
        params: [
			{ name: 'radius', label: 'Raio', default: 6, min: 4, max: 12 },
			{ name: 'e', label: 'Expoente', default: 2, min: 0.5, max: 4 }
		],
		generate: (p) => {
			const r = p.radius;
			for (let x = -r; x <= r; x++) {
				for (let y = -r; y <= r; y++) {
					for (let z = -r; z <= r; z++) {
						const nx = Math.pow(Math.abs(x/r), p.e);
						const ny = Math.pow(Math.abs(y/r), p.e);
						const nz = Math.pow(Math.abs(z/r), p.e);
						if (nx + ny + nz <= 1) {
							addBlockAt(x, y + r + 0.5, z, currentColor, 'sphere');
						}
					}
				}
			}
		}
	},
	
	window.ShapeRegistry.fractal = {
		icon: '❄️',
		name: 'Floco de Neve',
		category: "abstract",
		subcat: "math-fractal",
		params: [
			{ name: 'size', label: 'Tamanho', default: 6, min: 3, max: 12 },
			{ name: 'branches', label: 'Ramificações', default: 3, min: 1, max: 5 },
			{ name: 'thickness', label: 'Espessura', default: 1, min: 1, max: 3 },
			{ name: 'complexity', label: 'Complexidade', default: 2, min: 1, max: 4 }
		],
		generate: (params) => {
			const size = params.size;
			const branches = params.branches;
			const thickness = params.thickness;
			const complexity = params.complexity;
			const cx = 0, cy = 0, cz = 0;
			
			// Cores do floco (branco para azul claro)
			const colors = ['#FFFFFF', '#F0F8FF', '#E6F3FF', '#D4E9FF'];
			
			// Função para adicionar um bloco com variação de cor
			const addSnowBlock = (x, y, z) => {
				const color = colors[Math.floor(Math.random() * colors.length)];
				addBlockAt(x, y, z, color, 'cube');
			};
			
			// Centro do floco (hexágono)
			for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
				const x = Math.round(cx + Math.cos(angle));
				const z = Math.round(cz + Math.sin(angle));
				addSnowBlock(x, cy, z);
			}
			addSnowBlock(cx, cy, cz); // Centro
			
			// 6 eixos principais (simetria hexagonal)
			for (let arm = 0; arm < 6; arm++) {
				const baseAngle = (Math.PI * 2 * arm) / 6;
				
				// Eixo principal
				for (let r = 1; r <= size; r++) {
					const x = Math.round(cx + r * Math.cos(baseAngle));
					const z = Math.round(cz + r * Math.sin(baseAngle));
					
					// Adicionar espessura ao eixo
					for (let t = -thickness + 1; t < thickness; t++) {
						addSnowBlock(x, cy + t, z);
					}
					
					// Ramificações laterais (a cada 'complexity' blocos)
					if (r % complexity === 0 && r > 1) {
						for (let b = 1; b <= branches; b++) {
							// Ramificação esquerda
							const leftAngle = baseAngle - Math.PI / 4;
							const branchLength = Math.floor(size / (b + 1));
							
							for (let br = 1; br <= branchLength; br++) {
								const bx = Math.round(x + br * Math.cos(leftAngle) * 0.5);
								const bz = Math.round(z + br * Math.sin(leftAngle) * 0.5);
								addSnowBlock(bx, cy, bz);
								
								// Micro-ramificações (detalhes fractais)
								if (br === branchLength && complexity >= 3) {
									for (let micro = 0; micro < 2; micro++) {
										const microAngle = leftAngle + (micro === 0 ? -0.3 : 0.3);
										const mx = Math.round(bx + Math.cos(microAngle));
										const mz = Math.round(bz + Math.sin(microAngle));
										addSnowBlock(mx, cy, mz);
									}
								}
							}
							
							// Ramificação direita
							const rightAngle = baseAngle + Math.PI / 4;
							
							for (let br = 1; br <= branchLength; br++) {
								const bx = Math.round(x + br * Math.cos(rightAngle) * 0.5);
								const bz = Math.round(z + br * Math.sin(rightAngle) * 0.5);
								addSnowBlock(bx, cy, bz);
								
								// Micro-ramificações
								if (br === branchLength && complexity >= 3) {
									for (let micro = 0; micro < 2; micro++) {
										const microAngle = rightAngle + (micro === 0 ? -0.3 : 0.3);
										const mx = Math.round(bx + Math.cos(microAngle));
										const mz = Math.round(bz + Math.sin(microAngle));
										addSnowBlock(mx, cy, mz);
									}
								}
							}
						}
					}
					
					// Pontas decorativas no final de cada eixo
					if (r === size) {
						// Ponta em "V"
						for (let tip = 0; tip < 2; tip++) {
							const tipAngle = baseAngle + (tip === 0 ? -0.4 : 0.4);
							const tx = Math.round(x + 2 * Math.cos(tipAngle));
							const tz = Math.round(z + 2 * Math.sin(tipAngle));
							addSnowBlock(tx, cy, tz);
							
							// Sub-ponta
							const tx2 = Math.round(tx + Math.cos(tipAngle));
							const tz2 = Math.round(tz + Math.sin(tipAngle));
							addSnowBlock(tx2, cy, tz2);
						}
					}
				}
			}
			
			// Adicionar cristais decorativos aleatórios (efeito de gelo)
			if (complexity >= 4) {
				for (let i = 0; i < size; i++) {
					const angle = Math.random() * Math.PI * 2;
					const radius = Math.random() * size * 0.6;
					const x = Math.round(cx + radius * Math.cos(angle));
					const z = Math.round(cz + radius * Math.sin(angle));
					addSnowBlock(x, cy, z);
				}
			}
		}
	};
	// FIM DAS FUNÇÕES DAS INCLUSÕES 
    console.log("♾️ Shapes Matemáticas Carregadas");
}