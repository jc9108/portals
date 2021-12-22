<script context="module">
	import * as globals from "frontend/source/globals.js";

	import * as svelte from "svelte";

	const globals_r = globals.readonly;
</script>
<script>
	let [
		countdown_wrapper,
		last24hours_total_wrapper,
		last7days_total_wrapper,
		last30days_total_wrapper,
		last24hours_tbody_wrapper,
		last7days_tbody_wrapper,
		last30days_tbody_wrapper
	] = [null];
	svelte.onMount(() => {		
		globals_r.socket.emit("navigation", "stats");

		globals_r.socket.on("update countdown", (countdown) => {
			countdown_wrapper.innerHTML = countdown;
		});

		globals_r.socket.on("update domain request info", (domain_request_info) => {
			if (!domain_request_info || Object.keys(domain_request_info).length == 0) {
				return;
			}

			last24hours_total_wrapper.innerHTML = domain_request_info.last24hours_total;
			last7days_total_wrapper.innerHTML = domain_request_info.last7days_total;
			last30days_total_wrapper.innerHTML = domain_request_info.last30days_total;

			last24hours_tbody_wrapper.innerHTML = "";
			last7days_tbody_wrapper.innerHTML = "";
			last30days_tbody_wrapper.innerHTML = "";
		
			fill_stats_table(domain_request_info.last24hours_total, domain_request_info.last24hours_countries, last24hours_tbody_wrapper);
			fill_stats_table(domain_request_info.last7days_total, domain_request_info.last7days_countries, last7days_tbody_wrapper);
			fill_stats_table(domain_request_info.last30days_total, domain_request_info.last30days_countries, last30days_tbody_wrapper);
		});
	});
	svelte.onDestroy(() => {
		globals_r.socket.off("update countdown");
		globals_r.socket.off("update domain request info");
	});

	function fill_stats_table(total_requests, countries, parent_tbody) {
		let rank = 0;

		for (const country of countries) {
			parent_tbody.insertAdjacentHTML("beforeend", `
				<tr><td>${country.clientCountryName}</td><td>${++rank}</td><td>${country.requests}</td></tr>
			`);
		}

		parent_tbody.insertAdjacentHTML("beforeend", `
			<tr><td>TOTAL</td><td>${rank}</td><td>${total_requests}</td></tr>
		`);
	}
</script>

<svelte:head>
	<title>cloudflare zone stats — {globals_r.app_name}</title>
	<meta name="description" content="stats"/>
</svelte:head>
<div class="mt-4">
	<div id="big_box" class="mt-5 px-3">
		<h2 class="text-center mt-1 mb-0">domain requests</h2>
		<h6 class="text-center mt-1 mb-0">realtime data updates in <span bind:this={countdown_wrapper}>?</span> seconds</h6>
		<h3 class="mt-4">last 24 hours: <span bind:this={last24hours_total_wrapper}>?</span></h3>
		<table class="table table-bordered table-hover table-dark text-center mt-0">
			<thead>
				<tr><th>country</th><th>#</th><th>requests</th></tr>
			</thead>
			<tbody bind:this={last24hours_tbody_wrapper}></tbody>
		</table>
		<h3 class="mt-5">last 7 days: <span bind:this={last7days_total_wrapper}>?</span></h3>
		<table class="table table-bordered table-hover table-dark text-center mt-0">
			<thead>
				<tr><th>country</th><th>#</th><th>requests</th></tr>
			</thead>
			<tbody bind:this={last7days_tbody_wrapper}></tbody>
		</table>
		<h3 class="mt-5">last 30 days: <span bind:this={last30days_total_wrapper}>?</span></h3>
		<table class="table table-bordered table-hover table-dark text-center mt-0">
			<thead>
				<tr><th>country</th><th>#</th><th>requests</th></tr>
			</thead>
			<tbody bind:this={last30days_tbody_wrapper}></tbody>
		</table>
	</div>
</div>
