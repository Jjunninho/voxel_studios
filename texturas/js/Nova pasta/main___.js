// js/main.js
import { texturePresets } from './presets.js';
import { generateTextureFunction, applyEffect, blendTextures, getColor, calculateNormal } from './engine.js';
import { noise, hexToRgb, calculateImageVariance } from './utils.js';

// --- INICIALIZAÇÃO DO WORKER ---
const worker = new Worker('js/worker.js', { type: "module" });

// Elementos DOM
const generateBtn = document.getElementById('generateBtn');
const randomizeBtn = document.getElementById('randomizeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const downloadJsonBtn = document.getElementById('downloadJsonBtn');
const copyJsonBtn = document.getElementById('copyJsonBtn');
const randomSeedBtn = document.getElementById('randomSeedBtn');
const canvasContainer = document.getElementById('canvasContainer');
const previewCanvas = document.getElementById('previewCanvas');
const jsonPreview = document.getElementById('jsonPreview');
const fileSize = document.getElementById('fileSize');
const primaryTextureGrid = document.getElementById('primaryTextureGrid');
const secondaryTextureGrid = document.getElementById('secondaryTextureGrid');
const statusLabel = document.getElementById('statusLabel'); // Certifique-se de ter este ID no HTML ou use infoContainer

// Contexto do Canvas Principal
const ctx = previewCanvas.getContext('2d');

// Inputs
const inputs = {
    seed: document.getElementById('seed'),
    scale: document.getElementById('scale'),
    noiseAmount: document.getElementById('noiseAmount'),
    octaves: document.getElementById('octaves'),
    contrast: document.getElementById('contrast'),
    distortion: document.getElementById('distortion'),
    blendAmount: document.getElementById('blendAmount'),
    blendMode: document.getElementById('blendMode'),
    colorMode: document.getElementById('colorMode'),
    color1: document.getElementById('color1'),
    color2: document.getElementById('color2'),
    color3: document.getElementById('color3'),
    color4: document.getElementById('color4')
};

// Valores display
const displays = {
    scaleValue: document.getElementById('scaleValue'),
    noiseValue: document.getElementById('noiseValue'),
    octavesValue: document.getElementById('octavesValue'),
    contrastValue: document.getElementById('contrastValue'),
    distortionValue: document.getElementById('distortionValue'),
    blendAmountValue: document.getElementById('blendAmountValue')
};

// State
let currentTextures = { primary: 'stone', secondary: 'wood' };
let activeEffects = new Set();
let proceduralRecipe = null;
let currentRenderMode = 'texture';
let isTiling = false;
let isGenerating = false;
const VARIANCE_THRESHOLD = 5;

// Expor função setRenderMode para o HTML (janela global)
window.setRenderMode = function(mode) {
    currentRenderMode = mode;
    
    document.querySelectorAll('.render-mode-btn').forEach(btn => {
        if(btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    generateTexture(); // Preview imediato síncrono para troca de modo
}

// Inicializar texturas na UI
function initializeTextures() {
    texturePresets.forEach(texture => {
        // Textura primária
        const primaryBtn = document.createElement('button');
        primaryBtn.className = `texture-btn ${texture.id === currentTextures.primary ? 'active' : ''}`;
        primaryBtn.innerHTML = `${texture.emoji}<span>${texture.name}</span>`;
        primaryBtn.dataset.texture = texture.id;
        primaryBtn.dataset.type = 'primary';
        primaryBtn.addEventListener('click', handleTextureSelect);
        primaryTextureGrid.appendChild(primaryBtn);

        // Textura secundária
        const secondaryBtn = document.createElement('button');
        secondaryBtn.className = `texture-btn ${texture.id === currentTextures.secondary ? 'active' : ''}`;
        secondaryBtn.innerHTML = `${texture.emoji}<span>${texture.name}</span>`;
        secondaryBtn.dataset.texture = texture.id;
        secondaryBtn.dataset.type = 'secondary';
        secondaryBtn.addEventListener('click', handleTextureSelect);
        secondaryTextureGrid.appendChild(secondaryBtn);
    });
}

// Selecionar textura
function handleTextureSelect(e) {
    const targetBtn = e.target.closest('.texture-btn');
    if (!targetBtn) return;

    const type = targetBtn.dataset.type;
    const textureId = targetBtn.dataset.texture;
    
    document.querySelectorAll(`[data-type="${type}"]`).forEach(btn => {
        btn.classList.remove('active');
    });
    targetBtn.classList.add('active');
    
    currentTextures[type] = textureId;
    
    const preset = texturePresets.find(t => t.id === textureId);
    
    if (preset && type === 'primary') { 
        inputs.color1.value = preset.colors[0];
        inputs.color2.value = preset.colors[1];
        inputs.color3.value = preset.colors[2];
        inputs.color4.value = preset.colors[3];
    }

    generateTexture();
}

// Listeners de Inputs para Display
Object.keys(inputs).forEach(key => {
    if (inputs[key].type === 'range' || inputs[key].type === 'number') {
        const displayKey = `${key}Value`;
        if (displays[displayKey]) {
            inputs[key].addEventListener('input', (e) => {
                displays[displayKey].textContent = e.target.value;
            });
            displays[displayKey].textContent = inputs[key].value;
        }
    }
});

// Botão de seed aleatória
randomSeedBtn.addEventListener('click', () => {
    const newSeed = Math.floor(Math.random() * 9999999) + 1;
    inputs.seed.value = newSeed;
    if(displays.seedValue) displays.seedValue.textContent = newSeed;
    generateTexture();
});

// --- NOVO SISTEMA DE RANDOMIZAÇÃO (ASSÍNCRONO) ---
randomizeBtn.addEventListener('click', () => {
    // 1. Define valores aleatórios na UI primeiro
    setRandomValues();
    // 2. Inicia o "Guardião" via Worker
    startGeneration();
});

function setRandomValues() {
    inputs.seed.value = Math.floor(Math.random() * 9999999) + 1;
    
    const randomPrimary = texturePresets[Math.floor(Math.random() * texturePresets.length)];
    const randomSecondary = texturePresets[Math.floor(Math.random() * texturePresets.length)];
    currentTextures.primary = randomPrimary.id;
    currentTextures.secondary = randomSecondary.id;
    
    document.querySelectorAll('[data-type="primary"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.texture === randomPrimary.id);
    });
    document.querySelectorAll('[data-type="secondary"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.texture === randomSecondary.id);
    });
    
    inputs.color1.value = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    inputs.color2.value = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    inputs.color3.value = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    inputs.color4.value = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    
    inputs.scale.value = Math.floor(Math.random() * 195) + 5;
    inputs.noiseAmount.value = Math.random().toFixed(2);
    inputs.contrast.value = (Math.random() * 2.0 + 0.5).toFixed(1);
    inputs.distortion.value = Math.random().toFixed(2);
    inputs.blendAmount.value = Math.random().toFixed(2);
    
    Object.keys(inputs).forEach(key => {
        const displayKey = `${key}Value`;
        if (displays[displayKey]) {
            displays[displayKey].textContent = inputs[key].value;
        }
    });
}

// Função para ligar/desligar o Tiling
window.toggleTiling = function() {
    isTiling = !isTiling;
    const btn = document.getElementById('tilingBtn');
    
    if (isTiling) {
        btn.classList.add('active');
        btn.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
    } else {
        btn.classList.remove('active');
        btn.style.backgroundColor = '';
    }

    generateTexture();
}

// --- HELPER: Coletar Estado da UI ---
function getCurrentUIParams() {
    return {
        textureConfig: {
            seed: parseInt(inputs.seed.value),
            scale: parseFloat(inputs.scale.value),
            noiseAmount: parseFloat(inputs.noiseAmount.value),
            octaves: parseInt(inputs.octaves.value),
            contrast: parseFloat(inputs.contrast.value),
            distortion: parseFloat(inputs.distortion.value),
            blendAmount: parseFloat(inputs.blendAmount.value),
            blendMode: inputs.blendMode.value,
            colorMode: inputs.colorMode.value,
            // Passar os nomes das texturas para o engine saber qual função base usar
            primary: currentTextures.primary,
            secondary: currentTextures.secondary,
            colors: [
                hexToRgb(inputs.color1.value),
                hexToRgb(inputs.color2.value),
                hexToRgb(inputs.color3.value),
                hexToRgb(inputs.color4.value)
            ],
            effects: Array.from(activeEffects)
        },
        renderMode: currentRenderMode,
        isTiling: isTiling
    };
}

// --- CORE: Gerar Textura (Modo Síncrono para Preview Rápido) ---
// Mantido para quando o usuário mexe nos sliders manualmente
function generateTexture() {
    const size = 512;
    const paramsRaw = getCurrentUIParams();
    const params = paramsRaw.textureConfig; // atalho

    // Recria objeto receita para JSON
    proceduralRecipe = {
        version: "2.1",
        textures: {
            primary: currentTextures.primary,
            secondary: currentTextures.secondary,
            blend: { mode: params.blendMode, amount: params.blendAmount }
        },
        colors: params.colors.map(c => `rgb(${c.r}, ${c.g}, ${c.b})`),
        parameters: params,
        effects: Array.from(activeEffects)
    };

    previewCanvas.width = size;
    previewCanvas.height = size;
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            
            let value;

            // ... Lógica simplificada de renderização síncrona ...
            // OBS: O Worker vai ter a lógica duplicada, mas mais robusta.
            // Para "Engenharia Visual" ideal, no futuro moveríamos TUDO para o worker,
            // mas manter síncrono para sliders dá feedback mais instantâneo.
            
            if (currentRenderMode === 'solid') {
                value = 0.5; 
            } else if (currentRenderMode === 'gradient') {
                value = (x / size) * 0.5 + (y / size) * 0.5;
            } else {
                // Modo TEXTURA
                const nx = x / size + noise(x * 0.01, y * 0.01, params.seed) * params.distortion;
                const ny = y / size + noise(x * 0.01, y * 0.01, params.seed + 100) * params.distortion;
                
                let v1 = generateTextureFunction(nx, ny, params, currentTextures.primary);
                let v2 = generateTextureFunction(nx, ny, params, currentTextures.secondary);
                
                value = blendTextures(v1, v2, params.blendMode, params.blendAmount);
                value += (noise(x * 2, y * 2, params.seed + 200) * 2 - 1) * params.noiseAmount;
            }

             // Aplicar efeitos
             if (currentRenderMode !== 'solid') {
                activeEffects.forEach(effect => {
                   let efX = x/size;
                   let efY = y/size;
                   value = applyEffect(efX, efY, value, effect, params);
               });
           }
            
            // Contraste e clamp
            value = ((value - 0.5) * params.contrast + 0.5);
            value = Math.max(0, Math.min(1, value));
            
            // Cor Final
            let r, g, b;
            if (currentRenderMode === 'normal') {
                const normalColor = calculateNormal(x, y, value, params); // Precisa importar ou ter a lógica aqui
                r = normalColor.r; g = normalColor.g; b = normalColor.b;
            } else {
                const color = getColor(value, params.colorMode, params.colors);
                r = color.r; g = color.g; b = color.b;
            }

            data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Atualizar JSON Preview
    const jsonString = JSON.stringify(proceduralRecipe, null, 2);
    fileSize.textContent = `${(new Blob([jsonString]).size / 1024).toFixed(2)} KB`;
    jsonPreview.textContent = jsonString;
    canvasContainer.style.display = 'grid';
}

// --- GUARDIÃO ASSÍNCRONO (Web Worker) ---

function startGeneration() {
    if (isGenerating) return; 
    isGenerating = true;
    updateUIStatus("Inicializando Guardião...");
    
    // Inicia a tentativa 1
    requestTextureFromWorker(1);
}

function requestTextureFromWorker(attempt) {
    const params = getCurrentUIParams(); 
    
    // Modifica a seed aleatoriamente para cada tentativa do guardião
    // Isso garante que o worker tente variações diferentes
    params.textureConfig.seed = Math.floor(Math.random() * 100000);
    // Atualiza o input para refletir a seed que está sendo tentada
    inputs.seed.value = params.textureConfig.seed;

    worker.postMessage({
        width: 512,
        height: 512,
        textureConfig: params.textureConfig,
        renderMode: params.renderMode,
        isTiling: params.isTiling,
        attemptCount: attempt
    });
}

worker.onmessage = (e) => {
    const { buffer, variance, attemptCount } = e.data;

    if (variance > VARIANCE_THRESHOLD || attemptCount > 20 || currentRenderMode === 'solid') {
        // SUCESSO (ou desistência)
        const imageData = new ImageData(buffer, 512, 512);
        ctx.putImageData(imageData, 0, 0);
        
        const msg = attemptCount > 20 
            ? `⚠️ Desistência após ${attemptCount} tentativas (Var: ${variance.toFixed(2)})`
            : `✅ Sucesso na tentativa ${attemptCount} (Var: ${variance.toFixed(2)})`;
            
        updateUIStatus(msg);
        isGenerating = false;
        
        // Atualiza o JSON final com a seed vencedora
        generateTexture(); 
        
    } else {
        // FALHA - Tenta novamente
        updateUIStatus(`♻️ Tentativa ${attemptCount}: Rejeitada (Muito plana)...`);
        setTimeout(() => requestTextureFromWorker(attemptCount + 1), 0);
    }
};

function updateUIStatus(msg) {
    const infoContainer = document.querySelector('.canvas-wrapper h3');
    if (infoContainer) {
        // Preserva o título e adiciona o status pequeno
        infoContainer.innerHTML = `Visualização <span style="font-size: 11px; color: #aaa; font-weight: normal;">(${msg})</span>`;
    }
    if (statusLabel) statusLabel.innerText = msg;
}

// Botões Auxiliares
generateBtn.addEventListener('click', generateTexture); // Manual refresh

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `texture-${currentTextures.primary}-${currentTextures.secondary}.png`;
    link.href = previewCanvas.toDataURL();
    link.click();
});

downloadJsonBtn.addEventListener('click', () => {
    if (!proceduralRecipe) return;
    const jsonString = JSON.stringify(proceduralRecipe, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `texture-recipe-${Date.now()}.json`;
    link.href = url;
    link.click();
});

copyJsonBtn.addEventListener('click', async () => {
    if (!proceduralRecipe) return;
    try {
        await navigator.clipboard.writeText(JSON.stringify(proceduralRecipe, null, 2));
        alert('✅ Receita copiada!');
    } catch (err) {
        alert('❌ Erro ao copiar.');
    }
});

// Inicialização Final
initializeTextures();
generateTexture();