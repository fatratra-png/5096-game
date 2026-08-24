export type Grid = number[][];

export type Direction = 'up' | 'down' | 'left' | 'right';

export type GameState = {
	grid: Grid;
	score: number;
	bestScore: number;
	won: boolean;
	over: boolean;
	keepPlaying: boolean;
};

const SIZE = 4;
const WIN_VALUE = 5096;
const EMPTY = 0;
const SPAWN_2_CHANCE = 0.9;

const createEmptyGrid = (): Grid =>
	Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => EMPTY));

const cloneGrid = (grid: Grid): Grid => grid.map((row) => [...row]);

const getEmptyCells = (grid: Grid): [number, number][] => {
	const cells: [number, number][] = [];
	for (let r = 0; r < SIZE; r++) {
		for (let c = 0; c < SIZE; c++) {
			if (grid[r][c] === EMPTY) cells.push([r, c]);
		}
	}
	return cells;
};

const addRandomTile = (grid: Grid): Grid => {
	const next = cloneGrid(grid);
	const empty = getEmptyCells(next);
	if (empty.length === 0) return next;
	const [r, c] = empty[Math.floor(Math.random() * empty.length)];
	next[r][c] = Math.random() < SPAWN_2_CHANCE ? 2 : 4;
	return next;
};

const slideRowLeft = (row: number[]): { row: number[]; score: number; moved: boolean } => {
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

const rotateGrid = (grid: Grid, times: number): Grid => {
	let result = cloneGrid(grid);
	for (let t = 0; t < times; t++) {
		const next = createEmptyGrid();
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

export const move = (grid: Grid, direction: Direction): { grid: Grid; score: number; moved: boolean } => {
	const rot = rotations[direction];
	const rotated = rotateGrid(grid, rot);

	let totalScore = 0;
	let anyMoved = false;
	const newGrid = rotated.map((row) => {
		const { row: newRow, score, moved } = slideRowLeft(row);
		totalScore += score;
		if (moved) anyMoved = true;
		return newRow;
	});

	const result = rotateGrid(newGrid, (4 - rot) % 4);
	return { grid: result, score: totalScore, moved: anyMoved };
};

export const canMove = (grid: Grid): boolean => {
	for (let r = 0; r < SIZE; r++) {
		for (let c = 0; c < SIZE; c++) {
			if (grid[r][c] === EMPTY) return true;
			if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true;
			if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true;
		}
	}
	return false;
};

export const hasWon = (grid: Grid): boolean => {
	for (let r = 0; r < SIZE; r++) {
		for (let c = 0; c < SIZE; c++) {
			if (grid[r][c] >= WIN_VALUE) return true;
		}
	}
	return false;
};

export const initGame = (): GameState => {
	let grid = createEmptyGrid();
	grid = addRandomTile(grid);
	grid = addRandomTile(grid);

	const bestScore = loadBestScore();

	return {
		grid,
		score: 0,
		bestScore,
		won: false,
		over: false,
		keepPlaying: false
	};
};

export const processMove = (state: GameState, direction: Direction): GameState => {
	if (state.over) return state;
	if (state.won && !state.keepPlaying) return state;

	const result = move(state.grid, direction);
	if (!result.moved) return state;

	const newGrid = addRandomTile(result.grid);
	const newScore = state.score + result.score;
	const newBest = Math.max(newScore, state.bestScore);
	const won = !state.keepPlaying && hasWon(newGrid);
	const over = won ? false : !canMove(newGrid);

	saveBestScore(newBest);

	return {
		grid: newGrid,
		score: newScore,
		bestScore: newBest,
		won,
		over,
		keepPlaying: state.keepPlaying
	};
};

export const startNewGame = (): GameState => {
	const bestScore = loadBestScore();
	let grid = createEmptyGrid();
	grid = addRandomTile(grid);
	grid = addRandomTile(grid);
	return {
		grid,
		score: 0,
		bestScore,
		won: false,
		over: false,
		keepPlaying: false
	};
};

const BEST_SCORE_KEY = '5096-best-score';

const loadBestScore = (): number => {
	if (typeof localStorage === 'undefined') return 0;
	const raw = localStorage.getItem(BEST_SCORE_KEY);
	return raw ? parseInt(raw, 10) || 0 : 0;
};

const saveBestScore = (score: number): void => {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(BEST_SCORE_KEY, String(score));
};
