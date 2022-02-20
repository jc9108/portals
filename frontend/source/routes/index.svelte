<script context="module">
	import * as globals from "frontend/source/globals.js";

	import * as svelte from "svelte";

	const globals_r = globals.readonly;
	const globals_w = globals.writable;
</script>
<script>
	svelte.onMount(() => {
		globals_r.socket.emit("navigation", "index");
	});
</script>

<svelte:head>
	<title>{globals_r.app_name}</title>
	<meta name="description" content={globals_r.description}/>
</svelte:head>
<div class="mt-4">
	<div id="big_box" class="mt-5 px-3">
		<ul class="mt-3">
			{#if $globals_w.all_apps_urls}
				{#each Object.keys($globals_w.all_apps_urls).sort() as app_name, idx}
					{#if app_name != "portals"}
						<li><a href={$globals_w.all_apps_urls[app_name].link}>{app_name}</a> (<a href={$globals_w.all_apps_urls[app_name].repo} target="_blank"><i class="fab fa-github"></i></a>)</li>
					{/if}
				{:else}
					<li>?</li>
				{/each}
			{/if}
		</ul>
	</div>
</div>
