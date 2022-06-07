const backend = process.cwd();
const run_config = (backend.toLowerCase().startsWith("/mnt/c/") ? "dev" : "prod");
console.log(`${run_config}: ${backend}`);

const secrets = (run_config == "dev" ? (await import(`${backend}/.secrets.mjs`)).dev : (await import(`${backend}/.secrets.mjs`)).prod);
const sql = await import(`${backend}/model/sql.mjs`);
const cloudflare = await import(`${backend}/model/cloudflare.mjs`);

import * as socket_io_server from "socket.io";
import express from "express";
import http from "http";

const app = express();
const app_name = "portals";
const server = http.createServer(app);
const io = new socket_io_server.Server(server, {
	cors: (run_config == "dev" ? {origin: "*"} : null),
	maxHttpBufferSize: 1000000 // 1mb in bytes
});

await sql.init_db();
sql.cycle_backup_db();
cloudflare.cycle_update(io);
cloudflare.cycle_countdown(io);

const frontend = backend.replace("backend", "frontend");
const all_apps_urls = {
	"portals": {
		link: (run_config == "dev" ? "http://localhost:1025" : `https://portals.sh`),
		repo: "https://github.com/jc9108/portals"
	},
	"dark-mode-pdf": {
		link: (run_config == "dev" ? "http://localhost:1200" : `https://dark-mode-pdf.portals.sh`),
		repo: "https://github.com/jc9108/dark-mode-pdf"
	},
	"eternity": {
		link: (run_config == "dev" ? "http://localhost:1300" : `https://eternity.portals.sh`),
		repo: "https://github.com/jc9108/eternity"
	},
	"ttv-favorites": {
		link: "https://chrome.google.com/webstore/detail/ttv-favorites/ehbgkeiljpignaickbblnbfkhfeemmme",
		repo: "https://github.com/jc9108/ttv-favorites"
	},
	"yt-favorites": {
		link: "https://chrome.google.com/webstore/detail/yt-favorites/ifcphlpmanooadagnlmafmhgjklffkih",
		repo: "https://github.com/jc9108/yt-favorites"
	}
};

app.use("/", express.static(`${frontend}/build/`));

app.all("*", (req, res) => {
	res.status(404).sendFile(`${frontend}/build/index.html`);
});

io.on("connect", (socket) => {
	const headers = socket.handshake.headers;
	// console.log(headers);
	if (headers["user-agent"] == "node-XMLHttpRequest" && headers.secret == secrets.local_sockets_secret) { // socket connected from other node app
		console.log(`other localhost server (${headers.app}) connected as client`);

		io.to(socket.id).emit("store all apps urls", all_apps_urls);

		io.to(socket.id).emit("update domain request info", cloudflare.domain_request_info);
	} else { // socket connected from frontend
		console.log(`socket (${socket.id}) connected`);

		socket.on("layout mounted", () => {
			io.to(socket.id).emit("store all apps urls", all_apps_urls);

			io.to(socket.id).emit("update domain request info", cloudflare.domain_request_info);
		});

		socket.on("navigation", (route) => {
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

server.listen(secrets.port, secrets.host, () => {
	console.log(`server (${app_name}) started on (localhost:${secrets.port})`);
});
