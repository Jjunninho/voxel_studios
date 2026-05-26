/* ========================================
   VOXEL GENESIS - PROCEDURAL UI
   Gerenciamento de interface e interações
========================================= */

const ProceduralUI = {
    currentCategory: 'all',
    currentSubcategory: null,
    selectedGenerator: null,

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

        // Toolbar buttons
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
                this.switchSubcategory(subcat);
            });
        });

        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F5') {
                e.preventDefault();
                this.regenerate();
            } else if (e.key === 'r' || e.key === 'R') {
                this.randomizeParams();
            }	
        });
		
		// --- CORREÇÃO: CONTROLES DE GRID ---
        const gridCheck = document.getElementById('showGrid'); // Verifique se o ID no HTML é este
        if (gridCheck) {
            gridCheck.addEventListener('change', (e) => {
                ProceduralEngine.toggleGrid(e.target.checked);
            });
        }

        // --- CORREÇÃO: ATOMIZAÇÃO (Feedback Visual dos Sliders) ---
        // Atualiza o número ao lado do slider quando você mexe
        const scaleInput = document.getElementById('masterBlockScale');
        if (scaleInput) {
            scaleInput.addEventListener('input', (e) => {
                // Procura o span com a classe val-display vizinho ou próximo
                // Ajuste o seletor conforme seu HTML exato
                const display = e.target.parentElement.querySelector('.val-display') || 
                                document.getElementById('masterBlockScaleVal');
                
                if (display) display.textContent = `${e.target.value}x`;
            });
        }
    },

    renderInventorySlots() {
        const grid = document.getElementById('generatorsGrid');
        
        // Adicionar event listeners aos slots
        grid.querySelectorAll('.inventory-slot:not(.empty)').forEach(slot => {
            slot.addEventListener('click', () => {
                const shapeId = slot.dataset.shape;
                this.selectGenerator(shapeId, slot);
            });
        });
    },

    selectGenerator(shapeId, slotElement) {
        // Verificar se é fallback
        if (slotElement.classList.contains('fallback')) {
            ProceduralEngine.showToast(`🚧 "${shapeId}" em desenvolvimento! Aguarde futuras atualizações.`, 'info');
            return;
        }

        // Obter configuração do shape via engine
        const generator = ProceduralEngine.getGeneratorConfig(shapeId);
        
        if (!generator) {
            console.warn('Shape não encontrada no ShapeRegistry:', shapeId);
            ProceduralEngine.showToast(`Shape "${shapeId}" não disponível`, 'info');
            return;
        }

        this.selectedGenerator = shapeId;

        // Atualizar UI
        document.querySelectorAll('.inventory-slot').forEach(s => s.classList.remove('selected'));
        slotElement.classList.add('selected');

        // Atualizar nome no header
        document.getElementById('generatorName').textContent = generator.name;

        // Renderizar parâmetros
        this.renderParams(generator);

        // Gerar preview inicial com parâmetros padrão
        const defaultParams = this.getDefaultParams(generator);
        ProceduralEngine.generate(shapeId, defaultParams);
    },

    renderParams(generator) {
        const container = document.getElementById('paramsContainer');
        const placeholder = document.getElementById('noParamsPlaceholder');

        placeholder.classList.add('hidden');
        
        // Limpar parâmetros anteriores
        Array.from(container.children).forEach(child => {
            if (!child.classList.contains('no-params')) {
                child.remove();
            }
        });

        if (!generator.params || Object.keys(generator.params).length === 0) {
            placeholder.classList.remove('hidden');
            return;
        }

        // Agrupar parâmetros por tipo
        const groups = {
            dimensions: [],
            style: [],
            details: []
        };

        Object.entries(generator.params).forEach(([key, param]) => {
            if (['width', 'height', 'depth', 'radius', 'size', 'baseSize'].includes(key)) {
                groups.dimensions.push({ key, ...param });
            } else if (param.type === 'checkbox') {
                groups.details.push({ key, ...param });
            } else {
                groups.style.push({ key, ...param });
            }
        });

        // Renderizar grupos
        if (groups.dimensions.length > 0) {
            const group = this.createParamGroup('📏 Dimensões', groups.dimensions);
            container.appendChild(group);
        }

        if (groups.style.length > 0) {
            const group = this.createParamGroup('🎨 Estilo', groups.style);
            container.appendChild(group);
        }

        if (groups.details.length > 0) {
            const group = this.createParamGroup('🔧 Detalhes', groups.details);
            container.appendChild(group);
        }
    },

    createParamGroup(title, params) {
        const group = document.createElement('div');
        group.className = 'rpg-group';

        const header = document.createElement('h4');
        header.className = 'group-title';
        header.textContent = title;
        group.appendChild(header);

        params.forEach(param => {
            const control = this.createParamControl(param);
            group.appendChild(control);
        });

        return group;
    },

    createParamControl(param) {
        const control = document.createElement('div');
        control.className = 'rpg-control';

        if (param.type === 'checkbox') {
            // Checkbox
            const label = document.createElement('label');
            label.className = 'rpg-checkbox';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = param.default || false;
            input.dataset.param = param.key;

            const checkmark = document.createElement('span');
            checkmark.className = 'checkmark';

            const text = document.createTextNode(param.label);

            label.appendChild(input);
            label.appendChild(checkmark);
            label.appendChild(text);

            input.addEventListener('change', () => this.onParamChange());

            control.appendChild(label);

        } else if (param.type === 'select') {
            // Select dropdown
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

            select.addEventListener('change', () => this.onParamChange());
            control.appendChild(select);

        } else {
            // Range slider (default)
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
            
            if (input.type === 'checkbox') {
                params[key] = input.checked;
            } else if (input.type === 'range') {
                params[key] = parseFloat(input.value);
            } else {
                params[key] = input.value;
            }
        });

        return params;
    },

    onParamChange() {
        if (!this.selectedGenerator) return;

        const params = this.getCurrentParams();
        ProceduralEngine.generate(this.selectedGenerator, params);
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

        // Salvar no localStorage
        const presets = JSON.parse(localStorage.getItem('proceduralPresets') || '[]');
        presets.push(preset);
        localStorage.setItem('proceduralPresets', JSON.stringify(presets));

        this.renderPresets();
        ProceduralEngine.showToast('💾 Preset salvo!', 'success');
    },

    renderPresets() {
        const list = document.getElementById('presetsList');
        const empty = list.querySelector('.presets-empty');
        
        const presets = JSON.parse(localStorage.getItem('proceduralPresets') || '[]');

        if (presets.length === 0) {
            if (empty) empty.classList.remove('hidden');
            return;
        }

        if (empty) empty.classList.add('hidden');

        // Limpar presets antigos
        list.querySelectorAll('.preset-item').forEach(item => item.remove());

        presets.forEach((preset, index) => {
            const item = document.createElement('div');
            item.className = 'preset-item';
            
            const generator = ProceduralEngine.getGeneratorConfig(preset.generator);
            const icon = generator ? generator.icon : '📦';
            
            item.innerHTML = `
                <span>${icon} ${preset.name}</span>
                <button class="mini-btn">Carregar</button>
            `;

            item.querySelector('button').addEventListener('click', () => {
                this.loadPreset(preset);
            });

            list.insertBefore(item, empty);
        });
    },

    loadPreset(preset) {
        // Selecionar o gerador
        const slot = document.querySelector(`[data-shape="${preset.generator}"]`);
        if (slot) {
            this.selectGenerator(preset.generator, slot);

            // Aguardar renderização dos parâmetros
            setTimeout(() => {
                // Aplicar parâmetros
                Object.entries(preset.params).forEach(([key, value]) => {
                    const input = document.querySelector(`[data-param="${key}"]`);
                    if (input) {
                        if (input.type === 'checkbox') {
                            input.checked = value;
                        } else {
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
        this.currentSubcategory = category + '-all'; // Auto-seleciona "Tudo"

        // Atualizar tabs principais
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });

        // Mostrar/ocultar painéis de subcategoria
        document.querySelectorAll('.subcat-panel').forEach(panel => {
            if (panel.dataset.parent === category) {
                panel.classList.remove('hidden');
                // Resetar para "Tudo" ativo
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

        // Atualizar botões ativos
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
            
            // Subcategoria: se termina com "-all" ou não há subcategoria ativa, mostra tudo da categoria
            const matchesSubcat = !this.currentSubcategory || 
                                  this.currentSubcategory.endsWith('-all') || 
                                  subcat === this.currentSubcategory ||
                                  !subcat; // Slots sem subcategoria sempre aparecem
            
            const matchesSearch = !term || title.includes(term) || shape.includes(term);

            slot.style.display = (matchesCategory && matchesSubcat && matchesSearch) ? 'flex' : 'none';
        });
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

        // Salvar no localStorage para o editor principal ler
        const data = {
            blocks: ProceduralEngine.generatedBlocks.map(mesh => ({
                x: mesh.position.x,
                y: mesh.position.y,
                z: mesh.position.z,
                color: '#' + mesh.material.color.getHexString(),
                type: 'cube'
            })),
            timestamp: Date.now()
        };

        localStorage.setItem('proceduralExport', JSON.stringify(data));

        ProceduralEngine.showToast('✅ Pronto para adicionar ao mundo!', 'success');
        
        setTimeout(() => {
            if (confirm('Voltar ao editor para adicionar?')) {
                window.location.href = 'Voxel_genesis_ai_v9.html';
            }
        }, 1000);
    }
};

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
    ProceduralUI.init();
    ProceduralUI.renderPresets();
});
