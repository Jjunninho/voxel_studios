// js/main.js - VERSÃO COM IA INTEGRADA
import { texturePresets } from './presets.js';
import { generateTextureFunction, applyEffect, blendTextures, getColor } from './engine.js';
import { noise, hexToRgb, calculateImageVariance } from './utils.js';
import { generateTextureFromAI, getSuggestedPrompts } from './api.js';

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

// 🤖 Elementos da IA
const aiPromptInput = document.getElementById('aiPromptInput');
const generateAiBtn = document.getElementById('generateAiBtn');
const aiStatus = document.getElementById('aiStatus');
const suggestionsGrid = document.getElementById('suggestionsGrid');

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
let tilingEnabled = false; // NOVO: Estado do tiling

// ========================================
// NOVA FUNÇÃO: Toggle Tiling (CORRIGIDO)
// ========================================
window.toggleTiling = function() {
    tilingEnabled = !tilingEnabled;
    const tilingBtn = document.getElementById('tilingBtn');
    
    if (tilingEnabled) {
        tilingBtn.style.background = 'rgba(255, 215, 0, 0.2)';
        tilingBtn.style.borderColor = '#ffd700';
        tilingBtn.innerHTML = '✅ Tiling ATIVO';
    } else {
        tilingBtn.style.background = '';
        tilingBtn.style.borderColor = '#ffd700';
        tilingBtn.innerHTML = '🔄 Tiling (Repetição Infinita)';
    }
    
    generateTexture();
}

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
        primaryBtn.innerHTML = `${texture.emoji}<br><span>${texture.name}</span>`;
        primaryBtn.dataset.texture = texture.id;
        primaryBtn.dataset.type = 'primary';
        primaryBtn.addEventListener('click', handleTextureSelect);
        primaryTextureGrid.appendChild(primaryBtn);

        // Textura secundária
        const secondaryBtn = document.createElement('button');
        secondaryBtn.className = `texture-btn ${texture.id === currentTextures.secondary ? 'active' : ''}`;
        secondaryBtn.innerHTML = `${texture.emoji}<br><span>${texture.name}</span>`;
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
});

// ========================================
// RANDOMIZAR COM GUARDIÃO DE QUALIDADE
// ========================================
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
    inputs.contrast.value = (Math.random() * 2.9 + 0.1).toFixed(1);
    inputs.distortion.value = Math.random().toFixed(2);
    inputs.blendAmount.value = Math.random().toFixed(2);
    
    Object.keys(inputs).forEach(key => {
        const displayKey = `${key}Value`;
        if (displays[displayKey]) {
            displays[displayKey].textContent = inputs[key].value;
        }
    });
}

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

// ========================================
// CORE: Gerar Textura (RETORNA VARIÂNCIA)
// ========================================
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
        tiling: tilingEnabled // Passa o estado do tiling
    };

    const colors = [
        hexToRgb(inputs.color1.value),
        hexToRgb(inputs.color2.value),
        hexToRgb(inputs.color3.value),
        hexToRgb(inputs.color4.value)
    ];

    proceduralRecipe = {
        version: "2.1",
        textures: {
            primary: currentTextures.primary,
            secondary: currentTextures.secondary,
            blend: { mode: params.blendMode, amount: params.blendAmount }
        },
        colors: colors.map(c => `rgb(${c.r}, ${c.g}, ${c.b})`),
        colorMode: params.colorMode,
        parameters: params,
        effects: Array.from(activeEffects),
        renderMode: currentRenderMode,
        tiling: tilingEnabled
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
                // Modo TEXTURA (padrão)
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
    
    // ========================================
    // DETECÇÃO DE SATURAÇÃO + RETORNO
    // ========================================
    let visualVariance = 0;
    const infoContainer = document.querySelector('.canvas-wrapper h3'); 
    
    // 🛡️ GUARDIÃO UNIVERSAL - TODOS OS MODOS SÃO VALIDADOS
    // Exceção: Apenas 'solid' pula validação (é proposital)
    if (currentRenderMode === 'solid') {
        infoContainer.innerHTML = 'Visualização da Textura - Modo: SÓLIDA';
        visualVariance = 999; // Sólido não precisa validar
    } else {
        // 🔍 CALCULA VARIÂNCIA PARA TODOS OS OUTROS MODOS
        visualVariance = calculateImageVariance(imageData);
        
        // Detecta saturação
        if (visualVariance < 5) {
            infoContainer.innerHTML = `Visualização da Textura <span style="color:#ff4444; font-size:12px">⚠️ (Saturação: ${currentRenderMode.toUpperCase()})</span>`;
            console.warn(`⚠️ Modo ${currentRenderMode}: Variância muito baixa (${visualVariance.toFixed(2)}). A mistura causou saturação.`);
        } else {
            // Sucesso - título normal
            if (currentRenderMode === 'texture') {
                infoContainer.innerHTML = 'Visualização da Textura';
            } else {
                infoContainer.innerHTML = `Visualização da Textura - Modo: ${currentRenderMode.toUpperCase()}`;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Atualizar JSON
    const jsonString = JSON.stringify(proceduralRecipe, null, 2);
    const bytes = new Blob([jsonString]).size;
    fileSize.textContent = `${(bytes / 1024).toFixed(2)} KB`;
    jsonPreview.textContent = jsonString;

    canvasContainer.style.display = 'grid';
    
    // RETORNA A VARIÂNCIA PARA O GUARDIÃO
    return visualVariance;
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
initializeAISuggestions();
generateTexture();

// ====================================================================
// 🤖 SISTEMA DE IA - INICIALIZAÇÃO E CALLBACKS
// ====================================================================

function initializeAISuggestions() {
    const suggestions = getSuggestedPrompts();
    const allSuggestions = Object.values(suggestions).flat();
    
    // Pega 6 sugestões aleatórias
    const randomSuggestions = allSuggestions
        .sort(() => Math.random() - 0.5)
        .slice(0, 6);
    
    randomSuggestions.forEach(suggestion => {
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn';
        btn.textContent = suggestion;
        btn.addEventListener('click', () => {
            aiPromptInput.value = suggestion;
        });
        suggestionsGrid.appendChild(btn);
    });
}

function showAIStatus(message, type = 'info') {
    aiStatus.textContent = message;
    aiStatus.className = `ai-status ${type}`;
    aiStatus.classList.remove('hidden');
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            aiStatus.classList.add('hidden');
        }, 5000);
    }
}

// Callback que aplica a receita da IA e retorna a variância
function applyAIRecipe(recipe) {
    // Atualiza texturas selecionadas
    currentTextures.primary = recipe.textures.primary;
    currentTextures.secondary = recipe.textures.secondary;
    
    // Atualiza seleção visual
    document.querySelectorAll('[data-type="primary"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.texture === recipe.textures.primary);
    });
    document.querySelectorAll('[data-type="secondary"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.texture === recipe.textures.secondary);
    });
    
    // Atualiza cores
    recipe.colors.forEach((color, i) => {
        const input = document.getElementById(`color${i + 1}`);
        if (input) input.value = color;
    });
    
    // Atualiza parâmetros
    Object.keys(recipe.parameters).forEach(key => {
        if (inputs[key]) {
            inputs[key].value = recipe.parameters[key];
            const displayKey = `${key}Value`;
            if (displays[displayKey]) {
                displays[displayKey].textContent = recipe.parameters[key];
            }
        }
    });
    
    // Atualiza modo de blend
    inputs.blendMode.value = recipe.textures.blend.mode;
    inputs.blendAmount.value = recipe.textures.blend.amount;
    displays.blendAmountValue.textContent = recipe.textures.blend.amount;
    
    // Atualiza modo de cor
    inputs.colorMode.value = recipe.colorMode;
    
    // Atualiza modo de renderização
    currentRenderMode = recipe.renderMode || 'texture';
    document.querySelectorAll('.render-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === currentRenderMode);
    });
    
    // Atualiza tiling
    if (recipe.tiling !== undefined) {
        tilingEnabled = recipe.tiling;
        const tilingBtn = document.getElementById('tilingBtn');
        if (tilingEnabled) {
            tilingBtn.style.background = 'rgba(255, 215, 0, 0.2)';
            tilingBtn.innerHTML = '✅ Tiling ATIVO';
        } else {
            tilingBtn.style.background = '';
            tilingBtn.innerHTML = '🔄 Tiling (Repetição Infinita)';
        }
    }
    
    // Atualiza efeitos
    activeEffects.clear();
    if (recipe.effects && Array.isArray(recipe.effects)) {
        recipe.effects.forEach(effect => {
            activeEffects.add(effect);
            const btn = document.querySelector(`[data-effect="${effect}"]`);
            if (btn) btn.classList.add('active');
        });
    }
    
    // Gera e retorna variância
    return generateTexture();
}

// Botão de geração via IA
generateAiBtn.addEventListener('click', async () => {
    const prompt = aiPromptInput.value;
    
    if (!prompt.trim()) {
        showAIStatus('Por favor, descreva a textura desejada!', 'error');
        return;
    }
    
    generateAiBtn.disabled = true;
    generateAiBtn.textContent = '⏳ Gerando...';
    generateAiBtn.classList.add('loading');
    
    showAIStatus('🧠 IA processando sua descrição...', 'info');
    
    const result = await generateTextureFromAI(
        prompt,
        texturePresets,
        applyAIRecipe,
        (variance) => variance > 5
    );
    
    generateAiBtn.disabled = false;
    generateAiBtn.textContent = '✨ Gerar com IA';
    generateAiBtn.classList.remove('loading');
    
    if (result.success) {
        showAIStatus(result.message, 'success');
        
        // Atualiza título com stats
        const infoContainer = document.querySelector('.canvas-wrapper h3');
        const cor = result.attempts > 3 ? '#ffaa00' : '#00ff88';
        infoContainer.innerHTML = `
            Visualização via IA 
            <span style="font-size: 11px; color: #aaa; margin-left: 10px; font-weight: normal;">
                (${result.attempts} tentativa${result.attempts > 1 ? 's' : ''} • Variância: <span style="color:${cor}">${result.variance.toFixed(1)}</span>)
            </span>
        `;
    } else {
        showAIStatus(result.message, 'error');
    }
});

// ====================================================================
// 🎨 INICIALIZAÇÃO COM TEXTURA BONITA GARANTIDA
// ====================================================================

initializeTextures();
initializeAISuggestions();

// Ao invés de gerar qualquer coisa, vamos garantir uma textura bonita
function initializeWithBeautifulTexture() {
    let attempts = 0;
    const maxAttempts = 10;
    let variance = 0;
    
    console.log('🎨 Inicializando com textura de qualidade...');
    
    while (variance < 5 && attempts < maxAttempts) {
        attempts++;
        
        // Define valores que tem maior chance de dar certo
        const goodPresets = ['stone', 'wood', 'marble', 'clouds', 'metal', 'water', 'nebula'];
        const randomPrimary = goodPresets[Math.floor(Math.random() * goodPresets.length)];
        const randomSecondary = goodPresets[Math.floor(Math.random() * goodPresets.length)];
        
        currentTextures.primary = randomPrimary;
        currentTextures.secondary = randomSecondary;
        
        // Atualiza UI
        document.querySelectorAll('[data-type="primary"]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.texture === randomPrimary);
        });
        document.querySelectorAll('[data-type="secondary"]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.texture === randomSecondary);
        });
        
        // Define parâmetros seguros
        inputs.seed.value = Math.floor(Math.random() * 9999999) + 1;
        inputs.scale.value = 40 + Math.random() * 40; // 40-80
        inputs.noiseAmount.value = (0.2 + Math.random() * 0.3).toFixed(2); // 0.2-0.5
        inputs.contrast.value = (1.3 + Math.random() * 0.8).toFixed(1); // 1.3-2.1
        inputs.distortion.value = (0.1 + Math.random() * 0.3).toFixed(2); // 0.1-0.4
        inputs.blendAmount.value = (0.3 + Math.random() * 0.4).toFixed(2); // 0.3-0.7
        inputs.blendMode.value = ['multiply', 'screen', 'overlay'][Math.floor(Math.random() * 3)];
        
        // Atualiza displays
        Object.keys(inputs).forEach(key => {
            const displayKey = `${key}Value`;
            if (displays[displayKey]) {
                displays[displayKey].textContent = inputs[key].value;
            }
        });
        
        // Gera e mede
        variance = generateTexture();
        
        if (variance < 5) {
            console.log(`🔄 Tentativa ${attempts}: Variância ${variance.toFixed(2)} (baixa, tentando novamente...)`);
        }
    }
    
    if (variance >= 5) {
        console.log(`✅ Textura inicial gerada com sucesso na tentativa ${attempts}! Variância: ${variance.toFixed(2)}`);
        
        // Atualiza título com stats
        const infoContainer = document.querySelector('.canvas-wrapper h3');
        const cor = attempts > 5 ? '#ffaa00' : '#00ff88';
        infoContainer.innerHTML = `
            Visualização 
            <span style="font-size: 11px; color: #aaa; margin-left: 10px; font-weight: normal;">
                (Inicial gerada em ${attempts} tentativa${attempts > 1 ? 's' : ''} • Variância: <span style="color:${cor}">${variance.toFixed(1)}</span>)
            </span>
        `;
    } else {
        console.warn(`⚠️ Não foi possível gerar textura ideal em ${maxAttempts} tentativas. Usando a melhor disponível.`);
    }
}

// Chama a inicialização inteligente
initializeWithBeautifulTexture();

