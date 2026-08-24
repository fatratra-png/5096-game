<script lang="ts">
	import { browser } from '$app/environment';

	let { children } = $props();
</script>

<svelte:head>
	<meta name="theme-color" content="#faf8ef" />
</svelte:head>

{@render children()}

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(html, body) {
		height: 100%;
		background: #faf8ef;
		color: #776e65;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		overflow: hidden;
		touch-action: none;
		user-select: none;
	}

	:global(#svelte) {
		height: 100%;
	}
</style>
