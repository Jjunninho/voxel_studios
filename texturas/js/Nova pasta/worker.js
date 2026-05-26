// js/worker.js
import { generateTextureFunction, calculateNormal, applyEffect, blendTextures } from './engine.js';
import { calculateImageVariance, noise } from './utils.js';

self.onmessage = (e) => {
    const { 
        width, 
        height, 
        textureConfig, 
        renderMode, 
        isTiling, 
        attemptCount 
    } = e.data;

    const buffer = new Uint8ClampedArray(width * height * 4);
    // HeightMap auxiliar para cálculo de normais
    const heightMap = new Float32Array(width * height);
    
    // Parâmetros descompactados para facilitar leitura
    const params = textureConfig;
    const size = width; // Assumindo quadrado 512x512

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            let value;

            // --- 1. LÓGICA DE GERAÇÃO (Espelho do main.js) ---
            
            if (renderMode === 'solid') {
                value = 0.5;
            } 
            else if (renderMode === 'gradient') {
                value = (x / size) * 0.5 + (y / size) * 0.5;
                if(params.distortion > 0) {
                    value += noise(x * 0.005, y * 0.005, params.seed) * params.distortion * 0.2;
                }
            } 
            else if (renderMode === 'pixel') {
                const pixelSize = 16;
                const px = Math.floor(x / pixelSize) * pixelSize;
                const py = Math.floor(y / pixelSize) * pixelSize;
                
                const npx = px / size + noise(px * 0.01, py * 0.01, params.seed) * params.distortion;
                const npy = py / size + noise(px * 0.01, py * 0.01, params.seed + 100) * params.distortion;
                
                let v1 = generateTextureFunction(npx, npy, params, params.primary);
                let v2 = generateTextureFunction(npx, npy, params, params.secondary);
                value = blendTextures(v1, v2, params.blendMode, params.blendAmount);
            } 
            else {
                // Modo TEXTURA (Padrão)
                // Normalização das coordenadas e distorção
                const nx = x / size + noise(x * 0.01, y * 0.01, params.seed) * params.distortion;
                const ny = y / size + noise(x * 0.01, y * 0.01, params.seed + 100) * params.distortion;
                
                let v1 = generateTextureFunction(nx, ny, params, params.primary);
                let v2 = generateTextureFunction(nx, ny, params, params.secondary);
                
                value = blendTextures(v1, v2, params.blendMode, params.blendAmount);
                // Ruído de detalhe extra
                value += (noise(x * 2, y * 2, params.seed + 200) * 2 - 1) * params.noiseAmount;
            }

            // --- 2. APLICAÇÃO DE EFEITOS ---
            if (renderMode !== 'solid' && params.effects) {
                params.effects.forEach(effect => {
                    let efX = (renderMode === 'pixel') ? Math.floor(x/16)*16/size : x/size;
                    let efY = (renderMode === 'pixel') ? Math.floor(y/16)*16/size : y/size;
                    value = applyEffect(efX, efY, value, effect, params);
                });
            }

            // Contraste e clamp (limites 0 a 1)
            value = ((value - 0.5) * params.contrast + 0.5);
            value = Math.max(0, Math.min(1, value));

            // Salva no mapa de altura para uso posterior (Normal Maps)
            heightMap[y * width + x] = value;

            // --- 3. RENDERIZAÇÃO DE COR OU NORMAL ---
            let r, g, b;

            if (renderMode === 'normal') {
                // Cálculo de Normal Map usando o HeightMap recém gerado
                // Nota: O calculateNormal precisa suportar ler do array heightMap agora
                const vector = calculateNormal(x, y, width, height, heightMap, isTiling);
                
                // Se calculateNormal retornar objeto {x,y,z}, converte:
                r = (vector.x + 1) * 127.5;
                g = (vector.y + 1) * 127.5;
                b = (vector.z + 1) * 127.5;
            } else {
                // Renderização de Cor (Diffuse) simples para validação
                // O worker foca mais na geometria, mas retornamos um grayscale visual
                // Se quiser cor completa, precisaria da função getColor aqui também.
                // Por performance no Guardião, retornamos grayscale visual:
                const c = Math.floor(value * 255);
                r = c; g = c; b = c;
            }

            buffer[idx] = r;
            buffer[idx + 1] = g;
            buffer[idx + 2] = b;
            buffer[idx + 3] = 255;
        }
    }

    // 4. CÁLCULO DA VARIÂNCIA (O Guardião julga aqui)
    const variance = calculateImageVariance(buffer);

    // Retorna para a Main Thread
    self.postMessage({
        buffer: buffer,
        variance: variance,
        attemptCount: attemptCount,
        success: true
    }, [buffer.buffer]); // Transferable
};