'use strict';
const fs = require('fs-promise');

// 모델 정의 파일로 몽고 스키마 생성해줌
module.exports = async App => {
    debug.info('Load database..');

    const path = __dirname + '/../db/';
    const dbDir = await fs.readdir(path);

    global.model = {};

    debug.info('Connected database');

    for (const db of dbDir) {

        global.model[db] = require('mongoose');

        const dbConfig = config.db[db];

        await model[db].connect(            
            `mongodb://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:27017/${dbConfig.database}`,
            { useNewUrlParser: true }
        );

        //스키마 모델 생성
        const Schema = model[db].Schema;
        model[db].Promise = Promise;

        //스키마 리스트 
        const schemaList = await fs.readdir(path + '/' + db);
        schemaList.forEach(model_schema => {
            const schema = require(path + '/' + db + '/' + model_schema);
            const schema_name = model_schema.replace('.js', '');
            model[db][schema_name] = model[db].model(schema_name, new Schema(schema));
        });
    }

    Object.freeze(model);
}