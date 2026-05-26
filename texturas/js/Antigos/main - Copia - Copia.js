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
let isTiling = false;

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
// Botão Randomizar com "Filtro de Qualidade"
randomizeBtn.addEventListener('click', () => {
    let attempts = 0;
    const maxAttempts = 20; // Tenta no máximo 20 vezes para não travar o navegador
    let isTextureValid = false;
    let variance = 0;

    // Feedback visual que está "pensando"
    const originalText = randomizeBtn.innerHTML;
    randomizeBtn.innerHTML = '♻️ Buscando...';

    // O GRANDE LOOP (O Guardião)
    while (!isTextureValid && attempts < maxAttempts) {
        attempts++;
        
        // 1. Rola os dados
        setRandomValues();
        
        // 2. Gera a textura e pega a variância
        variance = generateTexture();

        // 3. A REGRA DE OURO
        if (currentRenderMode === 'solid') {
            // Se o usuário quer Sólido, aceita qualquer coisa (mesmo variância 0)
            isTextureValid = true;
        } else {
            // Se quer Textura, Gradiente ou Pixel, EXIGE variância > 5
            if (variance > 5) {
                isTextureValid = true;
            }
            // Se variance <= 5, o loop roda de novo e essa textura saturada é excluída
        }
    }
	
// Retorna o texto do botão
    randomizeBtn.innerHTML = originalText;

    const infoContainer = document.querySelector('.canvas-wrapper h3');

    if (!isTextureValid) {
        infoContainer.innerHTML = `⚠️ Falha após ${maxAttempts} tentativas (Saturação)`;
        console.warn(`⚠️ O sistema tentou ${maxAttempts} vezes mas só gerou texturas saturadas.`);
    } else {
        // SUCESSO! Mostra a estatística de "pensamento"
        const esforco = attempts === 1 ? 'de primeira!' : `após ${attempts} tentativas`;
        const cor = attempts > 5 ? '#ffaa00' : '#00ff88'; // Amarelo se pensou muito, Verde se foi rápido
        
        // Atualiza o título com o status
        infoContainer.innerHTML = `
            Visualização 
            <span style="font-size: 11px; color: #aaa; margin-left: 10px; font-weight: normal;">
                (Gerado ${esforco} • Variância: <span style="color:${cor}">${variance.toFixed(1)}</span>)
            </span>
        `;
        
        console.log(`✅ Textura gerada na tentativa ${attempts}. Variância: ${variance.toFixed(2)}`);
    }
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


// Função auxiliar para definir valores aleatórios (Extraída para uso no Loop)
function setRandomValues() {
    // Seed aleatória
    inputs.seed.value = Math.floor(Math.random() * 9999999) + 1;
    
    // Texturas aleatórias
    const randomPrimary = texturePresets[Math.floor(Math.random() * texturePresets.length)];
    const randomSecondary = texturePresets[Math.floor(Math.random() * texturePresets.length)];
    currentTextures.primary = randomPrimary.id;
    currentTextures.secondary = randomSecondary.id;
    
    // Atualizar botões visuais
    document.querySelectorAll('[data-type="primary"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.texture === randomPrimary.id);
    });
    document.querySelectorAll('[data-type="secondary"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.texture === randomSecondary.id);
    });
    
    // Cores aleatórias
    inputs.color1.value = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    inputs.color2.value = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    inputs.color3.value = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    inputs.color4.value = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    
    // Valores aleatórios (ajustados para evitar saturação extrema logo de cara)
    inputs.scale.value = Math.floor(Math.random() * 195) + 5;
    inputs.noiseAmount.value = Math.random().toFixed(2);
    inputs.contrast.value = (Math.random() * 2.0 + 0.5).toFixed(1); // Limitado levemente o contraste max
    inputs.distortion.value = Math.random().toFixed(2);
    inputs.blendAmount.value = Math.random().toFixed(2);
    
    // Atualizar displays numéricos
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
    
    // Atualiza visual do botão
    if (isTiling) {
        btn.classList.add('active');
        btn.style.backgroundColor = 'rgba(255, 215, 0, 0.2)'; // Um brilho dourado
    } else {
        btn.classList.remove('active');
        btn.style.backgroundColor = '';
    }

    // Regenera a textura com a nova configuração
    generateTexture();
}


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
        colorMode: inputs.colorMode.value,
		tiling: isTiling 
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
	// inicio na inclusão de atualização (Guardião Assícrono)
	const VARIANCE_THRESHOLD = 5;
	
	let isGenerating = false;
	// fim na inclusão de atualização (Guardião Assícrono)
	
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
            
            // --- DECISÃO DE COR FINAL ---
            let r, g, b;

            if (currentRenderMode === 'normal') {
                // MODO NORMAL MAP 🔮
                // Importe calculateNormal do engine.js lá no topo!
                const normalColor = calculateNormal(x, y, value, params);
                r = normalColor.r;
                g = normalColor.g;
                b = normalColor.b;
            } else {
                // MODOS PADRÃO (Textura, Gradiente, etc)
                const color = getColor(value, params.colorMode, colors);
                r = color.r;
                g = color.g;
                b = color.b;
            }

            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = 255;
        }
    }
	
// --- LÓGICA DE DETECÇÃO DE SATURAÇÃO ---
    // Importante: Certifique-se de importar calculateImageVariance no topo do arquivo!
    const visualVariance = calculateImageVariance(imageData);
    
    // Mostra aviso visual se for edição manual
    const infoContainer = document.querySelector('.canvas-wrapper h3'); 
    if (visualVariance < 5 && currentRenderMode !== 'solid') {
         infoContainer.innerHTML = 'Visualização <span style="color:#ff4444; font-size:12px">⚠️ (Saturada)</span>';
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

		return visualVariance; // <--- ADICIONE ESTE RETURN
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


// Função chamada pelo botão "Randomizar"
function startGeneration() {
    if (isGenerating) return; // Evita cliques duplos
    isGenerating = true;
    updateUIStatus("Inicializando Guardião...");
    
    // Inicia a tentativa 1
    requestTextureFromWorker(1);
}

function requestTextureFromWorker(attempt) {
    // Coleta estado atual da UI
    const params = getCurrentUIParams(); 
    
    // Modifica a seed aleatoriamente para cada tentativa do guardião
    params.textureConfig.seed = Math.random() * 10000;

    worker.postMessage({
        width: 512,
        height: 512,
        textureConfig: params.textureConfig,
        renderMode: params.renderMode,
        isTiling: params.isTiling,
        attemptCount: attempt
    });
}

// Atualização (Guardião Assícrono)

function startGeneration() {
    if (isGenerating) return; // Evita cliques duplos
    isGenerating = true;
    updateUIStatus("Inicializando Guardião...");
    
    // Inicia a tentativa 1
    requestTextureFromWorker(1);
}

function requestTextureFromWorker(attempt) {
    // Coleta estado atual da UI
    const params = getCurrentUIParams(); 
    
    // Modifica a seed aleatoriamente para cada tentativa do guardião
    params.textureConfig.seed = Math.random() * 10000;

    worker.postMessage({
        width: 512,
        height: 512,
        textureConfig: params.textureConfig,
        renderMode: params.renderMode,
        isTiling: params.isTiling,
        attemptCount: attempt
    });
}

// Escuta a resposta do Operário
worker.onmessage = (e) => {
    const { buffer, variance, attemptCount } = e.data;

    if (variance > VARIANCE_THRESHOLD || attemptCount > 20) {
        // SUCESSO (ou desistência após 20 tentativas para não fritar a CPU)
        
        // Coloca os pixels no Canvas
        const imageData = new ImageData(buffer, 512, 512);
        ctx.putImageData(imageData, 0, 0);
        
        const msg = attemptCount > 20 
            ? `Desistência após ${attemptCount} tentativas (Var: ${variance.toFixed(2)})`
            : `Sucesso na tentativa ${attemptCount} (Var: ${variance.toFixed(2)})`;
            
        updateUIStatus(msg);
        isGenerating = false;
        
    } else {
        // FALHA - O Guardião rejeita e pede outra
        updateUIStatus(`Tentativa ${attemptCount}: Rejeitada (Muito plana/saturada)...`);
        
        // Recursão assíncrona (não trava a UI)
        // Usamos setTimeout(0) para dar chance da UI respirar um frame se necessário
        setTimeout(() => requestTextureFromWorker(attemptCount + 1), 0);
    }
};

function updateUIStatus(msg) {
    document.getElementById('statusLabel').innerText = msg;
}
function updateUIStatus(msg) {
    document.getElementById('statusLabel').innerText = msg;
}