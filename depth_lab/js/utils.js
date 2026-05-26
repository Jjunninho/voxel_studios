export function mkCanvas(w, h) {
    const e = document.createElement('canvas');
    e.width = w; e.height = h;
    const c = e.getContext('2d');
    c.imageSmoothingEnabled = false;
    return { e, c };
}

export function toHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function r4(n) {
    return Math.round(n * 10000) / 10000;
}

export function setSt(msg, cls) {
    const e = document.getElementById('status');
    if (e) {
        e.innerHTML = msg;
        e.className = cls === 'ok' ? 'sok' : cls === 'err' ? 'serr' : 'swarn';
    }
}