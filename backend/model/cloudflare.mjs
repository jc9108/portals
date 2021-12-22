const backend = process.cwd();
const run_config = (backend.toLowerCase().slice(0, 20) == "/mnt/c/users/j9108c/" ? "dev" : "prod");

const secrets = (run_config == "dev" ? (await import(`${backend}/.secrets.mjs`)).dev : (await import(`${backend}/.secrets.mjs`)).prod);

import axios from "axios";

function get_dates(range) {
	let now = new Date(); // utc
	let from = null;
	let to = null;

	if (range == "last24hours") {
		from = new Date(now.setDate(now.getDate() - 1)).toISOString();
	} else if (range == "last7days") {
		from = new Date(now.setDate(now.getDate() - 7)).toISOString().slice(0, 10);
	} else if (range == "last30days") {
		from = new Date(now.setDate(now.getDate() - 30)).toISOString().slice(0, 10);
	}
	now = new Date();
	to = (range == "last24hours" ? now.toISOString() : now.toISOString().slice(0, 10));

	return [from, to];
}

async function get_requests_by_country(range) {
	const [from, to] = get_dates(range);
	const group = (range == "last24hours" ? "h" : "d");
	const dt = (range == "last24hours" ? "datetime" : "date");

	const endpoint = "https://api.cloudflare.com/client/v4/graphql";
	const data = {
		query: `
			query {
				viewer {
					zones(filter: {zoneTag: "${secrets.cloudflare_zone_id}"}) {
						httpRequests1${group}Groups(limit: 10000, filter: {${dt}_geq: "${from}", ${dt}_leq: "${to}"}) {
							sum {
								countryMap {
									clientCountryName
									requests
								}
							}
						}
					}
				}
			}
		`
	};
	const config = {
		headers: {
			"Authorization": `Bearer ${secrets.cloudflare_auth_token}`
		}
	};

	const response = await axios.post(endpoint, data, config);
	const response_data = response.data;
	// console.log(response_data);

	if (response_data.data.viewer.zones[0][`httpRequests1${group}Groups`].length == 0) { // no requests
		return [];
	} else {
		return response_data.data.viewer.zones[0][`httpRequests1${group}Groups`][0].sum.countryMap.sort((a, b) => b.requests - a.requests); // sort by number of requests, descending
	}
}

const domain_request_info = {};
async function update(io) {
	domain_request_info.last24hours_countries = await get_requests_by_country("last24hours");
	domain_request_info.last7days_countries = await get_requests_by_country("last7days");
	domain_request_info.last30days_countries = await get_requests_by_country("last30days");

	domain_request_info.last24hours_total = 0;
	domain_request_info.last7days_total = 0;
	domain_request_info.last30days_total = 0;

	for (const country of domain_request_info.last24hours_countries) {
		domain_request_info.last24hours_total += country.requests;
	}
	for (const country of domain_request_info.last7days_countries) {
		domain_request_info.last7days_total += country.requests;
	}
	for (const country of domain_request_info.last30days_countries) {
		domain_request_info.last30days_total += country.requests;
	}

	io.emit("update domain request info", domain_request_info);
	// console.log("stored domain request info");
}
function cycle_update(io) {
	update(io).catch((err) => console.error(err));

	setInterval(() => {
		update(io).catch((err) => console.error(err));
	}, 30000);
}

let countdown = 30;
function cycle_countdown(io) {
	setInterval(() => {
		io.emit("update countdown", countdown--);
		if (countdown == 0) {
			countdown = 30;
			// console.log("countdown reset");
		}
	}, 1000);
}

export {
	domain_request_info,
	cycle_update,
	cycle_countdown
};
