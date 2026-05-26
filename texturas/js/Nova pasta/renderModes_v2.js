// texturas/js/renderModes.js - Módulo de Modos de Renderização (v2.3)

import { noise } from './utils.js';
import { generateTextureFunction, blendTextures } from './engine.js';

// ====================================================================
// 🎨 REGISTRO DE MODOS DE RENDERIZAÇÃO
// ====================================================================

export const renderModes = {
    
    // --- MODOS CLÁSSICOS (Mantidos) ---
    texture: (x, y, size, params, currentTextures) => {
        const nx = x / size + noise(x * 0.01, y * 0.01, params.seed) * params.distortion;
        const ny = y / size + noise(x * 0.01, y * 0.01, params.seed + 100) * params.distortion;
        let v1 = generateTextureFunction(nx, ny, params, currentTextures.primary);
        let v2 = generateTextureFunction(nx, ny, params, currentTextures.secondary);
        let value = blendTextures(v1, v2, params.blendMode, params.blendAmount);
        value += (noise(x * 2, y * 2, params.seed + 200) * 2 - 1) * params.noiseAmount;
        return value;
    },

    gradient: (x, y, size, params, currentTextures) => {
        let value = (x / size) * 0.5 + (y / size) * 0.5;
        if (params.distortion > 0) value += noise(x * 0.005, y * 0.005, params.seed) * params.distortion * 0.2;
        return value;
    },

    solid: (x, y, size, params, currentTextures) => 0.5,

    pixel: (x, y, size, params, currentTextures) => {
        const pixelSize = 16;
        const px = Math.floor(x / pixelSize) * pixelSize;
        const py = Math.floor(y / pixelSize) * pixelSize;
        const npx = px / size + noise(px * 0.01, py * 0.01, params.seed) * params.distortion;
        const npy = py / size + noise(px * 0.01, py * 0.01, params.seed + 100) * params.distortion;
        let v1 = generateTextureFunction(npx, npy, params, currentTextures.primary);
        let v2 = generateTextureFunction(npx, npy, params, currentTextures.secondary);
        return blendTextures(v1, v2, params.blendMode, params.blendAmount);
    },

    // --- NOVOS MODOS (v2.3) ---

    // 📺 Scanlines: Linhas CRT horizontais
    scanlines: (x, y, size, params, currentTextures) => {
        // Base textural para não ficar chapado
        let base = renderModes.texture(x, y, size, params, currentTextures);
        
        // Frequência das linhas baseada na escala
        const freq = params.scale * 2; 
        const line = Math.sin(y * (freq / size) * Math.PI * 2);
        
        // Mistura suave (Scanline + Ruído)
        return blendTextures(base, (line + 1) * 0.5, 'multiply', 0.5 + params.distortion * 0.5);
    },

    // 🎯 Circles: Ondas concêntricas
    circles: (x, y, size, params, currentTextures) => {
        const cx = size / 2;
        const cy = size / 2;
        const dx = x - cx + (noise(x*0.01, y*0.01, params.seed) * params.distortion * 50);
        const dy = y - cy + (noise(y*0.01, x*0.01, params.seed+1) * params.distortion * 50);
        
        const dist = Math.sqrt(dx*dx + dy*dy);
        const wave = Math.sin(dist * (params.scale / 200)); // Frequência ajustada
        
        let base = renderModes.texture(x, y, size, params, currentTextures);
        return blendTextures(base, (wave + 1) * 0.5, 'overlay', 0.6);
    },

    // ♟️ Checkerboard: Tabuleiro de Xadrez Procedural
    checkerboard: (x, y, size, params, currentTextures) => {
        const checkSize = Math.max(4, size / (params.scale / 2)); // Tamanho do quadrado
        
        // Adiciona distorção nas coordenadas
        const distX = x + noise(x*0.02, y*0.02, params.seed) * params.distortion * 50;
        const distY = y + noise(y*0.02, x*0.02, params.seed+100) * params.distortion * 50;
        
        const cx = Math.floor(distX / checkSize);
        const cy = Math.floor(distY / checkSize);
        const pattern = (cx + cy) % 2 === 0 ? 0.2 : 0.8; // Escuro vs Claro
        
        let base = renderModes.texture(x, y, size, params, currentTextures);
        return blendTextures(base, pattern, 'multiply', 0.7);
    },

    // 🕸️ Voronoi: Células baseadas em Grid (Worley Noise Simplificado)
    voronoi: (x, y, size, params, currentTextures) => {
        // Escala define o tamanho das células
        const cellSize = Math.max(10, 200 - params.scale); 
        
        // Coordenada da célula atual
        const cellX = Math.floor(x / cellSize);
        const cellY = Math.floor(y / cellSize);
        
        // Posição "aleatória" do ponto central da célula (determinística via seed)
        // Usamos noise como hash function rápida
        const pointX = (cellX + Math.abs(noise(cellX, cellY, params.seed))) * cellSize;
        const pointY = (cellY + Math.abs(noise(cellX, cellY, params.seed + 100))) * cellSize;
        
        // Distância até o centro (simplificado para célula atual para performance)
        const dx = x - pointX;
        const dy = y - pointY;
        const dist = Math.sqrt(dx*dx + dy*dy) / (cellSize * 0.8);
        
        const pattern = Math.min(1, dist);
        
        let base = renderModes.texture(x, y, size, params, currentTextures);
        return blendTextures(base, pattern, 'overlay', 0.6);
    },

    // 🔷 Hexagons: Interferência de ondas (3 eixos)
    hexagons: (x, y, size, params, currentTextures) => {
        // Escala ajustada
        const s = (x + noise(x*0.01, y*0.01, params.seed)*params.distortion*20) * (params.scale / 500);
        const t = (y + noise(y*0.01, x*0.01, params.seed)*params.distortion*20) * (params.scale / 500);
        
        // Matemática hexagonal (soma de 3 cossenos rotacionados)
        const val = Math.cos(s) + 
                    Math.cos(s * -0.5 + t * 0.866) + 
                    Math.cos(s * -0.5 - t * 0.866);
        
        // Normaliza de -1.5..3 para 0..1
        const pattern = (val + 1.5) / 3;
        
        let base = renderModes.texture(x, y, size, params, currentTextures);
        return blendTextures(base, pattern, 'multiply', 0.8);
    },

    // 🌀 Spiral: Espiral Logarítmica
    spiral: (x, y, size, params, currentTextures) => {
        const cx = size / 2;
        const cy = size / 2;
        const dx = x - cx;
        const dy = y - cy;
        
        const dist = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx);
        
        // Espiral = Distância + Ângulo * Curvatura
        const spiralVal = Math.sin((dist * 0.1) + (angle * params.scale * 0.2));
        
        let base = renderModes.texture(x, y, size, params, currentTextures);
        return blendTextures(base, (spiralVal + 1) * 0.5, 'add', 0.4);
    }
};

// ====================================================================
// 🎯 FUNÇÃO PRINCIPAL: Renderiza pixel baseado no modo atual
// ====================================================================

export function renderPixel(x, y, size, params, currentTextures, renderMode) {
    const renderFunc = renderModes[renderMode];
    if (!renderFunc) {
        return renderModes.texture(x, y, size, params, currentTextures);
    }
    return renderFunc(x, y, size, params, currentTextures);
}

// ====================================================================
// 📋 METADADOS DOS MODOS (Atualizado v2.3)
// ====================================================================

export const renderModeMetadata = {
    texture: { name: 'Textura', icon: '🎭', validateSaturation: true },
    gradient: { name: 'Gradiente', icon: '🌈', validateSaturation: true },
    solid: { name: 'Sólida', icon: '⬛', validateSaturation: false },
    pixel: { name: 'Pixel Art', icon: '👾', validateSaturation: true },
    
    // Novos
    scanlines: { name: 'Scanlines', icon: '📺', validateSaturation: true },
    circles: { name: 'Círculos', icon: '🎯', validateSaturation: true },
    checkerboard: { name: 'Xadrez', icon: '♟️', validateSaturation: true },
    voronoi: { name: 'Voronoi', icon: '🕸️', validateSaturation: true },
    hexagons: { name: 'Hexágonos', icon: '🔷', validateSaturation: true },
    spiral: { name: 'Espiral', icon: '🌀', validateSaturation: true }
};

export function getAvailableModes() {
    return Object.keys(renderModes);
}

export function shouldValidateSaturation(mode) {
    return renderModeMetadata[mode]?.validateSaturation ?? true;
}