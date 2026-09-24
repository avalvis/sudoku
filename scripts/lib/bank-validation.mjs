// Independent bit-mask enumerator used only during content import/verification.
export function solutionsFor(text, limit = 2) {
  if (!/^[0-9]{81}$/.test(text)) throw new Error('Expected 81 digits');
  const cells = [...text].map(Number), rows = Array(9).fill(0), cols = Array(9).fill(0), blocks = Array(9).fill(0);
  const block = i => Math.floor(i / 27) * 3 + Math.floor(i % 9 / 3);
  for (let i = 0; i < 81; i++) {
    if (!cells[i]) continue;
    const bit = 1 << cells[i], r = Math.floor(i / 9), c = i % 9, b = block(i);
    if ((rows[r] | cols[c] | blocks[b]) & bit) return [];
    rows[r] |= bit; cols[c] |= bit; blocks[b] |= bit;
  }
  const solutions = [];
  const visit = () => {
    if (solutions.length >= limit) return;
    let spot = -1, mask = 0, minimum = 10;
    for (let i = 0; i < 81; i++) {
      if (cells[i]) continue;
      const available = 1022 & ~(rows[Math.floor(i / 9)] | cols[i % 9] | blocks[block(i)]);
      if (!available) return;
      let count = 0; for (let bits = available; bits; bits &= bits - 1) count++;
      if (count < minimum) { minimum = count; spot = i; mask = available; if (count === 1) break; }
    }
    if (spot === -1) { solutions.push(cells.join('')); return; }
    const r = Math.floor(spot / 9), c = spot % 9, b = block(spot);
    for (let bits = mask; bits; bits &= bits - 1) {
      const bit = bits & -bits;
      cells[spot] = Math.log2(bit); rows[r] |= bit; cols[c] |= bit; blocks[b] |= bit;
      visit();
      cells[spot] = 0; rows[r] ^= bit; cols[c] ^= bit; blocks[b] ^= bit;
      if (solutions.length >= limit) return;
    }
  };
  visit(); return solutions;
}

// Reject exact boards, digit relabelings, rotations and reflections.
// This deliberately does not claim full Sudoku-isomorphism canonicalization.
export function duplicateKey(text) {
  const forms = [];
  for (let transform = 0; transform < 8; transform++) {
    const labels = new Map([['0', '0']]);
    let next = 1, form = '';
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      let rr = r, cc = c;
      if (transform & 1) [rr, cc] = [cc, rr];
      if (transform & 2) rr = 8 - rr;
      if (transform & 4) cc = 8 - cc;
      const value = text[rr * 9 + cc];
      if (!labels.has(value)) labels.set(value, String(next++));
      form += labels.get(value);
    }
    forms.push(form);
  }
  return forms.sort()[0];
}
