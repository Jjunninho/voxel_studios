// js/shapes/shapes_props.js
if (window.ShapeRegistry) {

    // --- MESA RÚSTICA ---
    window.ShapeRegistry.table = {
        name: "Mesa de Madeira",
        icon: "🪑",
        category: "basic", // Vamos mudar para 'props' depois
        params: [
            { name: "width", label: "Largura", default: 3, min: 2, max: 6 },
            { name: "length", label: "Comprimento", default: 4, min: 2, max: 8 }
        ],
        generate: function(p) {
            const w = p.width;
            const l = p.length;
            const ox = -Math.floor(w/2);
            const oz = -Math.floor(l/2);

            // Tampo
            for(let x=0; x<w; x++) {
                for(let z=0; z<l; z++) {
                    addBlockAt(ox+x, 2, oz+z, "#8e44ad", "cube", {x:1, y:0.2, z:1});
                }
            }

            // Pernas (Cantos)
            const legs = [
                {x:0, z:0}, {x:w-1, z:0}, 
                {x:0, z:l-1}, {x:w-1, z:l-1}
            ];
            legs.forEach(leg => {
                addBlockAt(ox+leg.x, 0, oz+leg.z, "#5d4037", "cylinder", {x:0.3, y:1, z:0.3});
                addBlockAt(ox+leg.x, 1, oz+leg.z, "#5d4037", "cylinder", {x:0.3, y:1, z:0.3});
            });
        }
    };

    // --- CADEIRA ---
    window.ShapeRegistry.chair = {
        name: "Cadeira",
        icon: "💺",
        category: "basic",
        params: [], // Sem params, tamanho fixo
        generate: function(p) {
            // Pernas
            addBlockAt(0, 0, 0, "#8d6e63", "cylinder", {x:0.2, y:1, z:0.2});
            addBlockAt(1, 0, 0, "#8d6e63", "cylinder", {x:0.2, y:1, z:0.2});
            addBlockAt(0, 0, 1, "#8d6e63", "cylinder", {x:0.2, y:1, z:0.2});
            addBlockAt(1, 0, 1, "#8d6e63", "cylinder", {x:0.2, y:1, z:0.2});

            // Assento
            addBlockAt(0.5, 1, 0.5, "#a1887f", "cube", {x:1.5, y:0.2, z:1.5});

            // Encosto
            addBlockAt(0, 2, 0, "#8d6e63", "cylinder", {x:0.2, y:1.5, z:0.2});
            addBlockAt(1, 2, 0, "#8d6e63", "cylinder", {x:0.2, y:1.5, z:0.2});
            addBlockAt(0.5, 2.5, 0, "#a1887f", "cube", {x:1.2, y:0.5, z:0.2});
        }
    };

    console.log("🧸 Shapes Props Carregadas");
}