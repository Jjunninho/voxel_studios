// js/shapes/shapes_nature.js
// Natureza e Orgânico:
// Flora: tree, fractalTree, palm, pinecone, cactus, flower, bush, mushroom, mushroom_2, reed, coral.
// Elementos Naturais: rock, rock_2, crystal, , sticks_pile.
// Terrenos: 


//🌲 Natureza (nature)
//nature-all: 🌍 Tudo
//nature-trees: 🌲 Árvores
//nature-plants: 🌿 Plantas
//nature-rocks: 🪨 Rochas
//nature-water: 💧 Água
//nature-weather: ⛅ Clima

    //icon: '🎨',           // sempre primeiro
    //name: 'Nome Legível', // sempre segundo
    //category: 'basic',    // sempre terceiro
    //subcat: 'geometry',   // opcional, quarto
	
	//params: [...

if (window.ShapeRegistry) {

    // Natureza e Orgânico:
    window.ShapeRegistry.tree = {
        icon: "🌳",
		name: "Árvore Simples",
        category: "nature",
		subcat: "nature-trees",
        params: [
            { name: "height", label: "Altura Tronco", default: 6, min: 3, max: 15 },
            { name: "leafSize", label: "Tamanho Copa", default: 3, min: 2, max: 8 }
        ],
        generate: function(p) {
            // Tronco
            for(let y=0; y<p.height; y++) {
                // Usa 'cylinder' para o tronco ficar redondo
                addBlockAt(0, y, 0, "#5d4037", "cylinder");
            }
            
            // Copa (Folhas)
            const r = p.leafSize;
            const topY = p.height - 1;
            
            for(let x=-r; x<=r; x++) {
                for(let y=-r; y<=r; y++) {
                    for(let z=-r; z<=r; z++) {
                        // Equação da esfera para a copa
                        if (x*x + y*y + z*z <= r*r) {
                            // Variação de verde
                            const color = Math.random() > 0.5 ? "#2ecc71" : "#27ae60";
                            addBlockAt(x, topY + y + (r/2), z, color, "cube");
                        }
                    }
                }
            }
        }
    },
	
	window.ShapeRegistry.fractalTree = {
		icon: '🌲',
		name: 'Árvore Fractal',
		category: "nature",
		subcat: "nature-trees",
        params: [
			{ name: 'trunkHeight', label: 'Altura Tronco', default: 5, min: 3, max: 10 },
			{ name: 'crownLayers', label: 'Camadas Copa', default: 4, min: 2, max: 7 },
			{ name: 'branchiness', label: 'Ramificação', default: 0.6, min: 0.3, max: 1.0 }
		],
		generate: (params) => {
			const cx = 0, cy = 0, cz = 0;
			const trunkH = params.trunkHeight;
			const layers = params.crownLayers;
			const branch = params.branchiness;
			
			// ============ 1. TRONCO PRINCIPAL ============
			const trunkThickness = 0.4 + branch * 0.3;
			
			addBlockAt(
				cx, cy + trunkH / 2, cz,
				'#5D4037', // Marrom escuro
				'cylinder',
				{ x: trunkThickness, y: trunkH, z: trunkThickness }
			);
			
			// Textura de casca (anéis no tronco)
			const barkRings = Math.floor(trunkH / 1.5);
			for (let i = 0; i < barkRings; i++) {
				const ringY = cy + (i * trunkH) / barkRings;
				addBlockAt(
					cx, ringY, cz,
					'#4E342E',
					'torus',
					{ x: trunkThickness * 1.1, y: 0.1, z: trunkThickness * 1.1 }
				);
			}
			
			// ============ 2. COPA TRIANGULAR (CAMADAS) ============
			const crownStartY = cy + trunkH;
			const layerHeight = 1.5;
			
			for (let layer = 0; layer < layers; layer++) {
				const progress = layer / layers;
				const layerY = crownStartY + layer * layerHeight;
				
				// Raio diminui conforme sobe
				const baseRadius = (3 - progress * 2) * branch;
				const coneHeight = layerHeight * 1.8;
				
				// Cor varia (gradiente do escuro pra claro)
				const greenValue = 100 + layer * 20;
				const leafColor = `rgb(${greenValue * 0.4}, ${greenValue}, ${greenValue * 0.5})`;
				
				// Cone principal da camada
				addBlockAt(
					cx, layerY + coneHeight / 2, cz,
					leafColor,
					'cone',
					{ x: baseRadius, y: coneHeight, z: baseRadius }
				);
				
				// ============ 3. RAMIFICAÇÕES (TRIÂNGULOS LATERAIS) ============
				const branches = 4 + Math.floor(layer * 1.5);
				
				for (let b = 0; b < branches; b++) {
					const angle = (b / branches) * Math.PI * 2 + layer * 0.5;
					const branchDist = baseRadius * (0.6 + Math.random() * 0.3);
					const branchSize = baseRadius * (0.3 + Math.random() * 0.2);
					
					const bx = cx + Math.cos(angle) * branchDist;
					const bz = cz + Math.sin(angle) * branchDist;
					const by = layerY + Math.random() * layerHeight;
					
					// Cone menor (galho)
					addBlockAt(
						bx, by, bz,
						leafColor,
						'cone',
						{ x: branchSize, y: branchSize * 1.5, z: branchSize },
						{ 
							x: (Math.random() - 0.5) * 0.5, 
							y: angle, 
							z: (Math.random() - 0.5) * 0.3 
						}
					);
				}
			}
			
			// ============ 4. TOPO PONTIAGUDO ============
			const topY = crownStartY + layers * layerHeight;
			addBlockAt(
				cx, topY + 0.8, cz,
				'#7CB342',
				'cone',
				{ x: 0.5, y: 1.2, z: 0.5 }
			);
			
			// Estrela/brilho no topo (opcional)
			addBlockAt(
				cx, topY + 1.5, cz,
				'#FFEB3B',
				'sphere',
				0.15
			);
			
			// ============ 5. FOLHAGEM DETALHADA (ESFERAS VERDES) ============
			const foliageDensity = Math.floor(10 * branch);
			
			for (let i = 0; i < foliageDensity; i++) {
				const fLayer = Math.floor(Math.random() * layers);
				const fY = crownStartY + fLayer * layerHeight + Math.random() * layerHeight;
				const fAngle = Math.random() * Math.PI * 2;
				const fDist = Math.random() * (3 - (fLayer / layers) * 2) * branch;
				
				const fx = cx + Math.cos(fAngle) * fDist;
				const fz = cz + Math.sin(fAngle) * fDist;
				
				addBlockAt(
					fx, fY, fz,
					'#4CAF50',
					'sphere',
					0.2 + Math.random() * 0.2
				);
			}
			
			// ============ 6. RAÍZES (BASE DO TRONCO) ============
			const roots = 5;
			for (let i = 0; i < roots; i++) {
				const rootAngle = (i / roots) * Math.PI * 2;
				const rootLength = 1 + Math.random() * 0.5;
				const rootThick = trunkThickness * 0.6;
				
				const rx = cx + Math.cos(rootAngle) * rootLength * 0.5;
				const rz = cz + Math.sin(rootAngle) * rootLength * 0.5;
				
				addBlockAt(
					rx, cy - 0.2, rz,
					'#6D4C41',
					'cylinder',
					{ x: rootThick, y: 0.4, z: rootThick },
					{ x: 0, y: rootAngle, z: Math.PI / 6 }
				);
			}
		}
	},
	
	window.ShapeRegistry.palm = {
        icon: '🌴',
        name: 'Palmeira',
		category: "nature",
        subcat: "nature-trees",
        params: [
            { name: 'height', label: 'Altura', default: 10, min: 6, max: 18 },
            { name: 'leafLength', label: 'Tamanho das Folhas', default: 4, min: 2, max: 6 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const height = params.height;
            const leafLength = params.leafLength;
            const color = currentColor || '#8B4513';

            // SEÇÃO 1: Tronco (com leve curvatura)
            for (let i = 0; i < height; i++) {
                addBlockAt(
                    x + Math.sin(i * 0.3) * 0.1,
                    y + i,
                    z + Math.cos(i * 0.3) * 0.1,
                    color,
                    'cylinder',
                    0.4
                );
            }

            const topY = y + height;

            // SEÇÃO 2: Copa de folhas (5 folhas pendentes)
            const leafAngles = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3];

            leafAngles.forEach(angle => {
                for (let i = 1; i <= leafLength; i++) {
                    addBlockAt(
                        x + Math.cos(angle) * i * 0.6,
                        topY - i * 0.2,
                        z + Math.sin(angle) * i * 0.6,
                        '#228B22',
                        'box',
                        { x: 0.2, y: 0.1, z: 0.6 }
                    );
                }
            });
        }
    },
	// pinecone, cactus, flower, bush, mushroom, mushroom_2, reed, coral.
	    window.ShapeRegistry.pinecone = {
        icon: '🌰',
        name: 'Pinha',
		category: "nature",
        subcat: "nature-plants",
        params: [
            { name: 'height', label: 'Altura', default: 6, min: 3, max: 10 },
            { name: 'radius', label: 'Raio', default: 1.5, min: 0.8, max: 3 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const height = params.height;
            const radius = params.radius;
            const color = currentColor || '#8B4513';

            const layers = height * 3;
            const goldenAngle = Math.PI * (3 - Math.sqrt(5));

            // SEÇÃO 1: Escamas em espiral fibonacci
            for (let i = 0; i < layers; i++) {
                const t = i / layers;
                const angle = i * goldenAngle;
                const r = radius * (1 - t);
                const px = x + Math.cos(angle) * r;
                const py = y + t * height;
                const pz = z + Math.sin(angle) * r;

                addBlockAt(
                    px,
                    py,
                    pz,
                    color,
                    'cone',
                    { x: 0.3, y: 0.6, z: 0.3 },
                    { x: Math.PI / 2, y: angle, z: 0 }
                );
            }

            // SEÇÃO 2: Núcleo central
            for (let i = 0; i < height; i++) {
                addBlockAt(x, y + i, z, '#A0522D', 'cylinder', 0.3);
            }
        }
    },
	
    window.ShapeRegistry.cactus = {
        icon: '🌵',
        name: 'Cacto',
		category: "nature",
        subcat: "nature-plants",
        params: [
            { name: 'height', label: 'Altura', default: 8, min: 4, max: 15 },
            { name: 'armCount', label: 'Número de Braços', default: 2, min: 0, max: 4 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const height = params.height;
            const armCount = params.armCount;
            const color = currentColor || '#2E8B57';

            // SEÇÃO 1: Tronco principal
            for (let i = 0; i < height; i++) {
                addBlockAt(x, y + i, z, color, 'cylinder', 0.6);
            }

            // SEÇÃO 2: Braços laterais
            for (let a = 0; a < armCount; a++) {
                const armHeight = Math.floor(height * 0.5);
                const startY = y + Math.floor(height * 0.4);
                const dir = a % 2 === 0 ? 1 : -1;

                for (let i = 0; i < armHeight; i++) {
                    addBlockAt(
                        x + dir * 0.8,
                        startY + i,
                        z,
                        color,
                        'cylinder',
                        0.4
                    );
                }
            }

            // SEÇÃO 3: Topo arredondado
            addBlockAt(x, y + height, z, '#3CB371', 'sphere', 0.6);
        }
    },

    window.ShapeRegistry.flower = {
        icon: '🌸',
        name: 'Flor',
		category: "nature",
        subcat: "nature-plants",
        params: [
            { name: 'stemHeight', label: 'Altura do Caule', default: 5, min: 2, max: 10 },
            { name: 'petalCount', label: 'Número de Pétalas', default: 6, min: 4, max: 10 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const stemHeight = params.stemHeight;
            const petalCount = params.petalCount;
            const color = currentColor || '#FF69B4';

            // SEÇÃO 1: Caule
            for (let i = 0; i < stemHeight; i++) {
                addBlockAt(x, y + i, z, '#2E8B57', 'cylinder', 0.2);
            }

            const topY = y + stemHeight;

            // SEÇÃO 2: Miolo
            addBlockAt(x, topY, z, '#FFD700', 'sphere', 0.3);

            // SEÇÃO 3: Pétalas em círculo
            for (let i = 0; i < petalCount; i++) {
                const angle = (i / petalCount) * Math.PI * 2;
                addBlockAt(
                    x + Math.cos(angle) * 0.6,
                    topY,
                    z + Math.sin(angle) * 0.6,
                    color,
                    'sphere',
                    0.35
                );
            }
        }
    },

	window.ShapeRegistry.bush = {
		icon: '🦔',
		name: 'Ouriço Geométrico',
		category: "nature",
		subcat: "creat-animals",
        params: [
			{ name: 'subdivisions', label: 'Subdivisões', default: 2, min: 0, max: 3 },
			{ name: 'length', label: 'Comp. Espinho', default: 5, min: 2, max: 10 },
			{ name: 'baseThickness', label: 'Grossura Base', default: 0.5, min: 0.2, max: 1.0 }
		],
		generate: (params) => {
			const cx = 0, cy = 0, cz = 0;
			const coreRadius = 2;
			
			// ============ 1. CRIAR NÚCLEO (ICOSAEDRO) ============
			addBlockAt(cx, cy, cz, '#1a472a', 'icosahedron', coreRadius * 2);
			
			// ============ 2. GEOMETRIA DO ICOSAEDRO ============
			// Criar icosaedro geodésico e pegar centros das faces
			const geometry = new THREE.IcosahedronGeometry(coreRadius, params.subdivisions);
			const faces = [];
			
			// Extrair faces (grupos de 3 vértices)
			const positions = geometry.attributes.position.array;
			for (let i = 0; i < positions.length; i += 9) {
				// Calcular centro da face
				const v1 = { x: positions[i], y: positions[i+1], z: positions[i+2] };
				const v2 = { x: positions[i+3], y: positions[i+4], z: positions[i+5] };
				const v3 = { x: positions[i+6], y: positions[i+7], z: positions[i+8] };
				
				const centerX = (v1.x + v2.x + v3.x) / 3;
				const centerY = (v1.y + v2.y + v3.y) / 3;
				const centerZ = (v1.z + v2.z + v3.z) / 3;
				
				// Normal da face (direção perpendicular)
				const mag = Math.sqrt(centerX*centerX + centerY*centerY + centerZ*centerZ);
				
				faces.push({
					x: centerX,
					y: centerY,
					z: centerZ,
					nx: centerX / mag, // Normal normalizada
					ny: centerY / mag,
					nz: centerZ / mag
				});
			}
			
			// ============ 3. "COLAR" ESPINHOS NAS FACES ============
			faces.forEach((face, idx) => {
				const len = params.length * (0.9 + Math.random() * 0.2);
				const baseThick = params.baseThickness;
				const tipThick = 0.05; // Ponta afiada
				
				// Cor variada
				const spineColor = idx % 3 === 0 ? '#2d5016' : 
								  idx % 3 === 1 ? '#3a6b1e' : '#4a7c2e';
				
				// POSIÇÃO: Base do espinho encosta no centro da face
				// Cone do Three.js tem pivô no centro, então avançamos metade do comprimento
				const dist = len / 2;
				const px = cx + face.x + face.nx * dist;
				const py = cy + face.y + face.ny * dist;
				const pz = cz + face.z + face.nz * dist;
				
				// ROTAÇÃO: Alinhar eixo Y do cone com a normal da face
				const normalVector = new THREE.Vector3(face.nx, face.ny, face.nz);
				const upVector = new THREE.Vector3(0, 1, 0);
				const quaternion = new THREE.Quaternion().setFromUnitVectors(upVector, normalVector);
				const euler = new THREE.Euler().setFromQuaternion(quaternion);
				
				addBlockAt(
					px, py, pz,
					spineColor,
					'cone',
					{ x: baseThick, y: len, z: baseThick },
					{ x: euler.x, y: euler.y, z: euler.z }
				);
			});
		}
	},
	
	window.ShapeRegistry.mushroom = {
		icon: '🍄',
		name: 'Cogumelo',
		category: "nature",
		subcat: "nature-plants",
        params: [
			{ name: 'stemHeight', label: 'Altura Tronco', default: 8, min: 4, max: 15 },
			{ name: 'capRadius', label: 'Raio Chapéu', default: 6, min: 4, max: 12 }
		],
		generate: (p) => {
			// Tronco
			for (let y = 0; y < p.stemHeight; y++) {
				addBlockAt(0, y + 0.5, 0, currentColor, 'cylinder');
			}

			// Chapéu
			for (let x = -p.capRadius; x <= p.capRadius; x++) {
				for (let z = -p.capRadius; z <= p.capRadius; z++) {
					const d = x*x + z*z;
					if (d <= p.capRadius*p.capRadius) {
						const y = Math.floor(Math.sqrt(p.capRadius*p.capRadius - d));
						addBlockAt(x, p.stemHeight + y + 0.5, z, currentColor, 'sphere');
					}
				}
			}
		}
	},
	
	window.ShapeRegistry.mushroom_2 = {
		icon: '🍄',
		name: 'Cogumelo',
		category: "nature",
		subcat: "nature-plants",
        params: [
			{ name: 'height', label: 'Altura Caule', default: 3, min: 1, max: 6 },
			{ name: 'capRadius', label: 'Raio Chapéu', default: 2, min: 1, max: 4 },
			{ name: 'stemThickness', label: 'Grossura Caule', default: 0.5, min: 0.3, max: 1 },
			{ name: 'spots', label: 'Qtd. Pintas', default: 8, min: 3, max: 15 }
		],
		generate: (params) => {
			const cx = 0, cy = 0, cz = 0;
			const height = params.height;
			const capRadius = params.capRadius;
			const stemThick = params.stemThickness;
			const color = currentColor || '#D32F2F';
			
			// ============ 1. CAULE (Cilindro único) ============
			const stemY = cy + height / 2;
			addBlockAt(
				cx, stemY, cz,
				'#F5F5DC', // Bege claro
				'cylinder',
				{ x: stemThick, y: height, z: stemThick }
			);
			
			// ============ 2. CHAPÉU (Hemisfério low-poly) ============
			const capY = cy + height;
			
			// Criar hemisfério usando IcosahedronGeometry com baixa subdivisão
			// para aquele efeito "imperfeito" facetado
			const hemisphereGeometry = new THREE.IcosahedronGeometry(capRadius, 1);
			
			// Remover vértices da metade inferior para criar hemisfério
			const positions = hemisphereGeometry.attributes.position.array;
			const vertices = [];
			const indices = [];
			
			for (let i = 0; i < positions.length; i += 3) {
				const vx = positions[i];
				const vy = positions[i + 1];
				const vz = positions[i + 2];
				
				// Manter apenas vértices acima do plano Y=0
				if (vy >= -0.2) { // -0.2 para suavizar a base
					vertices.push(vx, vy, vz);
				}
			}
			
			// Adicionar chapéu (podemos usar uma esfera e achatar o Y para simular hemisfério)
			addBlockAt(
				cx, capY + capRadius * 0.4, cz,
				color,
				'sphere',
				{ x: capRadius * 1.1, y: capRadius * 0.7, z: capRadius * 1.1 } // Achatado
			);
			
			// ============ 3. LAMELAS/SAIA (Base do chapéu) ============
			addBlockAt(
				cx, capY - 0.1, cz,
				'#FFF8DC', // Creme
				'cylinder',
				{ x: capRadius * 0.6, y: 0.15, z: capRadius * 0.6 }
			);
			
			// ============ 4. PINTAS BRANCAS (Distribuição orgânica) ============
			const spotCount = params.spots;
			
			// Pintas em anéis concêntricos (mais natural)
			const rings = 3;
			let spotIndex = 0;
			
			for (let ring = 0; ring < rings; ring++) {
				const ringRadius = capRadius * (0.2 + ring * 0.3);
				const spotsInRing = Math.ceil(spotCount / rings);
				const angleOffset = ring * 0.5; // Rotação entre anéis
				
				for (let i = 0; i < spotsInRing && spotIndex < spotCount; i++) {
					const angle = (i / spotsInRing) * Math.PI * 2 + angleOffset;
					const spotRadius = 0.15 + Math.random() * 0.1; // Tamanhos variados
					const heightOffset = Math.sqrt(1 - Math.pow(ringRadius / capRadius, 2)) * capRadius * 0.6;
					
					addBlockAt(
						cx + Math.cos(angle) * ringRadius,
						capY + capRadius * 0.4 + heightOffset - ring * 0.15,
						cz + Math.sin(angle) * ringRadius,
						'#FFFFFF',
						'sphere',
						spotRadius
					);
					spotIndex++;
				}
			}
			
			// Pinta no topo
			addBlockAt(
				cx, 
				capY + capRadius * 0.9, 
				cz,
				'#FFFFFF',
				'sphere',
				0.25
			);
		}
	},
	
    window.ShapeRegistry.reed = {
        icon: '🌾',
        name: 'Junco',
		category: "nature",
        subcat: "nature-plants",
        params: [
            { name: 'height', label: 'Altura', default: 5, min: 3, max: 10 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const height = params.height;
            const color = currentColor || '#6B8E23';

            // SEÇÃO 1: Caule fino
            for (let i = 0; i < height; i++) {
                addBlockAt(x, y + i, z, color, 'cylinder', 0.15);
            }

            // SEÇÃO 2: Espiga superior
            addBlockAt(x, y + height, z, '#8B4513', 'cone', 0.3);
        }
    },
	
	window.ShapeRegistry.coral = {
		icon: '🪸',
		name: 'Coral',
		category: "nature",
		subcat: "nature-plants",
        params: [
			{ name: 'branches', label: 'Ramos', default: 12, min: 6, max: 30 },
			{ name: 'height', label: 'Altura', default: 8, min: 4, max: 16 }
		],
		generate: (p) => {
			for (let i = 0; i < p.branches; i++) {
				let x = 0, z = 0;
				const angle = Math.random() * Math.PI * 2;
				for (let y = 0; y < p.height; y++) {
					x += Math.round(Math.cos(angle) * Math.random());
					z += Math.round(Math.sin(angle) * Math.random());
					addBlockAt(x, y + 0.5, z, currentColor, 'sphere');
				}
			}
		}
	},
	
    window.ShapeRegistry.coral_2 = {
        icon: '🪸',
        name: 'Coral 2',
		category: "nature",
        subcat: "nature-plants",
        params: [
            { name: 'branches', label: 'Número de Ramos', default: 6, min: 3, max: 10 },
            { name: 'height', label: 'Altura', default: 4, min: 2, max: 8 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const branches = params.branches;
            const height = params.height;
            const color = currentColor || '#FF7F50';

            // SEÇÃO 1: Tronco base
            const baseHeight = height * 0.4;
            for (let i = 0; i < baseHeight; i++) {
                addBlockAt(x, y + i, z, color, 'cylinder', 0.4);
            }

            const baseY = y + baseHeight;

            // SEÇÃO 2: Ramos ramificados
            for (let b = 0; b < branches; b++) {
                const angle = (b / branches) * Math.PI * 2;
                const branchLength = height * 0.6;
                
                for (let i = 1; i <= branchLength; i++) {
                    addBlockAt(
                        x + Math.cos(angle) * i * 0.4,
                        baseY + i * 0.4,
                        z + Math.sin(angle) * i * 0.4,
                        color,
                        'sphere',
                        0.3
                    );
                }
            }
        }
    },
	
// Fim da Flora
// Elementos Naturais: rock, rock_2, crystal, , sticks_pile.

window.ShapeRegistry.rock = {
		icon: '🪨',
		name: 'Rocha',
		category: "nature",
		subcat: "nature-rocks",
		params: [
			{ name: 'size', label: 'Tamanho', default: 3, min: 1, max: 6 }
		],
		generate: (params) => {
			const size = params.size;
			const cx = 0, cy = size, cz = 0;
			
			// Criar rocha usando esfera irregular
			for (let x = -size; x <= size; x++) {
				for (let y = -size; y <= size; y++) {
					for (let z = -size; z <= size; z++) {
						const dist = Math.sqrt(x*x + y*y + z*z);
						const noise = Math.sin(x * 0.5) * Math.cos(z * 0.5);
						
						if (dist < size + noise && dist > 0.5) {
							const gray = 70 + Math.floor(Math.random() * 30);
							const color = '#' + gray.toString(16).repeat(3);
							addBlockAt(cx + x, cy + y, cz + z, color, 'cube');
						}
					}
				}
			}
		}
	},
	
window.ShapeRegistry.rock_2 = {
		icon: '🪨',
		name: 'Pedreira',
		category: "nature",
		subcat: "nature-rocks",
		params: [
			{ name: 'rocks', label: 'Quantidade de Rochas', default: 8, min: 3, max: 20 },
			{ name: 'spread', label: 'Área de Distribuição', default: 10, min: 5, max: 20 },
			{ name: 'minSize', label: 'Tamanho Mínimo', default: 1, min: 1, max: 4 },
			{ name: 'maxSize', label: 'Tamanho Máximo', default: 3, min: 2, max: 6 }
		],
		generate: (params) => {
			const numRocks = params.rocks;
			const spread = params.spread;
			const minSize = params.minSize;
			const maxSize = params.maxSize;
			
			// Gerar várias rochas em posições aleatórias
			for (let r = 0; r < numRocks; r++) {
				// Tamanho aleatório para cada rocha
				const size = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
				
				// Posição aleatória dentro da área de distribuição
				const cx = Math.floor((Math.random() - 0.5) * spread);
				const cz = Math.floor((Math.random() - 0.5) * spread);
				const cy = size; // Altura baseada no tamanho
				
				// Criar uma rocha usando esfera irregular
				for (let x = -size; x <= size; x++) {
					for (let y = -size; y <= size; y++) {
						for (let z = -size; z <= size; z++) {
							const dist = Math.sqrt(x*x + y*y + z*z);
							const noise = Math.sin(x * 0.5) * Math.cos(z * 0.5);
							
							if (dist < size + noise && dist > 0.5) {
								// Variação de cor por rocha (cada rocha tem tom diferente)
								const grayBase = 60 + Math.floor(Math.random() * 40);
								const variation = Math.floor(Math.random() * 15);
								const gray = grayBase + variation;
								const color = '#' + gray.toString(16).repeat(3);
								
								addBlockAt(cx + x, cy + y, cz + z, color, 'cube');
							}
						}
					}
				}
			}
		}
	},
    // --- TERRENO (SIMPLEX NOISE SIMULADO) ---
    window.ShapeRegistry.terrain = {
		name: "Terreno Ondulado",
		icon: "🏔️",
        category: "nature",
        subcat: "nature-rocks",
        params: [
            { name: "size", label: "Tamanho", default: 16, min: 8, max: 32 },
            { name: "roughness", label: "Rugosidade", default: 3, min: 1, max: 10 }
        ],
        generate: function(p) {
            const s = p.size;
            const offset = -Math.floor(s/2);
            
            for(let x=0; x<s; x++) {
                for(let z=0; z<s; z++) {
                    // Simula ruído com seno/cosseno
                    const h = Math.floor(
                        Math.sin(x * 0.2) * p.roughness + 
                        Math.cos(z * 0.2) * p.roughness
                    ) + p.roughness;
                    
                    // Preenche até a altura
                    for(let y=0; y<=h; y++) {
                        const color = y === h ? "#2ecc71" : "#795548"; // Verde no topo, marrom embaixo
                        addBlockAt(x+offset, y, z+offset, color, "cube");
                    }
                }
            }
        }
    };
// TODAS AS FUNÇÕES FORAM INCLUIDAS
    console.log("🌿 Shapes Natureza Carregadas");
}