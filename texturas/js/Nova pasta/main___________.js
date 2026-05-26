// js/main.js
import { texturePresets } from './presets.js';
import { generateTextureFunction, applyEffect, blendTextures, getColor } from './engine.js';
import { noise, hexToRgb, calculateImageVariance } from './utils.js';

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

    generateTexture();
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
    
    if (preset && type === 'primary') { // Apenas muda cor se for primária (regra original)
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
    displays.seedValue.textContent = newSeed; // assumindo que existe o elemento, se não existir, não quebra
});

// Randomizar Tudo
randomizeBtn.addEventListener('click', () => {
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
    inputs.contrast.value = (Math.random() * 2.9 + 0.1).toFixed(1);
    inputs.distortion.value = Math.random().toFixed(2);
    inputs.blendAmount.value = Math.random().toFixed(2);
    
    Object.keys(inputs).forEach(key => {
        const displayKey = `${key}Value`;
        if (displays[displayKey]) {
            displays[displayKey].textContent = inputs[key].value;
        }
    });
    
    setTimeout(generateTexture, 100);
});

// Efeitos
document.querySelectorAll('.effect-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const effect = e.target.dataset.effect;
        e.target.classList.toggle('active');
        
        if (e.target.classList.contains('active')) {
            activeEffects.add(effect);
        } else {
            activeEffects.delete(effect);
        }
    });
});

// --- CORE: Gerar Textura (Loop Principal) ---
function generateTexture() {
    const size = 512;
    
    const params = {
        seed: parseInt(inputs.seed.value),
        scale: parseFloat(inputs.scale.value),
        noiseAmount: parseFloat(inputs.noiseAmount.value),
        octaves: parseInt(inputs.octaves.value),
        contrast: parseFloat(inputs.contrast.value),
        distortion: parseFloat(inputs.distortion.value),
        blendAmount: parseFloat(inputs.blendAmount.value),
        blendMode: inputs.blendMode.value,
        colorMode: inputs.colorMode.value
    };

    const colors = [
        hexToRgb(inputs.color1.value),
        hexToRgb(inputs.color2.value),
        hexToRgb(inputs.color3.value),
        hexToRgb(inputs.color4.value)
    ];

    proceduralRecipe = {
        version: "2.0",
        textures: {
            primary: currentTextures.primary,
            secondary: currentTextures.secondary,
            blend: { mode: params.blendMode, amount: params.blendAmount }
        },
        colors: colors.map(c => `rgb(${c.r}, ${c.g}, ${c.b})`),
        colorMode: params.colorMode,
        parameters: params,
        effects: Array.from(activeEffects)
    };

    previewCanvas.width = size;
    previewCanvas.height = size;
    const ctx = previewCanvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            
            let value;

            if (currentRenderMode === 'solid') {
                value = 0.5; 
            } else if (currentRenderMode === 'gradient') {
                value = (x / size) * 0.5 + (y / size) * 0.5;
                if(params.distortion > 0) {
                    value += noise(x * 0.005, y * 0.005, params.seed) * params.distortion * 0.2;
                }
            } else if (currentRenderMode === 'pixel') {
                const pixelSize = 16;
                const px = Math.floor(x / pixelSize) * pixelSize;
                const py = Math.floor(y / pixelSize) * pixelSize;
                
                const npx = px / size + noise(px * 0.01, py * 0.01, params.seed) * params.distortion;
                const npy = py / size + noise(px * 0.01, py * 0.01, params.seed + 100) * params.distortion;
                
                let v1 = generateTextureFunction(npx, npy, params, currentTextures.primary);
                let v2 = generateTextureFunction(npx, npy, params, currentTextures.secondary);
                value = blendTextures(v1, v2, params.blendMode, params.blendAmount);
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
                    let efX = (currentRenderMode === 'pixel') ? Math.floor(x/16)*16/size : x/size;
                    let efY = (currentRenderMode === 'pixel') ? Math.floor(y/16)*16/size : y/size;
                    value = applyEffect(efX, efY, value, effect, params);
                });
            }
            
            // Contraste e clamp
            value = ((value - 0.5) * params.contrast + 0.5);
            value = Math.max(0, Math.min(1, value));
            
            // Obter cor
            const color = getColor(value, params.colorMode, colors);
            
            data[i] = color.r;
            data[i + 1] = color.g;
            data[i + 2] = color.b;
            data[i + 3] = 255;
        }
    }
	
	// --- NOVA LÓGICA DE DETECÇÃO ---
    const visualVariance = calculateImageVariance(imageData);
    
    // Referencia um lugar para mostrar o aviso (pode criar uma div no HTML ou usar console)
    const infoContainer = document.querySelector('.canvas-wrapper h3'); 
    
    // Se a variância for menor que 5, é praticamente uma cor sólida
    if (visualVariance < 5 && currentRenderMode === 'texture') {
        infoContainer.innerHTML = 'Visualização da Textura <span style="color:#ff4444; font-size:12px">⚠️ (Saturação Detectada)</span>';
        
        // Opcional: Console avisa o motivo
        console.warn(`Alerta visual: Variância muito baixa (${visualVariance.toFixed(2)}). A mistura '${params.blendMode}' com intensidade ${params.blendAmount} causou saturação.`);
    } else {
        infoContainer.innerHTML = 'Visualização da Textura';
    }

    ctx.putImageData(imageData, 0, 0);

    // Atualizar JSON
    const jsonString = JSON.stringify(proceduralRecipe, null, 2);
    const bytes = new Blob([jsonString]).size;
    fileSize.textContent = `${(bytes / 1024).toFixed(2)} KB`;
    jsonPreview.textContent = jsonString;

    canvasContainer.style.display = 'grid';
}

// Botões de Ação
generateBtn.addEventListener('click', generateTexture);

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
    URL.revokeObjectURL(url);
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

// Inicialização
initializeTextures();
generateTexture();