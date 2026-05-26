// js/shapes/shapes_arch.js
//Arquitetura e Estruturas:
//Construções: castle, house, building, temple, ruins, lighthouse, windmill, gazebo, well, fountain, tower.
//Componentes: stairs, lShapedStairs, spiralStairs, arch, bridge, wall, vault, dungeon, maze.
//==========================================================//

    //icon: '🎨',           // sempre primeiro
    //name: 'Nome Legível', // sempre segundo
    //category: 'basic',    // sempre terceiro
    //subcat: 'geometry',   // opcional, quarto
	
	//params: [...
	
	//2. 🏛️ Arquitetura (architecture)
//arch-all: 🌍 Tudo
//arch-medieval: 🏰 Medieval
//arch-modern: 🏢 Moderno
//arch-fantasy: ✨ Fantasia
//arch-industrial: 🏭 Industrial
//arch-parts: 🧱 Componentes

//==================================================================//


if (window.ShapeRegistry) {

    // --- CASTELO ---
    window.ShapeRegistry.castle = {
        icon: "🏰",
		name: "Castelo",
        category: "architecture",
		subcat: "arch-medieval",
        params: [
            { name: "width", label: "Largura", default: 15, min: 8, max: 30 },
            { name: "height", label: "Altura Muro", default: 6, min: 4, max: 12 }
        ],
        generate: function(p) {
            const w = p.width;
            const h = p.height;
            const offset = -Math.floor(w/2);
            
            // Função auxiliar para criar torres nos cantos
            const makeTower = (tx, tz) => {
                const th = h + 4; // Torre mais alta que muro
                for(let y=0; y<th; y++) {
                    // Corpo da torre (3x3)
                    for(let dx=-1; dx<=1; dx++) {
                        for(let dz=-1; dz<=1; dz++) {
                            addBlockAt(tx+dx, y, tz+dz, "#95a5a6", "cube");
                        }
                    }
                }
                // Ameias da torre
                addBlockAt(tx+1, th, tz+1, "#7f8c8d", "cube");
                addBlockAt(tx-1, th, tz+1, "#7f8c8d", "cube");
                addBlockAt(tx+1, th, tz-1, "#7f8c8d", "cube");
                addBlockAt(tx-1, th, tz-1, "#7f8c8d", "cube");
            };

            // Muros (4 lados)
            for(let i=0; i<w; i++) {
                for(let y=0; y<h; y++) {
                    // Paredes
                    addBlockAt(offset+i, y, offset, "#bdc3c7", "cube");     // Norte
                    addBlockAt(offset+i, y, offset+w-1, "#bdc3c7", "cube"); // Sul
                    addBlockAt(offset, y, offset+i, "#bdc3c7", "cube");     // Oeste
                    addBlockAt(offset+w-1, y, offset+i, "#bdc3c7", "cube"); // Leste
                }
                
                // Ameias do muro (alternadas)
                if(i % 2 === 0) {
                    addBlockAt(offset+i, h, offset, "#95a5a6", "cube");
                    addBlockAt(offset+i, h, offset+w-1, "#95a5a6", "cube");
                    addBlockAt(offset, h, offset+i, "#95a5a6", "cube");
                    addBlockAt(offset+w-1, h, offset+i, "#95a5a6", "cube");
                }
            }

            // Criar 4 torres
            makeTower(offset, offset);
            makeTower(offset+w-1, offset);
            makeTower(offset, offset+w-1);
            makeTower(offset+w-1, offset+w-1);
        }
    };

	window.ShapeRegistry.house = {
		icon: '🏠',
		name: 'Casa Procedural',
		category: "architecture",
		subcat: "arch-all",
        params: [
			{ name: 'width', label: 'Largura', default: 7, min: 5, max: 15 },
			{ name: 'depth', label: 'Profundidade', default: 7, min: 5, max: 15 },
			{ name: 'wallHeight', label: 'Altura Parede', default: 4, min: 3, max: 8 }
		],
		generate: (p) => {
			const hw = Math.floor(p.width / 2);
			const hd = Math.floor(p.depth / 2);

			// Paredes
			for (let y = 0; y < p.wallHeight; y++) {
				for (let x = -hw; x <= hw; x++) {
					for (let z = -hd; z <= hd; z++) {
						if (x === -hw || x === hw || z === -hd || z === hd) {
							addBlockAt(x, y + 0.5, z, currentColor, 'cube');
						}
					}
				}
			}

			// Telhado (pirâmide)
			for (let y = 0; y <= hw; y++) {
				const r = hw - y;
				for (let x = -r; x <= r; x++) {
					for (let z = -r; z <= r; z++) {
						addBlockAt(x, p.wallHeight + y + 0.5, z, currentColor, 'cone');
					}
				}
			}
		}
	},
	
    window.ShapeRegistry.proceduralBuilding = {
        icon: '🏢',
        name: 'Edifício Modular',
		category: "architecture",
        subcat: "arch-modern",
        params: [
            { name: 'floors', label: 'Andares', default: 6, min: 2, max: 20 },
            { name: 'width', label: 'Largura', default: 8, min: 4, max: 20 },
            { name: 'depth', label: 'Profundidade', default: 8, min: 4, max: 20 },
            { name: 'floorHeight', label: 'Altura Andar', default: 3, min: 2, max: 5 },
            { name: 'variation', label: 'Variação', default: 0.3, min: 0, max: 1 }
        ],
        generate: (p) => {
            let yOffset = 0;
            for (let f = 0; f < p.floors; f++) {
                const shrink = Math.floor(Math.random() * p.variation * 2);
                const hw = Math.floor((p.width - shrink) / 2);
                const hd = Math.floor((p.depth - shrink) / 2);

                for (let y = 0; y < p.floorHeight; y++) {
                    for (let x = -hw; x <= hw; x++) {
                        for (let z = -hd; z <= hd; z++) {
                            if (x === -hw || x === hw || z === -hd || z === hd) {
                                addBlockAt(x, yOffset + y + 0.5, z, currentColor, 'cube');
                            }
                        }
                    }
                }
                yOffset += p.floorHeight;
            }
        }
        
    },
	
		window.ShapeRegistry.ruins = {
		icon: '🏚️',
		name: 'Ruínas',
		category: "architecture",
		subcat: "arch-medieval",
        params: [
			{ name: 'size', label: 'Tamanho', default: 10, min: 6, max: 20 },
			{ name: 'height', label: 'Altura', default: 6, min: 3, max: 12 },
			{ name: 'decay', label: 'Desgaste', default: 0.4, min: 0, max: 1 }
		],
		generate: (p) => {
			const h = Math.floor(p.size / 2);

			for (let x = -h; x <= h; x++) {
				for (let z = -h; z <= h; z++) {
					if (x === -h || x === h || z === -h || z === h) {
						for (let y = 0; y < p.height; y++) {
							if (Math.random() > p.decay) {
								addBlockAt(x, y + 0.5, z, currentColor, 'cube');
							}
						}
					}
				}
			}
		}
	},
	
	window.ShapeRegistry.temple = {
		icon: '⛪',
		name: 'Templo',
		category: "architecture",
		subcat: "arch-medieval",
        params: [
			{ name: 'length', label: 'Comprimento', default: 14, min: 8, max: 30 },
			{ name: 'width', label: 'Largura', default: 8, min: 6, max: 16 },
			{ name: 'height', label: 'Altura', default: 8, min: 5, max: 15 }
		],
		generate: (p) => {
			const hl = Math.floor(p.length / 2);
			const hw = Math.floor(p.width / 2);

			// Piso
			for (let x = -hw; x <= hw; x++) {
				for (let z = -hl; z <= hl; z++) {
					addBlockAt(x, 0.5, z, currentColor, 'cube');
				}
			}

			// Colunas laterais
			for (let z = -hl; z <= hl; z += 3) {
				for (let y = 0; y < p.height; y++) {
					addBlockAt(-hw, y + 0.5, z, currentColor, 'cylinder');
					addBlockAt(hw, y + 0.5, z, currentColor, 'cylinder');
				}
			}
		}
	},
	
	   window.ShapeRegistry.lighthouse = {
        icon: '🏛️',
        name: 'Farol',
		category: "architecture",
        subcat: "arch-fantasy",
        params: [
            { name: 'height', label: 'Altura', default: 18, min: 10, max: 30 },
            { name: 'radius', label: 'Raio', default: 1.2, min: 0.8, max: 2.5 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const height = params.height;
            const radius = params.radius;
            const color = currentColor || '#F5F5F5';

            const baseHeight = Math.floor(height * 0.15);
            const towerHeight = height - baseHeight - 2;

            // Base de pedra
            for (let i = 0; i < baseHeight; i++) {
                addBlockAt(x, y + i, z, '#A9A9A9', 'cylinder', radius + 0.4);
            }

            // Torre principal
            for (let i = 0; i < towerHeight; i++) {
                addBlockAt(x, y + baseHeight + i, z, color, 'cylinder', radius);
            }

            const topY = y + baseHeight + towerHeight;

            // Varanda
            addBlockAt(x, topY, z, '#696969', 'ring', {x: radius + 0.6, y: 0.2, z: radius + 0.6});

            // Câmara da luz
            addBlockAt(x, topY + 0.5, z, '#FFD700', 'sphere', 0.8);

            // Cobertura
            addBlockAt(x, topY + 1.2, z, '#8B0000', 'cone', 1.2);
        }
    },
	
	window.ShapeRegistry.windmill = {
		icon: '🏰',
		name: 'Moinho de Vento',
		category: "architecture",
		subcat: "arch-industrial",
        params: [
			{ name: 'height', label: 'Altura', default: 12, min: 8, max: 20 },
			{ name: 'bladeLength', label: 'Tamanho das Pás', default: 3, min: 2, max: 5 }
		],
		generate: (params) => {
			const x = 0, y = 0, z = 0;
			const height = params.height;
			const bladeLength = params.bladeLength;
			const color = currentColor || '#F5DEB3';

			// SEÇÃO 1: Base da torre (cone invertido)
			const baseWidth = 1.5;
			for (let i = 0; i < 3; i++) {
				const ratio = 1 - (i / 3) * 0.3;
				addBlockAt(x, y + i, z, '#8B4513', 'cylinder', baseWidth * ratio);
			}

			// SEÇÃO 2: Torre principal
			for (let i = 3; i < height; i++) {
				addBlockAt(x, y + i, z, color, 'cylinder', 1.2);
			}

			// SEÇÃO 3: Hub das pás (TOPO DA TORRE)
			const hubY = y + height - 0.5; // ← MUDANÇA: Quase no topo!
			const hubZ = z + 1.5; // Projetado pra frente
			addBlockAt(x, hubY, hubZ, '#654321', 'sphere', 0.5);

			// SEÇÃO 4: Pás do moinho (PLANO VERTICAL X-Y)
			const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

			angles.forEach((angle) => {
				for (let i = 1; i <= bladeLength; i++) {
					const bx = x + Math.cos(angle) * i * 0.8;
					const by = hubY + Math.sin(angle) * i * 0.8;
					const bz = hubZ;
					
					addBlockAt(bx, by, bz, '#D2B48C', 'box', {
						x: 0.3,
						y: 0.8,
						z: 0.1
					});
				}
			});

			// SEÇÃO 5: Telhado cônico (ACIMA das pás)
			addBlockAt(x, y + height + 0.5, z, '#8B0000', 'cone', 1.4);
			
			// SEÇÃO 6: Janela/porta
			addBlockAt(x, y + height * 0.3, z + 1.3, '#654321', 'cube', 0.4);
		}
	},

    window.ShapeRegistry.well = {
        icon: '🚰',
        name: 'Poço',
		category: "architecture",
        subcat: "arch-medieval",
        params: [
            { name: 'radius', label: 'Raio', default: 2, min: 1, max: 4 },
            { name: 'depth', label: 'Profundidade', default: 4, min: 2, max: 8 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const radius = params.radius;
            const depth = params.depth;
            const color = currentColor || '#808080';

            // Parede circular
            for (let i = 0; i < depth; i++) {
                addBlockAt(x, y + i, z, color, 'cylinder', radius);
            }

            // Colunas de suporte
            const posts = [
                [-radius + 0.4, -radius + 0.4],
                [ radius - 0.4, -radius + 0.4],
                [-radius + 0.4,  radius - 0.4],
                [ radius - 0.4,  radius - 0.4]
            ];

            posts.forEach(([px, pz]) => {
                for (let i = 0; i < 3; i++) {
                    addBlockAt(x + px, y + depth + i, z + pz, '#8B4513', 'cube', 0.4);
                }
            });

            // Telhado
            addBlockAt(x, y + depth + 3, z, '#A52A2A', 'cone', radius + 0.6);
        }
    },
	
	    window.ShapeRegistry.gazebo = {
        icon: '⛺',
        name: 'Gazebo',
		category: "architecture",
        subcat: "arch-all",
        params: [
            { name: 'radius', label: 'Raio', default: 4, min: 2, max: 6 },
            { name: 'height', label: 'Altura', default: 4, min: 2, max: 8 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const radius = params.radius;
            const height = params.height;
            const color = currentColor || '#F0F8FF';
            const sides = 8;

            // Piso
            addBlockAt(x, y, z, '#DCDCDC', 'disc', radius);

            // Colunas
            for (let i = 0; i < sides; i++) {
                const angle = (i / sides) * Math.PI * 2;
                const px = x + Math.cos(angle) * radius;
                const pz = z + Math.sin(angle) * radius;

                for (let h = 0; h < height; h++) {
                    addBlockAt(px, y + h, pz, color, 'cylinder', 0.3);
                }
            }

            // Telhado
            addBlockAt(x, y + height, z, '#8B0000', 'cone', radius + 0.8);
        }
    },
	
	    window.ShapeRegistry.fountain = {
        icon: '⛲',
        name: 'Fonte',
		category: "architecture",
        subcat: "arch-modern",
        params: [
            { name: 'radius', label: 'Raio', default: 3, min: 2, max: 6 },
            { name: 'tiers', label: 'Níveis', default: 3, min: 1, max: 5 }
        ],
        generate: (params) => {
            const x = 0, y = 0, z = 0;
            const radius = params.radius;
            const tiers = params.tiers;
            const color = currentColor || '#87CEFA';

            // Bacia principal
            addBlockAt(x, y, z, '#A9A9A9', 'cylinder', radius);

            // Níveis da fonte
            for (let i = 0; i < tiers; i++) {
                addBlockAt(
                    x,
                    y + 0.6 + i * 0.6,
                    z,
                    '#B0C4DE',
                    'disc',
                    radius - i * 0.7
                );
            }

            // Jato de água
            for (let i = 0; i < 4; i++) {
                addBlockAt(x, y + 1.5 + i * 0.4, z, color, 'sphere', 0.3);
            }
        }
    },
	
    window.ShapeRegistry.tower = {
        icon: '🗼',
        name: 'Torre',
		category: "architecture",
        subcat: "arch-industrial",
        params: [
            { name: 'radius', label: 'Raio', default: 3, min: 2, max: 6 },
            { name: 'height', label: 'Altura', default: 12, min: 5, max: 20 }
        ],
        generate: (params) => {
            const r = params.radius;
            const h = params.height;
            const rSquared = r * r;
            
            // Corpo da torre
            for (let x = -r; x <= r; x++) {
                for (let z = -r; z <= r; z++) {
                    const distSquared = x*x + z*z;
                    if (distSquared <= rSquared) {
                        for (let y = 0; y < h; y++) {
                            // Torre oca
                            if (distSquared >= (r-1)*(r-1) || y === 0) {
                                addBlockAt(x, y + 0.5, z, currentColor, 'cylinder');
                            }
                        }
                    }
                }
            }
            
            // Topo (cone)
            for (let y = 0; y < r; y++) {
                const ratio = 1 - (y / r);
                const currentR = r * ratio;
                const rSquared = currentR * currentR;
                for (let x = -r; x <= r; x++) {
                    for (let z = -r; z <= r; z++) {
                        const distSquared = x*x + z*z;
                        if (distSquared <= rSquared) {
                            addBlockAt(x, h + y + 0.5, z, currentColor, 'cone');
                        }
                    }
                }
            }
        }
    },
    // --- TORRE ---
    window.ShapeRegistry.tower_2 = {
        icon: "🗼",
		name: "Torre de Mago",
        category: "architecture",
        subcat: "arch-fantasy:",
        params: [
            { name: "height", label: "Altura", default: 20, min: 10, max: 40 },
            { name: "radius", label: "Raio", default: 4, min: 2, max: 8 }
        ],
        generate: function(p) {
            const h = p.height;
            const r = p.radius;
            
            // Corpo da torre
            for(let y=0; y<h; y++) {
                for(let x=-r; x<=r; x++) {
                    for(let z=-r; z<=r; z++) {
                        // Círculo oco (paredes)
                        const dist = Math.sqrt(x*x + z*z);
                        if (dist <= r && dist > r-1.5) {
                            addBlockAt(x, y, z, "#34495e", "cube");
                        }
                    }
                }
            }
            
            // Telhado cônico
            const roofH = Math.floor(r * 1.5);
            for(let y=0; y<roofH; y++) {
                const currentR = r * (1 - (y/roofH));
                for(let x=-Math.ceil(currentR); x<=Math.ceil(currentR); x++) {
                    for(let z=-Math.ceil(currentR); z<=Math.ceil(currentR); z++) {
                         if (Math.sqrt(x*x + z*z) <= currentR) {
                             addBlockAt(x, h+y, z, "#8e44ad", "pyramid"); // Usa pirâmides para textura
                         }
                    }
                }
            }
        }
    },
	
	//Componentes: stairs, lShapedStairs, spiralStairs, arch, bridge, wall, vault, dungeon, maze.
	window.ShapeRegistry.stairs = {
        icon: '🔶',
        name: 'Escada',
		category: "architecture",
        subcat: "arch-parts",
        params: [
            { name: 'steps', label: 'Degraus', default: 8, min: 3, max: 15 },
            { name: 'width', label: 'Largura', default: 5, min: 3, max: 10 }
        ],
        generate: (params) => {
            const steps = params.steps;
            const width = params.width;
            const hw = Math.floor(width / 2);
            for (let step = 0; step < steps; step++) {
                for (let x = -hw; x <= hw; x++) {
                    for (let z = 0; z <= step; z++) {
                        for (let y = 0; y <= step; y++) {
                            addBlockAt(x, y + 0.5, z, currentColor, 'cube');
                        }
                    }
                }
            }
        }
    },
	
    window.ShapeRegistry.lShapedStairs = {
        icon: '↩️',
        name: 'Escada em L',
		category: "architecture",
        subcat: "arch-industrial",
        params: [
            { name: 'stepsPerLeg', label: 'Degraus por Perna', default: 6, min: 3, max: 12 },
            { name: 'width', label: 'Largura', default: 3, min: 2, max: 6 }
        ],
        generate: (params) => {
            const steps = params.stepsPerLeg;
            const width = params.width;
            const hw = Math.floor(width / 2);
            
            // Primeira perna (ao longo do eixo Z)
            for (let step = 0; step < steps; step++) {
                for (let x = -hw; x <= hw; x++) {
                    for (let z = 0; z <= step; z++) {
                        for (let y = 0; y <= step; y++) {
                            addBlockAt(x, y + 0.5, z, currentColor, 'cube');
                        }
                    }
                }
            }
            
            // Patamar (plataforma de transição)
            for (let x = -hw; x <= hw; x++) {
                for (let z = steps; z <= steps + width; z++) {
                    addBlockAt(x, steps + 0.5, z, currentColor, 'cube');
                }
            }
            
            // Segunda perna (ao longo do eixo X)
            for (let step = 1; step <= steps; step++) {
                for (let z = steps; z <= steps + width; z++) {
                    for (let x = hw; x <= hw + step; x++) {
                        for (let y = 0; y <= steps + step; y++) {
                            addBlockAt(x, y + 0.5, z, currentColor, 'cube');
                        }
                    }
                }
            }
        }
    },
	
    window.ShapeRegistry.spiralStairs = {
        icon: '🌀',
        name: 'Escada Espiral',
		category: "architecture",
        subcat: "arch-parts",
        params: [
            { name: 'steps', label: 'Degraus', default: 16, min: 8, max: 30 },
            { name: 'radius', label: 'Raio', default: 4, min: 3, max: 8 }
        ],
        generate: (params) => {
            const steps = params.steps;
            const radius = params.radius;
            const anglePerStep = (Math.PI * 2) / steps;
            
            for (let i = 0; i < steps; i++) {
                const angle = anglePerStep * i;
                const x = Math.round(radius * Math.cos(angle));
                const z = Math.round(radius * Math.sin(angle));
                const y = i;
                
                // Degrau (2x2 blocos)
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        addBlockAt(x + dx, y + 0.5, z + dz, currentColor, 'cube');
                    }
                }
                
                // Pilar central
                if (i === 0 || Math.abs(x) <= 1 && Math.abs(z) <= 1) {
                    addBlockAt(0, y + 0.5, 0, currentColor, 'cylinder');
                }
            }
        }
    },
	
    window.ShapeRegistry.arch = {
        icon: '🌉',
        name: 'Arco',
		category: "architecture",
        subcat: "arch-parts",
        params: [
            { name: 'width', label: 'Largura', default: 7, min: 5, max: 12 },
            { name: 'height', label: 'Altura', default: 6, min: 4, max: 10 },
            { name: 'thickness', label: 'Espessura', default: 2, min: 1, max: 4 }
        ],
        generate: (params) => {
            const w = params.width;
            const h = params.height;
            const t = params.thickness;
            const hw = Math.floor(w / 2);
            const r = hw;
            
            // Pilares
            for (let x = -hw; x <= -hw + t - 1; x++) {
                for (let z = 0; z < t; z++) {
                    for (let y = 0; y < h; y++) {
                        addBlockAt(x, y + 0.5, z, currentColor, 'cube');
                    }
                }
            }
            for (let x = hw - t + 1; x <= hw; x++) {
                for (let z = 0; z < t; z++) {
                    for (let y = 0; y < h; y++) {
                        addBlockAt(x, y + 0.5, z, currentColor, 'cube');
                    }
                }
            }
            
            // Arco superior
            for (let x = -hw; x <= hw; x++) {
                for (let z = 0; z < t; z++) {
                    const distFromCenter = Math.abs(x);
                    const archY = Math.floor(Math.sqrt(Math.max(0, r*r - distFromCenter*distFromCenter)));
                    const y = h - r + archY;
                    if (y >= h - r) {
                        addBlockAt(x, y + 0.5, z, currentColor, 'cube');
                    }
                }
            }
        }
    },

    window.ShapeRegistry.bridge = {
        icon: '🌉',
        name: 'Ponte',
		category: "architecture",
        subcat: "arch-modern",
        params: [
            { name: 'length', label: 'Comprimento', default: 12, min: 6, max: 20 },
            { name: 'width', label: 'Largura', default: 5, min: 3, max: 10 },
            { name: 'archHeight', label: 'Altura do Arco', default: 4, min: 2, max: 8 }
        ],
        generate: (params) => {
            const length = params.length;
            const width = params.width;
            const archHeight = params.archHeight;
            const hw = Math.floor(width / 2);
            const hl = Math.floor(length / 2);
            
            // Base da ponte
            for (let x = -hw; x <= hw; x++) {
                for (let z = -hl; z <= hl; z++) {
                    addBlockAt(x, 0.5, z, currentColor, 'cube');
                }
            }
            
            // Arcos laterais
            for (let z = -hl; z <= hl; z++) {
                const ratio = Math.abs(z) / hl;
                const archY = Math.floor(archHeight * (1 - ratio * ratio));
                for (let y = 1; y <= archY; y++) {
                    for (let x = -hw; x <= hw; x++) {
                        if (x === -hw || x === hw) {
                            addBlockAt(x, y + 0.5, z, currentColor, 'cube');
                        }
                    }
                }
            }
        }
    },
	
    window.ShapeRegistry.maze = {
        icon: '🧩',
        name: 'Labirinto',
		category: "architecture",
        subcat: "arch-medieval",
        params: [
            { name: 'size', label: 'Tamanho', default: 10, min: 6, max: 20 },
            { name: 'wallHeight', label: 'Altura das Paredes', default: 3, min: 2, max: 6 }
        ],
        generate: (params) => {
            const size = params.size;
            const wallH = params.wallHeight;
            
            // Grid para o labirinto (0 = caminho, 1 = parede)
            const grid = [];
            for (let i = 0; i < size; i++) {
                grid[i] = [];
                for (let j = 0; j < size; j++) {
                    grid[i][j] = 1; // Começa tudo como parede
                }
            }
            
            // Algoritmo simples de geração (DFS)
            function carve(x, z) {
                grid[x][z] = 0;
                
                const dirs = [[0, 2], [2, 0], [0, -2], [-2, 0]];
                dirs.sort(() => Math.random() - 0.5);
                
                for (let [dx, dz] of dirs) {
                    const nx = x + dx;
                    const nz = z + dz;
                    if (nx >= 0 && nx < size && nz >= 0 && nz < size && grid[nx][nz] === 1) {
                        grid[x + dx/2][z + dz/2] = 0;
                        carve(nx, nz);
                    }
                }
            }
            
            carve(1, 1);
            
            // Renderiza o labirinto
            const offset = Math.floor(size / 2);
            for (let x = 0; x < size; x++) {
                for (let z = 0; z < size; z++) {
                    if (grid[x][z] === 1) {
                        for (let y = 0; y < wallH; y++) {
                            addBlockAt(x - offset, y + 0.5, z - offset, currentColor, 'cube');
                        }
                    }
                }
            }
        }
    },
	
	window.ShapeRegistry.vault = {
		icon: '🏛️',
		name: 'Abóbada',
		category: "architecture",
		subcat: "arch-modern",
        params: [
			{ name: 'radius', label: 'Raio', default: 6, min: 4, max: 12 },
			{ name: 'length', label: 'Comprimento', default: 12, min: 6, max: 24 }
		],
		generate: (p) => {
			for (let z = -p.length / 2; z <= p.length / 2; z++) {
				for (let x = -p.radius; x <= p.radius; x++) {
					const y = Math.floor(Math.sqrt(p.radius*p.radius - x*x));
					addBlockAt(x, y + 0.5, z, currentColor, 'cube');
				}
			}
		}
	},

	window.ShapeRegistry.dungeon = {
		icon: '🗝️',
		name: 'Dungeon (Compacta)',
		category: "architecture",
		subcat: "arch-medieval",
        params: [
			{ name: 'rooms', label: 'Salas', default: 6, min: 2, max: 9 },
			{ name: 'roomSize', label: 'Tamanho Sala', default: 5, min: 4, max: 8 }
		],
		generate: (p) => {
			const gridSize = Math.ceil(Math.sqrt(p.rooms));
			const spacing = p.roomSize + 1;
			const halfGrid = Math.floor(gridSize / 2);

			let roomIndex = 0;

			for (let gx = -halfGrid; gx <= halfGrid && roomIndex < p.rooms; gx++) {
				for (let gz = -halfGrid; gz <= halfGrid && roomIndex < p.rooms; gz++) {

					const centerX = gx * spacing;
					const centerZ = gz * spacing;
					const hs = Math.floor(p.roomSize / 2);

					// Piso da sala
					for (let x = -hs; x <= hs; x++) {
						for (let z = -hs; z <= hs; z++) {
							addBlockAt(
								centerX + x,
								0.5,
								centerZ + z,
								currentColor,
								'cube'
							);
						}
					}

					roomIndex++;
				}
			}
		}
	},
	
    window.ShapeRegistry.dome = {
        icon: '🏟️',
        name: 'Domo',
		category: "architecture",
        subcat: "arch-modern",
        params: [
            { name: 'radius', label: 'Raio', default: 6, min: 4, max: 12 }
        ],
        generate: (params) => {
            const r = params.radius;
            const rSquared = r * r;
            
            for (let x = -r; x <= r; x++) {
                for (let z = -r; z <= r; z++) {
                    const distSquared = x*x + z*z;
                    if (distSquared <= rSquared) {
                        // Calcula altura baseada na esfera
                        const y = Math.floor(Math.sqrt(Math.max(0, rSquared - distSquared)));
                        
                        // Apenas a casca superior (oco)
                        const innerR = r - 1;
                        const innerDistSquared = distSquared;
                        const innerY = Math.floor(Math.sqrt(Math.max(0, innerR*innerR - innerDistSquared)));
                        
                        if (y > innerY || distSquared >= (r-1)*(r-1)) {
                            addBlockAt(x, y + 0.5, z, currentColor, 'sphere');
                        }
                    }
                }
            }
        }
    },
	
    window.ShapeRegistry.crystal = {
        icon: '💎',
        name: 'Cristal',
		category: "architecture",
        subcat: "arch-fantasy",
        params: [
            { name: 'height', label: 'Altura', default: 8, min: 5, max: 15 },
            { name: 'sides', label: 'Lados', default: 6, min: 4, max: 8 }
        ],
        generate: (params) => {
            const h = params.height;
            const sides = params.sides;
            const baseR = Math.floor(h * 0.4);
            
            // Base (polígono)
            for (let y = 0; y < Math.floor(h * 0.3); y++) {
                const vertices = [];
                for (let i = 0; i < sides; i++) {
                    const angle = (Math.PI * 2 * i) / sides;
                    vertices.push([
                        Math.round(baseR * Math.cos(angle)),
                        Math.round(baseR * Math.sin(angle))
                    ]);
                }
                
                const minX = Math.min(...vertices.map(v => v[0]));
                const maxX = Math.max(...vertices.map(v => v[0]));
                const minZ = Math.min(...vertices.map(v => v[1]));
                const maxZ = Math.max(...vertices.map(v => v[1]));
                
                for (let x = minX; x <= maxX; x++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        if (isPointInPolygon(x, z, vertices)) {
                            addBlockAt(x, y + 0.5, z, currentColor, 'cube');
                        }
                    }
                }
            }
            
            // Ponta (pirâmide)
            for (let y = Math.floor(h * 0.3); y < h; y++) {
                const ratio = 1 - ((y - Math.floor(h * 0.3)) / (h - Math.floor(h * 0.3)));
                const currentR = Math.ceil(baseR * ratio);
                
                const vertices = [];
                for (let i = 0; i < sides; i++) {
                    const angle = (Math.PI * 2 * i) / sides;
                    vertices.push([
                        Math.round(currentR * Math.cos(angle)),
                        Math.round(currentR * Math.sin(angle))
                    ]);
                }
                
                const minX = Math.min(...vertices.map(v => v[0]));
                const maxX = Math.max(...vertices.map(v => v[0]));
                const minZ = Math.min(...vertices.map(v => v[1]));
                const maxZ = Math.max(...vertices.map(v => v[1]));
                
                for (let x = minX; x <= maxX; x++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        if (isPointInPolygon(x, z, vertices)) {
                            addBlockAt(x, y + 0.5, z, currentColor, 'cone');
                        }
                    }
                }
            }
        }
    },

	window.ShapeRegistry.platformSet = {
		icon: '🧱',
		name: 'Plataformas',
		category: "architecture",
		subcat: "arch-parts",
        params: [
			{ name: 'count', label: 'Quantidade', default: 8, min: 3, max: 20 },
			{ name: 'spread', label: 'Espalhamento', default: 12, min: 6, max: 25 }
		],
		generate: (p) => {
			for (let i = 0; i < p.count; i++) {
				const x = Math.floor(Math.random() * p.spread - p.spread / 2);
				const z = Math.floor(Math.random() * p.spread - p.spread / 2);
				const y = Math.floor(Math.random() * 5) + 1;
				addBlockAt(x, y + 0.5, z, currentColor, 'cube');
			}
		}
	},
	
	window.ShapeRegistry.organicArch = {
		icon: '🏜️',
		name: 'Arco Natural',
		category: "architecture",
		subcat: "arch-medieval",
        params: [
			{ name: 'width', label: 'Largura', default: 10, min: 6, max: 20 },
			{ name: 'height', label: 'Altura', default: 6, min: 4, max: 12 }
		],
		generate: (p) => {
			const hw = Math.floor(p.width / 2);
			for (let x = -hw; x <= hw; x++) {
				const ratio = Math.abs(x) / hw;
				const yMax = Math.floor(p.height * (1 - ratio * ratio));
				for (let y = yMax; y <= p.height; y++) {
					addBlockAt(x, y + 0.5, 0, currentColor, 'sphere');
				}
			}
		}
	};
	// FIM DAS EQUAÇÕES - TODAS JÁ FORAM INCLUÍDAS
    console.log("🏰 Shapes Arquitetura Carregadas");
}