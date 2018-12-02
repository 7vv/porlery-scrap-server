const Express = require('express');
const App = Express();
const BootOrders = [
	'load_config',
	'load_global',
	'load_server',
	'load_database',
	'add_process_on',
	'start_scrap',
]

try {
	load_boot(App);
}
catch (e) {
	debug.error(e);
}

async function load_boot(App) {    

	for(let i in BootOrders) {
		await require('./boot/'+BootOrders[i])(App, Express);
	}
	
	debug.info(`porlery scrap server is started on port ${config.server.port}!`);
}