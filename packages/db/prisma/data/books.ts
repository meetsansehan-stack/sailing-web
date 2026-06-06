import type { Book } from "@parenting-newsletter/shared";

// 첫 도서 컬렉션 (수동 시드, 프로토타입) — 앵커 기사: 도서그림책-7 "5월 그림책, 가족 다양성 흐름".
// 메타데이터(isbn·표지·출판년도·도서관/구매 링크)는 enrichment 스크립트(알라딘·정보나루)가 채움.
// whyRecommended = 세일링 큐레이션(친근한 존대, 차분한 이해·발달 중심 톤 가드레일).
const COLLECTION = "다양한 가족의 모습을 담은 그림책";
const COLLECTION_DATE = "2026-05";

export const books: Book[] = [
  {
    id: "book-모든가족은특별해요",
    title: "모든 가족은 특별해요",
    author: "토드 파",
    publisher: "문학동네어린이",
    ageRange: "3-8",
    whyRecommended:
      "엄마가 둘인 집, 식구가 아주 많은 집, 조용한 집… 세상엔 정말 다양한 가족이 있어요. 알록달록한 그림으로 '우리 집과 달라도 모두 괜찮다'를 가볍고 따뜻하게 전해, 아이가 다름을 자연스럽게 받아들이도록 도와줘요.",
    themes: ["가족 다양성", "자존감"],
    collection: COLLECTION,
    collectionDate: COLLECTION_DATE,
    sourceArticleIds: ["도서그림책-7"],
    credibilityScore: 0.85,
  },
  {
    id: "book-우리가족입니다",
    title: "우리 가족입니다",
    author: "이혜란",
    publisher: "보림",
    ageRange: "4-8",
    whyRecommended:
      "할머니·할아버지와 함께 사는 한 가족의 하루를 담담하게 담아요. 가족의 모양이 저마다 달라도, 함께 보내는 시간과 마음은 똑같이 소중하다는 걸 아이가 자연스럽게 느껴요.",
    themes: ["조손가족", "사랑"],
    collection: COLLECTION,
    collectionDate: COLLECTION_DATE,
    sourceArticleIds: ["도서그림책-7"],
    credibilityScore: 0.85,
  },
  {
    id: "book-이모의결혼식",
    title: "이모의 결혼식",
    author: "선현경",
    publisher: "비룡소",
    ageRange: "4-8",
    whyRecommended:
      "다른 나라 사람과 결혼하는 이모의 결혼식을 아이의 눈높이에서 설렘으로 그려요. 다문화 가족을 특별한 일이 아니라 우리 곁의 한 모습으로 보여줘, 편견 없이 이야기 나누기 좋아요.",
    themes: ["다문화", "국제결혼"],
    collection: COLLECTION,
    collectionDate: COLLECTION_DATE,
    sourceArticleIds: ["도서그림책-7"],
    credibilityScore: 0.85,
  },
  {
    id: "book-왼발오른발",
    title: "왼발 오른발",
    author: "토미 드 파올라",
    publisher: "비룡소",
    ageRange: "4-8",
    whyRecommended:
      "어린 시절 나를 일으켜 세워 준 할아버지가 편찮으시자, 이번엔 손자가 할아버지의 첫걸음을 도와요. 돌봄이 한 방향이 아니라 서로 오간다는 걸 잔잔하게 전해, 세대를 잇는 가족의 의미를 느끼게 해줘요.",
    themes: ["세대", "돌봄"],
    collection: COLLECTION,
    collectionDate: COLLECTION_DATE,
    sourceArticleIds: ["도서그림책-7"],
    credibilityScore: 0.85,
  },
  {
    id: "book-따로따로행복하게",
    title: "따로따로 행복하게",
    author: "배빗 콜",
    publisher: "보림",
    ageRange: "5-8",
    whyRecommended:
      "부모가 헤어지기로 한 상황을 무겁지 않게, 때론 유쾌하게 풀어내요. 이혼이 누구의 잘못도 아니고 그 뒤에도 각자 행복할 수 있다는 메시지가, 비슷한 상황의 아이에게 잔잔한 위로가 돼요.",
    themes: ["이혼가족", "위로"],
    collection: COLLECTION,
    collectionDate: COLLECTION_DATE,
    sourceArticleIds: ["도서그림책-7"],
    credibilityScore: 0.8,
  },
  {
    id: "book-그렇게네가왔고",
    title: "그렇게 네가 왔고 우리는 가족이 되었단다",
    author: "",
    publisher: "뜨인돌어린이",
    ageRange: "4-8",
    whyRecommended:
      "'너를 기다렸고, 그렇게 우리가 가족이 됐어'라는 말로 입양 가족의 시작을 따뜻하게 그려요. 핏줄이 아니라 함께하겠다는 마음이 가족을 만든다는 걸 아이 눈높이로 전해요.",
    themes: ["입양", "사랑"],
    collection: COLLECTION,
    collectionDate: COLLECTION_DATE,
    sourceArticleIds: ["도서그림책-7"],
    credibilityScore: 0.8,
  },
  {
    id: "book-내동생과백만가지",
    title: "내 동생과 할 수 있는 백만 가지 일",
    author: "",
    publisher: "한울림어린이",
    ageRange: "4-8",
    whyRecommended:
      "장애가 있는 동생과 함께하는 평범하고도 즐거운 순간들을 담아요. '할 수 없는 것'이 아니라 '함께 할 수 있는 것'에 시선을 두어, 형제를 있는 그대로 바라보게 해줘요.",
    themes: ["장애 형제", "형제애"],
    collection: COLLECTION,
    collectionDate: COLLECTION_DATE,
    sourceArticleIds: ["도서그림책-7"],
    credibilityScore: 0.8,
  },
  {
    id: "book-우리가족만나볼래",
    title: "우리 가족 만나볼래?",
    author: "",
    publisher: "가교출판",
    ageRange: "4-8",
    whyRecommended:
      "한부모 가족, 다문화 가족, 입양 가족… 다양한 집의 아이들이 '우리 가족을 소개할게' 하고 차례로 등장해요. 여러 가족의 모습을 한 권에서 만나며, '정상 가족'이라는 틀을 자연스럽게 넓혀줘요.",
    themes: ["가족 다양성", "한부모", "다문화"],
    collection: COLLECTION,
    collectionDate: COLLECTION_DATE,
    sourceArticleIds: ["도서그림책-7"],
    credibilityScore: 0.8,
  },
];
