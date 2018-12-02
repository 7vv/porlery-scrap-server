const Promise = require('bluebird');
const debug = require('debug');
const config = require('./config');
const _ = require('lodash');

const request = require('request-promise');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const moment = require('moment');

// 네이버 뉴스 스크랩 엔진
module.exports = new class {

    // 환경세팅
    constructor() { 
        // 네이버 뉴스 도메인
        this.domain = 'https://news.naver.com';

        // 정치 
        this.politicsUrl = 'https://news.naver.com/main/main.nhn?mode=LSD&mid=shm&sid1=100';

        // 경제 
        this.economy = 'https://news.naver.com/main/main.nhn?mode=LSD&mid=shm&sid1=101';

        // 사회
        this.social = 'https://news.naver.com/main/main.nhn?mode=LSD&mid=shm&sid1=102';

        // 생활/문화
        this.lifeCulture = 'https://news.naver.com/main/main.nhn?mode=LSD&mid=shm&sid1=103';

        // 세계
        this.world = 'https://news.naver.com/main/main.nhn?mode=LSD&mid=shm&sid1=104';

        // IT/과학
        this.itScience = 'https://news.naver.com/main/main.nhn?mode=LSD&mid=shm&sid1=105';
    }

    // 실제 작업 실행
    async run() {
        // 정치 뉴스 가져오기
        await this.scrap(this.politicsUrl, "정치");

        // 경제 뉴스 가져오기
        await this.scrap(this.economy, "경제");

        // 사회 뉴스 가져오기
        await this.scrap(this.social, "사회");

        // 생활/문화        
        await this.scrap(this.lifeCulture, "생활/문화");

        // 세계        
        await this.scrap(this.world, "세계");

        // IT/과학        
        await this.scrap(this.itScience, "IT/과학");
    }

    // 네이버
    async scrap(url, type) {
        // 네이버 뉴스 목록 링크 가져오기
        const $ = await this.naver_request(url);
        debug(`porlery:scrap:네이버:${type}`)(`${type} 목록 가져오기 완료`);

        // 아래 링크에서 뉴스 목록 스크래핑 진행
        const linkList = this.getClusterMoreUrl($);
        debug(`porlery:scrap:네이버:${type}`)(`${type} 목록 스크래핑 완료`);        

        // 관련 뉴스 모음 목록에서 뉴스 상세 링크 가져오기
        const infoList = await this.getInfoNewsLink(linkList, type);
        
        // 중복 제거
        const infoListUniq = _.uniq(infoList);
        
        debug(`porlery:scrap:네이버:${type}`)(infoListUniq.length,`개 ${type} 목록 뉴스 상세 링크 완료`);

        // DB 중복제거 시작         
        const dbInfoObjectList = await model.porlery.naver.find({create_at: moment().format('YYYY-MM-DD'), type: type}, ['link']);
        const dbInfoList = dbInfoObjectList.map(object => object.link);

        // DB 에 존재하는 LINK 는 Null 처리
        const claenInfoList = [];
        infoListUniq.forEach(link => dbInfoList.includes(link) ? null : claenInfoList.push(link));            

        debug(`porlery:scrap:네이버:${type}`)(claenInfoList.length,`개 중복제거 후 ${type} 목록 뉴스 상세 링크 완료`);
        
        await this.getInfoNews(claenInfoList, `${type}`);        
    }

    // 네이버 전용 request 인코딩 맞춤
    async naver_request(url) { 
        return await request({ url: url, encoding: null, transform: body => cheerio.load(iconv.decode(body, 'euc-kr'), { decodeEntities: false })})
    }

    // 네이버 뉴스 상세내용 가져오기
    async getInfoNews(linkList, type = "None") {
        const news = {
            contents: [],
            type: type,
        };

        const total = linkList.length;

        for(const index in linkList) {
            try{
                this.progress(`porlery:scrap:네이버:${type}`, '상세 내용 가져오기', Number(index) + 1, total);
                        
                const link = linkList[index];    
                if (!link) continue;
                
                const $ = await this.naver_request(link);
    
                const header = $('#articleTitle').text();
                const content = $('#articleBodyContents').text();    
                const create_at = $('#main_content > div.article_header > div.article_info > div > .t11:nth-child(1)').text();
                const update_at = $('#main_content > div.article_header > div.article_info > div > .t11:nth-child(2)').text();          
    
                const result = {
                    link: link,
                    header: header,
                    content: content,
                    create_at: create_at.split(' ')[0],
                    update_at: update_at.split(' ')[0],
                    create_at_time: create_at.split(' ')[1],
                    update_at_time: update_at.split(' ')[1],
                    type: type,
                };
    
                news.contents.push(result);
                
                await model.porlery.naver(result).save();
    
                await Promise.delay(500);
            }catch(e) {
                console.log(e);
            }            
        }

        return news;
    }

    // 관련 뉴스 링크 모음에서 상세 뉴스 내용 파싱하기
    async getInfoNewsLink(linkList, type) {
        const infoLinkList = [];
        for(const link of linkList) {
            debug(`porlery:scrap:네이버:${type}`)('상세 링크 가져오기', link);
            const $ = await this.naver_request(link);                    

            // https 주소만 가져옵니다.
            $('#main_content .cluster').each(function(){
                $(this).find('a').each(function(){
                    const newsInfoLink = $(this).attr('href');  
                    if(newsInfoLink.match(config.regex.https)) infoLinkList.push(newsInfoLink);
                });                
            });            

            // 짧은 재시도는 막혀서 대기 시간 줌
            await Promise.delay(500);
        }
        return infoLinkList;
    }

    // 각 섹션별 뉴스에서 관련뉴스 링크 수집 함수
    getClusterMoreUrl($) {
        const domain = this.domain;
        const linkList = [];
        $('a[href^="/main/cluster"]').each(function(){            
            const link = $(this).attr('href');
            if(link) linkList.push(domain + link);
        });
        return linkList;
    }

    // 작업 진행률 퍼센트로 로그 표시
    progress(prefix, message, current, total) {
        debug(prefix)(message, Number(current / total * 100).toFixed(2), '%');        
    }
}
