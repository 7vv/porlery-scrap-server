const debug = require('debug');
const chalk = require('chalk');

module.exports = class Debug {
    constructor(prefix = 'porlery') {
        this.debug = debug(prefix);
    }

    error() {
        this.debug(chalk.bgRed('error'), ...arguments);
    }

	info() {
		this.debug(chalk.bgBlue('info'), ...arguments);
	}
} 