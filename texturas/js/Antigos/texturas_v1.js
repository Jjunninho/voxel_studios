        // Texturas disponíveis (expandidas)
        const texturePresets = [
            { id: 'stone', name: 'Pedra', emoji: '🪨', colors: ['#5A5A5A', '#A8A8A8', '#333333', '#CCCCCC'] },
            { id: 'wood', name: 'Madeira', emoji: '🪵', colors: ['#8B4513', '#D2691E', '#A0522D', '#DEB887'] },
            { id: 'earth', name: 'Terra', emoji: '🌍', colors: ['#654321', '#C19A6B', '#8B7355', '#D2B48C'] },
            { id: 'marble', name: 'Mármore', emoji: '⚪', colors: ['#E8E8E8', '#FFFFFF', '#C0C0C0', '#F8F8F8'] },
            { id: 'clouds', name: 'Nuvens', emoji: '☁️', colors: ['#B0C4DE', '#F0F8FF', '#87CEEB', '#FFFFFF'] },
            { id: 'noise', name: 'Ruído', emoji: '📊', colors: ['#333333', '#CCCCCC', '#666666', '#999999'] },
            { id: 'metal', name: 'Metal', emoji: '⚙️', colors: ['#708090', '#C0C0C0', '#A9A9A9', '#E8E8E8'] },
            { id: 'water', name: 'Água', emoji: '💧', colors: ['#1E90FF', '#87CEEB', '#00BFFF', '#ADD8E6'] },
            { id: 'lava', name: 'Lava', emoji: '🌋', colors: ['#FF4500', '#FF8C00', '#DC143C', '#FFD700'] },
            { id: 'grass', name: 'Grama', emoji: '🌿', colors: ['#228B22', '#32CD32', '#006400', '#90EE90'] },
            { id: 'sand', name: 'Areia', emoji: '🏖️', colors: ['#F4A460', '#DEB887', '#D2B48C', '#FFE4B5'] },
            { id: 'snow', name: 'Neve', emoji: '❄️', colors: ['#FFFFFF', '#F0F8FF', '#E6E6FA', '#F8F8FF'] },
            { id: 'abstract1', name: 'Abstrato 1', emoji: '🎨', colors: ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0'] },
            { id: 'abstract2', name: 'Abstrato 2', emoji: '🌀', colors: ['#9B5DE5', '#F15BB5', '#00BBF9', '#00F5D4'] },
            { id: 'crystal', name: 'Cristal', emoji: '🔮', colors: ['#8A2BE2', '#9370DB', '#BA55D3', '#DDA0DD'] },
            { id: 'nebula', name: 'Nebulosa', emoji: '🌌', colors: ['#191970', '#4B0082', '#8A2BE2', '#9400D3'] }
        ];

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

        let currentTextures = { primary: 'stone', secondary: 'wood' };
        let activeEffects = new Set();
        let proceduralRecipe = null;

        // Inicializar texturas
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
            const type = e.target.dataset.type;
            const textureId = e.target.dataset.texture;
            
            // Atualizar seleção visual
            document.querySelectorAll(`[data-type="${type}"]`).forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // Atualizar textura atual
            currentTextures[type] = textureId;
            
            // Atualizar cores
            const preset = texturePresets.find(t => t.id === textureId);
            if (preset && type === 'primary') {
                inputs.color1.value = preset.colors[0];
                inputs.color2.value = preset.colors[1];
                inputs.color3.value = preset.colors[2];
                inputs.color4.value = preset.colors[3];
            }
        }

        // Atualizar valores display
        Object.keys(inputs).forEach(key => {
            if (inputs[key].type === 'range' || inputs[key].type === 'number') {
                const displayKey = `${key}Value`;
                if (displays[displayKey]) {
                    inputs[key].addEventListener('input', (e) => {
                        displays[displayKey].textContent = e.target.value;
                    });
                    // Inicializar valor
                    displays[displayKey].textContent = inputs[key].value;
                }
            }
        });

        // Botão de seed aleatória
        randomSeedBtn.addEventListener('click', () => {
            const newSeed = Math.floor(Math.random() * 9999999) + 1;
            inputs.seed.value = newSeed;
            displays.seedValue.textContent = newSeed;
        });

        // Botão de randomizar tudo
        randomizeBtn.addEventListener('click', () => {
            // Seed aleatória
            inputs.seed.value = Math.floor(Math.random() * 9999999) + 1;
            
            // Texturas aleatórias
            const randomPrimary = texturePresets[Math.floor(Math.random() * texturePresets.length)];
            const randomSecondary = texturePresets[Math.floor(Math.random() * texturePresets.length)];
            currentTextures.primary = randomPrimary.id;
            currentTextures.secondary = randomSecondary.id;
            
            // Atualizar botões
            document.querySelectorAll('[data-type="primary"]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.texture === randomPrimary.id);
            });
            document.querySelectorAll('[data-type="secondary"]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.texture === randomSecondary.id);
            });
            
            // Cores aleatórias
            inputs.color1.value = '#' + Math.floor(Math.random()*16777215).toString(16);
            inputs.color2.value = '#' + Math.floor(Math.random()*16777215).toString(16);
            inputs.color3.value = '#' + Math.floor(Math.random()*16777215).toString(16);
            inputs.color4.value = '#' + Math.floor(Math.random()*16777215).toString(16);
            
            // Valores aleatórios
            inputs.scale.value = Math.floor(Math.random() * 195) + 5;
            inputs.noiseAmount.value = Math.random().toFixed(2);
            inputs.contrast.value = (Math.random() * 2.9 + 0.1).toFixed(1);
            inputs.distortion.value = Math.random().toFixed(2);
            inputs.blendAmount.value = Math.random().toFixed(2);
            
            // Atualizar displays
            Object.keys(inputs).forEach(key => {
                const displayKey = `${key}Value`;
                if (displays[displayKey]) {
                    displays[displayKey].textContent = inputs[key].value;
                }
            });
            
            // Gerar automaticamente
            setTimeout(generateTexture, 100);
        });

        // Efeitos especiais
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

        // Funções de ruído (Perlin melhorado)
        const permutation = [];
        for (let i = 0; i < 256; i++) permutation[i] = i;
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
        }
        for (let i = 0; i < 256; i++) permutation[256 + i] = permutation[i];

        function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
        function lerp(t, a, b) { return a + t * (b - a); }
        function grad(hash, x, y) {
            const h = hash & 15;
            const u = h < 8 ? x : y;
            const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
            return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
        }

        function noise(x, y, seed) {
            const X = Math.floor(x) & 255;
            const Y = Math.floor(y) & 255;
            x -= Math.floor(x);
            y -= Math.floor(y);
            const u = fade(x);
            const v = fade(y);
            const a = permutation[X + seed] + Y;
            const b = permutation[X + 1 + seed] + Y;
            return lerp(v,
                lerp(u, grad(permutation[a], x, y), grad(permutation[b], x - 1, y)),
                lerp(u, grad(permutation[a + 1], x, y - 1), grad(permutation[b + 1], x - 1, y - 1))
            );
        }

        // Função de textura
        function generateTextureFunction(x, y, params, textureType) {
            let value = 0;
            
            switch(textureType) {
                case 'stone':
                    value = Math.abs(noise(x / params.scale, y / params.scale, params.seed));
                    value = Math.pow(value, 1.5);
                    break;
                case 'wood':
                    const dist = Math.sqrt(Math.pow(x - 0.5, 2) + Math.pow(y - 0.5, 2));
                    value = Math.sin(dist * params.scale + noise(x, y, params.seed) * 10) * 0.5 + 0.5;
                    break;
                case 'earth':
                    value = (noise(x / params.scale, y / params.scale, params.seed) + 1) * 0.5;
                    break;
                case 'marble':
                    const marble = x / params.scale + noise(x / params.scale * 0.5, y / params.scale * 0.5, params.seed) * 4;
                    value = Math.abs(Math.sin(marble)) * 0.8 + 0.2;
                    break;
                case 'clouds':
                    value = (noise(x / params.scale, y / params.scale, params.seed) + 1) * 0.5;
                    value = Math.pow(value, 2);
                    break;
                case 'metal':
                    value = Math.sin(x * params.scale) * Math.cos(y * params.scale) * 0.5 + 0.5;
                    value += noise(x * 5, y * 5, params.seed) * 0.2;
                    break;
                case 'water':
                    value = Math.sin(x * params.scale + noise(x * 2, y * 2, params.seed) * 3) * 
                            Math.cos(y * params.scale + noise(x * 2, y * 2, params.seed + 1) * 3) * 0.5 + 0.5;
                    break;
                case 'lava':
                    value = Math.abs(Math.sin(x * params.scale * 0.3) * Math.cos(y * params.scale * 0.3)) * 0.8;
                    value += noise(x * 10, y * 10, params.seed) * 0.2;
                    break;
                case 'grass':
                    value = noise(x / params.scale, y / params.scale, params.seed) * 0.7 + 0.3;
                    value += Math.sin(x * params.scale * 2) * 0.1;
                    break;
                default:
                    value = noise(x / params.scale, y / params.scale, params.seed) * 0.5 + 0.5;
            }
            
            return Math.max(0, Math.min(1, value));
        }

        // Aplicar efeitos especiais
        function applyEffect(x, y, baseValue, effect, params) {
            switch(effect) {
                case 'depth':
                    return baseValue + noise(x * 20, y * 20, params.seed + 1) * 0.3;
                case 'glow':
                    const glow = Math.sin(x * 10) * Math.cos(y * 10) * 0.2;
                    return baseValue + glow;
                case 'cracks':
                    const crack = noise(x * 50, y * 50, params.seed + 2);
                    return baseValue * (1 - Math.abs(crack * 0.3));
                case 'waves':
                    const wave = Math.sin((x + y) * params.scale * 0.5) * 0.3;
                    return baseValue + wave;
                case 'cells':
                    const cell = Math.abs(noise(x * 15, y * 15, params.seed + 3));
                    return baseValue * (0.7 + cell * 0.3);
                case 'crystals':
                    const crystal = Math.abs(Math.sin(x * 25) * Math.cos(y * 25));
                    return baseValue * (0.6 + crystal * 0.4);
                case 'fibers':
                    const fiber = Math.sin(x * 30) * 0.5 + 0.5;
                    return baseValue * (0.8 + fiber * 0.2);
                case 'sparks':
                    const spark = noise(x * 100, y * 100, params.seed + 4);
                    return baseValue + (spark > 0.8 ? 0.2 : 0);
                default:
                    return baseValue;
            }
        }

        // Misturar texturas
        function blendTextures(value1, value2, mode, amount) {
            switch(mode) {
                case 'add':
                    return value1 * (1 - amount) + (value1 + value2) * amount * 0.5;
                case 'multiply':
                    return value1 * (1 - amount) + (value1 * value2) * amount;
                case 'screen':
                    return value1 * (1 - amount) + (1 - (1 - value1) * (1 - value2)) * amount;
                case 'overlay':
                    return value1 < 0.5 ? 
                        2 * value1 * value2 * amount + value1 * (1 - amount) :
                        1 - 2 * (1 - value1) * (1 - value2) * amount + value1 * (1 - amount);
                case 'difference':
                    return value1 * (1 - amount) + Math.abs(value1 - value2) * amount;
                case 'noise':
                    return value1 + (Math.random() - 0.5) * amount;
                default:
                    return value1;
            }
        }

        // Gerar cor baseada no modo
        function getColor(value, colorMode, colors) {
            switch(colorMode) {
                case 'gradient':
                    if (value < 0.33) return colors[0];
                    if (value < 0.66) return colors[1];
                    if (value < 0.8) return colors[2];
                    return colors[3];
                case 'noise':
                    const r = Math.floor((value + noise(value * 10, 0, 0)) * 127.5);
                    const g = Math.floor((value + noise(0, value * 10, 1)) * 127.5);
                    const b = Math.floor((value + noise(value * 10, value * 10, 2)) * 127.5);
                    return {r, g, b};
                case 'bands':
                    const band = Math.floor(value * 4);
                    return colors[band % 4];
                case 'spots':
                    const spot = Math.sin(value * 20) > 0 ? colors[0] : colors[1];
                    return spot;
                case 'rainbow':
                    const hue = value * 360;
                    return hslToRgb(hue, 80, 50);
                default:
                    return colors[0];
            }
        }

        // Converter HSL para RGB
        function hslToRgb(h, s, l) {
            h /= 360;
            s /= 100;
            l /= 100;
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            return {
                r: Math.round(r * 255),
                g: Math.round(g * 255),
                b: Math.round(b * 255)
            };
        }

        // Hex para RGB
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 0, g: 0, b: 0 };
        }

        // Gerar textura
        function generateTexture() {
            const size = 512;
            
            // Parâmetros
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

            // Cores
            const colors = [
                hexToRgb(inputs.color1.value),
                hexToRgb(inputs.color2.value),
                hexToRgb(inputs.color3.value),
                hexToRgb(inputs.color4.value)
            ];

            // Criar receita
            proceduralRecipe = {
                version: "2.0",
                textures: {
                    primary: currentTextures.primary,
                    secondary: currentTextures.secondary,
                    blend: {
                        mode: params.blendMode,
                        amount: params.blendAmount
                    }
                },
                colors: colors.map(c => `rgb(${c.r}, ${c.g}, ${c.b})`),
                colorMode: params.colorMode,
                parameters: params,
                effects: Array.from(activeEffects)
            };

            // Renderizar
            previewCanvas.width = size;
            previewCanvas.height = size;
            const ctx = previewCanvas.getContext('2d');
            const imageData = ctx.createImageData(size, size);
            const data = imageData.data;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const i = (y * size + x) * 4;
                    
                    // Coordenadas normalizadas com distorção
                    const nx = x / size + noise(x * 0.01, y * 0.01, params.seed) * params.distortion;
                    const ny = y / size + noise(x * 0.01, y * 0.01, params.seed + 100) * params.distortion;
                    
                    // Gerar valores das texturas
                    let value1 = generateTextureFunction(nx, ny, params, currentTextures.primary);
                    let value2 = generateTextureFunction(nx, ny, params, currentTextures.secondary);
                    
                    // Aplicar mistura
                    let value = blendTextures(value1, value2, params.blendMode, params.blendAmount);
                    
                    // Adicionar ruído
                    value += (noise(x * 2, y * 2, params.seed + 200) * 2 - 1) * params.noiseAmount;
                    
                    // Aplicar efeitos especiais
                    activeEffects.forEach(effect => {
                        value = applyEffect(nx, ny, value, effect, params);
                    });
                    
                    // Aplicar contraste
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

            ctx.putImageData(imageData, 0, 0);

            // Mostrar JSON
            const jsonString = JSON.stringify(proceduralRecipe, null, 2);
            const bytes = new Blob([jsonString]).size;
            fileSize.textContent = `${(bytes / 1024).toFixed(2)} KB`;
            jsonPreview.textContent = jsonString;

            canvasContainer.style.display = 'grid';
        }

        // Event Listeners
        generateBtn.addEventListener('click', generateTexture);
        
        downloadBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = `texture-${currentTextures.primary}-${currentTextures.secondary}.png`;
            link.href = previewCanvas.toDataURL();
            link.click();
        });

        downloadJsonBtn.addEventListener('click', () => {
            if (!proceduralRecipe) {
                alert('⚠️ Gere uma textura primeiro!');
                return;
            }

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
            if (!proceduralRecipe) {
                alert('⚠️ Gere uma textura primeiro!');
                return;
            }

            const jsonString = JSON.stringify(proceduralRecipe, null, 2);
            try {
                await navigator.clipboard.writeText(jsonString);
                alert('✅ Receita copiada para a área de transferência!');
            } catch (err) {
                alert('❌ Erro ao copiar receita.');
            }
        });

        // Inicializar
        initializeTextures();
        generateTexture(); // Gerar primeira textura automaticamente