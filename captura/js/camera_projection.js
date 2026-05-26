// =============================================================================
// VOXEL GENESIS - CAMERA PROJECTION (VERSÃO CORRIGIDA - PIXEL MATRIX)
// =============================================================================

const CameraProjection = {
    // Estado
    isActive: false,
    sourceImage: null,
    sourceCanvas: null,
    sourceCtx: null,
    points: [],
    maxPoints: 4,
    
    // Configurações
    pointRadius: 8,
    pointColor: '#ffcc00',
    lineColor: '#00ffff',
    lineWidth: 2,
    
    // Canvas de saída - ALTERADO PARA 64x64!
    outputSize: 64, // 🔥 MUDANÇA CRÍTICA
    outputCanvas: null,
    outputCtx: null,

    init() {
        this.outputCanvas = document.createElement('canvas');
        this.outputCanvas.width = this.outputSize;
        this.outputCanvas.height = this.outputSize;
        this.outputCtx = this.outputCanvas.getContext('2d');
        console.log('✅ Camera Projection System inicializado (Pixel Matrix Mode)');
    },

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.sourceImage = img;
                    this.setupSourceCanvas(img);
                    this.points = [];
                    resolve(img);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    setupSourceCanvas(img) {
        const maxSize = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxSize || height > maxSize) {
            if (width > height) { height = (maxSize / width) * height; width = maxSize; }
            else { width = (maxSize / height) * width; height = maxSize; }
        }
        this.sourceCanvas = document.createElement('canvas');
        this.sourceCanvas.width = width;
        this.sourceCanvas.height = height;
        this.sourceCtx = this.sourceCanvas.getContext('2d');
        this.sourceCtx.drawImage(img, 0, 0, width, height);
    },

    addPoint(x, y) {
        if (this.points.length >= this.maxPoints) return false;
        this.points.push({ x, y });
        this.drawPoints();
        return this.points.length === this.maxPoints;
    },

    removeLastPoint() {
        this.points.pop();
        this.drawPoints();
    },

    resetPoints() {
        this.points = [];
        this.drawPoints();
    },

    drawPoints() {
        if (!this.sourceCanvas || !this.sourceCtx) return;
        this.sourceCtx.drawImage(this.sourceImage, 0, 0, this.sourceCanvas.width, this.sourceCanvas.height);
        
        if (this.points.length > 1) {
            this.sourceCtx.strokeStyle = this.lineColor;
            this.sourceCtx.lineWidth = this.lineWidth;
            this.sourceCtx.beginPath();
            this.points.forEach((point, i) => {
                if (i === 0) this.sourceCtx.moveTo(point.x, point.y);
                else this.sourceCtx.lineTo(point.x, point.y);
            });
            if (this.points.length === 4) this.sourceCtx.closePath();
            this.sourceCtx.stroke();
        }
        
        this.points.forEach((point, i) => {
            const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44'];
            this.sourceCtx.fillStyle = '#000';
            this.sourceCtx.beginPath();
            this.sourceCtx.arc(point.x, point.y, this.pointRadius + 2, 0, Math.PI * 2);
            this.sourceCtx.fill();
            this.sourceCtx.fillStyle = colors[i] || this.pointColor;
            this.sourceCtx.beginPath();
            this.sourceCtx.arc(point.x, point.y, this.pointRadius, 0, Math.PI * 2);
            this.sourceCtx.fill();
            this.sourceCtx.fillStyle = '#000';
            this.sourceCtx.font = 'bold 12px Arial';
            this.sourceCtx.textAlign = 'center';
            this.sourceCtx.textBaseline = 'middle';
            this.sourceCtx.fillText(i + 1, point.x, point.y);
        });
    },

    // Funções matemáticas de homografia (mantidas iguais)
    computeHomography(srcPoints, dstPoints) {
        const A = []; const b = [];
        for (let i = 0; i < 4; i++) {
            const x = srcPoints[i].x; const y = srcPoints[i].y;
            const u = dstPoints[i].x; const v = dstPoints[i].y;
            A.push([x, y, 1, 0, 0, 0, -u*x, -u*y]);
            A.push([0, 0, 0, x, y, 1, -v*x, -v*y]);
            b.push(u); b.push(v);
        }
        const h = this.solveLeastSquares(A, b);
        h.push(1);
        return [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], h[8]]];
    },

    solveLeastSquares(A, b) {
        const m = A.length; const n = A[0].length;
        const ATA = [];
        for (let i = 0; i < n; i++) {
            ATA[i] = [];
            for (let j = 0; j < n; j++) {
                let sum = 0;
                for (let k = 0; k < m; k++) sum += A[k][i] * A[k][j];
                ATA[i][j] = sum;
            }
        }
        const ATb = [];
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let k = 0; k < m; k++) sum += A[k][i] * b[k];
            ATb[i] = sum;
        }
        return this.gaussianElimination(ATA, ATb);
    },

    gaussianElimination(A, b) {
        const n = A.length;
        const Ab = A.map((row, i) => [...row, b[i]]);
        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let k = i + 1; k < n; k++) if (Math.abs(Ab[k][i]) > Math.abs(Ab[maxRow][i])) maxRow = k;
            [Ab[i], Ab[maxRow]] = [Ab[maxRow], Ab[i]];
            for (let k = i + 1; k < n; k++) {
                const factor = Ab[k][i] / Ab[i][i];
                for (let j = i; j <= n; j++) Ab[k][j] -= factor * Ab[i][j];
            }
        }
        const x = new Array(n);
        for (let i = n - 1; i >= 0; i--) {
            x[i] = Ab[i][n];
            for (let j = i + 1; j < n; j++) x[i] -= Ab[i][j] * x[j];
            x[i] /= Ab[i][i];
        }
        return x;
    },

    applyHomography(x, y, H) {
        const w = H[2][0] * x + H[2][1] * y + H[2][2];
        const xp = (H[0][0] * x + H[0][1] * y + H[0][2]) / w;
        const yp = (H[1][0] * x + H[1][1] * y + H[1][2]) / w;
        return [xp, yp];
    },

    sampleBilinear(imageData, x, y) {
        const x1 = Math.floor(x); const y1 = Math.floor(y);
        const x2 = Math.ceil(x); const y2 = Math.ceil(y);
        const dx = x - x1; const dy = y - y1;
        const width = imageData.width; const height = imageData.height;
        if (x1 < 0 || x2 >= width || y1 < 0 || y2 >= height) return [0, 0, 0, 0];
        const getPixel = (px, py) => {
            const idx = (py * width + px) * 4;
            return [imageData.data[idx], imageData.data[idx + 1], imageData.data[idx + 2], imageData.data[idx + 3]];
        };
        const p11 = getPixel(x1, y1); const p21 = getPixel(x2, y1);
        const p12 = getPixel(x1, y2); const p22 = getPixel(x2, y2);
        const result = [];
        for (let i = 0; i < 4; i++) {
            const v1 = p11[i] * (1 - dx) + p21[i] * dx;
            const v2 = p12[i] * (1 - dx) + p22[i] * dx;
            result[i] = Math.round(v1 * (1 - dy) + v2 * dy);
        }
        return result;
    },

    invertMatrix3x3(M) {
        const det = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1])
                  - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0])
                  + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
        if (Math.abs(det) < 1e-10) throw new Error("Matriz singular, não inversível");
        const invDet = 1 / det;
        return [
            [(M[1][1] * M[2][2] - M[1][2] * M[2][1]) * invDet,
             (M[0][2] * M[2][1] - M[0][1] * M[2][2]) * invDet,
             (M[0][1] * M[1][2] - M[0][2] * M[1][1]) * invDet],
            [(M[1][2] * M[2][0] - M[1][0] * M[2][2]) * invDet,
             (M[0][0] * M[2][2] - M[0][2] * M[2][0]) * invDet,
             (M[0][2] * M[1][0] - M[0][0] * M[1][2]) * invDet],
            [(M[1][0] * M[2][1] - M[1][1] * M[2][0]) * invDet,
             (M[0][1] * M[2][0] - M[0][0] * M[2][1]) * invDet,
             (M[0][0] * M[1][1] - M[0][1] * M[1][0]) * invDet]
        ];
    },

    warpPerspective() {
        if (this.points.length !== 4) throw new Error('4 pontos necessários');
        
        const size = this.outputSize;
        const dstPoints = [
            { x: 0, y: 0 },
            { x: size, y: 0 },
            { x: size, y: size },
            { x: 0, y: size }
        ];
        
        const H = this.computeHomography(this.points, dstPoints);
        const Hinv = this.invertMatrix3x3(H);
        
        // 🔥 CORREÇÃO: Criar canvas limpo temporário com a imagem original
        const cleanCanvas = document.createElement('canvas');
        cleanCanvas.width = this.sourceCanvas.width;
        cleanCanvas.height = this.sourceCanvas.height;
        const cleanCtx = cleanCanvas.getContext('2d');
        cleanCtx.drawImage(this.sourceImage, 0, 0, cleanCanvas.width, cleanCanvas.height);
        
        const srcData = cleanCtx.getImageData(0, 0, cleanCanvas.width, cleanCanvas.height);
        const outputData = this.outputCtx.createImageData(size, size);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const [srcX, srcY] = this.applyHomography(x, y, Hinv);
                const color = this.sampleBilinear(srcData, srcX, srcY);
                const idx = (y * size + x) * 4;
                outputData.data[idx] = color[0];
                outputData.data[idx + 1] = color[1];
                outputData.data[idx + 2] = color[2];
                outputData.data[idx + 3] = color[3];
            }
        }
        this.outputCtx.putImageData(outputData, 0, 0);
        return this.outputCanvas.toDataURL('image/png');
    },

    // =========================================================================
    // 🔥 NOVA FUNÇÃO - CONVERSÃO REAL PARA PIXEL MATRIX
    // =========================================================================

    /**
     * Gera JSON com PIXEL MATRIX real (como o 03_recipe.json)
     */
    generateTextureRecipe(filename = 'camera_texture') {
        if (this.points.length !== 4) {
            throw new Error('É necessário 4 pontos para gerar a receita');
        }
        
        // 1. Processa a imagem (64x64)
        this.warpPerspective();
        
        // 2. Extrai a matriz de pixels real
        const pixelMatrix = this.extractPixelMatrix();
        
        // 3. Extrai cores dominantes (para metadados)
        const dominantColors = this.extractDominantColors(this.outputCanvas, 5);
        
        // 4. Monta o JSON no formato correto
        const recipe = {
            type: "pixel_matrix", // 🔥 MODO CORRETO
            
            metadata: {
                originalFilename: filename,
                creationTool: "Camera Projection",
                gridSize: this.outputSize
            },
            
            pixelData: pixelMatrix, // 🔥 MATRIZ REAL DE 64x64
            
            colors: dominantColors, // Cores dominantes (para referência)
            
            renderMode: "matrix", // 🔥 Renderizar diretamente
            
            parameters: {
                seed: 0,
                scale: 1,
                tiling: false
            }
        };
        
        return recipe;
    },

    /**
     * Extrai a matriz de pixels 64x64 do canvas
     */
    extractPixelMatrix() {
        const size = this.outputSize;
        const imageData = this.outputCtx.getImageData(0, 0, size, size);
        const data = imageData.data;
        const matrix = [];
        
        for (let y = 0; y < size; y++) {
            const row = [];
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                // Converter RGB para HEX
                const hex = '#' + 
                    r.toString(16).padStart(2, '0') +
                    g.toString(16).padStart(2, '0') +
                    b.toString(16).padStart(2, '0');
                
                row.push(hex);
            }
            matrix.push(row);
        }
        
        return matrix;
    },

    /**
     * K-Means para extrair cores dominantes
     */
    extractDominantColors(canvas, k = 5) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = [];
        
        // Amostragem de pixels (pega 1 a cada 16 para performance)
        for (let i = 0; i < imageData.data.length; i += 64) {
            if (imageData.data[i + 3] < 128) continue; // Ignora transparentes
            pixels.push([
                imageData.data[i], 
                imageData.data[i + 1], 
                imageData.data[i + 2]
            ]);
        }
        
        if (pixels.length === 0) return ['#ffffff'];

        // K-Means simplificado (3 iterações)
        let centroids = [];
        for (let i = 0; i < k; i++) {
            const idx = Math.floor(Math.random() * pixels.length);
            centroids.push([...pixels[idx]]);
        }
        
        for (let iter = 0; iter < 3; iter++) {
            const clusters = Array.from({ length: k }, () => []);
            
            pixels.forEach(pixel => {
                let minDist = Infinity;
                let minIdx = 0;
                
                centroids.forEach((centroid, i) => {
                    const dist = Math.sqrt(
                        (pixel[0] - centroid[0]) ** 2 + 
                        (pixel[1] - centroid[1]) ** 2 + 
                        (pixel[2] - centroid[2]) ** 2
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        minIdx = i;
                    }
                });
                
                clusters[minIdx].push(pixel);
            });
            
            centroids = clusters.map((cluster, i) => {
                if (cluster.length === 0) return centroids[i];
                const sum = cluster.reduce((acc, p) => [
                    acc[0] + p[0], 
                    acc[1] + p[1], 
                    acc[2] + p[2]
                ], [0, 0, 0]);
                return [
                    Math.round(sum[0] / cluster.length), 
                    Math.round(sum[1] / cluster.length), 
                    Math.round(sum[2] / cluster.length)
                ];
            });
        }
        
        return centroids.map(c => '#' + c.map(v => 
            Math.max(0, Math.min(255, Math.round(v)))
                .toString(16)
                .padStart(2, '0')
        ).join(''));
    }
};

// Auto-inicializar
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        CameraProjection.init();
    });
}
