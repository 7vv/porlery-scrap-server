const Debug = require('../class/debug');

module.exports = App => {    
    global.config = Object.freeze(Object.assign(require('config'), require('../config/regex')));	

    global.debug = Object.freeze(new Debug());
    global._ = Object.freeze(require('lodash'));
    global.path = Object.freeze(require('path'));
    global.Promise = Object.freeze(require('bluebird'));
}