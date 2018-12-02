'use strict'
const bodyParser = require('body-parser');

module.exports = App => {
    debug.info('Load server..');
    
    App.listen(config.server.port);
    App.use(bodyParser.json({type: 'text/plain'}));
    App.use(bodyParser.json({type: 'application/json'}));
    App.use(bodyParser.urlencoded({ extended: true }));    
};