// =============================================================================
// VOXEL GENESIS - CAMERA PROJECTION UI
// =============================================================================

const CameraProjectionUI = {
    isOpen: false,
    currentStep: 'upload',
    originalFilename: 'texture',
    modal: null,
    uploadZone: null,
    pointsStatus: null,
    
    init() {
        if (document.getElementById('cameraProjectionModal')) return;
        this.createModal();
        this.setupEventListeners();
        console.log('✅ Camera Projection UI inicializada');
    },
    
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'cameraProjectionModal';
        modal.className = 'camera-modal hidden';
        modal.innerHTML = `
            <div class="camera-modal-overlay" onclick="CameraProjectionUI.close()"></div>
            <div class="camera-modal-content terraria-panel">
                <div class="camera-modal-header">
                    <h2>📸 Projeção de Câmera (Auto-Analysis)</h2>
                    <button class="modal-close-btn" onclick="CameraProjectionUI.close()">✖</button>
                </div>
                <div class="camera-steps">
                    <div class="step active" data-step="upload"><span class="step-number">1</span><span class="step-label">Foto</span></div>
                    <div class="step-arrow">→</div>
                    <div class="step" data-step="select"><span class="step-number">2</span><span class="step-label">Pontos</span></div>
                    <div class="step-arrow">→</div>
                    <div class="step" data-step="preview"><span class="step-number">3</span><span class="step-label">Gerar</span></div>
                </div>
                <div class="camera-modal-body">
                    <div id="loadingOverlay" class="hidden" style="position:absolute; inset:0; background:rgba(0,0,0,0.85); z-index:50; display:none; align-items:center; justify-content:center; flex-direction:column;">
                        <div class="pixel-spinner"></div>
                        <p style="margin-top:15px; color:#ffcc00; font-size:20px;">Analisando parâmetros...</p>
                    </div>
                    <div id="uploadStep" class="camera-step-content active">
                        <div class="upload-zone" id="uploadZone">
                            <div class="upload-icon">📷</div>
                            <h3>Arraste foto ou clique</h3>
                            <input type="file" id="photoInput" accept="image/*" hidden>
                        </div>
                    </div>
                    <div id="selectStep" class="camera-step-content">
                        <div class="instructions-panel"><p>Marque os 4 cantos.</p></div>
                        <div class="canvas-container" id="canvasContainer"><canvas id="sourceCanvas"></canvas></div>
                        <div class="points-controls">
                            <button class="rpg-btn red" onclick="CameraProjectionUI.removeLastPoint()">↶ Voltar</button>
                            <button class="rpg-btn blue" onclick="CameraProjectionUI.resetPoints()">↺ Reset</button>
                        </div>
                    </div>
                    <div id="previewStep" class="camera-step-content">
                        <div class="preview-comparison">
                            <div class="preview-before"><h4>Original</h4><canvas id="previewOriginal"></canvas></div>
                            <div class="preview-arrow">→</div>
                            <div class="preview-after"><h4>Corrigida</h4><canvas id="previewCorrected"></canvas></div>
                        </div>
                        <div class="preview-info" style="text-align: center;">
                            <p>✅ Parâmetros matemáticos calculados!</p>
                            <p>🎨 Paleta extraída: <span id="palettePreview"></span></p>
                        </div>
                    </div>
                </div>
                <div class="camera-modal-footer">
                    <button class="rpg-btn red" onclick="CameraProjectionUI.close()">Cancelar</button>
                    <div class="footer-spacer"></div>
                    <button id="btnBack" class="rpg-btn blue hidden" onclick="CameraProjectionUI.previousStep()">← Voltar</button>
                    <button id="btnNext" class="rpg-btn green hidden" onclick="CameraProjectionUI.nextStep()">Processar →</button>
                    <button id="btnApply" class="rpg-btn green hidden" onclick="CameraProjectionUI.saveAsTexture()">💾 Salvar JSON</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        this.modal = modal;
        this.uploadZone = document.getElementById('uploadZone');
        this.pointsStatus = document.getElementById('pointsStatus'); // (Opcional se removeu o status visual)
    },
    
    setupEventListeners() {
        const photoInput = document.getElementById('photoInput');
        this.uploadZone.addEventListener('click', () => photoInput.click());
        photoInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                this.originalFilename = e.target.files[0].name.replace(/\.[^/.]+$/, "");
                this.loadPhoto(e.target.files[0]);
            }
        });
        
        // Canvas click via delegation
        const container = document.getElementById('canvasContainer');
        if (container) {
            container.addEventListener('click', (e) => {
                if (this.currentStep !== 'select' || e.target.id !== 'sourceCanvas') return;
                const rect = e.target.getBoundingClientRect();
                const scaleX = e.target.width / rect.width;
                const scaleY = e.target.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                this.addPoint(x, y);
            });
        }
    },
    
    open() { if(!this.modal) this.createModal(); this.modal.classList.remove('hidden'); this.currentStep = 'upload'; this.updateUI(); },
    close() { this.modal.classList.add('hidden'); this.reset(); },
    
    async loadPhoto(file) {
        const loader = document.getElementById('loadingOverlay');
        try {
            loader.classList.remove('hidden'); loader.style.display = 'flex';
            await new Promise(r => setTimeout(r, 100));
            await CameraProjection.loadImage(file);
            
            const cvs = document.getElementById('sourceCanvas');
            cvs.width = CameraProjection.sourceCanvas.width;
            cvs.height = CameraProjection.sourceCanvas.height;
            cvs.getContext('2d').drawImage(CameraProjection.sourceCanvas, 0, 0);
            
            this.currentStep = 'select';
            this.updateUI();
        } catch (e) { console.error(e); alert('Erro ao carregar'); }
        finally { loader.style.display = 'none'; loader.classList.add('hidden'); }
    },
    
    addPoint(x, y) {
        const done = CameraProjection.addPoint(x, y);
        const cvs = document.getElementById('sourceCanvas');
        const ctx = cvs.getContext('2d');
        ctx.drawImage(CameraProjection.sourceCanvas, 0, 0); // Limpa e redesenha (já com pontos)
        
        // Opcional: Atualizar botão
        const btn = document.getElementById('btnNext');
        if (btn) btn.disabled = !done;
        
        if (done) this.showToast('4 pontos marcados! Clique em Processar.');
    },
    
    removeLastPoint() { CameraProjection.removeLastPoint(); this.refreshCanvas(); },
    resetPoints() { CameraProjection.resetPoints(); this.refreshCanvas(); },
    refreshCanvas() {
        const cvs = document.getElementById('sourceCanvas');
        cvs.getContext('2d').drawImage(CameraProjection.sourceCanvas, 0, 0);
        document.getElementById('btnNext').disabled = true;
    },
    
    processTransform() {
        const loader = document.getElementById('loadingOverlay');
        loader.classList.remove('hidden'); loader.style.display = 'flex';
        setTimeout(() => {
            try {
                const dataUrl = CameraProjection.warpPerspective();
                
                // Previews
                const prevOrig = document.getElementById('previewOriginal');
                const prevCorr = document.getElementById('previewCorrected');
                prevOrig.width = prevCorr.width = 256;
                prevOrig.height = prevCorr.height = 256;
                
                prevOrig.getContext('2d').drawImage(CameraProjection.sourceImage, 0,0, 256, 256);
                
                const img = new Image();
                img.onload = () => {
                    prevCorr.getContext('2d').drawImage(img, 0,0, 256, 256);
                    
                    // Mostrar cores extraídas na UI
                    const colors = CameraProjection.extractDominantColors(CameraProjection.outputCanvas);
                    const pal = document.getElementById('palettePreview');
                    pal.innerHTML = '';
                    colors.forEach(c => {
                        const s = document.createElement('span');
                        s.style.cssText = `display:inline-block;width:20px;height:20px;background:${c};border:1px solid #fff;margin-right:4px;`;
                        pal.appendChild(s);
                    });
                    
                    loader.style.display = 'none'; loader.classList.add('hidden');
                    this.currentStep = 'preview';
                    this.updateUI();
                };
                img.src = dataUrl;
                
            } catch (e) { console.error(e); }
        }, 50);
    },
    
    saveAsTexture() {
        try {
            // AQUI É A MÁGICA: Gera um JSON padrão, não um JSON de pixel
            const recipe = CameraProjection.generateTextureRecipe(this.originalFilename);
            
            // Download ou Salvar (dependendo do ambiente)
            const json = JSON.stringify(recipe, null, 2);
            const blob = new Blob([json], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.originalFilename + '_recipe.json';
            a.click();
            
            this.showToast('✅ Receita Procedural Gerada!', 'success');
            setTimeout(() => this.close(), 1000);
        } catch (e) { console.error(e); }
    },
    
    nextStep() {
        if (this.currentStep === 'upload') this.currentStep = 'select';
        else if (this.currentStep === 'select') this.processTransform();
        this.updateUI();
    },
    
    previousStep() {
        if (this.currentStep === 'select') { this.currentStep = 'upload'; this.resetPoints(); }
        else if (this.currentStep === 'preview') this.currentStep = 'select';
        this.updateUI();
    },
    
    updateUI() {
        document.querySelectorAll('.camera-step-content').forEach(el => el.classList.remove('active'));
        document.getElementById(this.currentStep + 'Step').classList.add('active');
        
        const backs = ['btnBack'];
        const nexts = ['btnNext'];
        const finals = ['btnApply', 'btnDownload'];
        
        const show = (ids) => ids.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
        const hide = (ids) => ids.forEach(id => document.getElementById(id)?.classList.add('hidden'));
        
        hide([...backs, ...nexts, ...finals]);
        
        if (this.currentStep === 'select') { show(backs); show(nexts); document.getElementById('btnNext').disabled = CameraProjection.points.length < 4; }
        else if (this.currentStep === 'preview') { show(backs); show(finals); }
        
        // Update steps visual
        document.querySelectorAll('.step').forEach(s => {
            s.classList.remove('active');
            if(s.dataset.step === this.currentStep) s.classList.add('active');
        });
    },
    
    reset() { this.currentStep = 'upload'; CameraProjection.points = []; this.updateUI(); },
    
    showToast(msg) {
        const t = document.createElement('div');
        t.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:5px;z-index:9999;border:1px solid #0f0;";
        t.innerText = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    }
};

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => CameraProjectionUI.init());