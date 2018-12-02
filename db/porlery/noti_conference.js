module.exports = {
    "url": {
        "type": "string",        
		"trim": true,		
        "description": "컨퍼런스 설명 본문 경로"
	},
	"name": {
		"type": "string",
		"trim": true,
		"description": "컨퍼런스 이름"
	},
    "start_date": {
        "type": "date",
        "format": "date-time",
        "description": "시작일",
    },
    "end_date": {
        "type": "date",
        "format": "date-time",
		"description": "종료일",
    },
    "place": {
        "type": "string",
		"trim": true,
		"description": "장소"
    },
    "host": {
        "type": "string",
		"trim": true,
		"description": "주최자"
    },
    "keyword": {
        "type": "array",
		"trim": true,
		"description": "키워드 ex) [IT, 디자인, 인프라]"
    },
    "level": {
        "type": "number",		
		"description": "우선순위 0이 가장 높습니다."
    },
    "etc": {
        "type": "string",
		"trim": true,
		"description": "특이사항 ex) 유료, 회차 등"
    }
}