/* ========================================
   VOXEL GENESIS - PROCEDURAL UI V2
   Interface para Sistema Multi-Objeto
========================================= */

const ProceduralUI = {
    currentCategory: 'basic',
    
    init() {
        this.setupGeneratorList();
        this.setupControls();
        this.setupHistoryButtons();
        this.setupGhostControls();
        console.log('✅ Procedural UI V2 inicializado');
    },

    // ==================== LISTA DE GERADORES ====================
    setupGeneratorList() {
        const container = document.getElementById('generatorsList');
        if (!container) return;

        const shapes = this.getAllShapes();
        const grouped = this.groupByCategory(shapes);

        let html = '';
        for (const [category, items] of Object.entries(grouped)) {
            html += `
                <div class="category-group">
                    <div class="category-header">${this.getCategoryName(category)}</div>
                    <div class="generators-grid">
                        ${items.map(shape => this.createGeneratorCard(shape)).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        // Event listeners
        container.querySelectorAll('.generator-card').forEach(card => {
            card.addEventListener('click', () => {
                const shapeId = card.dataset.shape;
                this.selectGenerator(shapeId);
            });
        });
    },

    getAllShapes() {
        const registry = typeof ShapeRegistry !== 'undefined' ? ShapeRegistry : window.ShapeRegistry;
        if (!registry) return [];

        return Object.entries(registry).map(([id, shape]) => ({
            id,
            ...shape
        }));
    },

    groupByCategory(shapes) {
        const grouped = {};
        shapes.forEach(shape => {
            const cat = shape.category || 'basic';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(shape);
        });
        return grouped;
    },

    getCategoryName(cat) {
        const names = {
            'basic': '📦 Básicos',
            'architecture': '🏰 Arquitetura',
            'nature': '🌳 Natureza',
            'abstract': '🎨 Abstratos',
            'organic': '🧬 Orgânicos'
        };
        return names[cat] || cat;
    },

    createGeneratorCard(shape) {
        return `
            <div class="generator-card" data-shape="${shape.id}">
                <div class="generator-icon">${shape.icon || '📦'}</div>
                <div class="generator-name">${shape.name}</div>
            </div>
        `;
    },

    // ==================== SELEÇÃO DE GERADOR ====================
    selectGenerator(shapeId) {
        const shape = (typeof ShapeRegistry !== 'undefined' ? ShapeRegistry : window.ShapeRegistry)?.[shapeId];
        if (!shape) return;

        // Highlight card
        document.querySelectorAll('.generator-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-shape="${shapeId}"]`)?.classList.add('active');

        // Mostrar painel de parâmetros
        this.showParametersPanel(shapeId, shape);
    },

    showParametersPanel(shapeId, shape) {
        const panel = document.getElementById('parametersPanel');
        if (!panel) return;

        let html = `
            <div class="panel-header">
                <h3>${shape.icon} ${shape.name}</h3>
            </div>
        `;

        // Parâmetros da forma
        if (shape.params && shape.params.length > 0) {
            html += '<div class="params-section">';
            shape.params.forEach(param => {
                html += `
                    <div class="param-control">
                        <label>${param.label}</label>
                        <div class="param-input-group">
                            <input 
                                type="range" 
                                id="param_${param.name}"
                                min="${param.min || 1}"
                                max="${param.max || 20}"
                                value="${param.default || 5}"
                                step="1"
                            />
                            <span id="param_${param.name}_value">${param.default || 5}</span>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        // Botão de gerar
        html += `
            <div class="generate-section">
                <button class="btn-primary" onclick="ProceduralUI.generateShape('${shapeId}')">
                    👻 Criar Preview
                </button>
            </div>
        `;

        panel.innerHTML = html;

        // Event listeners para sliders
        if (shape.params) {
            shape.params.forEach(param => {
                const slider = document.getElementById(`param_${param.name}`);
                const display = document.getElementById(`param_${param.name}_value`);
                if (slider && display) {
                    slider.addEventListener('input', (e) => {
                        display.textContent = e.target.value;
                    });
                }
            });
        }
    },

    generateShape(shapeId) {
        const shape = (typeof ShapeRegistry !== 'undefined' ? ShapeRegistry : window.ShapeRegistry)?.[shapeId];
        if (!shape) return;

        const params = {};
        if (shape.params) {
            shape.params.forEach(param => {
                const input = document.getElementById(`param_${param.name}`);
                if (input) {
                    params[param.name] = parseInt(input.value);
                }
            });
        }

        ProceduralEngine.generate(shapeId, params);
    },

    // ==================== CONTROLES PRINCIPAIS ====================
    setupControls() {
        // Grid toggle
        const gridToggle = document.getElementById('toggleGrid');
        if (gridToggle) {
            gridToggle.addEventListener('change', (e) => {
                ProceduralEngine.toggleGrid(e.target.checked);
            });
        }

        // Reset câmera
        const resetCam = document.getElementById('btnResetCamera');
        if (resetCam) {
            resetCam.addEventListener('click', () => {
                ProceduralEngine.resetCamera();
            });
        }

        // Clear all
        const clearAll = document.getElementById('btnClearAll');
        if (clearAll) {
            clearAll.addEventListener('click', () => {
                ProceduralEngine.clearAll();
            });
        }

        // Export
        const exportJSON = document.getElementById('btnExportJSON');
        if (exportJSON) {
            exportJSON.addEventListener('click', () => {
                ProceduralEngine.exportJSON();
            });
        }

        const exportOBJ = document.getElementById('btnExportOBJ');
        if (exportOBJ) {
            exportOBJ.addEventListener('click', () => {
                ProceduralEngine.exportOBJ();
            });
        }
    },

    // ==================== HISTÓRICO ====================
    setupHistoryButtons() {
        const btnUndo = document.getElementById('btnUndo');
        const btnRedo = document.getElementById('btnRedo');

        if (btnUndo) {
            btnUndo.addEventListener('click', () => {
                ProceduralEngine.undo();
            });
        }

        if (btnRedo) {
            btnRedo.addEventListener('click', () => {
                ProceduralEngine.redo();
            });
        }

        // Copy/Paste
        const btnCopy = document.getElementById('btnCopy');
        const btnPaste = document.getElementById('btnPaste');

        if (btnCopy) {
            btnCopy.addEventListener('click', () => {
                ProceduralEngine.copySelected();
            });
        }

        if (btnPaste) {
            btnPaste.addEventListener('click', () => {
                ProceduralEngine.paste();
            });
        }
    },

    // ==================== CONTROLES DO GHOST ====================
    setupGhostControls() {
        // Posição
        const posX = document.getElementById('ghostPosX');
        const posY = document.getElementById('ghostPosY');
        const posZ = document.getElementById('ghostPosZ');
        const rotY = document.getElementById('ghostRotY');

        if (posX) {
            posX.addEventListener('change', (e) => {
                if (ProceduralEngine.ghost.active) {
                    ProceduralEngine.ghost.position.x = parseFloat(e.target.value);
                    ProceduralEngine.updateGhostPosition();
                }
            });
        }

        if (posY) {
            posY.addEventListener('change', (e) => {
                if (ProceduralEngine.ghost.active) {
                    ProceduralEngine.ghost.position.y = parseFloat(e.target.value);
                    ProceduralEngine.updateGhostPosition();
                }
            });
        }

        if (posZ) {
            posZ.addEventListener('change', (e) => {
                if (ProceduralEngine.ghost.active) {
                    ProceduralEngine.ghost.position.z = parseFloat(e.target.value);
                    ProceduralEngine.updateGhostPosition();
                }
            });
        }

        if (rotY) {
            rotY.addEventListener('input', (e) => {
                if (ProceduralEngine.ghost.active) {
                    ProceduralEngine.ghost.rotation.y = parseFloat(e.target.value) * Math.PI / 180;
                    ProceduralEngine.updateGhostRotation();
                }
            });
        }

        // Botões de confirmação/cancelamento
        const btnConfirm = document.getElementById('btnConfirmGhost');
        const btnCancel = document.getElementById('btnCancelGhost');

        if (btnConfirm) {
            btnConfirm.addEventListener('click', () => {
                ProceduralEngine.confirmGhost();
            });
        }

        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                ProceduralEngine.cancelGhost();
            });
        }
    }
};

// Auto-inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um frame para garantir que ShapeRegistry está carregado
    requestAnimationFrame(() => {
        ProceduralUI.init();
    });
});
