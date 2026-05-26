/* ========================================
   VOXEL GENESIS - PROCEDURAL ENGINE
   v3.2 - SISTEMA COMPLETO DE HISTÓRICO:
   ✅ Undo/Redo funcional (50 estados)
   ✅ Copy/Paste com offset automático
   ✅ Salvamento automático após transformações
   ✅ Serialização/Deserialização de grupos
   
   CORREÇÕES ANTERIORES:
   ✅ Tecla 'S' para Scale
   ✅ Shift+R para Rotate (evita conflito com Randomize)
   ✅ Preview limpo após adicionar ao mundo
   ✅ BoxHelper dispose correto
========================================= */

const ProceduralEngine = {
    // Three.js
    scene: null,
    camera: null,
    renderer: null,
    controls: null,     // OrbitControls
    transformer: null,  // TransformControls (Mover/Girar/Escalar)
    raycaster: null,
    mouse: null,
    gridHelper: null,
    
    // Estado de Geração
    currentGenerator: null,
    currentParams: {},
    
    // 🔥 ESTRUTURA: GRUPOS
    previewGroup: null,   // O objeto "fantasma" atual (preview antes de confirmar)
    worldObjects: [],     // Lista de Grupos (Objetos) confirmados
    selectedObject: null, // Objeto atualmente selecionado pelo Transformer
    
    // Histórico e Clipboard
    history: [],         
    historyIndex: -1,
    maxHistorySize: 50,  // Limite de estados para não estourar memória
    clipboard: null,     

    // Stats
    stats: { fps: 60, blocks: 0, vertices: 0 },

    // Mapeamento (Mantido igual)
    categoryMap: {
        'basic': ['cube', 'plane', 'sphere', 'cylinder', 'cone', 'pyramid', 'torus', 'tetrahedron', 'hexahedron', 'octahedron', 'dodecahedron', 'icosahedron', 'hollowSphere', 'hollowCone', 'hollowCylinder', 'rectangularPrism', 'hexagon', 'superquadric'],
        'architecture': ['castle', 'tower', 'tower_2', 'lighthouse', 'windmill', 'well', 'gazebo', 'fountain', 'stairs', 'lShapedStairs', 'spiralStairs', 'arch', 'bridge', 'maze', 'vault', 'dungeon', 'dome', 'crystal', 'platformSet', 'organicArch', 'house', 'proceduralBuilding', 'ruins', 'temple'],
        'nature': ['tree', 'fractalTree', 'palm', 'pinecone', 'cactus', 'flower', 'bush', 'mushroom', 'mushroom_2', 'reed', 'coral', 'coral_2', 'rock', 'rock_2', 'terrain'],
        'abstract': ['helix', 'dna', 'spiral2D', 'knot', 'mobius', 'klein_bottle', 'wave', 'heart', 'fractal_cube', 'sierpinski_pyramid', 'dragon_curve_3d', 'hilbert_curve', 'julia_set', 'apollonian_gasket', 'spiral_log', 'metatrons_cube', 'flower_of_life', 'seed_of_life', 'sri_yantra', 'vesica_piscis', 'mandala', 'pentagram', 'tessellation', 'implicitSurface', 'gyroid', 'sticks_pile', 'fractal']
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
                    step: param.step || 1,
                    type: param.type || 'range',
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
        this.setupInteraction(); // 🔥 Raycaster e Transformer
        this.animate();
        this.saveState(); 
        console.log('✅ Procedural Engine v3.2 (UNDO/REDO/PASTE COMPLETOS) inicializado');
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
        this.renderer.shadowMap.enabled = true;
        
        this.controls = new THREE.OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        this.gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
        this.scene.add(this.gridHelper);
        
        // Grupo Container para o Preview
        this.previewGroup = new THREE.Group();
        this.previewGroup.name = "PreviewGroup";
        this.scene.add(this.previewGroup);

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

    // 🔥 CONFIGURAÇÃO DE SELEÇÃO E TRANSFORMER
    setupInteraction() {
        const canvas = this.renderer.domElement;
        
        // 1. Raycaster (Click to Select)
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        canvas.addEventListener('pointerdown', (event) => {
            // Calcula posição do mouse normalizada (-1 a +1)
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);

            // Raycast contra objetos do MUNDO (não o preview)
            // Precisamos checar os filhos dos grupos em worldObjects
            // Mas queremos selecionar o GRUPO pai.
            
            // Cria array temporário de todos os meshes no mundo
            let allMeshes = [];
            this.worldObjects.forEach(group => {
                allMeshes = allMeshes.concat(group.children);
            });

            const intersects = this.raycaster.intersectObjects(allMeshes);

            if (intersects.length > 0) {
                // Seleciona o objeto pai (O Grupo) do bloco clicado
                const hitObject = intersects[0].object;
                const parentGroup = hitObject.parent;
                
                if (parentGroup && parentGroup.isGroup && parentGroup !== this.previewGroup) {
                    this.selectObject(parentGroup);
                }
            } else {
                // Clicou no vazio -> Deseleciona
                // Apenas se não estiver clicando no gizmo do transformer
                // (O TransformControls lida com seus próprios eventos, então isso geralmente é ok)
                this.deselectObject();
            }
        });

        // 2. TransformControls
        this.transformer = new THREE.TransformControls(this.camera, canvas);
        
        // Quando começa a arrastar, desativa órbita
        this.transformer.addEventListener('dragging-changed', (event) => {
            this.controls.enabled = !event.value; // Desativa órbita enquanto arrasta
            
            // Quando SOLTA o gizmo (value = false), salva o estado
            if (!event.value && this.selectedObject) {
                this.saveState();
                console.log('💾 Estado salvo após transformação');
            }
        });
        
        // Listener para atualizar BoxHelper durante transformação
        this.transformer.addEventListener('change', () => {
            // BoxHelper é atualizado automaticamente no animate()
        });

        this.scene.add(this.transformer);

        // ✅ CORREÇÃO: Teclas para alternar modos
        // G = Move (Translate)
        // S = Scale (CORRIGIDO - era 'E' antes)
        // Shift+R = Rotate (CORRIGIDO - evita conflito com R=Randomize)
        window.addEventListener('keydown', (event) => {
            // Ignora se estiver digitando em um input
            if (document.activeElement && document.activeElement.tagName === 'INPUT') {
                return;
            }

            const key = event.key.toLowerCase();
            
            switch (key) {
                case 'g': 
                    this.transformer.setMode('translate'); 
                    this.showToast('🔵 Modo: Mover (G)', 'info');
                    break;
                    
                case 'r': 
                    // Apenas com Shift para evitar conflito com Randomize
                    if (event.shiftKey) {
                        this.transformer.setMode('rotate'); 
                        this.showToast('🟢 Modo: Rotacionar (Shift+R)', 'info');
                    }
                    break;
                    
                case 's': // ✅ CORRIGIDO: Agora S = Scale
                    this.transformer.setMode('scale'); 
                    this.showToast('🟡 Modo: Escalar (S)', 'info');
                    break;
            }
        });
    },

    selectObject(group) {
        this.selectedObject = group;
        this.transformer.attach(group);
        
        // Visual Feedback (Opcional: Bounding Box)
        const box = new THREE.BoxHelper(group, 0xffff00);
        group.userData.boxHelper = box;
        this.scene.add(box);
        
        this.showToast('✅ Objeto Selecionado (G=Mover, S=Escalar, Shift+R=Rotacionar)', 'info');
    },

    deselectObject() {
        if (this.selectedObject) {
            // Remove e destroi o BoxHelper
            if (this.selectedObject.userData.boxHelper) {
                this.scene.remove(this.selectedObject.userData.boxHelper);
                this.selectedObject.userData.boxHelper.dispose(); // ✅ Libera memória
                this.selectedObject.userData.boxHelper = null;    // ✅ Limpa referência
            }
            this.transformer.detach();
            this.selectedObject = null;
        }
    },

    handleResize() {
        const canvas = this.renderer.domElement;
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        
        // Atualizar BoxHelper se existir
        if (this.selectedObject && this.selectedObject.userData.boxHelper) {
            this.selectedObject.userData.boxHelper.update();
        }
        
        this.renderer.render(this.scene, this.camera);
        
        // FPS (simplificado)
        this.stats.fps = Math.round(1000 / 16.67); // ~60
        const fpsEl = document.getElementById('statFPS');
        if (fpsEl) fpsEl.textContent = this.stats.fps;
        
        // Block count
        const blockCount = this.previewGroup.children.length + 
                          this.worldObjects.reduce((sum, g) => sum + g.children.length, 0);
        const blockEl = document.getElementById('statBlocks');
        if (blockEl) blockEl.textContent = blockCount;
    },

    // ==========================================
    // 🔥 GERAÇÃO PROCEDURAL
    // ==========================================
    generate(shapeKey, params) {
        this.currentGenerator = shapeKey;
        this.currentParams = { ...params };
        
        this.clearPreview();
        
        const shape = (typeof ShapeRegistry !== 'undefined' ? ShapeRegistry : window.ShapeRegistry)?.[shapeKey];
        if (!shape || !shape.generate) {
            this.showToast('Gerador não encontrado', 'error');
            return;
        }

        try {
            // Captura a cor atual e tipo global (atomização)
            const masterType = document.getElementById('masterBlockType')?.value || 'default';
            const masterScale = parseFloat(document.getElementById('masterBlockScale')?.value || 1);

            // Hook temporário para addBlockAt
            const originalAddBlockAt = window.addBlockAt;
            window.addBlockAt = (x, y, z, color, type, scale, rotation) => {
                this.addVoxelToPreview(
                    x, y, z, 
                    color, 
                    masterType === 'default' ? type : masterType, 
                    scale !== undefined ? scale : masterScale, 
                    rotation
                );
            };

            // Executa o gerador
            shape.generate(params);

            // Restaura
            window.addBlockAt = originalAddBlockAt;

            this.showToast(`✨ ${shape.name || 'Forma'} gerada!`, 'success');

        } catch (error) {
            console.error('Erro na geração:', error);
            this.showToast('Erro ao gerar: ' + error.message, 'error');
        }
    },

    addVoxelToPreview(x, y, z, color, type, scale, rotation) {
        const group = this.previewGroup; // Sempre adiciona ao preview
        
        // Cria geometria baseada no tipo
        let geometry;
        switch(type) {
            case 'sphere': geometry = new THREE.SphereGeometry(0.5, 8, 8); break;
            case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8); break;
            case 'cone': geometry = new THREE.ConeGeometry(0.5, 1, 8); break;
            case 'pyramid': geometry = new THREE.ConeGeometry(0.5, 1, 4); break;
            case 'torus': geometry = new THREE.TorusGeometry(0.4, 0.15, 8, 12); break;
            default: geometry = new THREE.BoxGeometry(1, 1, 1); break;
        }

        const material = new THREE.MeshPhongMaterial({ 
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.8, // Preview semi-transparente
            shininess: 30
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

        group.add(mesh);
    },

    // ==========================================
    // 🔥 GERENCIAMENTO DE OBJETOS
    // ==========================================

    clearPreview() {
        while(this.previewGroup.children.length > 0){ 
            const mesh = this.previewGroup.children[0];
            this.previewGroup.remove(mesh);
            if(mesh.geometry) mesh.geometry.dispose();
            if(mesh.material) mesh.material.dispose();
        }
    },

    clearAll() {
        this.saveState();
        this.clearPreview();
        this.deselectObject();
        
        // Remove todos os grupos do mundo
        this.worldObjects.forEach(group => {
            this.scene.remove(group);
            // Limpa filhos
            while(group.children.length > 0){
                const m = group.children[0];
                group.remove(m);
                if(m.geometry) m.geometry.dispose();
                if(m.material) m.material.dispose();
            }
        });
        this.worldObjects = [];
        this.showToast('🧹 Cena limpa!', 'warn');
    },

    // 🔥 "O BOTÃO MAIS" (ADD) - Agora cria um OBJETO independente
    // ✅ CORREÇÃO: Preview é LIMPO após adicionar (remove fantasma)
    commitPreview() {
        if (this.previewGroup.children.length === 0) {
            this.showToast('⚠️ Nada para adicionar', 'warn');
            return;
        }

        this.saveState();

        // 1. Cria um novo Grupo para o objeto do mundo
        const newObject = new THREE.Group();
        newObject.name = `WorldObject_${this.worldObjects.length}`;
        
        // 2. Clona os meshes do preview para o novo objeto
        this.previewGroup.children.forEach(child => {
            const clone = child.clone();
            // Torna sólido (remove transparência do preview)
            clone.material = child.material.clone();
            clone.material.transparent = false;
            clone.material.opacity = 1.0;
            newObject.add(clone);
        });

        // 3. Adiciona à cena e à lista lógica
        this.scene.add(newObject);
        this.worldObjects.push(newObject);
        
        // ✅ 4. LIMPA O PREVIEW (CORRIGIDO - Remove o "fantasma")
        this.clearPreview(); 
        
        // 5. SELECIONA O NOVO OBJETO AUTOMATICAMENTE
        this.selectObject(newObject);
        this.transformer.setMode('translate'); // Já pronto para mover

        this.showToast('✅ Objeto Criado! Use G/S/Shift+R para transformar.', 'success');
    },

    deletePreview() {
        if (this.selectedObject) {
            // Se tem objeto selecionado, deleta ele
            this.saveState(); // Salva estado antes de deletar
            this.scene.remove(this.selectedObject);
            this.worldObjects = this.worldObjects.filter(o => o !== this.selectedObject);
            this.deselectObject();
            this.showToast('🗑️ Objeto deletado', 'info');
        } else {
            // Senão, limpa o preview (comportamento original)
            this.clearPreview();
            this.showToast('🗑️ Preview limpo', 'info');
        }
    },

    // ==========================================
    // 🔥 EXPORTAÇÃO (ATUALIZADA PARA GRUPOS)
    // ==========================================
    
    // Função auxiliar para pegar todos os blocos flat (para JSON export)
    getAllBlocksFlat() {
        const blocks = [];
        
        // Blocos do Preview
        this.previewGroup.children.forEach(mesh => {
            blocks.push(this.serializeMesh(mesh));
        });

        // Blocos dos Objetos do Mundo (levando em conta a posição do grupo)
        this.worldObjects.forEach(group => {
            group.updateMatrixWorld(); // Garante que transformações estejam aplicadas
            group.children.forEach(mesh => {
                // Precisamos da posição global do bloco (Posição do Grupo + Posição do Bloco)
                const globalPos = new THREE.Vector3();
                mesh.getWorldPosition(globalPos);
                
                const sMesh = this.serializeMesh(mesh);
                sMesh.position = { x: globalPos.x, y: globalPos.y, z: globalPos.z };
                
                blocks.push(sMesh);
            });
        });
        
        return blocks;
    },

    serializeMesh(mesh) {
        return {
            position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
            color: '#' + mesh.material.color.getHexString(),
            type: mesh.userData.type || 'cube',
            scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
            rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z }
        };
    },

    exportJSON() {
        const data = {
            generator: 'scene_export_v3',
            blocks: this.getAllBlocksFlat()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voxel_scene_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('💾 JSON exportado!', 'success');
    },

    exportOBJ() {
        this.showToast('📦 Exportação OBJ em desenvolvimento...', 'info');
    },
    
    // ==========================================
    // 🔥 SISTEMA DE HISTÓRICO (UNDO/REDO)
    // ==========================================
    
    saveState() {
        // Remove estados "futuros" se estamos no meio da pilha
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // Serializa o estado atual da cena
        const state = {
            timestamp: Date.now(),
            worldObjects: this.worldObjects.map(group => this.serializeGroup(group)),
            preview: this.previewGroup.children.map(mesh => this.serializeMesh(mesh)),
            selectedObjectIndex: this.selectedObject ? 
                this.worldObjects.indexOf(this.selectedObject) : -1
        };

        this.history.push(state);
        this.historyIndex++;

        // Limita o tamanho do histórico
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }

        console.log(`💾 Estado salvo | Histórico: ${this.historyIndex + 1}/${this.history.length}`);
    },

    serializeGroup(group) {
        return {
            name: group.name,
            position: { x: group.position.x, y: group.position.y, z: group.position.z },
            rotation: { x: group.rotation.x, y: group.rotation.y, z: group.rotation.z },
            scale: { x: group.scale.x, y: group.scale.y, z: group.scale.z },
            children: group.children.map(mesh => this.serializeMesh(mesh))
        };
    },

    restoreState(state) {
        if (!state) return;

        // Limpa tudo primeiro
        this.deselectObject();
        this.clearPreview();
        
        // Remove objetos do mundo
        this.worldObjects.forEach(group => {
            this.scene.remove(group);
            while(group.children.length > 0){
                const m = group.children[0];
                group.remove(m);
                if(m.geometry) m.geometry.dispose();
                if(m.material) m.material.dispose();
            }
        });
        this.worldObjects = [];

        // Reconstrói objetos do mundo
        state.worldObjects.forEach(groupData => {
            const group = new THREE.Group();
            group.name = groupData.name;
            group.position.set(groupData.position.x, groupData.position.y, groupData.position.z);
            group.rotation.set(groupData.rotation.x, groupData.rotation.y, groupData.rotation.z);
            group.scale.set(groupData.scale.x, groupData.scale.y, groupData.scale.z);

            groupData.children.forEach(meshData => {
                const mesh = this.createMeshFromData(meshData);
                mesh.material.transparent = false;
                mesh.material.opacity = 1.0;
                group.add(mesh);
            });

            this.scene.add(group);
            this.worldObjects.push(group);
        });

        // Reconstrói preview
        state.preview.forEach(meshData => {
            const mesh = this.createMeshFromData(meshData);
            mesh.material.transparent = true;
            mesh.material.opacity = 0.8;
            this.previewGroup.add(mesh);
        });

        // Restaura seleção
        if (state.selectedObjectIndex >= 0 && state.selectedObjectIndex < this.worldObjects.length) {
            this.selectObject(this.worldObjects[state.selectedObjectIndex]);
        }
    },

    createMeshFromData(data) {
        // Cria geometria baseada no tipo
        let geometry;
        switch(data.type) {
            case 'sphere': geometry = new THREE.SphereGeometry(0.5, 8, 8); break;
            case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8); break;
            case 'cone': geometry = new THREE.ConeGeometry(0.5, 1, 8); break;
            case 'pyramid': geometry = new THREE.ConeGeometry(0.5, 1, 4); break;
            case 'torus': geometry = new THREE.TorusGeometry(0.4, 0.15, 8, 12); break;
            default: geometry = new THREE.BoxGeometry(1, 1, 1); break;
        }

        const material = new THREE.MeshPhongMaterial({ 
            color: new THREE.Color(data.color),
            shininess: 30
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(data.position.x, data.position.y, data.position.z);
        mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        mesh.scale.set(data.scale.x, data.scale.y, data.scale.z);
        
        mesh.userData = { 
            type: data.type || 'cube', 
            originalColor: data.color,
            isDataBlock: true 
        };
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    },

    undo() { 
        if (this.historyIndex <= 0) {
            this.showToast('⚠️ Nada para desfazer', 'warn');
            return;
        }

        this.historyIndex--;
        const state = this.history[this.historyIndex];
        this.restoreState(state);
        
        this.showToast(`⏪ Desfazer (${this.historyIndex + 1}/${this.history.length})`, 'info');
    },

    redo() { 
        if (this.historyIndex >= this.history.length - 1) {
            this.showToast('⚠️ Nada para refazer', 'warn');
            return;
        }

        this.historyIndex++;
        const state = this.history[this.historyIndex];
        this.restoreState(state);
        
        this.showToast(`⏩ Refazer (${this.historyIndex + 1}/${this.history.length})`, 'info');
    },
    
    copyToClipboard() { 
        if (this.selectedObject) {
            // Serializa o objeto selecionado
            this.clipboard = {
                type: 'object',
                data: this.serializeGroup(this.selectedObject)
            };
            this.showToast('📋 Objeto copiado!', 'success');
        } else {
            this.showToast('⚠️ Nenhum objeto selecionado', 'warn');
        }
    },
    
    pasteFromClipboard() { 
        if (!this.clipboard || !this.clipboard.data) {
            this.showToast('⚠️ Clipboard vazio', 'warn');
            return;
        }

        this.saveState(); // Salva estado antes de colar

        const groupData = this.clipboard.data;
        
        // Cria novo grupo
        const newGroup = new THREE.Group();
        newGroup.name = `WorldObject_${this.worldObjects.length}`;
        
        // Aplica offset de 2 unidades em X e Z para não colar exatamente em cima
        const offsetX = 2;
        const offsetZ = 2;
        
        newGroup.position.set(
            groupData.position.x + offsetX, 
            groupData.position.y, 
            groupData.position.z + offsetZ
        );
        newGroup.rotation.set(groupData.rotation.x, groupData.rotation.y, groupData.rotation.z);
        newGroup.scale.set(groupData.scale.x, groupData.scale.y, groupData.scale.z);

        // Reconstrói os meshes
        groupData.children.forEach(meshData => {
            const mesh = this.createMeshFromData(meshData);
            mesh.material.transparent = false;
            mesh.material.opacity = 1.0;
            newGroup.add(mesh);
        });

        // Adiciona à cena
        this.scene.add(newGroup);
        this.worldObjects.push(newGroup);

        // Seleciona o novo objeto
        this.deselectObject();
        this.selectObject(newGroup);
        this.transformer.setMode('translate');

        this.showToast('📋 Objeto colado! (offset +2,+2)', 'success');
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
        this.showToast('📷 Câmera resetada', 'info');
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
