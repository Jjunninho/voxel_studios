/* ══════════════════════════════════════════════════════════════════
   VOXEL FORGE — ENGINE PROCEDURAL (v2.0 - ENHANCED MUTATIONS)
   ══════════════════════════════════════════════════════════════════ */

let scene, camera, renderer, mesh, material;
const camState = { r: 60, th: 0.5, ph: 0.8 };
let isDragging = false, prevMouse = { x: 0, y: 0 };

let recipes = [];
let currentRecipe = null;
let generatedVoxels = [];
const simplex = new SimplexNoise(); 

function init() {
    const cv = document.getElementById('c3d');
    const vp = document.getElementById('viewport');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08080f);
    
    camera = new THREE.PerspectiveCamera(45, vp.clientWidth / vp.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
    renderer.setSize(vp.clientWidth, vp.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene.add(new THREE.AmbientLight(0xffffff, 0.8)); 
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(30, 50, 40);
    scene.add(dir);
    
    scene.add(new THREE.GridHelper(100, 100, 0x1a1a28, 0x0f0f18));

    material = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        shininess: 30
    });

    updateCamera();
    animate();

    new ResizeObserver(() => {
        camera.aspect = vp.clientWidth / vp.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(vp.clientWidth, vp.clientHeight);
    }).observe(vp);

    cv.addEventListener('mousedown', e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', e => {
        if (!isDragging) return;
        camState.th -= (e.clientX - prevMouse.x) * 0.01;
        camState.ph = Math.max(0.1, Math.min(Math.PI - 0.1, camState.ph - (e.clientY - prevMouse.y) * 0.01));
        prevMouse = { x: e.clientX, y: e.clientY };
        updateCamera();
    });
    cv.addEventListener('wheel', e => {
        camState.r = Math.max(5, Math.min(200, camState.r + e.deltaY * 0.1));
        updateCamera();
    });
}

function updateCamera() {
    camera.position.set(
        camState.r * Math.sin(camState.ph) * Math.sin(camState.th),
        camState.r * Math.cos(camState.ph),
        camState.r * Math.sin(camState.ph) * Math.cos(camState.th)
    );
    camera.lookAt(0, 5, 0);
}

function animate() { requestAnimationFrame(animate); renderer.render(scene, camera); }

window.loadRecipes = function(files) {
    const f = files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const json = JSON.parse(e.target.result);
            
            // Suporta AMBOS os formatos:
            // v1.0: { recipes: [...] }
            // v2.0: { recipesByClass: { "Classe1": [...], "Classe2": [...] } }
            
            if (json.recipes && Array.isArray(json.recipes)) {
                // Formato v1.0 (simples)
                recipes = json.recipes;
            } else if (json.recipesByClass && typeof json.recipesByClass === 'object') {
                // Formato v2.0 (clustered) - achata todas as receitas
                recipes = [];
                Object.keys(json.recipesByClass).forEach(className => {
                    const classRecipes = json.recipesByClass[className];
                    if (Array.isArray(classRecipes)) {
                        classRecipes.forEach(r => {
                            recipes.push({
                                ...r,
                                name: `${className} - ${r.name}` // Adiciona prefixo da classe
                            });
                        });
                    }
                });
            } else {
                throw new Error('Formato de arquivo inválido. Esperado "recipes" ou "recipesByClass"');
            }
            
            if (!recipes.length) {
                throw new Error('Nenhuma receita encontrada no arquivo');
            }
            
            document.getElementById('recipeInfo').innerText = `📦 ${recipes.length} receitas carregadas`;
            const sel = document.getElementById('recipeSel');
            sel.innerHTML = recipes.map((r, i) => `<option value="${i}">${r.name}</option>`).join('');
            document.getElementById('classCard').style.display = 'block';
            document.getElementById('genBtn').disabled = false;
            window.selectRecipe();
        } catch (err) { alert('Erro no JSON: ' + err.message); }
    };
    reader.readAsText(f);
};

window.selectRecipe = function() {
    currentRecipe = recipes[document.getElementById('recipeSel').value];
};

window.generate = function() {
    if (!currentRecipe) return;

    if (!material) {
        material = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 30 });
    }

    const R = currentRecipe;
    const struct = R.structure;
    
    let seedStr = document.getElementById('seedIn').value;
    if(seedStr === 'random') seedStr = Math.random().toString();
    const seed = seedStr.split('').reduce((a,b)=>a+b.charCodeAt(0),0);
    
    // 🆕 NOVOS PARÂMETROS
    const chaos = parseFloat(document.getElementById('chaosLvl').value);
    const colorVar = parseFloat(document.getElementById('colorVar').value) / 100;
    const scaleG = parseFloat(document.getElementById('scaleG').value);
    const density = parseFloat(document.getElementById('density').value) / 100;
    const heightMult = parseFloat(document.getElementById('heightMult').value);
    const erosion = parseFloat(document.getElementById('erosion').value) / 100;
    const horizontalNoise = parseFloat(document.getElementById('hNoise').value) / 100;
    const verticalStretch = parseFloat(document.getElementById('vStretch').value);

    generatedVoxels = [];
    const W = struct.silhouette.w;
    const H = struct.silhouette.h;
    const mask = struct.silhouette.mask;
    const depthData = Array.isArray(struct.depthProfile) ? struct.depthProfile : struct.depthProfile.data;
    const palette = struct.palette || [{hex: '#888888', weight: 1}];
    
    const maxDepth = struct.bounds ? struct.bounds.d : 8;
    const depthMultiplier = maxDepth / (Math.max(...depthData.filter(v => v > 0)) || 1);

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = y * W + x;
            if (!mask[i]) continue; 

            // 🆕 DENSIDADE - Probabilidade de gerar o voxel
            if (Math.random() > density) continue;

            // 🆕 RUÍDO HORIZONTAL - Desloca posição X/Z
            const hNoiseX = simplex.noise2D(x * 0.2, y * 0.2 + seed) * horizontalNoise * 3;
            const hNoiseZ = simplex.noise2D(x * 0.2 + 100, y * 0.2 + seed) * horizontalNoise * 3;

            let zBase = depthData[i] * depthMultiplier;
            
            // 🆕 MULTIPLICADOR DE ALTURA
            zBase *= heightMult;
            
            const noiseVal = simplex.noise3D(x * 0.1, y * 0.1, seed * 0.01); 
            const variation = (R.variation.noiseLevel || 0.1) * chaos;
            let finalHeight = Math.max(1, Math.round(zBase + (noiseVal * zBase * variation)));
            
            // 🆕 ALONGAMENTO VERTICAL
            finalHeight = Math.round(finalHeight * verticalStretch);
            
            const baseColorHex = pickColor(palette);

            for (let z = 0; z < finalHeight; z++) {
                // 🆕 EROSÃO - Remove voxels aleatoriamente (mais na base)
                const erosionChance = erosion * (1 - z / finalHeight);
                if (Math.random() < erosionChance) continue;

                const color = applyColorVar(baseColorHex, colorVar, z, finalHeight);
                generatedVoxels.push({
                    x: ((x - W/2) + hNoiseX) * scaleG,
                    y: z * scaleG, 
                    z: ((y - H/2) + hNoiseZ) * scaleG,
                    r: color.r, g: color.g, b: color.b
                });
            }
        }
    }

    rebuildMesh(generatedVoxels, scaleG);
    document.getElementById('genStats').innerText = `Gerado: ${generatedVoxels.length} blocos`;
    document.getElementById('expBtn').disabled = false;
};

function rebuildMesh(voxels, scale) {
    if (mesh) { 
        scene.remove(mesh); 
        mesh.geometry.dispose(); 
    }
    if (!voxels.length) return;

    const geo = new THREE.BoxGeometry(scale, scale, scale);
    mesh = new THREE.InstancedMesh(geo, material, voxels.length);
    
    const dummy = new THREE.Object3D();
    const matrices = new Float32Array(voxels.length * 16);
    const colors = [];
    
    for (let i = 0; i < voxels.length; i++) {
        const v = voxels[i];
        dummy.position.set(v.x, v.y, v.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        dummy.matrix.toArray(matrices, i * 16);
        colors.push(v.r / 255, v.g / 255, v.b / 255);
    }
    
    mesh.instanceMatrix.array.set(matrices);
    
    const colorAttribute = new THREE.InstancedBufferAttribute(new Float32Array(colors), 3);
    mesh.geometry.setAttribute('instanceColor', colorAttribute);
    
    material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
            '#include <color_pars_vertex>',
            `#include <color_pars_vertex>
            attribute vec3 instanceColor;
            varying vec3 vInstanceColor;`
        ).replace(
            '#include <color_vertex>',
            `#include <color_vertex>
            vInstanceColor = instanceColor;`
        );
        
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_pars_fragment>',
            `#include <color_pars_fragment>
            varying vec3 vInstanceColor;`
        ).replace(
            '#include <color_fragment>',
            `#include <color_fragment>
            diffuseColor.rgb *= vInstanceColor;`
        );
    };
    
    mesh.instanceMatrix.needsUpdate = true;
    mesh.geometry.computeBoundingSphere(); 
    
    scene.add(mesh);
    material.needsUpdate = true;
}

function pickColor(palette) {
    let r = Math.random();
    let sum = 0;
    for (let p of palette) {
        sum += p.weight;
        if (r <= sum) return p.hex;
    }
    return palette[0].hex;
}

function applyColorVar(hex, variance, z, maxZ) {
    const color = new THREE.Color(hex);
    if (variance > 0) {
        const shift = (Math.random() - 0.5) * variance;
        color.r = Math.max(0, Math.min(1, color.r + shift));
        color.g = Math.max(0, Math.min(1, color.g + shift));
        color.b = Math.max(0, Math.min(1, color.b + shift));
    }
    const ao = 0.7 + (z / Math.max(1, maxZ)) * 0.3;
    color.multiplyScalar(ao);
    return { r: Math.floor(color.r * 255), g: Math.floor(color.g * 255), b: Math.floor(color.b * 255) };
}

window.exportOBJ = function() {
    if (!generatedVoxels.length) return;
    const json = JSON.stringify({
        blocks: generatedVoxels.map(v => ({
            position: { x: v.x, y: v.y, z: v.z },
            color: new THREE.Color(v.r/255, v.g/255, v.b/255).getStyle(),
            type: 'cube',
            scale: { x: 1, y: 1, z: 1 }
        })),
        _meta: { recipe: currentRecipe.name, timestamp: new Date().toISOString() }
    }, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Voxel_${currentRecipe.name}.json`;
    a.click();
};

document.getElementById('recipeInput').addEventListener('change', e => window.loadRecipes(e.target.files));
init();
