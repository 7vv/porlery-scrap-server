module.exports = async App => {
    process.on('uncaughtException', (err) => {          
        debug.error(err);
    });

    process.on('unhandledRejection', (err) => {     
        debug.error(err);
    });
}