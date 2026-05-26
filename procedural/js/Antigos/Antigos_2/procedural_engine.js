/* ========================================
   VOXEL GENESIS - PROCEDURAL ENGINE
   Integração com shapes.js do editor principal
========================================= */

// Estado global do Procedural Studio
const ProceduralEngine = {
    // Three.js
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    
    // Geração
    currentGenerator: null,
    currentParams: {},
    generatedBlocks: [],
    
    // Stats
    stats: {
        fps: 60,
        blocks: 0,
        vertices: 0
    },

    // Mapeamento de categorias para shapes do ShapeRegistry
    categoryMap: {
        'basic': ['cube', 'plane', 'sphere', 'cylinder', 'cone', 'pyramid'],
        'architecture': ['castle', 'tower', 'lighthouse'],
        'nature': ['tree'],
        'abstract': ['helix', 'spiral', 'knot'],
        'organic': ['dna']
    },
    
    // Converte parâmetros do ShapeRegistry para formato do UI
    getGeneratorConfig(shapeId) {
        // CORREÇÃO AQUI: Removemos 'window.' para acessar a const globalmente
        const shape = (typeof ShapeRegistry !== 'undefined' ? ShapeRegistry : window.ShapeRegistry)?.[shapeId];
        
        if (!shape) return null;

        const config = {
            name: shape.name,
            icon: shape.icon,
            category: this.getCategory(shapeId),
            shapeKey: shapeId,
            params: {}
        };

        // Converter params array para objeto
        if (shape.params) {
            shape.params.forEach(param => {
                config.params[param.name] = {
                    label: param.label,
                    min: param.min || 1,
                    max: param.max || 20,
                    default: param.default || 5,
                    step: 1
                };
            });
        }

        return config;
    },

    getCategory(shapeId) {
        for (const [category, shapes] of Object.entries(this.categoryMap)) {
            if (shapes.includes(shapeId)) return category;
        }
        return 'basic';
    },

    // Inicialização
    init() {
        this.setupScene();
        this.setupLights();
        this.animate();
        console.log('✅ Procedural Engine inicializado');
    },

    // Configurar cena Three.js
    setupScene() {
        const canvas = document.getElementById('previewCanvas');
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(0, 0, 0);
		// FUNÇÃO GRID
		this.gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
        this.scene.add(this.gridHelper);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true 
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Controls
        this.controls = new THREE.OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Grid Helper
        const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
        this.scene.add(gridHelper);
        
        // Resize handler
        window.addEventListener('resize', () => this.handleResize());
    },

    setupLights() {
        // Ambient
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        
        // Directional
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);
        
        // Outro directional para suavizar sombras
        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight2.position.set(-10, 10, -10);
        this.scene.add(dirLight2);
    },

    // Loop de animação
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        
        // Atualizar FPS (simplificado)
        this.updateStats();
    },

    updateStats() {
        const blockEl = document.getElementById('statBlocks');
        const vertEl = document.getElementById('statVerts');
        if(blockEl) blockEl.textContent = this.stats.blocks;
        if(vertEl) vertEl.textContent = this.stats.vertices;
    },

    handleResize() {
        const canvas = this.renderer.domElement;
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    },

	// 2. Adicione essa nova função na Engine para a UI chamar
    toggleGrid(visible) {
        if (this.gridHelper) {
            this.gridHelper.visible = visible;
        }
    },
	
    // Gerar forma procedural
// Em ProceduralEngine
	async generate(shapeId, params = {}) {
		const shape = (typeof ShapeRegistry !== 'undefined' ? ShapeRegistry : window.ShapeRegistry)?.[shapeId];
		
		if (!shape) {
			console.error('❌ Shape não encontrada:', shapeId);
			this.showToast(`Shape "${shapeId}" não existe`, 'error');
			return;
		}

		this.currentGenerator = shapeId;
		this.currentParams = params;

		const loading = document.getElementById('loadingOverlay');
		if(loading) loading.classList.remove('hidden');

		this.clearGenerated();
		await new Promise(resolve => setTimeout(resolve, 50));

		try {
			// 🔥 CAPTURA OVERRIDES DO USUÁRIO
			const overrideTypeEl = document.getElementById('masterBlockType');
			const overrideScaleEl = document.getElementById('masterBlockScale');
			
			const overrideType = overrideTypeEl ? overrideTypeEl.value : 'default';
			const overrideScale = overrideScaleEl ? parseFloat(overrideScaleEl.value) : 1.0;

			console.log(`🎨 Override: Tipo=${overrideType}, Escala=${overrideScale}`);

			// 🔥 INTERCEPTOR
			const capturedBlocks = [];
			const originalAddBlockAt = window.addBlockAt;
			
			window.addBlockAt = (x, y, z, color, type, scale, rotation) => {
				// Aplicar override de tipo
				const finalType = (overrideType === 'default') ? type : overrideType;
				
				// Aplicar override de escala
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
				
				capturedBlocks.push({ 
					x, y, z, color, 
					type: finalType, 
					scale: finalScale, 
					rotation 
				});
			};

			// Executa gerador
			shape.generate(params);
			
			// Restaura função original
			window.addBlockAt = originalAddBlockAt;
			
			// Renderiza
			capturedBlocks.forEach(blockData => {
				this.addBlockToScene(blockData);
			});
			
			this.stats.blocks = this.generatedBlocks.length;
			this.stats.vertices = this.generatedBlocks.length * 24; 
			
			console.log(`✅ Gerado: ${shape.name} (${this.stats.blocks} blocos)`);
			
		} catch (error) {
			console.error('❌ Erro ao gerar:', error);
			this.showToast('Erro ao gerar forma', 'error');
		} finally {
			if(loading) loading.classList.add('hidden');
		}
	},

    // Adicionar bloco visual à cena (ATUALIZADA)
    addBlockToScene(blockData) {
        const { x, y, z, color, type, scale, rotation } = blockData;
        
        let geometry;
        
        // 🔥 SUPORTE A GEOMETRIAS VARIADAS
        switch(type) {
            case 'sphere': geometry = new THREE.SphereGeometry(0.5, 16, 16); break;
            case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16); break;
            case 'cone': geometry = new THREE.ConeGeometry(0.5, 1, 16); break;
            case 'plane': geometry = new THREE.PlaneGeometry(1, 1); break;
            case 'torus': geometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16); break;
            default: geometry = new THREE.BoxGeometry(1, 1, 1); // 'cube'
        }
        
        // Tratamento de cor
        let colorValue = color || 0x00ff00;
        if (typeof color === 'string') {
            colorValue = parseInt(color.replace('#', '0x'));
        }
        
        const material = new THREE.MeshLambertMaterial({ color: colorValue });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Posição
        mesh.position.set(x, y, z);
        
        // 🔥 SUPORTE A ROTAÇÃO
        if (rotation) {
            mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
        }

        // 🔥 SUPORTE A ESCALA (Global ou Específica)
        // Se o gerador mandou escala específica para o bloco, usa ela.
        // Se não, usa 1.
        if (scale) {
            if (typeof scale === 'number') mesh.scale.setScalar(scale);
            else mesh.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
        }
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.scene.add(mesh);
        this.generatedBlocks.push(mesh);
    },

    // Limpar blocos gerados
    clearGenerated() {
        this.generatedBlocks.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.generatedBlocks = [];
        this.stats.blocks = 0;
        this.stats.vertices = 0;
    },

    // Resetar câmera
    resetCamera() {
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    },

    // Exportar para JSON
    exportJSON() {
        const data = {
            generator: this.currentGenerator,
            params: this.currentParams,
            blocks: this.generatedBlocks.map(mesh => ({
                x: mesh.position.x,
                y: mesh.position.y,
                z: mesh.position.z,
                color: '#' + mesh.material.color.getHexString(),
                type: 'cube'
            }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `procedural_${this.currentGenerator}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('JSON exportado com sucesso!', 'success');
    },

    // Exportar para OBJ (usando OBJExporter.js do projeto)
    exportOBJ() {
        if (typeof THREE.OBJExporter === 'undefined') {
            this.showToast('OBJExporter não carregado', 'error');
            return;
        }

        const exporter = new THREE.OBJExporter();
        
        // Criar grupo temporário com todos os blocos
        const group = new THREE.Group();
        this.generatedBlocks.forEach(mesh => group.add(mesh.clone()));
        
        const objData = exporter.parse(group);
        
        const blob = new Blob([objData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `procedural_${this.currentGenerator}_${Date.now()}.obj`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('OBJ exportado com sucesso!', 'success');
    },

    // Sistema de notificações
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return; // Segurança caso o container não exista
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Auto-inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    ProceduralEngine.init();
});