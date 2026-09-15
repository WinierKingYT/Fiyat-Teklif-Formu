import { deflateSync } from 'node:zlib';

const CRC_TABLE = (() => {
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[n] = c;
    }
    return table;
})();

function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/**
 * Deterministic PNG per product index — each image has a distinct hue and a
 * soft vertical light band, so a 13-14 item "image" quote carries 13-14
 * visually different product thumbnails instead of one 1x1 transparent pixel
 * reused everywhere (the old synthetic fixture).
 */
export function productImagePng(index: number, width = 240, height = 180): Buffer {
    const hues = [220, 15, 130, 45, 280, 60, 340, 190, 100, 0, 160, 25, 250, 70, 310, 200];
    const hue = hues[index % hues.length];
    const s = 0.55;
    const l = 0.5;
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const h = hue / 60;
    const x = chroma * (1 - Math.abs((h % 2) - 1));
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 1) { r = chroma; g = x; }
    else if (h < 2) { r = x; g = chroma; }
    else if (h < 3) { g = chroma; b = x; }
    else if (h < 4) { g = x; b = chroma; }
    else if (h < 5) { r = x; b = chroma; }
    else { r = chroma; b = x; }
    const m = l - chroma / 2;
    const base = [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];

    const raw = Buffer.alloc(height * (1 + width * 3));
    for (let y = 0; y < height; y++) {
        const row = y * (1 + width * 3);
        raw[row] = 0; // filter: none
        for (let px = 0; px < width; px++) {
            const o = row + 1 + px * 3;
            const band = Math.round(14 * Math.sin(((px + y) / width) * Math.PI));
            for (let c = 0; c < 3; c++) {
                raw[o + c] = Math.max(0, Math.min(255, base[c] + band));
            }
        }
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // color type: truecolor RGB
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', deflateSync(raw)),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}