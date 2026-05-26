/* ========================================
   VOXEL GENESIS - PROCEDURAL ENGINE
   v2.5 - Multi-Objetos, Undo/Redo e Clipboard
========================================= */

const ProceduralEngine = {
    // Three.js
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    gridHelper: null,
    
    // Estado de Geração
    currentGenerator: null,
    currentParams: {},
    
    // 🔥 NOVA ESTRUTURA DE DADOS
    previewBlocks: [],   // Blocos sendo editados agora (o "fantasma")
    worldBlocks: [],     // Blocos já confirmados na cena (fixos)
    
    // Histórico e Clipboard
    history: [],         // Pilha de estados para Undo
    historyIndex: -1,    // Posição atual no histórico
    clipboard: null,     // Armazena config para Copiar/Colar

    // Stats
    stats: { fps: 60, blocks: 0, vertices: 0 },

    // Mapeamento (Mantido igual)
    categoryMap: {
        'basic': ['cube', 'plane', 'sphere', 'cylinder', 'cone', 'pyramid', 'torus', 'tetrahedron', 'hexahedron', 'octahedron', 'dodecahedron', 'icosahedron', 'hollowSphere', 'hollowCone', 'hollowCylinder', 'rectangularPrism', 'hexagon', 'superquadric'],
        'architecture': ['castle', 'tower', 'tower_2', 'lighthouse', 'windmill', 'well', 'gazebo', 'fountain', 'stairs', 'lShapedStairs', 'spiralStairs', 'arch', 'bridge', 'maze', 'vault', 'dungeon', 'dome', 'crystal', 'platformSet', 'organicArch', 'house', 'proceduralBuilding', 'ruins', 'temple'],
        'nature': ['tree', 'fractalTree', 'palm', 'pinecone', 'cactus', 'flower', 'bush', 'mushroom', 'mushroom_2', 'reed', 'coral', 'coral_2', 'rock', 'rock_2', 'terrain'],
        'abstract': ['helix', 'dna', 'spiral2D', 'knot', 'mobius', 'klein_bottle', 'wave', 'heart', 'fractal_cube', 'sierpinski_pyramid', 'dragon_curve_3d', 'hilbert_curve', 'julia_set', 'apollonian_gasket', 'spiral_log', 'metatrons_cube', 'flower_of_life', 'seed_of_life', 'sri_yantra', 'vesica_piscis', 'mandala', 'pentagram', 'tessellation', 'implicitSurface', 'gyroid', 'sticks_pile', 'fractal']
    },

    // (getGeneratorConfig e getCategory mantidos iguais...)
    getGeneratorConfig(shapeId) {
        const shape = (typeof ShapeRegistry !== 'undefined' ? ShapeRegistry : window.ShapeRegistry)?.[shapeId];
        if (!shape) return null;
        const config = {
            name: shape.name,
            icon: shape.icon,
            category: this.getCategory(shapeId),
            shapeKey: shapeId,
            params: {}
        };
        if (shape.params) {
            shape.params.forEach(param => {
                config.params[param.name] = {
                    label: param.label,
                    min: param.min || 1,
                    max: param.max || 20,
                    default: param.default || 5,
                    step: param.step || 1, // Adicionado suporte a step
                    type: param.type || 'range', // Adicionado suporte a tipo
                    options: param.options || []
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

    init() {
        this.setupScene();
        this.setupLights();
        this.animate();
        this.saveState(); // Salva estado inicial vazio
        console.log('✅ Procedural Engine v2.5 (Multi-Object) inicializado');
    },

    setupScene() {
        const canvas = document.getElementById('previewCanvas');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        this.camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true; // Sombras
        
        this.controls = new THREE.OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        this.gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
        this.scene.add(this.gridHelper);
        
        window.addEventListener('resize', () => this.handleResize());
    },

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(15, 25, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.updateStats();
    },

    updateStats() {
        const totalBlocks = this.worldBlocks.length + this.previewBlocks.length;
        const blockEl = document.getElementById('statBlocks');
        const vertEl = document.getElementById('statVerts');
        if(blockEl) blockEl.textContent = totalBlocks;
        if(vertEl) vertEl.textContent = totalBlocks * 24; // Aprox
    },

    handleResize() {
        const canvas = this.renderer.domElement;
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    },

    toggleGrid(visible) {
        if (this.gridHelper) this.gridHelper.visible = visible;
    },

    // ==========================================
    // 🔥 LÓGICA DE GERAÇÃO E MULTI-OBJETOS
    // ==========================================

    async generate(shapeId, params = {}) {
        const shape = (typeof ShapeRegistry !== 'undefined' ? ShapeRegistry : window.ShapeRegistry)?.[shapeId];
        
        if (!shape) {
            this.showToast(`Erro: Shape ${shapeId} não encontrada`, 'error');
            return;
        }

        this.currentGenerator = shapeId;
        this.currentParams = params;

        const loading = document.getElementById('loadingOverlay');
        if(loading) loading.classList.remove('hidden');

        // 🔥 Limpa APENAS o preview atual, mantendo o mundo
        this.clearPreview();
        
        await new Promise(resolve => setTimeout(resolve, 20)); // Breve delay para UI

        try {
            // Captura Overrides Globais
            const overrideTypeEl = document.getElementById('masterBlockType');
            const overrideScaleEl = document.getElementById('masterBlockScale');
            const overrideType = overrideTypeEl ? overrideTypeEl.value : 'default';
            const overrideScale = overrideScaleEl ? parseFloat(overrideScaleEl.value) : 1.0;

            const tempBlocks = [];
            const originalAddBlockAt = window.addBlockAt;
            
            // Interceptor de blocos
            window.addBlockAt = (x, y, z, color, type, scale, rotation) => {
                const finalType = (overrideType === 'default') ? type : overrideType;
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
                
                tempBlocks.push({ x, y, z, color, type: finalType, scale: finalScale, rotation });
            };

            shape.generate(params);
            
            window.addBlockAt = originalAddBlockAt;
            
            // Renderiza como Preview (fantasma/seleção)
            tempBlocks.forEach(data => this.addBlockToScene(data, true));
            
        } catch (error) {
            console.error(error);
            this.showToast('Erro na geração', 'error');
        } finally {
            if(loading) loading.classList.add('hidden');
        }
    },

    // Adiciona bloco à cena
    addBlockToScene(blockData, isPreview = false) {
        const { x, y, z, color, type, scale, rotation } = blockData;
        
        let geometry;
        switch(type) {
            case 'sphere': geometry = new THREE.SphereGeometry(0.5, 16, 16); break;
            case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16); break;
            case 'cone': geometry = new THREE.ConeGeometry(0.5, 1, 16); break;
            case 'plane': geometry = new THREE.PlaneGeometry(1, 1); break;
            case 'torus': geometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16); break;
            case 'pyramid': geometry = new THREE.ConeGeometry(0.7, 1, 4); break; // Pirâmide simples
            case 'tetrahedron': geometry = new THREE.TetrahedronGeometry(0.6); break;
            case 'octahedron': geometry = new THREE.OctahedronGeometry(0.6); break;
            case 'dodecahedron': geometry = new THREE.DodecahedronGeometry(0.6); break;
            case 'icosahedron': geometry = new THREE.IcosahedronGeometry(0.6); break;
            default: geometry = new THREE.BoxGeometry(1, 1, 1); // cube
        }

        let colorValue = color || 0x00ff00;
        if (typeof color === 'string') colorValue = parseInt(color.replace('#', '0x'));
        
        const material = new THREE.MeshLambertMaterial({ 
            color: colorValue,
            transparent: isPreview,
            opacity: isPreview ? 0.9 : 1.0 // Preview levemente transparente
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        
        if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
        
        if (scale) {
            if (typeof scale === 'number') mesh.scale.setScalar(scale);
            else mesh.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
        }

        mesh.userData = { 
            type: type || 'cube', 
            originalColor: color,
            isDataBlock: true 
        };
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.scene.add(mesh);
        
        if (isPreview) {
            this.previewBlocks.push(mesh);
            
            // Adiciona contorno (Wireframe) para indicar que é seleção
            /* // Opcional: Wireframe
            const edges = new THREE.EdgesGeometry(geometry);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true }));
            mesh.add(line); 
            */
        } else {
            this.worldBlocks.push(mesh);
        }
    },

    // ==========================================
    // 🔥 GERENCIAMENTO DE ESTADO (NOVO)
    // ==========================================

    // Limpa apenas o objeto atual (preview)
    clearPreview() {
        this.previewBlocks.forEach(mesh => {
            this.scene.remove(mesh);
            if(mesh.geometry) mesh.geometry.dispose();
            if(mesh.material) mesh.material.dispose();
        });
        this.previewBlocks = [];
    },

    // Limpa TUDO (Vassoura)
    clearAll() {
        this.saveState(); // Salva antes de limpar
        this.clearPreview();
        this.worldBlocks.forEach(mesh => {
            this.scene.remove(mesh);
            if(mesh.geometry) mesh.geometry.dispose();
            if(mesh.material) mesh.material.dispose();
        });
        this.worldBlocks = [];
        this.showToast('🧹 Cena limpa!', 'warn');
    },

    // Confirma o objeto atual no mundo (+)
    commitPreview() {
        if (this.previewBlocks.length === 0) return;

        this.saveState(); // Salva histórico antes de adicionar

        // Move do preview para o mundo
        this.previewBlocks.forEach(mesh => {
            // Remove transparência de preview
            mesh.material.opacity = 1.0;
            mesh.material.transparent = false;
            this.worldBlocks.push(mesh);
        });
        
        this.previewBlocks = []; // Esvazia preview (os meshes agora estão em worldBlocks)
        this.showToast('✅ Objeto adicionado!', 'success');
    },

    // Deleta o preview atual (Lixeira)
    deletePreview() {
        if (this.previewBlocks.length === 0) {
            this.showToast('Nada selecionado para deletar', 'info');
            return;
        }
        this.clearPreview();
        this.showToast('🗑️ Seleção descartada', 'error');
    },

    // ==========================================
    // 🔥 HISTÓRICO (UNDO / REDO)
    // ==========================================

    saveState() {
        // Remove estados futuros se estivermos no meio do histórico
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // Serializa apenas os blocos do mundo (o preview não entra no histórico global)
        const state = this.worldBlocks.map(mesh => ({
            p: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
            r: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
            s: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
            c: '#' + mesh.material.color.getHexString(),
            t: mesh.userData.type
        }));

        this.history.push(state);
        this.historyIndex++;
        
        // Limita tamanho do histórico
        if (this.history.length > 20) {
            this.history.shift();
            this.historyIndex--;
        }
    },

    undo() {
        if (this.historyIndex > 0) {
            this.clearPreview(); // Limpa preview atual para evitar conflitos
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
            this.showToast('↩️ Desfazer', 'info');
        } else {
            this.showToast('Início do histórico', 'info');
        }
    },

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.clearPreview();
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
            this.showToast('↪️ Refazer', 'info');
        } else {
            this.showToast('Fim do histórico', 'info');
        }
    },

    restoreState(state) {
        // Limpa mundo atual
        this.worldBlocks.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.worldBlocks = [];

        // Reconstrói mundo a partir do estado
        state.forEach(data => {
            this.addBlockToScene({
                x: data.p.x, y: data.p.y, z: data.p.z,
                color: data.c,
                type: data.t,
                scale: data.s,
                rotation: data.r
            }, false); // false = vai direto pro worldBlocks
        });
    },

    // ==========================================
    // 🔥 CLIPBOARD (COPY / PASTE)
    // ==========================================
    
    copyToClipboard() {
        if (!this.currentGenerator) {
            this.showToast('Nada para copiar', 'error');
            return;
        }
        this.clipboard = {
            generator: this.currentGenerator,
            params: JSON.parse(JSON.stringify(this.currentParams)) // Deep copy
        };
        this.showToast('📑 Configuração Copiada!', 'success');
    },

    pasteFromClipboard() {
        if (!this.clipboard) {
            this.showToast('Clipboard vazio', 'info');
            return;
        }
        
        // Simula seleção do gerador na UI
        const slot = document.querySelector(`.inventory-slot[data-shape="${this.clipboard.generator}"]`);
        if (slot && typeof ProceduralUI !== 'undefined') {
            ProceduralUI.selectGenerator(this.clipboard.generator, slot);
            
            // Aplica os parâmetros salvos (pequeno delay para UI renderizar)
            setTimeout(() => {
                const inputs = document.querySelectorAll('[data-param]');
                inputs.forEach(input => {
                    const key = input.dataset.param;
                    if (this.clipboard.params[key] !== undefined) {
                        if (input.type === 'checkbox') input.checked = this.clipboard.params[key];
                        else {
                            input.value = this.clipboard.params[key];
                            const display = document.getElementById(`val_${key}`);
                            if(display) display.textContent = this.clipboard.params[key];
                        }
                    }
                });
                ProceduralUI.onParamChange(); // Regenera
            }, 100);
            
            this.showToast('📋 Configuração Colada!', 'success');
        }
    },

    // ==========================================
    // EXPORTAÇÃO
    // ==========================================
    
    resetCamera() {
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    },

    exportJSON() {
        // Combina mundo + preview para exportar
        const allBlocks = [...this.worldBlocks, ...this.previewBlocks];
        
        const data = {
            generator: 'scene_export',
            blocks: allBlocks.map(mesh => ({
                position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
                color: '#' + mesh.material.color.getHexString(),
                type: mesh.userData.type || 'cube',
                scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
                rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z }
            }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voxel_scene_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('JSON exportado!', 'success');
    },

    exportOBJ() {
        if (typeof THREE.OBJExporter === 'undefined') {
            this.showToast('OBJExporter não carregado', 'error');
            return;
        }
        const exporter = new THREE.OBJExporter();
        const group = new THREE.Group();
        
        // Exporta tudo
        [...this.worldBlocks, ...this.previewBlocks].forEach(mesh => group.add(mesh.clone()));
        
        const objData = exporter.parse(group);
        const blob = new Blob([objData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voxel_scene_${Date.now()}.obj`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('OBJ exportado!', 'success');
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
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

document.addEventListener('DOMContentLoaded', () => {
    ProceduralEngine.init();
});