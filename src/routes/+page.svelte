<script lang="ts">
	import { onMount } from 'svelte';
	import {
		createInitialBoard,
		move,
		spawnTile,
		hasWon,
		isGameOver,
		TARGET_SCORE,
		type Board,
		type Direction
	} from '$lib/gameLogic';

	let board: Board = createInitialBoard();
	let score = 0;
	let best = 0;
	let status: 'playing' | 'won' | 'lost' = 'playing';
	let keepPlaying = false;

	onMount(() => {
		const saved = localStorage.getItem('5096-best');
		if (saved) best = Number(saved);
	});

	const handleMove = (direction: Direction) => {
		if (status === 'lost') return;
		if (status === 'won' && !keepPlaying) return;

		const result = move(board, direction);
		if (!result.moved) return;

		board = spawnTile(result.board);
		score += result.scoreGained;

		if (score > best) {
			best = score;
			localStorage.setItem('5096-best', String(best));
		}

		if (hasWon(board) && status === 'playing') {
			status = 'won';
		} else if (isGameOver(board)) {
			status = 'lost';
		}
	};

	const handleKeydown = (e: KeyboardEvent) => {
		const map: Record<string, Direction> = {
			ArrowUp: 'up',
			ArrowDown: 'down',
			ArrowLeft: 'left',
			ArrowRight: 'right'
		};
		const dir = map[e.key];
		if (dir) {
			e.preventDefault();
			handleMove(dir);
		}
	};

	let touchStartX = 0;
	let touchStartY = 0;

	const handleTouchStart = (e: TouchEvent) => {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	};

	const handleTouchEnd = (e: TouchEvent) => {
		const dx = e.changedTouches[0].clientX - touchStartX;
		const dy = e.changedTouches[0].clientY - touchStartY;
		if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
		if (Math.abs(dx) > Math.abs(dy)) {
			handleMove(dx > 0 ? 'right' : 'left');
		} else {
			handleMove(dy > 0 ? 'down' : 'up');
		}
	};

	const restart = () => {
		board = createInitialBoard();
		score = 0;
		status = 'playing';
		keepPlaying = false;
	};

	const shades = [
		'#F3F1EA', '#E7E3D6', '#D6D0BC', '#C2B99C',
		'#A99C79', '#8B7C57', '#6C5D3E', '#4E4229',
		'#362C19', '#231B0E', '#150F07'
	];

	const tileStyle = (value: number): string => {
		if (value === 0) return '';
		const level = Math.max(0, Math.floor(Math.min(Math.log2(value) - 1, shades.length - 1)));
		const dark = level > 5;
		return `background:${shades[level]}; color:${dark ? '#F3F1EA' : '#1B1B1B'};`;
	};
</script>

<svelte:window on:keydown={handleKeydown} />

<main on:touchstart={handleTouchStart} on:touchend={handleTouchEnd}>
	<header>
		<div>
			<h1>5096</h1>
			<p>Fusionnez les tuiles jusqu'à atteindre <strong>{TARGET_SCORE}</strong>.</p>
		</div>
		<div class="scores">
			<div class="score-box">
				<span class="label">Score</span>
				<span class="value">{score}</span>
			</div>
			<div class="score-box">
				<span class="label">Record</span>
				<span class="value">{best}</span>
			</div>
		</div>
	</header>

	<div class="toolbar">
		<button on:click={restart}>Nouvelle partie</button>
	</div>

	<div class="board">
		{#each board as row}
			{#each row as cell}
				<div class="cell" style={tileStyle(cell)}>
					{#if cell !== 0}<span>{cell}</span>{/if}
				</div>
			{/each}
		{/each}

		{#if status === 'won'}
			<div class="overlay">
				<p>5096 atteint.</p>
				<div class="overlay-actions">
					<button on:click={() => (keepPlaying = true)}>Continuer</button>
					<button on:click={restart}>Rejouer</button>
				</div>
			</div>
		{:else if status === 'lost'}
			<div class="overlay">
				<p>Plus de mouvement possible.</p>
				<button on:click={restart}>Rejouer</button>
			</div>
		{/if}
	</div>

	<p class="hint">Flèches du clavier, ou glisser sur mobile.</p>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #FAFAF7;
		color: #1B1B1B;
		font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
	}
	main { max-width: 420px; margin: 0 auto; padding: 32px 20px 48px; }
	header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
	h1 { font-size: 40px; letter-spacing: -0.03em; margin: 0; font-weight: 700; }
	header p { margin: 4px 0 0; font-size: 13px; color: #6B6B63; }
	.scores { display: flex; gap: 8px; }
	.score-box { background: #1B1B1B; color: #F3F1EA; border-radius: 6px; padding: 6px 12px; text-align: center; min-width: 64px; }
	.score-box .label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.6; }
	.score-box .value { display: block; font-variant-numeric: tabular-nums; font-size: 18px; font-weight: 600; }
	.toolbar { margin-bottom: 12px; }
	.toolbar button { background: transparent; border: 1px solid #1B1B1B; color: #1B1B1B; padding: 6px 14px; font-size: 13px; border-radius: 6px; cursor: pointer; }
	.toolbar button:hover { background: #1B1B1B; color: #F3F1EA; }
	.board { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #E7E3D6; border-radius: 10px; padding: 10px; aspect-ratio: 1 / 1; }
	.cell { display: flex; align-items: center; justify-content: center; background: #F3F1EA; border-radius: 6px; font-variant-numeric: tabular-nums; font-weight: 700; font-size: clamp(16px, 5.5vw, 26px); transition: background 120ms ease; }
	.overlay { position: absolute; inset: 0; background: rgba(250, 250, 247, 0.92); border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; font-size: 15px; }
	.overlay-actions { display: flex; gap: 8px; }
	.overlay button { background: #1B1B1B; color: #F3F1EA; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
	.hint { text-align: center; font-size: 12px; color: #9A9689; margin-top: 16px; }
</style>
