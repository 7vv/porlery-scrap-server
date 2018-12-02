const cheerio = require('cheerio');
const request = require('request-promise');  
const moment = require('moment-timezone');

const YEAR = moment().tz('Asia/Seoul').format('YYYY');
const ZETAWIKI_CONFERENCE_PREFIX = '_국내_IT_컨퍼런스_일정';

/**
 * Main.
 */
module.exports.start = async function() {    
    const $ = await zetawikiRequest(YEAR + ZETAWIKI_CONFERENCE_PREFIX);
    const data = zetawikiTable2Array($);    
    const cleanData = removeSepicalCharacters(data);

    // TODO: mongoose pipeline save query
    cleanData.forEach(async value => {
        const result = await model.porlery.noti_conference(value).save();
        debug.info(result);
    });
}

/**
 * Zetawiki IT conference default request
 * (Warning: Don't URL ENCODE)
 * 
 * @param {String} name Parsing page name 
 */
function zetawikiRequest(name) {
    return request({
        url: `https://zetawiki.com/wiki/${encodeURIComponent(name)}`,
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36'   
        },
        transform: response => cheerio.load(response),
    });
}

/**
 * Zetawiki Table 2 Map.
 * 
 * @param {Jquery} $ Jquery Object
 */
function zetawikiTable2Array($) {    
    const data = [];

    // Not Arrow Function but Used $(this)
    $('#mw-content-text > table > tbody > tr').each(function(index) {
        // index === 1 Skip (Table header)
        if (index === 1) return;

        // Filter Month
        const checkMonth = $(this).find('th').text();

        if (checkMonth) return;        

        data.push({
            url: $(this).find('td:nth-child(1) a').attr('href'),
            name: $(this).find('td:nth-child(1)').text(),                        
            end_date: $(this).find('td:nth-child(2)').text(),
            place: $(this).find('td:nth-child(3)').text(),
            host: $(this).find('td:nth-child(5)').text(),
            etc: $(this).find('td:nth-child(6)').text(),
            keyword: ['IT', '서버', '개발', '인프라'],
            level: 0,
            // Ugly date form to YYYY-MM-DD
            ...zetawikiDateFilter($(this).find('td:nth-child(2)').text()),
        });
    });

    return data;
}

/**
 * Zetawiki Table Date Filter
 * X.XX(D) => YYYY-MM-DD 
 * 
 * @param {String} date ex) 1.19(D)
 */
function zetawikiDateFilter(date = moment().format('MM-DD')) {   
    // Delete Korean, (), space
    data = date.replace(/[가-힣]|\(|\)| /gi, '');

    // A.XX ~ B.XX => [AA-XX, BB-XX]
    let [start_date, end_date] = date.split('~').map(_date => YEAR + '-' + moment(_date).format('MM-DD'));
    
    // day.
    end_date = end_date === undefined ? start_date : end_date;

    return {start_date, end_date};
}

/**
 * Remove Special Characters
 * 
 * @param {Array[Object]} data
 */
function removeSepicalCharacters(data) {
    return data.map(object => { 
        Object.keys(object).forEach(key => object[key] = String(object[key]).replace(/^ |\\n|\n|\t|\\t/gi, ''));
        return object;
    });
}