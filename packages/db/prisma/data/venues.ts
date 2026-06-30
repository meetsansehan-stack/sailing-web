import type { ReservableVenue } from '@parenting-newsletter/shared';

export const venues: ReservableVenue[] = [
  {
    "id": "venue-국립과천과학관",
    "name": "국립과천과학관",
    "type": "museum",
    "ageRange": "4-12",
    "entryMinAge": 0,
    "region": "경기 과천",
    "reservationUrl": "https://www.sciencecenter.go.kr/scipia/",
    "reservationChannel": "국립과천과학관",
    "operator": "national",
    "pricing": "mixed",
    "schedule": "화~일 09:30-17:30 (월 휴관)",
    "description": "상설전시관·천체투영관·생물탐구관. 입장권 예매 + 일부 체험 프로그램 별도 예약. 가족권 할인.",
    "credibilityScore": 0.95,
    "tags": [
      "상설전시",
      "천체관측"
    ]
  },
  {
    "id": "venue-국립국악원-어린이공연",
    "name": "국립국악원 어린이 국악 공연",
    "type": "show",
    "ageRange": "4-12",
    "region": "서울 서초구",
    "reservationUrl": "https://www.gugak.go.kr/",
    "reservationChannel": "국립국악원",
    "operator": "national",
    "pricing": "mixed",
    "schedule": "매월 주말 어린이 회차 + 방학 기획 공연",
    "description": "국악 입문 어린이 공연·체험. 일부 회차 무료, 기획 공연 유료. 자체 예매.",
    "credibilityScore": 0.93,
    "tags": [
      "국악",
      "공연예매"
    ]
  },
  {
    "id": "venue-국립대구과학관",
    "name": "국립대구과학관",
    "type": "museum",
    "ageRange": "4-12",
    "entryMinAge": 0,
    "region": "대구 달성군",
    "reservationUrl": "https://www.dnsm.or.kr/",
    "reservationChannel": "국립대구과학관",
    "operator": "national",
    "pricing": "mixed",
    "schedule": "화~일 09:30-17:30 (월 휴관)",
    "description": "상설전시 + 천체투영관·SF관·어린이관. 입장권 사전예매, 어린이 체험 별도 신청. 달성군.",
    "credibilityScore": 0.93,
    "tags": [
      "상설전시",
      "천체관측"
    ]
  },
  {
    "id": "venue-국립대구박물관-어린이박물관",
    "name": "국립대구박물관 어린이박물관",
    "type": "museum",
    "ageRange": "4-10",
    "entryMinAge": 0,
    "region": "대구 수성구",
    "reservationUrl": "https://daegu.museum.go.kr/",
    "reservationChannel": "국립대구박물관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화~일 09:00-18:00 (월 휴관)",
    "description": "대구·경북 지역 역사·문화 주제 체험전시. 회차당 정원제 사전예약, 무료.",
    "credibilityScore": 0.93,
    "tags": [
      "사전예약",
      "지역특화",
      "무료"
    ]
  },
  {
    "id": "venue-국립민속박물관-어린이박물관",
    "name": "국립민속박물관 어린이박물관",
    "type": "museum",
    "ageRange": "4-9",
    "entryMinAge": 0,
    "region": "서울 종로구",
    "reservationUrl": "https://www.nfm.go.kr/kids/main.do",
    "reservationChannel": "국립민속박물관",
    "operator": "national",
    "pricing": "free",
    "schedule": "평일·주말 회차제 / 월 휴관",
    "description": "전통문화 주제 체험전시. 회차당 정원 100명, 전 회차 사전예약. 부모 동반 필수.",
    "credibilityScore": 0.95,
    "tags": [
      "사전예약",
      "전통문화"
    ]
  },
  {
    "id": "venue-국립부산국악원",
    "name": "국립부산국악원 어린이 공연",
    "type": "show",
    "ageRange": "4-12",
    "region": "부산 부산진구",
    "reservationUrl": "https://busan.gugak.go.kr/",
    "reservationChannel": "국립부산국악원",
    "operator": "national",
    "pricing": "mixed",
    "schedule": "시즌별 어린이 공연 일정",
    "description": "국악 입문 어린이 공연·체험. 일부 회차 무료, 기획 공연 유료. 자체 예매.",
    "credibilityScore": 0.92,
    "tags": [
      "국악",
      "공연예매"
    ]
  },
  {
    "id": "venue-국립아시아문화전당-어린이극장",
    "name": "국립아시아문화전당(ACC) 어린이극장",
    "type": "show",
    "ageRange": "3-12",
    "region": "광주 동구",
    "reservationUrl": "https://www.acc.go.kr/child/index.do",
    "reservationChannel": "국립아시아문화전당",
    "operator": "national",
    "pricing": "paid",
    "schedule": "시즌별 공연 일정 별도 공지",
    "description": "아시아 문화 기반 어린이 공연·뮤지컬. 자체 예매 시스템, 가족석 별도. 5/22 〈숲의 노래〉 개막.",
    "credibilityScore": 0.93,
    "tags": [
      "공연예매",
      "뮤지컬"
    ]
  },
  {
    "id": "venue-국립어린이청소년도서관",
    "name": "국립어린이청소년도서관",
    "type": "library",
    "ageRange": "0-12",
    "region": "서울 강남구",
    "reservationUrl": "https://www.nlcy.go.kr/",
    "reservationChannel": "국립어린이청소년도서관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화~일 09:00-18:00 (월·공휴일 휴관)",
    "description": "사서추천 그림책 프로그램·작가 강연·전시 사전예약. 도서관 출입은 예약 없이 가능, 프로그램만 신청.",
    "credibilityScore": 0.94,
    "tags": [
      "사전예약",
      "도서프로그램",
      "무료"
    ]
  },
  {
    "id": "venue-국립제주박물관-어린이박물관",
    "name": "국립제주박물관 어린이박물관",
    "type": "museum",
    "ageRange": "4-10",
    "entryMinAge": 0,
    "region": "제주 제주시",
    "reservationUrl": "https://jeju.museum.go.kr/",
    "reservationChannel": "국립제주박물관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화~일 09:00-18:00 (월 휴관)",
    "description": "탐라·제주 역사 주제 어린이 체험전시. 회차당 정원제 사전예약, 무료.",
    "credibilityScore": 0.93,
    "tags": [
      "사전예약",
      "제주역사",
      "무료"
    ]
  },
  {
    "id": "venue-국립중앙박물관-어린이박물관",
    "name": "국립중앙박물관 어린이박물관",
    "type": "museum",
    "ageRange": "5-10",
    "entryMinAge": 0,
    "region": "서울 용산구",
    "reservationUrl": "https://www.museum.go.kr/site/child/home",
    "reservationChannel": "국립중앙박물관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화·목·금·일 10:00·13:00·15:00 / 수·토 13:00·15:00·17:00",
    "description": "회차당 정원제 사전예약. 어린이 눈높이 체험전시·교육프로그램 무료 운영. 도시락 가능 공간 분리.",
    "credibilityScore": 0.96,
    "tags": [
      "사전예약",
      "회차제",
      "무료"
    ]
  },
  {
    "id": "venue-국립춘천박물관-어린이박물관",
    "name": "국립춘천박물관 어린이박물관",
    "type": "museum",
    "ageRange": "4-10",
    "entryMinAge": 0,
    "region": "강원 춘천",
    "reservationUrl": "https://chuncheon.museum.go.kr/",
    "reservationChannel": "국립춘천박물관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화~일 회차제",
    "description": "강원 지역 역사·자연 주제 체험. 회차당 정원 50명, 사전예약 권장. 무료.",
    "credibilityScore": 0.92,
    "tags": [
      "사전예약",
      "지역특화",
      "무료"
    ]
  },
  {
    "id": "venue-국립한글박물관",
    "name": "국립한글박물관 한글놀이터·체험전시",
    "type": "museum",
    "ageRange": "3-9",
    "entryMinAge": 0,
    "region": "서울 용산구",
    "reservationUrl": "https://www.hangeul.go.kr/viewing/privateReservGuide.do?curr_menu_cd=0101020101",
    "reservationChannel": "국립한글박물관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화~일 회차제 (월 휴관)",
    "description": "한글놀이터 회차예약. 영유아 한글 체험 무료. 상설전시는 예약 없이 입장 가능.",
    "credibilityScore": 0.95,
    "tags": [
      "사전예약",
      "한글",
      "무료"
    ]
  },
  {
    "id": "venue-국립해양박물관",
    "name": "국립해양박물관 어린이박물관",
    "type": "museum",
    "ageRange": "4-10",
    "entryMinAge": 0,
    "region": "부산 영도구",
    "reservationUrl": "https://www.mmk.or.kr/",
    "reservationChannel": "국립해양박물관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화~일 09:00-18:00 (월 휴관)",
    "description": "해양 주제 체험전시·교육프로그램. 어린이박물관 무료, 일부 체험은 사전예약. 영도구.",
    "credibilityScore": 0.93,
    "tags": [
      "사전예약",
      "해양",
      "무료"
    ]
  },
  {
    "id": "venue-노원천문우주과학관",
    "name": "노원천문우주과학관 (구 노원우주학교)",
    "type": "program",
    "ageRange": "5-12",
    "region": "서울 노원구",
    "reservationUrl": "https://nowoncosmos.or.kr/",
    "reservationChannel": "노원구청",
    "operator": "district",
    "pricing": "paid",
    "schedule": "주말·방학 기획 프로그램",
    "description": "천체관측·우주과학 체험 전문 시설. 회차당 정원제 사전예약, 개인·단체·교육 예약 분리. 노원구민 할인.",
    "credibilityScore": 0.87,
    "tags": [
      "천체관측",
      "온라인예약"
    ]
  },
  {
    "id": "venue-부산시립박물관-어린이박물관",
    "name": "부산시립박물관 어린이박물관",
    "type": "museum",
    "ageRange": "4-10",
    "entryMinAge": 0,
    "region": "부산 남구",
    "reservationUrl": "https://museum.busan.go.kr/",
    "reservationChannel": "부산광역시",
    "operator": "metro",
    "pricing": "free",
    "schedule": "화~일 09:00-18:00 (월 휴관)",
    "description": "부산 지역사·민속 주제 어린이 체험전시. 회차당 정원제 사전예약, 무료. 남구 대연동.",
    "credibilityScore": 0.9,
    "tags": [
      "사전예약",
      "지역사",
      "무료"
    ]
  },
  {
    "id": "venue-서대문자연사박물관",
    "name": "서대문자연사박물관",
    "type": "museum",
    "ageRange": "3-12",
    "entryMinAge": 0,
    "region": "서울 서대문구",
    "reservationUrl": "https://namu.sdm.go.kr/",
    "reservationChannel": "서대문구청",
    "operator": "district",
    "pricing": "paid",
    "schedule": "화~일 09:00-18:00 (월 휴관)",
    "description": "자연사 상설전시 + 주말 가족 교육 프로그램. 입장권 사전예매·당일 발권 모두 가능.",
    "credibilityScore": 0.89,
    "tags": [
      "상설전시",
      "주말교육"
    ]
  },
  {
    "id": "venue-서울교육청어린이도서관",
    "name": "서울특별시교육청 어린이도서관",
    "type": "library",
    "ageRange": "0-12",
    "region": "서울 종로구",
    "reservationUrl": "https://childlib.sen.go.kr/",
    "reservationChannel": "서울특별시교육청",
    "operator": "metro",
    "pricing": "free",
    "schedule": "화~일 09:00-18:00",
    "description": "어린이 전용 도서관. 책 읽어주기·인형극·작가 만남 등 주말 프로그램 사전신청. 사직동.",
    "credibilityScore": 0.92,
    "tags": [
      "사전신청",
      "주말프로그램",
      "무료"
    ]
  },
  {
    "id": "venue-서울상상나라",
    "name": "서울상상나라",
    "type": "indoor-play",
    "ageRange": "0-7",
    "region": "서울 광진구",
    "reservationUrl": "https://www.seoulchildrensmuseum.org/reservation/viewAdmission.do",
    "reservationChannel": "서울특별시 (서울시여성가족재단 위탁)",
    "operator": "metro",
    "pricing": "paid",
    "schedule": "화~일 09:30-17:50 / 1일 4회차 (월 휴관)",
    "description": "영유아·미취학 대상 9개 체험전시실. 회차당 정원제, 100% 사전예약. 어린이대공원 내 위치.",
    "credibilityScore": 0.92,
    "tags": [
      "사전예약",
      "회차제",
      "실내"
    ]
  },
  {
    "id": "venue-서울시립과학관",
    "name": "서울시립과학관",
    "type": "museum",
    "ageRange": "5-12",
    "entryMinAge": 0,
    "region": "서울 노원구",
    "reservationUrl": "https://science.seoul.go.kr/",
    "reservationChannel": "서울특별시",
    "operator": "metro",
    "pricing": "paid",
    "schedule": "화~일 09:30-17:30 (월 휴관)",
    "description": "상설전시 + 주말 가족 과학교실. 입장권 사전예약, 가족 패키지 할인. 노원역 인근.",
    "credibilityScore": 0.91,
    "tags": [
      "사전예약",
      "과학교실"
    ]
  },
  {
    "id": "venue-서울어린이대공원",
    "name": "서울어린이대공원",
    "type": "indoor-play",
    "ageRange": "0-12",
    "entryMinAge": 0,
    "region": "서울 광진구",
    "reservationUrl": "https://www.sisul.or.kr/open_content/childrenpark/",
    "reservationChannel": "서울시설공단",
    "operator": "metro",
    "pricing": "free",
    "schedule": "연중무휴 / 동물원 10:00-17:00",
    "description": "동물원·놀이공원·체험프로그램·공연시설을 갖춘 시 운영 종합 어린이공원. 입장 무료, 일부 체험·시설대관 사전예약.",
    "credibilityScore": 0.9,
    "tags": [
      "무료입장",
      "동물원",
      "종합시설"
    ]
  },
  {
    "id": "venue-서울형키즈카페",
    "name": "서울형 키즈카페",
    "type": "indoor-play",
    "ageRange": "0-7",
    "entryMinAge": 0,
    "region": "서울 25개 자치구",
    "reservationUrl": "https://umppa.seoul.go.kr/icare/user/kidsCafe/BD_selectKidsCafeList.do",
    "reservationChannel": "서울특별시 (우리동네 키움포털)",
    "operator": "metro",
    "pricing": "paid",
    "schedule": "지점별 상이 / 수시 온라인 예약",
    "description": "서울시 자치구별 영유아 실내놀이 시설. 2026년 300개소로 확대 운영, 이용료 2,000~5,000원. 자치구·연령별 검색 후 회차 예약.",
    "credibilityScore": 0.92,
    "tags": [
      "사전예약",
      "동네지점",
      "회차제"
    ]
  },
  {
    "id": "venue-송파책박물관",
    "name": "송파책박물관",
    "type": "museum",
    "ageRange": "4-12",
    "entryMinAge": 0,
    "region": "서울 송파구",
    "reservationUrl": "https://www.bookmuseum.go.kr/",
    "reservationChannel": "송파구청",
    "operator": "district",
    "pricing": "free",
    "schedule": "화~일 10:00-18:00 (월 휴관)",
    "description": "책·출판·인쇄 주제 어린이 체험전시. 상설전시 무료, 워크숍 사전예약. 가락동.",
    "credibilityScore": 0.88,
    "tags": [
      "무료",
      "책체험"
    ]
  },
  {
    "id": "venue-제주민속자연사박물관",
    "name": "제주민속자연사박물관",
    "type": "museum",
    "ageRange": "3-12",
    "entryMinAge": 0,
    "region": "제주 제주시",
    "reservationUrl": "https://www.jeju.go.kr/museum/index.htm",
    "reservationChannel": "제주특별자치도",
    "operator": "metro",
    "pricing": "paid",
    "schedule": "매일 09:00-18:00",
    "description": "제주 민속·자연·지질 주제 상설전시. 어린이 체험관 운영, 입장료 저렴. 가족 단위 추천.",
    "credibilityScore": 0.9,
    "tags": [
      "상설전시",
      "제주민속"
    ]
  },
  {
    "id": "venue-종로아이들극장",
    "name": "종로 아이들극장",
    "type": "show",
    "ageRange": "3-10",
    "region": "서울 종로구",
    "reservationUrl": "https://www.jfac.or.kr/site/child/home",
    "reservationChannel": "종로문화재단",
    "operator": "district",
    "pricing": "paid",
    "schedule": "시즌별 공연 일정 / 주말 가족 공연",
    "description": "종로구 어린이 전용 공연장. 시즌별 동화·뮤지컬·인형극. 자체 예매, 종로구민 할인.",
    "credibilityScore": 0.88,
    "tags": [
      "공연예매",
      "구민할인"
    ]
  },
  {
    "id": "venue-경기도어린이박물관",
    "name": "경기도어린이박물관",
    "type": "indoor-play",
    "ageRange": "0-12",
    "entryMinAge": 0,
    "region": "경기 용인",
    "reservationUrl": "https://gcm.ggcf.kr/",
    "reservationChannel": "경기문화재단",
    "operator": "metro",
    "pricing": "free",
    "schedule": "화~일 1·2회차제 (10:00-13:30 / 14:00-17:30, 월 휴관)",
    "description": "영유아·초등 대상 체험형 어린이박물관. 회차당 정원제 사전예약, 무료 관람. 용인 기흥 상갈.",
    "credibilityScore": 0.91,
    "tags": [
      "사전예약",
      "회차제",
      "무료"
    ]
  },
  {
    "id": "venue-국립세계문자박물관-어린이",
    "name": "국립세계문자박물관 어린이 체험",
    "type": "museum",
    "ageRange": "4-12",
    "entryMinAge": 0,
    "region": "인천 연수구",
    "reservationUrl": "https://www.mow.or.kr/",
    "reservationChannel": "국립세계문자박물관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화~일 10:00-18:00 (월 휴관)",
    "description": "문자·글자 주제 국립박물관. 어린이 문자 체험공간 운영, 상설전시 무료. 송도. 일부 교육 프로그램 사전예약.",
    "credibilityScore": 0.93,
    "tags": [
      "무료",
      "문자체험",
      "사전예약"
    ]
  },
  {
    "id": "venue-국립중앙과학관-꿈아띠",
    "name": "국립중앙과학관 어린이체험(꿈아띠)",
    "type": "museum",
    "ageRange": "4-10",
    "entryMinAge": 0,
    "region": "대전 유성구",
    "reservationUrl": "https://www.science.go.kr/",
    "reservationChannel": "국립중앙과학관",
    "operator": "national",
    "pricing": "mixed",
    "schedule": "화~일 09:30-17:50 (월 휴관)",
    "description": "국내 대표 국립과학관. 어린이 대상 꿈아띠체험관 운영, 상설전시 무료·일부 체험 유료. 회차 사전예약. 유성구.",
    "credibilityScore": 0.94,
    "tags": [
      "사전예약",
      "과학체험",
      "어린이관"
    ]
  },
  {
    "id": "venue-국립전주박물관-어린이박물관",
    "name": "국립전주박물관 어린이박물관",
    "type": "museum",
    "ageRange": "4-10",
    "entryMinAge": 0,
    "region": "전북 전주",
    "reservationUrl": "https://jeonju.museum.go.kr/",
    "reservationChannel": "국립전주박물관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화~일 09:00-18:00 (월 휴관)",
    "description": "전북·조선 선비문화 주제 어린이 체험전시. 회차당 정원제 사전예약, 무료.",
    "credibilityScore": 0.92,
    "tags": [
      "사전예약",
      "지역특화",
      "무료"
    ]
  },
  {
    "id": "venue-국립공주박물관-어린이박물관",
    "name": "국립공주박물관 어린이박물관",
    "type": "museum",
    "ageRange": "4-10",
    "entryMinAge": 0,
    "region": "충남 공주",
    "reservationUrl": "https://gongju.museum.go.kr/",
    "reservationChannel": "국립공주박물관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화~일 09:00-18:00 (월 휴관)",
    "description": "백제·웅진 역사 주제 어린이 체험전시. 회차당 정원제 사전예약, 무료. 공주 웅진동.",
    "credibilityScore": 0.92,
    "tags": [
      "사전예약",
      "백제역사",
      "무료"
    ]
  },
  {
    "id": "venue-국립김해박물관-어린이박물관",
    "name": "국립김해박물관 어린이박물관",
    "type": "museum",
    "ageRange": "4-10",
    "entryMinAge": 0,
    "region": "경남 김해",
    "reservationUrl": "https://gimhae.museum.go.kr/",
    "reservationChannel": "국립김해박물관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화~일 09:00-18:00 (월 휴관)",
    "description": "가야 역사·문화 주제 어린이 체험전시. 회차당 정원제 사전예약, 무료.",
    "credibilityScore": 0.92,
    "tags": [
      "사전예약",
      "가야역사",
      "무료"
    ]
  },
  {
    "id": "venue-국립경주박물관-어린이박물관",
    "name": "국립경주박물관 어린이박물관",
    "type": "museum",
    "ageRange": "4-10",
    "entryMinAge": 0,
    "region": "경북 경주",
    "reservationUrl": "https://gyeongju.museum.go.kr/",
    "reservationChannel": "국립경주박물관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화~일 10:00-18:00 (월 휴관)",
    "description": "신라 역사·문화 주제 어린이 체험전시. 회차당 정원제 사전예약, 무료. 경주 인왕동.",
    "credibilityScore": 0.93,
    "tags": [
      "사전예약",
      "신라역사",
      "무료"
    ]
  },
  {
    "id": "venue-국립청주박물관-어린이박물관",
    "name": "국립청주박물관 어린이박물관",
    "type": "museum",
    "ageRange": "4-10",
    "entryMinAge": 0,
    "region": "충북 청주",
    "reservationUrl": "https://cheongju.museum.go.kr/child/index.do",
    "reservationChannel": "국립청주박물관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화~일 09:00-18:00 (월 휴관)",
    "description": "백제·충청 역사 주제 어린이체험전시. 회차당 정원제 사전예약(kguide.kr), 무료. 청주 상당구.",
    "credibilityScore": 0.92,
    "tags": [
      "사전예약",
      "백제역사",
      "무료"
    ]
  },
  {
    "id": "venue-국립나주박물관-어린이박물관",
    "name": "국립나주박물관 어린이박물관",
    "type": "museum",
    "ageRange": "3-10",
    "entryMinAge": 0,
    "region": "전남 나주",
    "reservationUrl": "https://naju.museum.go.kr/",
    "reservationChannel": "국립나주박물관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화~일 09:00-18:00, 유아놀이터 1일 7회차 (월 휴관)",
    "description": "마한·나주 지역 역사 주제 어린이체험전시. 유아놀이터 회차당 20명 사전예약, 새 어린이박물관 시범운영 중(2026). 무료.",
    "credibilityScore": 0.92,
    "tags": [
      "사전예약",
      "마한역사",
      "무료"
    ]
  },
  {
    "id": "venue-국립세종도서관",
    "name": "국립세종도서관 어린이자료실",
    "type": "library",
    "ageRange": "0-12",
    "region": "세종 세종시",
    "reservationUrl": "https://sejong.nl.go.kr/",
    "reservationChannel": "국립세종도서관",
    "operator": "national",
    "pricing": "free",
    "schedule": "화~일 09:00-18:00 (월 휴관)",
    "description": "어린이자료실 단체방문·교육프로그램 사전신청. 사서추천 연령별 도서 큐레이션, 어린이 독서문화 행사 정기 운영.",
    "credibilityScore": 0.92,
    "tags": [
      "사전신청",
      "도서프로그램",
      "무료"
    ]
  },
  {
    "id": "venue-성남아트센터",
    "name": "성남아트센터 어린이 공연",
    "type": "show",
    "ageRange": "3-12",
    "region": "경기 성남",
    "reservationUrl": "https://www.snart.or.kr/",
    "reservationChannel": "성남문화재단",
    "operator": "district",
    "pricing": "paid",
    "schedule": "시즌별 공연 일정 / 키즈 페스티벌 연중",
    "description": "성남문화재단 운영 어린이 공연. 키즈 페스티벌(가족음악극·전래동화클래식·인형극) 연중 기획, 아트리움 어린이예술놀이터. 자체 예매.",
    "credibilityScore": 0.88,
    "tags": [
      "공연예매",
      "키즈페스티벌"
    ]
  },
  {
    "id": "venue-서울역사-어린이박물관",
    "name": "서울역사 어린이박물관",
    "type": "museum",
    "ageRange": "4-10",
    "entryMinAge": 0,
    "region": "서울 종로구",
    "reservationUrl": "https://museum.seoul.go.kr/chd/index.do",
    "reservationChannel": "서울역사박물관",
    "operator": "metro",
    "pricing": "free",
    "schedule": "화~일 10:00-17:20 (월 휴관)",
    "description": "서울 역사를 어린이 눈높이로 체험. 사전예약·단체 입장 운영, 무료 관람. 종로구 새문안로 55.",
    "credibilityScore": 0.90,
    "tags": [
      "사전예약",
      "서울역사",
      "무료"
    ]
  },
  {
    "id": "venue-국립현대미술관-어린이미술관",
    "name": "국립현대미술관 어린이미술관",
    "type": "museum",
    "ageRange": "4-12",
    "entryMinAge": 0,
    "region": "경기 과천",
    "reservationUrl": "https://www.mmca.go.kr/",
    "reservationChannel": "국립현대미술관",
    "operator": "national",
    "pricing": "mixed",
    "schedule": "화~일 10:00-18:00 (월 휴관)",
    "description": "과천관 내 어린이미술관. 감각·체험 기반 기획전시 운영(현재: '오~감각미술관' 2027.2월까지). 통합예약 필수.",
    "credibilityScore": 0.93,
    "tags": [
      "사전예약",
      "미술체험",
      "과천"
    ]
  },
  {
    "id": "venue-세종문화회관-어린이공연",
    "name": "세종문화회관 어린이 공연",
    "type": "show",
    "ageRange": "4-12",
    "region": "서울 종로구",
    "reservationUrl": "https://www.sejongpac.or.kr/",
    "reservationChannel": "세종문화회관",
    "operator": "metro",
    "pricing": "mixed",
    "schedule": "시즌별 공연 일정",
    "description": "서울시 대표 공연시설. 어린이 오케스트라·가족 음악회·꿈나무 기획공연 연중 운영. 자체 예매.",
    "credibilityScore": 0.91,
    "tags": [
      "공연예매",
      "음악회"
    ]
  },
  {
    "id": "venue-국립극단-어린이청소년극장",
    "name": "국립극단 어린이청소년극장",
    "type": "show",
    "ageRange": "4-13",
    "region": "서울 종로구",
    "reservationUrl": "https://www.ntck.or.kr/",
    "reservationChannel": "국립극단",
    "operator": "national",
    "pricing": "paid",
    "schedule": "시즌별 공연 일정 (예매문의 평일 10~18시)",
    "description": "국립 어린이청소년 전문 극단. 창작극·동화 기반 공연 전문. 홍익대 대학로 캠퍼스 내, 1600-6261.",
    "credibilityScore": 0.92,
    "tags": [
      "공연예매",
      "창작극"
    ]
  },
  {
    "id": "venue-경기도박물관",
    "name": "경기도박물관 어린이 프로그램",
    "type": "museum",
    "ageRange": "4-12",
    "entryMinAge": 0,
    "region": "경기 용인",
    "reservationUrl": "https://musenet.ggcf.kr/",
    "reservationChannel": "경기문화재단",
    "operator": "metro",
    "pricing": "mixed",
    "schedule": "화~일 10:00-18:00 (월 휴관)",
    "description": "경기 역사·문화 주제 박물관. 어린이 상시 체험 프로그램 운영. 용인 기흥 상갈.",
    "credibilityScore": 0.89,
    "tags": [
      "어린이프로그램",
      "경기역사"
    ]
  },
  {
    "id": "venue-광주시립미술관-어린이갤러리",
    "name": "광주시립미술관 어린이갤러리",
    "type": "museum",
    "ageRange": "3-12",
    "entryMinAge": 0,
    "region": "광주 북구",
    "reservationUrl": "https://artmuse.gwangju.go.kr/",
    "reservationChannel": "광주광역시",
    "operator": "metro",
    "pricing": "free",
    "schedule": "화~일 10:00-18:00 (월 휴관)",
    "description": "광주시립미술관 본관 내 어린이갤러리. 연간 기획전 운영(2026: 3/31~12/31). 온라인 사전예약, 무료. 북구 운암동.",
    "credibilityScore": 0.89,
    "tags": [
      "사전예약",
      "미술체험",
      "무료"
    ]
  },
  {
    "id": "venue-국립항공박물관",
    "name": "국립항공박물관",
    "type": "museum",
    "ageRange": "4-12",
    "entryMinAge": 0,
    "region": "서울 강서구",
    "reservationUrl": "https://www.aviation.or.kr/",
    "reservationChannel": "국립항공박물관",
    "operator": "national",
    "pricing": "mixed",
    "schedule": "화~일 10:00-18:00 (월 휴관)",
    "description": "한국 항공 역사·기술 체험관. 시뮬레이터·실물 항공기 전시. 어린이 체험교육 사전예약. 강서구 하늘길.",
    "credibilityScore": 0.91,
    "tags": [
      "사전예약",
      "항공체험",
      "시뮬레이터"
    ]
  },
  {
    "id": "venue-노원수학문화관",
    "name": "노원수학문화관",
    "type": "program",
    "ageRange": "5-12",
    "region": "서울 노원구",
    "reservationUrl": "https://www.nowon.kr/math/main",
    "reservationChannel": "노원구청",
    "operator": "district",
    "pricing": "mixed",
    "schedule": "개인·가족·단체 교육 예약, 강연·행사·영화 운영",
    "description": "수학 주제 체험 문화 시설. 개인·가족·단체 교육 예약 분리, 강연·전시·영화 복합 운영. 노원구 한글비석로.",
    "credibilityScore": 0.86,
    "tags": [
      "사전예약",
      "수학체험",
      "구민시설"
    ]
  },
  {
    "id": "venue-서초수학박물관",
    "name": "서초수학박물관",
    "type": "museum",
    "ageRange": "5-12",
    "region": "서울 서초구",
    "reservationUrl": "https://www.scmathmuseum.com/",
    "reservationChannel": "서초수학박물관",
    "operator": "district",
    "pricing": "mixed",
    "schedule": "목 17:00~ 개인 관람 / 평일 단체 예약 도슨트 프로그램",
    "description": "수학의 역사·원리를 체험하는 박물관. 개인 관람은 목요일 오후 한정, 단체·학교는 평일 사전예약 도슨트 운영. 서초구 방배동.",
    "credibilityScore": 0.84,
    "tags": [
      "사전예약",
      "수학체험",
      "도슨트"
    ]
  }
];
