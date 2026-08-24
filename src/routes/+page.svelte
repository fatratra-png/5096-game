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
	let scorePop = 0;
	let popKey = 0;

	onMount(() => {
		const saved = localStorage.getItem('5096-best');
		if (saved) best = Number(saved);
	});

	const handleMove = (direction: Direction) => {
		if (status === 'lost') return;
		if (status === 'won' && !keepPlaying) return;

		const result = move(board, direction);
		if (!result.moved) return;

		if (result.scoreGained > 0) {
			scorePop = result.scoreGained;
			popKey += 1;
		}

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

	const tileColors: Record<number, { bg: string; fg: string }> = {
		2:    { bg: '#FFFBEB', fg: '#000000' },
		4:    { bg: '#FEF3C7', fg: '#000000' },
		8:    { bg: '#FDE68A', fg: '#000000' },
		16:   { bg: '#FCD34D', fg: '#000000' },
		32:   { bg: '#F59E0B', fg: '#000000' },
		64:   { bg: '#EF4444', fg: '#ffffff' },
		128:  { bg: '#F97316', fg: '#000000' },
		256:  { bg: '#84CC16', fg: '#000000' },
		512:  { bg: '#06B6D4', fg: '#000000' },
		1024: { bg: '#8B5CF6', fg: '#ffffff' },
		2048: { bg: '#EC4899', fg: '#ffffff' },
		4096: { bg: '#000000', fg: '#ffffff' },
		8192: { bg: '#ffffff', fg: '#000000' }
	};

	const tileStyle = (value: number): string => {
		if (value === 0) return '';
		const c = tileColors[value] ?? { bg: '#000000', fg: '#ffffff' };
		const fontSize = value < 100 ? 'clamp(22px, 7vw, 34px)' : value < 1000 ? 'clamp(17px, 5.5vw, 26px)' : 'clamp(13px, 4.5vw, 20px)';
		return `background:${c.bg}; color:${c.fg}; font-size:${fontSize};`;
	};
</script>

<svelte:window on:keydown={handleKeydown} />

<main on:touchstart={handleTouchStart} on:touchend={handleTouchEnd}>
	<header>
		<div class="title-area">
			<h1>5096.</h1>
			<p>atteins <strong>{TARGET_SCORE}</strong> ou meurs en essayant.</p>
		</div>
		<div class="scores">
			<div class="score-box">
				<span class="label">SCORE</span>
				<span class="value">{score}</span>
				{#key popKey}
					{#if scorePop > 0}
						<span class="score-pop">+{scorePop}</span>
					{/if}
				{/key}
			</div>
			<div class="score-box best">
				<span class="label">BEST</span>
				<span class="value">{best}</span>
			</div>
		</div>
	</header>

	<div class="toolbar">
		<button class="btn-new" on:click={restart}>NOUVELLE PARTIE</button>
	</div>

	<div class="board-wrap">
		<div class="board">
			{#each board as row}
				{#each row as cell}
					<div class="cell" style={tileStyle(cell)}>
						{#if cell !== 0}
							<span>{cell}</span>
						{/if}
					</div>
				{/each}
			{/each}
		</div>

		{#if status === 'won'}
			<div class="overlay won">
				<div class="overlay-box">
					<p class="overlay-emoji">&#127942;</p>
					<p class="overlay-title">VICTOIRE.</p>
					<p class="overlay-sub">t'as atteint <strong>{TARGET_SCORE}</strong>.</p>
					<div class="overlay-actions">
						<button class="btn-continue" on:click={() => (keepPlaying = true)}>CONTINUER</button>
						<button class="btn-restart" on:click={restart}>REJOUER</button>
					</div>
				</div>
			</div>
		{:else if status === 'lost'}
			<div class="overlay lost">
				<div class="overlay-box">
					<p class="overlay-emoji">&#128128;</p>
					<p class="overlay-title">PERDU.</p>
					<p class="overlay-sub">t'es nul. score: <strong>{score}</strong>.</p>
					<button class="btn-restart lost-btn" on:click={restart}>R&Eacute;ESSAYER</button>
				</div>
			</div>
		{/if}
	</div>

	<p class="hint">fl&egrave;ches ou swipe. pas d'excuse.</p>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #FACC15;
		color: #000000;
		font-family: 'Courier New', Courier, monospace;
		min-height: 100vh;
	}

	:global(*) {
		box-sizing: border-box;
	}

	main {
		max-width: 460px;
		margin: 0 auto;
		padding: 24px 16px 48px;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
		margin-bottom: 16px;
	}

	.title-area {
		flex: 1;
	}

	h1 {
		font-size: 52px;
		font-weight: 900;
		letter-spacing: -0.06em;
		margin: 0;
		line-height: 1;
		text-decoration: underline;
		text-decoration-thickness: 4px;
		text-underline-offset: 4px;
	}

	header p {
		margin: 8px 0 0;
		font-size: 13px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	header p strong {
		font-size: 16px;
	}

	.scores {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}

	.score-box {
		position: relative;
		background: #000000;
		color: #ffffff;
		border: 3px solid #000000;
		box-shadow: 4px 4px 0 #000000;
		border-radius: 0;
		padding: 8px 14px;
		text-align: center;
		min-width: 76px;
	}

	.score-box.best {
		background: #ffffff;
		color: #000000;
	}

	.score-box .label {
		display: block;
		font-size: 9px;
		letter-spacing: 0.15em;
		font-weight: 700;
		opacity: 0.7;
	}

	.score-box .value {
		display: block;
		font-variant-numeric: tabular-nums;
		font-size: 22px;
		font-weight: 900;
	}

	.score-pop {
		position: absolute;
		top: -10px;
		right: -6px;
		background: #EF4444;
		color: #ffffff;
		font-size: 11px;
		font-weight: 900;
		padding: 2px 7px;
		border: 2px solid #000000;
		box-shadow: 2px 2px 0 #000000;
		animation: popUp 0.5s ease-out forwards;
		pointer-events: none;
	}

	@keyframes popUp {
		0% { opacity: 1; transform: translateY(0) scale(1); }
		100% { opacity: 0; transform: translateY(-30px) scale(0.7); }
	}

	.toolbar {
		margin-bottom: 12px;
	}

	.btn-new {
		background: #000000;
		color: #FACC15;
		border: 3px solid #000000;
		box-shadow: 4px 4px 0 rgba(0,0,0,0.3);
		padding: 10px 22px;
		font-size: 13px;
		font-weight: 900;
		font-family: 'Courier New', Courier, monospace;
		letter-spacing: 0.1em;
		cursor: pointer;
		transition: all 0.1s ease;
	}

	.btn-new:hover {
		box-shadow: 2px 2px 0 rgba(0,0,0,0.3);
		transform: translate(2px, 2px);
	}

	.btn-new:active {
		box-shadow: 0px 0px 0 rgba(0,0,0,0.3);
		transform: translate(4px, 4px);
	}

	.board-wrap {
		position: relative;
	}

	.board {
		position: relative;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
		background: #ffffff;
		border: 4px solid #000000;
		box-shadow: 8px 8px 0 #000000;
		padding: 8px;
		aspect-ratio: 1 / 1;
	}

	.cell {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #F5F5F4;
		border: 3px solid #000000;
		font-variant-numeric: tabular-nums;
		font-weight: 900;
		aspect-ratio: 1 / 1;
		transition: transform 0.08s ease;
	}

	.cell:not(:empty):hover {
		transform: scale(1.06);
		z-index: 1;
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}

	.overlay-box {
		background: #ffffff;
		border: 4px solid #000000;
		box-shadow: 8px 8px 0 #000000;
		padding: 28px 36px;
		text-align: center;
		max-width: 300px;
		width: 90%;
	}

	.overlay-emoji {
		font-size: 48px;
		margin: 0 0 8px;
	}

	.overlay-title {
		font-size: 32px;
		font-weight: 900;
		margin: 0 0 6px;
		letter-spacing: -0.02em;
	}

	.overlay-sub {
		font-size: 13px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 18px;
	}

	.overlay-sub strong {
		font-size: 16px;
	}

	.overlay-actions {
		display: flex;
		gap: 8px;
		justify-content: center;
	}

	.overlay button {
		border: 3px solid #000000;
		padding: 10px 18px;
		cursor: pointer;
		font-weight: 900;
		font-size: 12px;
		font-family: 'Courier New', Courier, monospace;
		letter-spacing: 0.1em;
		transition: all 0.1s ease;
	}

	.btn-continue {
		background: #FACC15;
		color: #000000;
		box-shadow: 3px 3px 0 #000000;
	}

	.btn-continue:hover {
		box-shadow: 1px 1px 0 #000000;
		transform: translate(2px, 2px);
	}

	.btn-restart {
		background: #ffffff;
		color: #000000;
		box-shadow: 3px 3px 0 #000000;
	}

	.btn-restart:hover {
		box-shadow: 1px 1px 0 #000000;
		transform: translate(2px, 2px);
	}

	.lost-btn {
		background: #EF4444;
		color: #ffffff;
		box-shadow: 4px 4px 0 #000000;
		font-size: 14px;
		padding: 12px 24px;
	}

	.hint {
		text-align: center;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-top: 16px;
		opacity: 0.5;
	}

	@media (max-width: 480px) {
		main { padding: 16px 12px 36px; }
		h1 { font-size: 40px; }
		.board { gap: 6px; padding: 6px; border-width: 3px; box-shadow: 6px 6px 0 #000000; }
		.cell { border-width: 2px; }
		.score-box { min-width: 62px; padding: 6px 10px; box-shadow: 3px 3px 0 #000000; }
		.score-box .value { font-size: 18px; }
	}
</style>
