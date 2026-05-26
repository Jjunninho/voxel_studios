// texturas/js/renderModes.js - Módulo de Modos de Renderização

import { noise } from './utils.js';
import { generateTextureFunction, blendTextures } from './engine.js';

// ====================================================================
// 🎨 REGISTRO DE MODOS DE RENDERIZAÇÃO
// ====================================================================

/**
 * Cada modo de renderização é uma função que recebe:
 * @param {number} x - Coordenada X do pixel (0-511)
 * @param {number} y - Coordenada Y do pixel (0-511)
 * @param {number} size - Tamanho do canvas (512)
 * @param {object} params - Parâmetros da textura
 * @param {object} currentTextures - { primary, secondary }
 * @returns {number} - Valor de 0 a 1 representando intensidade
 */

export const renderModes = {
    
    // ========================================
    // 🎭 MODO: TEXTURE (Padrão)
    // ========================================
    texture: (x, y, size, params, currentTextures) => {
        const nx = x / size + noise(x * 0.01, y * 0.01, params.seed) * params.distortion;
        const ny = y / size + noise(x * 0.01, y * 0.01, params.seed + 100) * params.distortion;
        
        let v1 = generateTextureFunction(nx, ny, params, currentTextures.primary);
        let v2 = generateTextureFunction(nx, ny, params, currentTextures.secondary);
        
        let value = blendTextures(v1, v2, params.blendMode, params.blendAmount);
        value += (noise(x * 2, y * 2, params.seed + 200) * 2 - 1) * params.noiseAmount;
        
        return value;
    },

    // ========================================
    // 🌈 MODO: GRADIENT
    // ========================================
    gradient: (x, y, size, params, currentTextures) => {
        let value = (x / size) * 0.5 + (y / size) * 0.5;
        
        if (params.distortion > 0) {
            value += noise(x * 0.005, y * 0.005, params.seed) * params.distortion * 0.2;
        }
        
        return value;
    },

    // ========================================
    // ⬛ MODO: SOLID
    // ========================================
    solid: (x, y, size, params, currentTextures) => {
        return 0.5; // Cor única
    },

    // ========================================
    // 👾 MODO: PIXEL ART
    // ========================================
    pixel: (x, y, size, params, currentTextures) => {
        const pixelSize = 16;
        const px = Math.floor(x / pixelSize) * pixelSize;
        const py = Math.floor(y / pixelSize) * pixelSize;
        
        const npx = px / size + noise(px * 0.01, py * 0.01, params.seed) * params.distortion;
        const npy = py / size + noise(px * 0.01, py * 0.01, params.seed + 100) * params.distortion;
        
        let v1 = generateTextureFunction(npx, npy, params, currentTextures.primary);
        let v2 = generateTextureFunction(npx, npy, params, currentTextures.secondary);
        
        return blendTextures(v1, v2, params.blendMode, params.blendAmount);
    }

    // ========================================
    // 💡 ADICIONE NOVOS MODOS AQUI:
    // ========================================
    // Exemplo:
    // 
    // scanlines: (x, y, size, params, currentTextures) => {
    //     const lineSpacing = 4;
    //     const line = Math.floor(y / lineSpacing) % 2;
    //     
    //     let baseValue = renderModes.texture(x, y, size, params, currentTextures);
    //     return line ? baseValue : baseValue * 0.5;
    // },
    //
    // Depois adicione no HTML:
    // <button class="render-mode-btn" data-mode="scanlines" onclick="setRenderMode('scanlines')">
    //     📺 Scanlines
    // </button>
};

// ====================================================================
// 🎯 FUNÇÃO PRINCIPAL: Renderiza pixel baseado no modo atual
// ====================================================================

/**
 * Renderiza um pixel usando o modo de renderização selecionado
 */
export function renderPixel(x, y, size, params, currentTextures, renderMode) {
    // Pega a função do modo
    const renderFunc = renderModes[renderMode];
    
    if (!renderFunc) {
        console.warn(`⚠️ Modo '${renderMode}' não existe! Usando 'texture' como fallback.`);
        return renderModes.texture(x, y, size, params, currentTextures);
    }
    
    return renderFunc(x, y, size, params, currentTextures);
}

// ====================================================================
// 📋 METADADOS DOS MODOS (Para UI)
// ====================================================================

export const renderModeMetadata = {
    texture: {
        name: 'Textura',
        icon: '🎭',
        description: 'Textura procedural completa',
        validateSaturation: true
    },
    gradient: {
        name: 'Gradiente',
        icon: '🌈',
        description: 'Gradiente suave com distorção',
        validateSaturation: true
    },
    solid: {
        name: 'Sólida',
        icon: '⬛',
        description: 'Cor única para testes',
        validateSaturation: false // Não valida (proposital)
    },
    pixel: {
        name: 'Pixel Art',
        icon: '👾',
        description: 'Textura pixelada 16x16',
        validateSaturation: true
    }
};

// ====================================================================
// 🔍 FUNÇÃO AUXILIAR: Lista modos disponíveis
// ====================================================================

export function getAvailableModes() {
    return Object.keys(renderModes);
}

export function shouldValidateSaturation(mode) {
    return renderModeMetadata[mode]?.validateSaturation ?? true;
}
