// Pembangkit QR Code (model 2, mode byte, koreksi galat level M, versi 1-9) tanpa dependensi.
// Kapasitas maksimum 180 byte; cukup untuk URL batch. Diverifikasi dengan decoder QR (lihat lib/qr.test.ts dan docs).
type Block = [count: number, dataCodewords: number];
const EC_M: { ecPerBlock: number; blocks: Block[] }[] = [
  { ecPerBlock: 10, blocks: [[1, 16]] }, { ecPerBlock: 16, blocks: [[1, 28]] }, { ecPerBlock: 26, blocks: [[1, 44]] },
  { ecPerBlock: 18, blocks: [[2, 32]] }, { ecPerBlock: 24, blocks: [[2, 43]] }, { ecPerBlock: 16, blocks: [[4, 27]] },
  { ecPerBlock: 18, blocks: [[4, 31]] }, { ecPerBlock: 22, blocks: [[2, 38], [2, 39]] }, { ecPerBlock: 22, blocks: [[3, 36], [2, 37]] },
];
const dataCapacity = (version: number) => EC_M[version - 1].blocks.reduce((a, [n, d]) => a + n * d, 0);

// Aritmetika GF(256), polinomial 0x11D.
const EXP = new Array<number>(512); const LOG = new Array<number>(256);
for (let i = 0, x = 1; i < 255; i += 1) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function reedSolomon(data: number[], degree: number): number[] {
  let gen = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array<number>(gen.length + 1).fill(0);
    gen.forEach((coef, j) => { next[j] ^= coef; next[j + 1] ^= mul(coef, EXP[i]); });
    gen = next;
  }
  const rem = new Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem.shift()!; rem.push(0);
    for (let i = 0; i < degree; i += 1) rem[i] ^= mul(gen[i + 1], factor);
  }
  return rem;
}

function encodeData(bytes: number[], version: number): number[] {
  const bits: number[] = [];
  const push = (value: number, length: number) => { for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1); };
  push(0b0100, 4); push(bytes.length, 8); bytes.forEach((b) => push(b, 8));
  const capacityBits = dataCapacity(version) * 8;
  push(0, Math.min(4, capacityBits - bits.length));
  while (bits.length % 8) bits.push(0);
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8).join(""), 2));
  for (let pad = 0xec; out.length < dataCapacity(version); pad = pad === 0xec ? 0x11 : 0xec) out.push(pad);
  return out;
}

function interleave(data: number[], version: number): number[] {
  const { ecPerBlock, blocks } = EC_M[version - 1];
  const dataBlocks: number[][] = []; let offset = 0;
  for (const [count, size] of blocks) for (let i = 0; i < count; i += 1) { dataBlocks.push(data.slice(offset, offset + size)); offset += size; }
  const ecBlocks = dataBlocks.map((block) => reedSolomon(block, ecPerBlock));
  const result: number[] = [];
  const maxLen = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxLen; i += 1) for (const block of dataBlocks) if (i < block.length) result.push(block[i]);
  for (let i = 0; i < ecPerBlock; i += 1) for (const block of ecBlocks) result.push(block[i]);
  return result;
}

const bit = (value: number, i: number) => ((value >>> i) & 1) === 1;

function alignmentPositions(version: number, size: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const positions = [6];
  for (let pos = size - 7; positions.length < count; pos -= step) positions.splice(1, 0, pos);
  return positions;
}

const MASKS: ((r: number, c: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0, (r) => r % 2 === 0, (_r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0, (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function penalty(m: boolean[][]): number {
  const n = m.length; let score = 0;
  const runScore = (line: boolean[]) => { let s = 0, run = 1; for (let i = 1; i <= line.length; i += 1) { if (i < line.length && line[i] === line[i - 1]) run += 1; else { if (run >= 5) s += 3 + (run - 5); run = 1; } } return s; };
  for (let i = 0; i < n; i += 1) { score += runScore(m[i]); score += runScore(m.map((row) => row[i])); }
  for (let r = 0; r < n - 1; r += 1) for (let c = 0; c < n - 1; c += 1) if (m[r][c] === m[r][c + 1] && m[r][c] === m[r + 1][c] && m[r][c] === m[r + 1][c + 1]) score += 3;
  const pattern = [true, false, true, true, true, false, true];
  const matches = (line: boolean[], start: number) => pattern.every((v, k) => line[start + k] === v);
  for (let i = 0; i < n; i += 1) {
    const row = m[i]; const col = m.map((r) => r[i]);
    for (let s = 0; s + 7 <= n; s += 1) {
      for (const line of [row, col]) {
        if (!matches(line, s)) continue;
        const before = s >= 4 && line.slice(s - 4, s).every((v) => !v); const after = s + 11 <= n && line.slice(s + 7, s + 11).every((v) => !v);
        if (before || after) score += 40;
      }
    }
  }
  const dark = m.flat().filter(Boolean).length; const percent = (dark * 100) / (n * n);
  return score + Math.floor(Math.abs(percent - 50) / 5) * 10;
}

/** Mengembalikan matriks modul (true = gelap) tanpa quiet zone. */
export function qrMatrix(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));
  let version = 1;
  while (version <= 9 && bytes.length > Math.floor((dataCapacity(version) * 8 - 12) / 8)) version += 1;
  if (version > 9) throw new Error("qr_text_too_long");
  const size = version * 4 + 17;
  const codewords = interleave(encodeData(bytes, version), version);

  const modules: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const setFn = (x: number, y: number, dark: boolean) => { if (x < 0 || y < 0 || x >= size || y >= size) return; modules[y][x] = dark; isFunction[y][x] = true; };

  for (let i = 0; i < size; i += 1) { setFn(6, i, i % 2 === 0); setFn(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy += 1) for (let dx = -4; dx <= 4; dx += 1) { const dist = Math.max(Math.abs(dx), Math.abs(dy)); setFn(cx + dx, cy + dy, dist !== 2 && dist !== 4); }
  }
  const align = alignmentPositions(version, size);
  align.forEach((ay, i) => align.forEach((ax, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === align.length - 1) || (i === align.length - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) setFn(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));

  const drawFormat = (mask: number) => {
    const data = (0b00 << 3) | mask; // level M = 00
    let rem = data; for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i += 1) setFn(8, i, bit(bits, i));
    setFn(8, 7, bit(bits, 6)); setFn(8, 8, bit(bits, 7)); setFn(7, 8, bit(bits, 8));
    for (let i = 9; i < 15; i += 1) setFn(14 - i, 8, bit(bits, i));
    for (let i = 0; i < 8; i += 1) setFn(size - 1 - i, 8, bit(bits, i));
    for (let i = 8; i < 15; i += 1) setFn(8, size - 15 + i, bit(bits, i));
    setFn(8, size - 8, true);
  };
  drawFormat(0);
  if (version >= 7) {
    let rem = version; for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i += 1) { const dark = bit(bits, i); const a = size - 11 + (i % 3); const b = Math.floor(i / 3); setFn(a, b, dark); setFn(b, a, dark); }
  }

  let index = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j; const upward = ((right + 1) & 2) === 0; const y = upward ? size - 1 - vert : vert;
        if (!isFunction[y][x] && index < codewords.length * 8) { modules[y][x] = bit(codewords[index >>> 3], 7 - (index & 7)); index += 1; }
      }
    }
  }

  let best = 0; let bestScore = Infinity; let bestModules = modules;
  for (let mask = 0; mask < 8; mask += 1) {
    const trial = modules.map((row) => row.slice());
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) if (!isFunction[y][x] && MASKS[mask](y, x)) trial[y][x] = !trial[y][x];
    drawFormat(mask); // menulis bit format ke `modules`; salin modul fungsi ke trial
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) if (isFunction[y][x]) trial[y][x] = modules[y][x];
    const s = penalty(trial);
    if (s < bestScore) { bestScore = s; best = mask; bestModules = trial; }
  }
  drawFormat(best);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) if (isFunction[y][x]) bestModules[y][x] = modules[y][x];
  return bestModules;
}

/** Path SVG (satu elemen) untuk matriks QR dengan quiet zone `border` modul. */
export function qrSvgPath(text: string, border = 4): { d: string; size: number } {
  const m = qrMatrix(text); const parts: string[] = [];
  m.forEach((row, y) => row.forEach((dark, x) => { if (dark) parts.push(`M${x + border} ${y + border}h1v1h-1z`); }));
  return { d: parts.join(""), size: m.length + border * 2 };
}
