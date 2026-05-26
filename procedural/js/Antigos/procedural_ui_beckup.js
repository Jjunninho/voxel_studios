/* ========================================
   VOXEL GENESIS - PROCEDURAL UI
   Gerenciamento de interface e interações
   UPDATED: Com Live Update (Debounce)
========================================= */

const ProceduralUI = {
    currentCategory: 'all',
    selectedGenerator: null,
    debounceTimer: null, // ⏱️ Variável para controlar o tempo do Live Update

    init() {
        this.setupEventListeners();
        this.renderInventorySlots();
        console.log('✅ Procedural UI inicializada com Live Update');
    },

    setupEventListeners() {
        // Voltar ao editor
        document.getElementById('backToEditor')?.addEventListener('click', () => {
            if (ProceduralEngine.stats.blocks > 0 && confirm('Voltar ao editor principal? (mudanças não salvas serão perdidas)')) {
                window.location.href = 'Voxel_genesis_ai_v9.html';
            } else if (ProceduralEngine.stats.blocks === 0) {
                 window.location.href = 'Voxel_genesis_ai_v9.html';
            }
        });

        // Toolbar buttons
        document.getElementById('btnRegenerate')?.addEventListener('click', () => {
            this.regenerate();
        });

        document.getElementById('btnRandomize')?.addEventListener('click', () => {
            this.randomizeParams();
        });

        document.getElementById('btnFullscreen')?.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('btnResetCamera')?.addEventListener('click', () => {
            ProceduralEngine.resetCamera();
        });

        // Exportação
        document.getElementById('btnExport')?.addEventListener('click', () => {
            this.exportToEditor();
        });
        
        document.getElementById('btnDownloadOBJ')?.addEventListener('click', () => {
             ProceduralEngine.exportOBJ();
        });
        
        // --- CONTROLES GERAIS (Atomização e Grid) ---
        
        // Grid Toggle
        const gridCheck = document.getElementById('showGrid');
        if (gridCheck) {
            gridCheck.addEventListener('change', (e) => {
                ProceduralEngine.toggleGrid(e.target.checked);
            });
        }

        // Atomização (Escala Global) com Live Update
        const scaleInput = document.getElementById('masterBlockScale');
        if (scaleInput) {
            scaleInput.addEventListener('input', (e) => {
                // Atualiza Label
                const display = e.target.parentElement.querySelector('.val-display') || 
                                document.getElementById('masterBlockScaleVal');
                if (display) display.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
                
                // Dispara Live Update se já houver algo gerado
                if (ProceduralEngine.generatedBlocks.length > 0) {
                    this.triggerLiveUpdate();
                }
            });
        }
        
        // Tipo de Bloco Global (Cubo, Esfera, etc)
        const typeSelect = document.getElementById('masterBlockType');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                if (ProceduralEngine.generatedBlocks.length > 0) {
                    this.regenerate(); // Select não precisa de debounce, é clique único
                }
            });
        }
    },

    // 🚀 O SEGREDO DO LIVE UPDATE: DEBOUNCE
    triggerLiveUpdate() {
        // Cancela o timer anterior se o usuário ainda estiver mexendo
        if (this.debounceTimer) clearTimeout(this.debounceTimer);

        // Agenda uma nova geração para daqui a 300ms
        this.debounceTimer = setTimeout(() => {
            this.regenerate();
        }, 300);
    },

    renderInventorySlots() {
        const grid = document.getElementById('inventoryGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // Pega lista de generators da Engine (que lê do ShapeRegistry)
        const categories = ProceduralEngine.categoryMap;
        
        // Para cada categoria
        Object.entries(categories).forEach(([catName, shapeIds]) => {
            shapeIds.forEach(shapeId => {
                const config = ProceduralEngine.getGeneratorConfig(shapeId);
                if (!config) return;

                const slot = document.createElement('div');
                slot.className = 'inv-slot';
                slot.dataset.category = catName;
                slot.dataset.id = shapeId;
                
                slot.innerHTML = `
                    <div class="icon">${config.icon}</div>
                    <div class="name">${config.name}</div>
                `;

                slot.addEventListener('click', () => {
                    // Remove active de todos
                    document.querySelectorAll('.inv-slot').forEach(s => s.classList.remove('active'));
                    slot.classList.add('active');
                    this.selectGenerator(shapeId);
                });

                grid.appendChild(slot);
            });
        });
        
        // Listener de Tabs de Categoria
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                const cat = e.currentTarget.dataset.category;
                this.filterInventory(cat);
            });
        });
        
        // Listener de Busca
        document.getElementById('searchGenerators')?.addEventListener('input', (e) => {
            this.filterInventory(this.currentCategory, e.target.value);
        });
    },

    filterInventory(category, searchTerm = '') {
        this.currentCategory = category;
        const slots = document.querySelectorAll('.inv-slot');
        
        slots.forEach(slot => {
            const slotCat = slot.dataset.category;
            const name = slot.querySelector('.name').textContent.toLowerCase();
            const term = searchTerm.toLowerCase();
            
            const matchCat = category === 'all' || slotCat === category;
            const matchSearch = name.includes(term);
            
            slot.style.display = (matchCat && matchSearch) ? 'flex' : 'none';
        });
    },

    selectGenerator(shapeId) {
        this.selectedGenerator = shapeId;
        const config = ProceduralEngine.getGeneratorConfig(shapeId);
        
        // Atualiza título do painel de controle
        const titleEl = document.getElementById('controlsTitle');
        if(titleEl) titleEl.innerHTML = `${config.icon} ${config.name}`;
        
        this.renderGeneratorParams(config);
        
        // Gera automaticamente ao selecionar (Primeira vez)
        this.regenerate();
    },

    renderGeneratorParams(config) {
        const container = document.getElementById('paramsContainer');
        if (!container) return;
        
        container.innerHTML = '';

        if (!config.params || Object.keys(config.params).length === 0) {
            container.innerHTML = '<div class="presets-empty"><p>Sem parâmetros configuráveis</p></div>';
            return;
        }

        Object.entries(config.params).forEach(([key, param]) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'param-group';
            
            // Checkbox é diferente de Range
            if (param.type === 'checkbox') {
                wrapper.className += ' checkbox-group'; // Classe CSS sugerida para alinhar
                wrapper.innerHTML = `
                    <label>${param.label}</label>
                    <input type="checkbox" id="p_${key}" ${param.default ? 'checked' : ''}>
                `;
                
                // Listener para Checkbox
                const checkbox = wrapper.querySelector('input');
                checkbox.addEventListener('change', () => {
                     this.triggerLiveUpdate(); // 🔥 LIVE UPDATE
                });

            } else {
                // Range Slider (Padrão)
                wrapper.innerHTML = `
                    <div class="param-header">
                        <label>${param.label}</label>
                        <span class="val-display">${param.default}</span>
                    </div>
                    <input type="range" id="p_${key}" class="rpg-slider" 
                        min="${param.min}" max="${param.max}" value="${param.default}" step="${param.step || 1}">
                `;

                // Listener para Slider
                const input = wrapper.querySelector('input');
                const display = wrapper.querySelector('.val-display');

                input.addEventListener('input', (e) => {
                    display.textContent = e.target.value;
                    this.triggerLiveUpdate(); // 🔥 LIVE UPDATE
                });
            }

            container.appendChild(wrapper);
        });
    },

    getParamsFromUI() {
        const params = {};
        const config = ProceduralEngine.getGeneratorConfig(this.selectedGenerator);
        
        if (config && config.params) {
            Object.keys(config.params).forEach(key => {
                const el = document.getElementById(`p_${key}`);
                if (el) {
                    if (el.type === 'checkbox') {
                        params[key] = el.checked;
                    } else {
                        params[key] = parseFloat(el.value);
                    }
                }
            });
        }
        return params;
    },

    regenerate() {
        if (this.selectedGenerator) {
            const params = this.getParamsFromUI();
            ProceduralEngine.generate(this.selectedGenerator, params);
        }
    },

    randomizeParams() {
        if (!this.selectedGenerator) return;
        
        const config = ProceduralEngine.getGeneratorConfig(this.selectedGenerator);
        if (!config || !config.params) return;

        Object.entries(config.params).forEach(([key, param]) => {
            const el = document.getElementById(`p_${key}`);
            if (el) {
                if (el.type === 'checkbox') {
                    el.checked = Math.random() > 0.5;
                } else {
                    const min = param.min;
                    const max = param.max;
                    // Gera valor aleatório respeitando o step
                    const step = param.step || 1;
                    const randomVal = Math.floor(Math.random() * ((max - min) / step + 1)) * step + min;
                    el.value = randomVal;
                    
                    // Atualiza display visual
                    const display = el.parentElement.querySelector('.val-display');
                    if (display) display.textContent = randomVal;
                }
            }
        });

        this.regenerate(); // Randomizar gera imediatamente, sem debounce
    },

    toggleFullscreen() {
        const canvas = document.getElementById('previewCanvas');
        if (!document.fullscreenElement) {
            canvas.parentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    },

    exportToEditor() {
        if (ProceduralEngine.stats.blocks === 0) {
            ProceduralEngine.showToast('Nada para exportar', 'error');
            return;
        }

        const data = {
            blocks: ProceduralEngine.generatedBlocks.map(mesh => ({
                x: mesh.position.x,
                y: mesh.position.y,
                z: mesh.position.z,
                color: '#' + mesh.material.color.getHexString(),
                type: 'cube' // Aqui poderia pegar o tipo real se salvo no mesh.userData
            })),
            timestamp: Date.now()
        };

        localStorage.setItem('proceduralExport', JSON.stringify(data));
        ProceduralEngine.showToast('✅ Pronto! Voltando ao editor...', 'success');
        
        setTimeout(() => {
             window.location.href = 'Voxel_genesis_ai_v9.html';
        }, 800);
    }
};

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
    ProceduralUI.init();
});