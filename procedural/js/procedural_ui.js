/* ========================================
   VOXEL GENESIS - PROCEDURAL UI
   Gerenciamento de interface e interações
   
   VERSÃO: v2.5 - Multi-Objetos & Histórico
   MODIFICAÇÕES:
   ✅ Controles de Multi-Objeto (Add, Delete, Clear)
   ✅ Histórico (Undo/Redo) e Clipboard (Copy/Paste)
   ✅ Exportação consolidada (Mundo + Preview)
========================================= */

const ProceduralUI = {
    currentCategory: 'all',
    currentSubcategory: null,
    selectedGenerator: null,
    debounceTimer: null, // ⏱️ Timer para Live Update suave

    init() {
        this.setupEventListeners();
        this.renderInventorySlots();
        console.log('✅ Procedural UI inicializada');
    },

    setupEventListeners() {
        // Voltar ao editor
        document.getElementById('backToEditor').addEventListener('click', () => {
            if (confirm('Voltar ao editor principal? (mudanças não salvas serão perdidas)')) {
                window.location.href = 'Voxel_genesis_ai_v9.html';
            }
        });

        // ==========================================
        // 🔥 NOVOS CONTROLES DE MULTI-OBJETO
        // ==========================================

        // Grupo: Histórico & Clipboard
        const btnUndo = document.getElementById('btnUndo');
        if(btnUndo) btnUndo.addEventListener('click', () => ProceduralEngine.undo());

        const btnRedo = document.getElementById('btnRedo');
        if(btnRedo) btnRedo.addEventListener('click', () => ProceduralEngine.redo());

        const btnCopy = document.getElementById('btnCopy');
        if(btnCopy) btnCopy.addEventListener('click', () => ProceduralEngine.copyToClipboard());

        const btnPaste = document.getElementById('btnPaste');
        if(btnPaste) btnPaste.addEventListener('click', () => ProceduralEngine.pasteFromClipboard());

        // Grupo: Edição Crítica
        const btnAdd = document.getElementById('btnAdd'); // O botão "+"
        if(btnAdd) btnAdd.addEventListener('click', () => {
            ProceduralEngine.commitPreview(); // Adiciona ao mundo
        });

        const btnDelete = document.getElementById('btnDelete'); // Lixeira
        if(btnDelete) btnDelete.addEventListener('click', () => ProceduralEngine.deletePreview());

        const btnClear = document.getElementById('btnClear'); // Vassoura
        if(btnClear) btnClear.addEventListener('click', () => {
            if(confirm('Tem certeza? Isso apagará TODA a cena.')) {
                ProceduralEngine.clearAll();
            }
        });

        // Grupo: Confirmação
        const btnConfirm = document.getElementById('btnConfirm');
        if(btnConfirm) btnConfirm.addEventListener('click', () => {
            ProceduralEngine.commitPreview();
            document.getElementById('noParamsPlaceholder').classList.remove('hidden'); // "Fecha" edição
            document.getElementById('paramsContainer').innerHTML = '';
        });

        const btnCancel = document.getElementById('btnCancel');
        if(btnCancel) btnCancel.addEventListener('click', () => {
            ProceduralEngine.deletePreview(); // Cancela o que estava fazendo
            document.getElementById('noParamsPlaceholder').classList.remove('hidden');
            document.getElementById('paramsContainer').innerHTML = '';
        });

        // ==========================================
        // FERRAMENTAS ORIGINAIS
        // ==========================================

        document.getElementById('btnRegenerate').addEventListener('click', () => {
            this.regenerate();
        });

        document.getElementById('btnRandomize').addEventListener('click', () => {
            this.randomizeParams();
        });

        document.getElementById('btnFullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        document.getElementById('btnResetCamera').addEventListener('click', () => {
            ProceduralEngine.resetCamera();
        });

        // Exportação
        document.getElementById('btnExport').addEventListener('click', () => {
            this.exportToEditor();
        });

        document.getElementById('btnDownloadJSON').addEventListener('click', () => {
            ProceduralEngine.exportJSON();
        });

        document.getElementById('btnDownloadOBJ').addEventListener('click', () => {
            ProceduralEngine.exportOBJ();
        });

        // Parâmetros
        document.getElementById('btnResetParams').addEventListener('click', () => {
            this.resetParams();
        });

        document.getElementById('btnSavePreset').addEventListener('click', () => {
            this.savePreset();
        });

        // Busca
        document.getElementById('searchGenerators').addEventListener('input', (e) => {
            this.filterGenerators(e.target.value);
        });

        // Tabs de categoria
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchCategory(e.currentTarget.dataset.category);
            });
        });

        // Botões de filtro de subcategoria
        document.querySelectorAll('.subcat-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const subcat = e.currentTarget.dataset.subcat;
                // Removida linha bugada: const slotSubcats = slot.dataset.subcat || "";
                this.switchSubcategory(subcat);
            });
        });

        // ==========================================
        // 🔥 ATALHOS DE TECLADO EXPANDIDOS
        // ==========================================
        document.addEventListener('keydown', (e) => {
            // F5 (Regenerate)
            if (e.key === 'F5') {
                e.preventDefault();
                this.regenerate();
            } 
            // R (Randomize)
            else if (e.key === 'r' || e.key === 'R') {
                if(document.activeElement.tagName !== 'INPUT') {
                    this.randomizeParams();
                }
            }
            // Ctrl+Z (Undo)
            else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                ProceduralEngine.undo();
            }
            // Ctrl+Y (Redo)
            else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                ProceduralEngine.redo();
            }
            // Delete (Lixeira)
            else if (e.key === 'Delete') {
                ProceduralEngine.deletePreview();
            }
            // Enter (Confirmar)
            else if (e.key === 'Enter' && !e.ctrlKey) {
                if(document.activeElement.tagName !== 'INPUT') {
                    ProceduralEngine.commitPreview();
                }
            }
        });
        
        // Controles de Grid
        const gridCheck = document.getElementById('showGrid');
        if (gridCheck) {
            gridCheck.addEventListener('change', (e) => {
                ProceduralEngine.toggleGrid(e.target.checked);
            });
        }

        // Atomização (Feedback Visual dos Sliders)
        const scaleInput = document.getElementById('masterBlockScale');
        if (scaleInput) {
            scaleInput.addEventListener('input', (e) => {
                const display = e.target.parentElement.querySelector('.val-display') || 
                                document.getElementById('masterBlockScaleVal');
                
                if (display) display.textContent = `${e.target.value}x`;
                
                // Live Update
                if (ProceduralEngine.previewGroup && ProceduralEngine.previewGroup.children.length > 0) {
                    this.triggerLiveUpdate();
                }
            });
        }
        
        // Tipo de Bloco Global
        const typeSelect = document.getElementById('masterBlockType');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                // Corrigido: previewGroup.children ao invés de previewBlocks
                if (ProceduralEngine.previewGroup && ProceduralEngine.previewGroup.children.length > 0) {
                    this.triggerLiveUpdate();
                }
            });
        }
    },

    renderInventorySlots() {
        const grid = document.getElementById('generatorsGrid');
        grid.querySelectorAll('.inventory-slot:not(.empty)').forEach(slot => {
            slot.addEventListener('click', () => {
                const shapeId = slot.dataset.shape;
                this.selectGenerator(shapeId, slot);
            });
        });
    },

    selectGenerator(shapeId, slotElement) {
        if (slotElement.classList.contains('fallback')) {
            ProceduralEngine.showToast(`🚧 "${shapeId}" em desenvolvimento!`, 'info');
            return;
        }

        const generator = ProceduralEngine.getGeneratorConfig(shapeId);
        
        if (!generator) {
            console.warn('Shape não encontrada:', shapeId);
            ProceduralEngine.showToast(`Shape "${shapeId}" não disponível`, 'info');
            return;
        }

        // 🔥 Se já houver um preview não confirmado, confirma ele antes de mudar? 
        // Ou deleta? No modelo RPG, substituir o preview atual é o padrão.
        // O Engine.generate já cuida de limpar o preview anterior.

        this.selectedGenerator = shapeId;

        // UI Updates
        document.querySelectorAll('.inventory-slot').forEach(s => s.classList.remove('selected'));
        slotElement.classList.add('selected');
        document.getElementById('generatorName').textContent = generator.name;

        this.renderParams(generator);

        const defaultParams = this.getDefaultParams(generator);
        ProceduralEngine.generate(shapeId, defaultParams);
    },

    renderParams(generator) {
        const container = document.getElementById('paramsContainer');
        const placeholder = document.getElementById('noParamsPlaceholder');

        placeholder.classList.add('hidden');
        
        Array.from(container.children).forEach(child => {
            if (!child.classList.contains('no-params')) child.remove();
        });

        if (!generator.params || Object.keys(generator.params).length === 0) {
            placeholder.classList.remove('hidden');
            return;
        }

        const groups = { dimensions: [], style: [], details: [] };

        Object.entries(generator.params).forEach(([key, param]) => {
            if (['width', 'height', 'depth', 'radius', 'size', 'baseSize'].includes(key)) {
                groups.dimensions.push({ key, ...param });
            } else if (param.type === 'checkbox') {
                groups.details.push({ key, ...param });
            } else {
                groups.style.push({ key, ...param });
            }
        });

        if (groups.dimensions.length > 0) container.appendChild(this.createParamGroup('📏 Dimensões', groups.dimensions));
        if (groups.style.length > 0) container.appendChild(this.createParamGroup('🎨 Estilo', groups.style));
        if (groups.details.length > 0) container.appendChild(this.createParamGroup('🔧 Detalhes', groups.details));
    },
    
    renderPresets() {
        const container = document.getElementById('presetsList');
        if (!container) return; 

        const presets = JSON.parse(localStorage.getItem('voxel_presets') || '{}');
        const list = Object.keys(presets);

        container.innerHTML = '';

        if (list.length === 0) {
            container.innerHTML = `<div class="presets-empty"><p>💭 Nenhum preset salvo</p><small>Use 💾 para salvar</small></div>`;
            return;
        }

        list.forEach(name => {
            const item = document.createElement('div');
            item.className = 'preset-item';
            item.innerHTML = `<span>${name}</span><button class="delete-preset" title="Excluir">×</button>`;
            
            item.addEventListener('click', (e) => {
                if(e.target.className !== 'delete-preset') this.loadPreset(name);
            });

            item.querySelector('.delete-preset').addEventListener('click', (e) => {
                e.stopPropagation();
                if(confirm(`Excluir preset "${name}"?`)) {
                    const current = JSON.parse(localStorage.getItem('voxel_presets'));
                    delete current[name];
                    localStorage.setItem('voxel_presets', JSON.stringify(current));
                    this.renderPresets();
                }
            });
            container.appendChild(item);
        });
    },

    createParamGroup(title, params) {
        const group = document.createElement('div');
        group.className = 'rpg-group';
        const header = document.createElement('h4');
        header.className = 'group-title';
        header.textContent = title;
        group.appendChild(header);
        params.forEach(param => group.appendChild(this.createParamControl(param)));
        return group;
    },

    createParamControl(param) {
        const control = document.createElement('div');
        control.className = 'rpg-control';

        if (param.type === 'checkbox') {
            const label = document.createElement('label');
            label.className = 'rpg-checkbox';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = param.default || false;
            input.dataset.param = param.key;
            const checkmark = document.createElement('span');
            checkmark.className = 'checkmark';
            const text = document.createTextNode(param.label);
            label.appendChild(input); label.appendChild(checkmark); label.appendChild(text);
            input.addEventListener('change', () => this.triggerLiveUpdate());
            control.appendChild(label);

        } else if (param.type === 'select') {
            const label = document.createElement('label');
            label.textContent = param.label;
            control.appendChild(label);
            const select = document.createElement('select');
            select.className = 'rpg-select';
            select.dataset.param = param.key;
            param.options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option.charAt(0).toUpperCase() + option.slice(1);
                if (option === param.default) opt.selected = true;
                select.appendChild(opt);
            });
            select.addEventListener('change', () => this.triggerLiveUpdate());
            control.appendChild(select);

        } else {
            const label = document.createElement('label');
            label.innerHTML = `${param.label} <span class="val-display" id="val_${param.key}">${param.default}</span>`;
            control.appendChild(label);
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'rpg-slider';
            slider.min = param.min;
            slider.max = param.max;
            slider.step = param.step || 1;
            slider.value = param.default;
            slider.dataset.param = param.key;
            slider.addEventListener('input', (e) => {
                document.getElementById(`val_${param.key}`).textContent = e.target.value;
                this.triggerLiveUpdate();
            });
            slider.addEventListener('change', () => this.onParamChange());
            control.appendChild(slider);
        }
        return control;
    },

    getDefaultParams(generator) {
        const params = {};
        Object.entries(generator.params).forEach(([key, param]) => {
            params[key] = param.default;
        });
        return params;
    },

    getCurrentParams() {
        const params = {};
        document.querySelectorAll('[data-param]').forEach(input => {
            const key = input.dataset.param;
            if (input.type === 'checkbox') params[key] = input.checked;
            else if (input.type === 'range') params[key] = parseFloat(input.value);
            else params[key] = input.value;
        });
        return params;
    },

    onParamChange() {
        if (!this.selectedGenerator) return;
        const params = this.getCurrentParams();
        ProceduralEngine.generate(this.selectedGenerator, params);
    },

    triggerLiveUpdate() {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.onParamChange();
        }, 300);
    },

    regenerate() {
        if (!this.selectedGenerator) {
            ProceduralEngine.showToast('Selecione um gerador primeiro', 'info');
            return;
        }
        const params = this.getCurrentParams();
        ProceduralEngine.generate(this.selectedGenerator, params);
        ProceduralEngine.showToast('🔨 Reforgado!', 'success');
    },

    randomizeParams() {
        if (!this.selectedGenerator) return;
        const generator = ProceduralEngine.getGeneratorConfig(this.selectedGenerator);
        if (!generator) return;

        document.querySelectorAll('[data-param]').forEach(input => {
            const key = input.dataset.param;
            const param = generator.params[key];
            if (!param) return;

            if (input.type === 'checkbox') {
                input.checked = Math.random() > 0.5;
            } else if (input.type === 'range') {
                const range = param.max - param.min;
                const random = param.min + Math.random() * range;
                const rounded = Math.round(random / param.step) * param.step;
                input.value = rounded;
                const display = document.getElementById(`val_${key}`);
                if (display) display.textContent = rounded;
            }
        });
        this.onParamChange();
        ProceduralEngine.showToast('🎲 Dados rolados!', 'success');
    },

    resetParams() {
        if (!this.selectedGenerator) return;
        const generator = ProceduralEngine.getGeneratorConfig(this.selectedGenerator);
        if (!generator) return;

        document.querySelectorAll('[data-param]').forEach(input => {
            const key = input.dataset.param;
            const param = generator.params[key];
            if (!param) return;

            if (input.type === 'checkbox') {
                input.checked = param.default || false;
            } else if (input.type === 'range') {
                input.value = param.default;
                const display = document.getElementById(`val_${key}`);
                if (display) display.textContent = param.default;
            } else {
                input.value = param.default;
            }
        });
        this.onParamChange();
        ProceduralEngine.showToast('↺ Parâmetros resetados', 'info');
    },

    savePreset() {
        if (!this.selectedGenerator) return;
        const name = prompt('Nome do preset:');
        if (!name) return;
        const preset = {
            name: name,
            generator: this.selectedGenerator,
            params: this.getCurrentParams(),
            timestamp: Date.now()
        };
        const presets = JSON.parse(localStorage.getItem('proceduralPresets') || '[]');
        presets.push(preset);
        localStorage.setItem('proceduralPresets', JSON.stringify(presets));
        this.renderPresets();
        ProceduralEngine.showToast('💾 Preset salvo!', 'success');
    },

    loadPreset(preset) {
        const slot = document.querySelector(`[data-shape="${preset.generator}"]`);
        if (slot) {
            this.selectGenerator(preset.generator, slot);
            setTimeout(() => {
                Object.entries(preset.params).forEach(([key, value]) => {
                    const input = document.querySelector(`[data-param="${key}"]`);
                    if (input) {
                        if (input.type === 'checkbox') input.checked = value;
                        else {
                            input.value = value;
                            const display = document.getElementById(`val_${key}`);
                            if (display) display.textContent = value;
                        }
                    }
                });
                this.onParamChange();
                ProceduralEngine.showToast('📜 Preset carregado!', 'success');
            }, 100);
        }
    },

    switchCategory(category) {
        this.currentCategory = category;
        this.currentSubcategory = category + '-all';
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });
        document.querySelectorAll('.subcat-panel').forEach(panel => {
            if (panel.dataset.parent === category) {
                panel.classList.remove('hidden');
                panel.querySelectorAll('.subcat-filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.subcat.endsWith('-all'));
                });
            } else {
                panel.classList.add('hidden');
            }
        });
        this.filterGenerators();
    },

    switchSubcategory(subcat) {
        this.currentSubcategory = subcat;
        const parentCategory = subcat.split('-')[0];
        document.querySelectorAll(`.subcat-panel[data-parent*="${parentCategory}"] .subcat-filter-btn`).forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subcat === subcat);
        });
        this.filterGenerators();
    },

    filterGenerators(searchTerm = '') {
        const term = searchTerm.toLowerCase();
        const slots = document.querySelectorAll('.inventory-slot:not(.empty)');
        slots.forEach(slot => {
            const category = slot.dataset.category;
            const subcat = slot.dataset.subcat || '';
            const shape = slot.dataset.shape || '';
            const title = slot.getAttribute('title')?.toLowerCase() || '';
            const matchesCategory = this.currentCategory === 'all' || category === this.currentCategory;
            const matchesSubcat = !this.currentSubcategory || 
                                  this.currentSubcategory.endsWith('-all') || 
                                  subcat === this.currentSubcategory ||
                                  !subcat;
            const matchesSearch = !term || title.includes(term) || shape.includes(term);
            slot.style.display = (matchesCategory && matchesSubcat && matchesSearch) ? 'flex' : 'none';
        });
    },
    
    toggleFullscreen() {
        const canvas = document.getElementById('previewCanvas');
        if (!document.fullscreenElement) canvas.parentElement.requestFullscreen();
        else document.exitFullscreen();
    },

    // 🔥 ATUALIZADA: Exportar TUDO (Mundo + Preview)
    exportToEditor() {
        // Usa o método getAllBlocksFlat da engine que já serializa corretamente
        const allBlocks = ProceduralEngine.getAllBlocksFlat();

        if (allBlocks.length === 0) {
            ProceduralEngine.showToast('Nada para exportar', 'error');
            return;
        }

        const data = {
            textureRecipe: null, 
            customColors: [],
            blocks: allBlocks, // Já está serializado corretamente
            timestamp: Date.now()
        };

        localStorage.setItem('proceduralExport', JSON.stringify(data));
        ProceduralEngine.showToast('✅ Dados enviados para o Editor!', 'success');
        
        setTimeout(() => {
            if (confirm('Ir para o Editor Principal agora?')) {
                window.location.href = 'Voxel_genesis_ai_v9.html';
            }
        }, 800);
    }
};

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
    ProceduralUI.init();
    ProceduralUI.renderPresets();
});