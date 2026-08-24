<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		initGame,
		startNewGame,
		processMove,
		type GameState,
		type Direction
	} from '$lib/gameLogic';

	let state: GameState = $state(initGame());
	let touchStartX = 0;
	let touchStartY = 0;

	const handleKeydown = (e: KeyboardEvent) => {
		const keyMap: Record<string, Direction> = {
			ArrowUp: 'up',
			ArrowDown: 'down',
			ArrowLeft: 'left',
			ArrowRight: 'right'
		};
		const dir = keyMap[e.key];
		if (dir) {
			e.preventDefault();
			state = processMove(state, dir);
		}
	};

	const handleTouchStart = (e: TouchEvent) => {
		const touch = e.touches[0];
		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
	};

	const handleTouchEnd = (e: TouchEvent) => {
		const touch = e.changedTouches[0];
		const dx = touch.clientX - touchStartX;
		const dy = touch.clientY - touchStartY;
		const absDx = Math.abs(dx);
		const absDy = Math.abs(dy);

		if (Math.max(absDx, absDy) < 30) return;

		let dir: Direction;
		if (absDx > absDy) {
			dir = dx > 0 ? 'right' : 'left';
		} else {
			dir = dy > 0 ? 'down' : 'up';
		}
		state = processMove(state, dir);
	};

	const handleNewGame = () => {
		state = startNewGame();
	};

	const handleKeepPlaying = () => {
		state = { ...state, keepPlaying: true, won: false };
	};

	const formatScore = (n: number): string => String(n);

	const tileColor = (value: number): string => {
		const colors: Record<number, { bg: string; fg: string }> = {
			0: { bg: '#cdc1b4', fg: '#cdc1b4' },
			2: { bg: '#eee4da', fg: '#776e65' },
			4: { bg: '#ede0c8', fg: '#776e65' },
			8: { bg: '#f2b179', fg: '#f9f6f2' },
			16: { bg: '#f59563', fg: '#f9f6f2' },
			32: { bg: '#f67c5f', fg: '#f9f6f2' },
			64: { bg: '#f65e3b', fg: '#f9f6f2' },
			128: { bg: '#edcf72', fg: '#f9f6f2' },
			256: { bg: '#edcc61', fg: '#f9f6f2' },
			512: { bg: '#edc850', fg: '#f9f6f2' },
			1024: { bg: '#edc53f', fg: '#f9f6f2' },
			2048: { bg: '#edc22e', fg: '#f9f6f2' },
			4096: { bg: '#3c3a32', fg: '#f9f6f2' },
			8192: { bg: '#3c3a32', fg: '#f9f6f2' }
		};
		return colors[value] ?? { bg: '#3c3a32', fg: '#f9f6f2' };
	};

	const fontSize = (value: number): string => {
		if (value < 100) return '2.2rem';
		if (value < 1000) return '1.7rem';
		if (value < 10000) return '1.3rem';
		return '1rem';
	};

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeydown);
		}
	});
</script>

<svelte:window
	on:touchstart={handleTouchStart}
	on:touchend={handleTouchEnd}
/>

<div class="container">
	<header>
		<div class="title-row">
			<h1>5096</h1>
			<div class="scores">
				<div class="score-box">
					<span class="score-label">Score</span>
					<span class="score-value">{formatScore(state.score)}</span>
				</div>
				<div class="score-box">
					<span class="score-label">Best</span>
					<span class="score-value">{formatScore(state.bestScore)}</span>
				</div>
			</div>
		</div>
		<div class="controls">
			<p class="subtitle">Join the tiles, get to <strong>5096</strong>!</p>
			<button class="new-game-btn" on:click={handleNewGame}>New Game</button>
		</div>
	</header>

	<div class="board">
		<div class="grid-bg">
			{#each Array(4) as _}
				{#each Array(4) as _}
					<div class="cell-bg"></div>
				{/each}
			{/each}
		</div>
		<div class="grid">
			{#each state.grid as row, r}
				{#each row as tile, c}
					{#if tile !== 0}
						{@const colors = tileColor(tile)}
						<div
							class="tile"
							style="
								grid-row: {r + 1};
								grid-column: {c + 1};
								background: {colors.bg};
								color: {colors.fg};
								font-size: {fontSize(tile)};
							"
						>
							{tile}
						</div>
					{/if}
				{/each}
			{/each}
		</div>
	</div>

	{#if state.won}
		<div class="overlay">
			<div class="message">
				<p class="message-title">You win!</p>
				<p class="message-sub">You reached {state.score >= 5096 ? '5096' : 'a high tile'}!</p>
				<div class="message-actions">
					<button class="msg-btn primary" on:click={handleKeepPlaying}>Keep Playing</button>
					<button class="msg-btn" on:click={handleNewGame}>New Game</button>
				</div>
			</div>
		</div>
	{/if}

	{#if state.over}
		<div class="overlay">
			<div class="message">
				<p class="message-title">Game Over</p>
				<p class="message-sub">Score: {formatScore(state.score)}</p>
				<button class="msg-btn primary" on:click={handleNewGame}>Try Again</button>
			</div>
		</div>
	{/if}

	<footer>
		<p>Swipe or use arrow keys to play</p>
	</footer>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 1rem;
		gap: 1rem;
	}

	header {
		width: 100%;
		max-width: 420px;
	}

	.title-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	h1 {
		font-size: 3rem;
		font-weight: 800;
		color: #776e65;
		letter-spacing: -0.02em;
	}

	.scores {
		display: flex;
		gap: 0.5rem;
	}

	.score-box {
		background: #bbada0;
		color: #eee4da;
		border-radius: 6px;
		padding: 0.3rem 0.8rem;
		text-align: center;
		min-width: 70px;
	}

	.score-label {
		display: block;
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.8;
	}

	.score-value {
		display: block;
		font-size: 1.3rem;
		font-weight: 700;
		color: #fff;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.subtitle {
		font-size: 0.9rem;
		color: #776e65;
	}

	.subtitle strong {
		font-weight: 700;
	}

	.new-game-btn {
		background: #8f7a66;
		color: #f9f6f2;
		border: none;
		border-radius: 6px;
		padding: 0.5rem 1rem;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		transition: background 0.15s;
	}

	.new-game-btn:hover {
		background: #9f8b77;
	}

	.board {
		position: relative;
		width: 100%;
		max-width: 420px;
		aspect-ratio: 1;
	}

	.grid-bg {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
		padding: 10px;
		background: #bbada0;
		border-radius: 8px;
		position: absolute;
		inset: 0;
	}

	.cell-bg {
		background: rgba(238, 228, 218, 0.35);
		border-radius: 4px;
		aspect-ratio: 1;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
		padding: 10px;
		position: absolute;
		inset: 0;
	}

	.tile {
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		aspect-ratio: 1;
		transition: all 0.08s ease;
	}

	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(238, 228, 218, 0.73);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.message {
		background: #faf8ef;
		border-radius: 8px;
		padding: 2rem 2.5rem;
		text-align: center;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
	}

	.message-title {
		font-size: 2rem;
		font-weight: 800;
		color: #776e65;
		margin-bottom: 0.3rem;
	}

	.message-sub {
		font-size: 1rem;
		color: #776e65;
		margin-bottom: 1.2rem;
		opacity: 0.8;
	}

	.message-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.msg-btn {
		background: #8f7a66;
		color: #f9f6f2;
		border: none;
		border-radius: 6px;
		padding: 0.6rem 1.2rem;
		font-size: 0.9rem;
		font-weight: 700;
		cursor: pointer;
		transition: background 0.15s;
	}

	.msg-btn:hover {
		background: #9f8b77;
	}

	.msg-btn.primary {
		background: #776e65;
	}

	.msg-btn.primary:hover {
		background: #877d6a;
	}

	footer {
		margin-top: 0.5rem;
	}

	footer p {
		font-size: 0.8rem;
		color: #776e65;
		opacity: 0.6;
	}

	@media (max-width: 480px) {
		.container {
			padding: 0.5rem;
		}

		h1 {
			font-size: 2.2rem;
		}

		.score-box {
			min-width: 55px;
			padding: 0.2rem 0.5rem;
		}

		.score-value {
			font-size: 1rem;
		}

		.subtitle {
			font-size: 0.75rem;
		}
	}
</style>
