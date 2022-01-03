const backend = process.cwd();
const run_config = (backend.toLowerCase().slice(0, 20) == "/mnt/c/users/j9108c/" ? "dev" : "prod");
console.log(`${run_config}: ${backend}`);

const secrets = (run_config == "dev" ? (await import(`${backend}/.secrets.mjs`)).dev : (await import(`${backend}/.secrets.mjs`)).prod);
const sql = await import(`${backend}/model/sql.mjs`);
const cloudflare = await import(`${backend}/model/cloudflare.mjs`);

import * as socket_io_server from "socket.io";
import * as socket_io_client from "socket.io-client";
import express from "express";
import http from "http";

const app = express();
const app_name = "portals";
const server = http.createServer(app);
const io = new socket_io_server.Server(server, {
	cors: (run_config == "dev" ? {origin: "*"} : null),
	maxHttpBufferSize: 1000000 // 1mb in bytes
});
const app_socket = socket_io_client.io("http://localhost:1026", {
	autoConnect: false,
	reconnect: true,
	extraHeaders: {
		app: app_name,
		secret: secrets.local_sockets_secret
	}
});

await sql.init_db();
sql.cycle_backup_db();
cloudflare.cycle_update(io);
cloudflare.cycle_countdown(io);

const frontend = backend.replace("backend", "frontend");
let other_apps_urls = null;

app.use("/", express.static(`${frontend}/build/`));

app.all("*", (req, res) => {
	res.status(404).sendFile(`${frontend}/build/index.html`);
});

io.on("connect", (socket) => {
	const headers = socket.handshake.headers;
	// console.log(headers);
	if (headers["user-agent"] == "node-XMLHttpRequest" && headers.secret == secrets.local_sockets_secret) { // socket connected from other node app
		console.log(`other localhost server (${headers.app}) connected as client`);

		io.to(socket.id).emit("store other apps urls", other_apps_urls);

		io.to(socket.id).emit("update domain request info", cloudflare.domain_request_info);
	} else { // socket connected from frontend
		console.log(`socket (${socket.id}) connected`);

		socket.on("layout mounted", () => {
			io.to(socket.id).emit("store other apps urls", other_apps_urls);

			io.to(socket.id).emit("update domain request info", cloudflare.domain_request_info);
		});

		socket.on("navigation", async (route) => {
			switch (route) {
				case "index":
					break;
				case "stats":
					io.to(socket.id).emit("update domain request info", cloudflare.domain_request_info);
					break;
				default:
					break;
			}
			
			sql.add_visit().catch((err) => console.error(err));
		});
	}
});

app_socket.on("connect", () => {
	console.log("connected as client to j9108c (localhost:1026)");
});

app_socket.on("store other apps urls", (urls) => {
	other_apps_urls = urls;
});

app_socket.connect();

server.listen(secrets.port, secrets.host, () => {
	console.log(`server (${app_name}) started on (localhost:${secrets.port})`);
});
