/* ========================================
   VOXEL GENESIS - PROCEDURAL ENGINE V2
   Sistema Multi-Objeto + Histórico + Ghost Preview
========================================= */

const ProceduralEngine = {
    // Three.js
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    gridHelper: null,
    
    // Sistema de Objetos
    objects: [], // Array de objetos na cena { id, meshes, data }
    nextObjectId: 1,
    selectedObjectId: null,
    
    // Sistema de Histórico (Undo/Redo)
    history: {
        stack: [],
        pointer: -1,
        maxSize: 50
    },
    
    // Ghost Preview
    ghost: {
        active: false,
        meshes: [],
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        shapeId: null,
        params: {}
    },
    
    // Clipboard
    clipboard: null,
    
    // Geração
    currentGenerator: null,
    currentParams: {},
    
    // Stats
    stats: {
        fps: 60,
        blocks: 0,
        vertices: 0,
        objects: 0
    },

    categoryMap: {
        'basic': ['cube', 'plane', 'sphere', 'cylinder', 'cone', 'pyramid'],
        'architecture': ['castle', 'tower', 'lighthouse'],
        'nature': ['tree'],
        'abstract': ['helix', 'spiral', 'knot'],
        'organic': ['dna']
    },
    
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

    // ==================== INICIALIZAÇÃO ====================
    init() {
        this.setupScene();
        this.setupLights();
        this.setupKeyboardControls();
        this.animate();
        console.log('✅ Procedural Engine V2 inicializado');
    },

    setupScene() {
        const canvas = document.getElementById('previewCanvas');
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        this.camera = new THREE.PerspectiveCamera(
            60,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(0, 0, 0);
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true 
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        this.controls = new THREE.OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        this.gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
        this.scene.add(this.gridHelper);
        
        window.addEventListener('resize', () => this.handleResize());
    },

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);
        
        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight2.position.set(-10, 10, -10);
        this.scene.add(dirLight2);
    },

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z / Cmd+Z = Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            // Ctrl+Shift+Z / Cmd+Shift+Z = Redo
            else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                this.redo();
            }
            // Ctrl+C / Cmd+C = Copy
            else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                e.preventDefault();
                this.copySelected();
            }
            // Ctrl+V / Cmd+V = Paste
            else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault();
                this.paste();
            }
            // Delete/Backspace = Remove selected
            else if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedObjectId) {
                e.preventDefault();
                this.deleteObject(this.selectedObjectId);
            }
            // Escape = Cancelar ghost
            else if (e.key === 'Escape' && this.ghost.active) {
                this.cancelGhost();
            }
            // Enter = Confirmar ghost
            else if (e.key === 'Enter' && this.ghost.active) {
                this.confirmGhost();
            }
            // Setas = Mover ghost
            else if (this.ghost.active) {
                this.handleGhostMovement(e);
            }
        });
    },

    handleGhostMovement(e) {
        const step = e.shiftKey ? 5 : 1;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.ghost.position.x -= step;
                this.updateGhostPosition();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.ghost.position.x += step;
                this.updateGhostPosition();
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (e.altKey) {
                    this.ghost.position.y += step;
                } else {
                    this.ghost.position.z -= step;
                }
                this.updateGhostPosition();
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (e.altKey) {
                    this.ghost.position.y -= step;
                } else {
                    this.ghost.position.z += step;
                }
                this.updateGhostPosition();
                break;
            case 'q':
            case 'Q':
                e.preventDefault();
                this.ghost.rotation.y += Math.PI / 8;
                this.updateGhostRotation();
                break;
            case 'e':
            case 'E':
                e.preventDefault();
                this.ghost.rotation.y -= Math.PI / 8;
                this.updateGhostRotation();
                break;
        }
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.updateStats();
    },

    updateStats() {
        const blockEl = document.getElementById('statBlocks');
        const vertEl = document.getElementById('statVerts');
        const objEl = document.getElementById('statObjects');
        
        if(blockEl) blockEl.textContent = this.stats.blocks;
        if(vertEl) vertEl.textContent = this.stats.vertices;
        if(objEl) objEl.textContent = this.stats.objects;
    },

    handleResize() {
        const canvas = this.renderer.domElement;
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    },

    toggleGrid(visible) {
        if (this.gridHelper) {
            this.gridHelper.visible = visible;
        }
    },

    resetCamera() {
        this.camera.position.set(20, 20, 20);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    },

    // ==================== SISTEMA DE GHOST PREVIEW ====================
    async createGhost(shapeId, params = {}) {
        const shape = (typeof ShapeRegistry !== 'undefined' ? ShapeRegistry : window.ShapeRegistry)?.[shapeId];
        
        if (!shape) {
            console.error('❌ Shape não encontrada:', shapeId);
            return;
        }

        // Limpar ghost anterior
        this.clearGhost();

        // Configurar novo ghost
        this.ghost.active = true;
        this.ghost.shapeId = shapeId;
        this.ghost.params = params;
        this.ghost.position = { x: 0, y: 0, z: 0 };
        this.ghost.rotation = { x: 0, y: 0, z: 0 };

        // Capturar blocos do gerador
        const capturedBlocks = this.captureGeneratorBlocks(shapeId, params);

        // Criar meshes semi-transparentes
        capturedBlocks.forEach(blockData => {
            const mesh = this.createBlockMesh(blockData, true); // true = ghost mode
            this.ghost.meshes.push(mesh);
            this.scene.add(mesh);
        });

        this.showToast(`👻 Ghost ativo: ${shape.name} (Use setas para mover, Enter para confirmar, Esc para cancelar)`, 'info');
        this.updateGhostControls();
    },

    updateGhostPosition() {
        this.ghost.meshes.forEach(mesh => {
            const offset = mesh.userData.offset;
            mesh.position.set(
                this.ghost.position.x + offset.x,
                this.ghost.position.y + offset.y,
                this.ghost.position.z + offset.z
            );
        });
        this.updateGhostControls();
    },

    updateGhostRotation() {
        const pivot = new THREE.Vector3(
            this.ghost.position.x,
            this.ghost.position.y,
            this.ghost.position.z
        );

        this.ghost.meshes.forEach(mesh => {
            // Recalcular posição rotacionada
            const offset = mesh.userData.originalOffset;
            const rotated = new THREE.Vector3(offset.x, offset.y, offset.z);
            rotated.applyEuler(new THREE.Euler(
                this.ghost.rotation.x,
                this.ghost.rotation.y,
                this.ghost.rotation.z
            ));

            mesh.position.set(
                pivot.x + rotated.x,
                pivot.y + rotated.y,
                pivot.z + rotated.z
            );

            mesh.rotation.set(
                this.ghost.rotation.x,
                this.ghost.rotation.y,
                this.ghost.rotation.z
            );
        });
        this.updateGhostControls();
    },

    updateGhostControls() {
        const posXEl = document.getElementById('ghostPosX');
        const posYEl = document.getElementById('ghostPosY');
        const posZEl = document.getElementById('ghostPosZ');
        const rotYEl = document.getElementById('ghostRotY');

        if (posXEl) posXEl.value = this.ghost.position.x;
        if (posYEl) posYEl.value = this.ghost.position.y;
        if (posZEl) posZEl.value = this.ghost.position.z;
        if (rotYEl) rotYEl.value = Math.round(this.ghost.rotation.y * 180 / Math.PI);
    },

    confirmGhost() {
        if (!this.ghost.active) return;

        // Converter ghost em objeto real
        const blockData = this.ghost.meshes.map(mesh => ({
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z,
            color: '#' + mesh.material.color.getHexString(),
            type: mesh.userData.type || 'cube',
            scale: {
                x: mesh.scale.x,
                y: mesh.scale.y,
                z: mesh.scale.z
            },
            rotation: {
                x: mesh.rotation.x,
                y: mesh.rotation.y,
                z: mesh.rotation.z
            }
        }));

        const objectData = {
            shapeId: this.ghost.shapeId,
            params: this.ghost.params,
            position: { ...this.ghost.position },
            rotation: { ...this.ghost.rotation },
            blocks: blockData
        };

        this.clearGhost();
        this.addObject(objectData);
        this.showToast('✅ Objeto adicionado!', 'success');
    },

    cancelGhost() {
        this.clearGhost();
        this.showToast('🚫 Ghost cancelado', 'info');
    },

    clearGhost() {
        this.ghost.meshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.ghost.meshes = [];
        this.ghost.active = false;
    },

    // ==================== SISTEMA DE OBJETOS ====================
    addObject(objectData) {
        const id = this.nextObjectId++;
        const meshes = [];

        // Criar meshes permanentes
        objectData.blocks.forEach(blockData => {
            const mesh = this.createBlockMesh(blockData, false);
            mesh.userData.objectId = id;
            meshes.push(mesh);
            this.scene.add(mesh);
        });

        const obj = {
            id: id,
            meshes: meshes,
            data: objectData
        };

        this.objects.push(obj);
        this.stats.objects = this.objects.length;
        this.stats.blocks = this.getTotalBlocks();
        this.stats.vertices = this.stats.blocks * 24;

        // Adicionar ao histórico
        this.addToHistory({
            type: 'add',
            object: obj
        });

        this.updateObjectsList();
        console.log(`✅ Objeto #${id} adicionado (${meshes.length} blocos)`);
    },

    deleteObject(objectId) {
        const index = this.objects.findIndex(obj => obj.id === objectId);
        if (index === -1) return;

        const obj = this.objects[index];

        // Remover meshes da cena
        obj.meshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });

        this.objects.splice(index, 1);
        
        if (this.selectedObjectId === objectId) {
            this.selectedObjectId = null;
        }

        this.stats.objects = this.objects.length;
        this.stats.blocks = this.getTotalBlocks();
        this.stats.vertices = this.stats.blocks * 24;

        // Adicionar ao histórico
        this.addToHistory({
            type: 'delete',
            object: obj
        });

        this.updateObjectsList();
        this.showToast(`🗑️ Objeto #${objectId} removido`, 'info');
    },

    clearAll() {
        if (this.objects.length === 0) {
            this.showToast('Cena já está vazia', 'info');
            return;
        }

        if (!confirm(`Deseja limpar TODOS os ${this.objects.length} objetos?`)) {
            return;
        }

        // Salvar estado para undo
        const allObjects = [...this.objects];

        // Remover todos
        this.objects.forEach(obj => {
            obj.meshes.forEach(mesh => {
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
            });
        });

        this.objects = [];
        this.selectedObjectId = null;
        this.stats.objects = 0;
        this.stats.blocks = 0;
        this.stats.vertices = 0;

        this.addToHistory({
            type: 'clear',
            objects: allObjects
        });

        this.updateObjectsList();
        this.showToast('🧹 Cena limpa!', 'success');
    },

    getTotalBlocks() {
        return this.objects.reduce((sum, obj) => sum + obj.meshes.length, 0);
    },

    // ==================== SISTEMA DE HISTÓRICO ====================
    addToHistory(action) {
        // Remover ações futuras se voltamos no tempo
        if (this.history.pointer < this.history.stack.length - 1) {
            this.history.stack = this.history.stack.slice(0, this.history.pointer + 1);
        }

        this.history.stack.push(action);
        this.history.pointer++;

        // Limitar tamanho
        if (this.history.stack.length > this.history.maxSize) {
            this.history.stack.shift();
            this.history.pointer--;
        }

        this.updateHistoryButtons();
    },

    undo() {
        if (this.history.pointer < 0) {
            this.showToast('Nada para desfazer', 'info');
            return;
        }

        const action = this.history.stack[this.history.pointer];
        this.history.pointer--;

        switch(action.type) {
            case 'add':
                // Reverter: remover objeto
                this.deleteObjectSilent(action.object.id);
                break;
            case 'delete':
                // Reverter: adicionar objeto de volta
                this.restoreObject(action.object);
                break;
            case 'clear':
                // Reverter: restaurar todos objetos
                action.objects.forEach(obj => this.restoreObject(obj));
                break;
        }

        this.updateHistoryButtons();
        this.showToast('↶ Desfeito', 'info');
    },

    redo() {
        if (this.history.pointer >= this.history.stack.length - 1) {
            this.showToast('Nada para refazer', 'info');
            return;
        }

        this.history.pointer++;
        const action = this.history.stack[this.history.pointer];

        switch(action.type) {
            case 'add':
                this.restoreObject(action.object);
                break;
            case 'delete':
                this.deleteObjectSilent(action.object.id);
                break;
            case 'clear':
                action.objects.forEach(obj => this.deleteObjectSilent(obj.id));
                break;
        }

        this.updateHistoryButtons();
        this.showToast('↷ Refeito', 'info');
    },

    deleteObjectSilent(objectId) {
        const index = this.objects.findIndex(obj => obj.id === objectId);
        if (index === -1) return;

        const obj = this.objects[index];
        obj.meshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });

        this.objects.splice(index, 1);
        this.stats.objects = this.objects.length;
        this.stats.blocks = this.getTotalBlocks();
        this.updateObjectsList();
    },

    restoreObject(obj) {
        const meshes = [];

        obj.data.blocks.forEach(blockData => {
            const mesh = this.createBlockMesh(blockData, false);
            mesh.userData.objectId = obj.id;
            meshes.push(mesh);
            this.scene.add(mesh);
        });

        const restored = {
            id: obj.id,
            meshes: meshes,
            data: obj.data
        };

        this.objects.push(restored);
        this.stats.objects = this.objects.length;
        this.stats.blocks = this.getTotalBlocks();
        this.updateObjectsList();
    },

    updateHistoryButtons() {
        const undoBtn = document.getElementById('btnUndo');
        const redoBtn = document.getElementById('btnRedo');

        if (undoBtn) {
            undoBtn.disabled = this.history.pointer < 0;
        }
        if (redoBtn) {
            redoBtn.disabled = this.history.pointer >= this.history.stack.length - 1;
        }
    },

    // ==================== CLIPBOARD ====================
    copySelected() {
        if (!this.selectedObjectId) {
            this.showToast('Nenhum objeto selecionado', 'warning');
            return;
        }

        const obj = this.objects.find(o => o.id === this.selectedObjectId);
        if (!obj) return;

        this.clipboard = JSON.parse(JSON.stringify(obj.data)); // Deep clone
        this.showToast('📋 Objeto copiado', 'success');
    },

    paste() {
        if (!this.clipboard) {
            this.showToast('Clipboard vazio', 'warning');
            return;
        }

        // Criar ghost com offset
        const pasteData = JSON.parse(JSON.stringify(this.clipboard));
        pasteData.position.x += 5; // Offset para não sobrepor

        this.createGhostFromData(pasteData);
        this.showToast('📋 Colando... (Use setas para posicionar)', 'info');
    },

    createGhostFromData(objectData) {
        this.clearGhost();

        this.ghost.active = true;
        this.ghost.shapeId = objectData.shapeId;
        this.ghost.params = objectData.params;
        this.ghost.position = { ...objectData.position };
        this.ghost.rotation = { ...objectData.rotation };

        objectData.blocks.forEach(blockData => {
            const mesh = this.createBlockMesh(blockData, true);
            this.ghost.meshes.push(mesh);
            this.scene.add(mesh);
        });

        this.updateGhostPosition();
    },

    // ==================== GERAÇÃO (COMPATIBILIDADE) ====================
    async generate(shapeId, params = {}) {
        // Criar ghost ao invés de adicionar direto
        await this.createGhost(shapeId, params);
    },

    captureGeneratorBlocks(shapeId, params) {
        const shape = (typeof ShapeRegistry !== 'undefined' ? ShapeRegistry : window.ShapeRegistry)?.[shapeId];
        if (!shape) return [];

        const overrideTypeEl = document.getElementById('masterBlockType');
        const overrideScaleEl = document.getElementById('masterBlockScale');
        
        const overrideType = overrideTypeEl ? overrideTypeEl.value : 'default';
        const overrideScale = overrideScaleEl ? parseFloat(overrideScaleEl.value) : 1.0;

        const capturedBlocks = [];
        const originalAddBlockAt = window.addBlockAt;
        
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
            
            capturedBlocks.push({ 
                x, y, z, color, 
                type: finalType, 
                scale: finalScale, 
                rotation 
            });
        };

        try {
            shape.generate(params);
        } catch(e) {
            console.error('Erro ao gerar:', e);
        }
        
        window.addBlockAt = originalAddBlockAt;
        
        return capturedBlocks;
    },

    createBlockMesh(blockData, isGhost = false) {
        const { x, y, z, color, type, scale, rotation } = blockData;
        
        let geometry;
        switch(type) {
            case 'sphere': geometry = new THREE.SphereGeometry(0.5, 16, 16); break;
            case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16); break;
            case 'cone': geometry = new THREE.ConeGeometry(0.5, 1, 16); break;
            case 'plane': geometry = new THREE.PlaneGeometry(1, 1); break;
            case 'torus': geometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16); break;
            default: geometry = new THREE.BoxGeometry(1, 1, 1);
        }
        
        let colorValue = color || 0x00ff00;
        if (typeof color === 'string') {
            colorValue = parseInt(color.replace('#', '0x'));
        }
        
        const material = new THREE.MeshLambertMaterial({ 
            color: colorValue,
            transparent: isGhost,
            opacity: isGhost ? 0.5 : 1.0,
            wireframe: isGhost
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        
        if (rotation) {
            mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
        }

        if (scale) {
            if (typeof scale === 'number') {
                mesh.scale.setScalar(scale);
            } else {
                mesh.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
            }
        }

        mesh.userData.type = type || 'cube';
        
        if (isGhost) {
            mesh.userData.offset = { x, y, z };
            mesh.userData.originalOffset = { x, y, z };
        }

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    },

    // ==================== UI UPDATES ====================
    updateObjectsList() {
        const listEl = document.getElementById('objectsList');
        if (!listEl) return;

        if (this.objects.length === 0) {
            listEl.innerHTML = '<div style="padding: 10px; color: #666; text-align: center;">Nenhum objeto</div>';
            return;
        }

        listEl.innerHTML = this.objects.map(obj => {
            const shape = (typeof ShapeRegistry !== 'undefined' ? ShapeRegistry : window.ShapeRegistry)?.[obj.data.shapeId];
            const name = shape ? shape.name : obj.data.shapeId;
            const icon = shape ? shape.icon : '📦';
            const selected = obj.id === this.selectedObjectId ? 'selected' : '';
            
            return `
                <div class="object-item ${selected}" data-id="${obj.id}">
                    <span>${icon} ${name} #${obj.id}</span>
                    <span class="object-blocks">${obj.meshes.length} blocos</span>
                    <button class="btn-small" onclick="ProceduralEngine.deleteObject(${obj.id})">🗑️</button>
                </div>
            `;
        }).join('');

        // Adicionar event listeners
        listEl.querySelectorAll('.object-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    this.selectObject(parseInt(item.dataset.id));
                }
            });
        });
    },

    selectObject(objectId) {
        this.selectedObjectId = objectId;
        this.updateObjectsList();
        
        const obj = this.objects.find(o => o.id === objectId);
        if (obj) {
            // Highlight visual (opcional)
            this.showToast(`Selecionado: Objeto #${objectId}`, 'info');
        }
    },

    // ==================== EXPORTAÇÃO ====================
    exportJSON() {
        const data = {
            version: '2.0',
            objects: this.objects.map(obj => obj.data)
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voxel_genesis_scene_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('💾 Cena exportada!', 'success');
    },

    exportOBJ() {
        if (typeof THREE.OBJExporter === 'undefined') {
            this.showToast('OBJExporter não carregado', 'error');
            return;
        }

        const exporter = new THREE.OBJExporter();
        const group = new THREE.Group();
        
        this.objects.forEach(obj => {
            obj.meshes.forEach(mesh => group.add(mesh.clone()));
        });
        
        const objData = exporter.parse(group);
        
        const blob = new Blob([objData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voxel_genesis_scene_${Date.now()}.obj`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('💾 OBJ exportado!', 'success');
    },

    // ==================== NOTIFICAÇÕES ====================
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

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
    ProceduralEngine.init();
});
