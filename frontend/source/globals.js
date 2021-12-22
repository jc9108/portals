import * as env from "$app/env";
import * as svelte_store from "svelte/store";
import * as socket_io_client from "socket.io-client";

const run_config = (env.dev ? "dev" : "prod");
const app_name = "portals";

const readonly = {
	app_name: app_name,
	repo: `https://github.com/j9108c/${app_name}`,
	description: "apps",
	backend: (run_config == "dev" ? "/backend" : ""),
	socket: socket_io_client.io((run_config == "dev" ? `http://${(env.browser ? location.hostname : "localhost")}:1101` : ""))
};

const writable = svelte_store.writable({ // global state
	other_apps_urls: null
});

export {
	readonly,
	writable
};