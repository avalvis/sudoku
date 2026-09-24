// Build-time fixture authoring only. No puzzle generation ships in the application.
import { writeFileSync } from 'node:fs';
import { gradePuzzle } from '../src/domain/grading.ts';
let seed = 20260925;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const range = n => Array.from({ length: n }, (_, i) => i);
function countSolutions(input) {
  const cells = input.flat().map(v => v ?? 0);
  let count = 0;
  function visit() {
    if (count >= 2) return;
    let spot = -1, candidates = [];
    for (let i = 0; i < 81; i++) {
      if (cells[i]) continue;
      const r = Math.floor(i / 9), c = i % 9;
      const used = new Set();
      for (let n = 0; n < 9; n++) {
        used.add(cells[r * 9 + n]); used.add(cells[n * 9 + c]);
        used.add(cells[(Math.floor(r / 3) * 3 + Math.floor(n / 3)) * 9 + Math.floor(c / 3) * 3 + n % 3]);
      }
      const options = range(9).map(n => n + 1).filter(n => !used.has(n));
      if (!options.length) return;
      if (spot < 0 || options.length < candidates.length) { spot = i; candidates = options; }
    }
    if (spot < 0) { count++; return; }
    for (const value of candidates) { cells[spot] = value; visit(); cells[spot] = 0; if (count >= 2) return; }
  }
  visit(); return count;
}
const puzzles = [];
function randomSolution() {
  const cells = Array(81).fill(0);
  function fill() {
    let spot = -1, options = [];
    for (let i = 0; i < 81; i++) {
      if (cells[i]) continue;
      const r = Math.floor(i / 9), c = i % 9;
      const candidates = range(9).map(n => n + 1).filter(d => !cells.some((v, j) => v === d && (Math.floor(j / 9) === r || j % 9 === c || (Math.floor(j / 27) === Math.floor(r / 3) && Math.floor(j % 9 / 3) === Math.floor(c / 3)))));
      if (!candidates.length) return false;
      if (spot < 0 || candidates.length < options.length) { spot = i; options = candidates; }
    }
    if (spot < 0) return true;
    for (const value of shuffle(options)) { cells[spot] = value; if (fill()) return true; }
    cells[spot] = 0; return false;
  }
  if (!fill()) throw new Error('Unable to author a solution');
  return range(9).map(r => cells.slice(r * 9, r * 9 + 9));
}

// Fixed seed and finite search budget: incomplete packs are never published.
const targets = { easy: 'Singles', medium: 'Locked candidates', hard: 'Naked pairs' };
const seen = new Set();
for (const [difficulty, technique] of Object.entries(targets)) {
  let accepted = 0;
  for (let attempt = 0; attempt < 5000 && accepted < 3; attempt++) {
    const solution = randomSolution();
    const givens = solution.map(row => [...row]);
    for (const i of shuffle(range(81))) {
      const r = Math.floor(i / 9), c = i % 9, before = givens[r][c];
      givens[r][c] = null;
      if (countSolutions(givens) !== 1) givens[r][c] = before;
    }
    const grade = gradePuzzle(givens);
    if (!grade.solved || grade.technique !== technique) continue;
    const key = JSON.stringify(givens);
    if (seen.has(key)) continue;
    if (JSON.stringify(grade.grid) !== JSON.stringify(solution)) throw new Error('Logical solver disagrees with solution');
    seen.add(key);
    puzzles.push({ id: `graded-v1-${difficulty}-${++accepted}`, difficulty, givens, solution });
    console.log(`${difficulty} ${accepted}/3: ${technique}`);
  }
  if (accepted !== 3) throw new Error(`Generation budget exhausted for ${difficulty}; existing pack unchanged`);
}
writeFileSync(new URL('../src/domain/graded-pack.json', import.meta.url), JSON.stringify(puzzles, null, 2) + '\n');
console.log(`Authored ${puzzles.length} unique, technique-graded puzzles.`);

