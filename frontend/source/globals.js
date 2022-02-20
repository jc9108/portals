import * as env from "$app/env";
import * as svelte_store from "svelte/store";
import * as socket_io_client from "socket.io-client";

const run_config = (env.dev ? "dev" : "prod");
const app_name = "portals";

const readonly = {
	app_name: app_name,
	repo: `https://github.com/jc9108/${app_name}`,
	description: "apps portal",
	backend: (run_config == "dev" ? "/backend" : ""),
	socket: socket_io_client.io((run_config == "dev" ? `http://${(env.browser ? location.hostname : "localhost")}:1026` : ""))
};

const writable = svelte_store.writable({ // global state
	all_apps_urls: null
});

export {
	readonly,
	writable
};
