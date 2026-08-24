export type Board = number[][];

export type Direction = 'up' | 'down' | 'left' | 'right';

export const TARGET_SCORE = 5096;

const SIZE = 4;
const EMPTY = 0;

export const createEmptyBoard = (): Board =>
	Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => EMPTY));

const cloneBoard = (b: Board): Board => b.map((row) => [...row]);

const emptyCells = (b: Board): [number, number][] => {
	const cells: [number, number][] = [];
	for (let r = 0; r < SIZE; r++) {
		for (let c = 0; c < SIZE; c++) {
			if (b[r][c] === EMPTY) cells.push([r, c]);
		}
	}
	return cells;
};

export const spawnTile = (b: Board): Board => {
	const next = cloneBoard(b);
	const free = emptyCells(next);
	if (free.length === 0) return next;
	const [r, c] = free[Math.floor(Math.random() * free.length)];
	next[r][c] = Math.random() < 0.9 ? 2 : 4;
	return next;
};

export const createInitialBoard = (): Board => {
	let b = createEmptyBoard();
	b = spawnTile(b);
	b = spawnTile(b);
	return b;
};

const slideLeft = (row: number[]): { row: number[]; score: number; moved: boolean } => {
	const filtered = row.filter((v) => v !== EMPTY);
	const merged: number[] = [];
	let score = 0;
	let i = 0;
	while (i < filtered.length) {
		if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
			const val = filtered[i] * 2;
			merged.push(val);
			score += val;
			i += 2;
		} else {
			merged.push(filtered[i]);
			i++;
		}
	}
	while (merged.length < SIZE) merged.push(EMPTY);
	const moved = merged.some((v, idx) => v !== row[idx]);
	return { row: merged, score, moved };
};

const rotate = (b: Board, times: number): Board => {
	let result = cloneBoard(b);
	for (let t = 0; t < times; t++) {
		const next = createEmptyBoard();
		for (let r = 0; r < SIZE; r++) {
			for (let c = 0; c < SIZE; c++) {
				next[c][SIZE - 1 - r] = result[r][c];
			}
		}
		result = next;
	}
	return result;
};

const rotations: Record<Direction, number> = {
	left: 0,
	down: 1,
	right: 2,
	up: 3
};

export const move = (b: Board, direction: Direction): { board: Board; scoreGained: number; moved: boolean } => {
	const rot = rotations[direction];
	const rotated = rotate(b, rot);

	let totalScore = 0;
	let anyMoved = false;
	const newBoard = rotated.map((row) => {
		const { row: newRow, score, moved } = slideLeft(row);
		totalScore += score;
		if (moved) anyMoved = true;
		return newRow;
	});

	const result = rotate(newBoard, (4 - rot) % 4);
	return { board: result, scoreGained: totalScore, moved: anyMoved };
};

export const hasWon = (b: Board): boolean => {
	for (let r = 0; r < SIZE; r++) {
		for (let c = 0; c < SIZE; c++) {
			if (b[r][c] >= TARGET_SCORE) return true;
		}
	}
	return false;
};

export const isGameOver = (b: Board): boolean => {
	for (let r = 0; r < SIZE; r++) {
		for (let c = 0; c < SIZE; c++) {
			if (b[r][c] === EMPTY) return false;
			if (c + 1 < SIZE && b[r][c] === b[r][c + 1]) return false;
			if (r + 1 < SIZE && b[r][c] === b[r + 1][c]) return false;
		}
	}
	return true;
};
