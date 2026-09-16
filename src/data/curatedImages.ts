export interface CuratedImageItem {
  url: string;
  title: string;
  tag: string;
}

export interface CategoryImageCollection {
  category: string;
  categoryName: string;
  images: CuratedImageItem[];
}

export const CURATED_GALLERY: CategoryImageCollection[] = [
  {
    category: 'golf',
    categoryName: '파크골프 & 필드 라이프',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80',
        title: '푸른 잔디 파크골프 코스 & 그린 전경',
        tag: '코스 전경',
      },
      {
        url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=1200&q=80',
        title: '골프공과 클럽 헤드 클로즈업 & 퍼팅 라인',
        tag: '장비/클럽',
      },
      {
        url: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&w=1200&q=80',
        title: '맑은 하늘 아래 시원한 티샷 드라이버 스윙',
        tag: '티샷/스윙',
      },
      {
        url: 'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=1200&q=80',
        title: '정교한 홀컵 어프로치 & 깃대 핀',
        tag: '어프로치',
      },
      {
        url: 'https://images.unsplash.com/photo-1628891890377-5712989b1112?auto=format&fit=crop&w=1200&q=80',
        title: '파크골프 라운딩 동반자와 함께하는 필드 워킹',
        tag: '라운딩 라이프',
      },
      {
        url: 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?auto=format&fit=crop&w=1200&q=80',
        title: '탁 트인 호수 뷰 명문 코스 페어웨이',
        tag: '명문 코스',
      },
      {
        url: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&w=1200&q=80',
        title: '그린 위 롱퍼트 볼 마킹과 브레이크 라이 읽기',
        tag: '퍼팅 레슨',
      },
      {
        url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=1200&q=80',
        title: '파크골프 전용 우드 클럽과 파크골프 공 세팅',
        tag: '용품 세팅',
      },
    ],
  },
  {
    category: 'sports',
    categoryName: '스포츠 & 경기 분석',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
        title: '열정적인 스포츠 스타디움 트랙 & 경기장',
        tag: '경기장',
      },
      {
        url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
        title: '결정적인 승부처 축구 경기 하이라이트',
        tag: '축구/경기',
      },
      {
        url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
        title: '역동적인 경기 순간과 선수들의 열정',
        tag: '스포츠 현장',
      },
    ],
  },
  {
    category: 'health',
    categoryName: '건강 & 시니어 웰빙',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
        title: '햇살 속 힐링 요가와 관절 스트레칭',
        tag: '스트레칭',
      },
      {
        url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
        title: '숲속 야외 산책과 유산소 건강 워킹',
        tag: '워킹 루틴',
      },
      {
        url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
        title: '활력 넘치는 시니어 피트니스 & 근력 운동',
        tag: '시니어 웰빙',
      },
    ],
  },
  {
    category: 'cooking',
    categoryName: '요리 & 간편 레시피',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
        title: '신선한 식재료로 차려낸 건강한 가정식 밥상',
        tag: '가정식',
      },
      {
        url: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80',
        title: '정갈하고 맛있는 홈메이드 요리 레시피',
        tag: '홈메이드',
      },
      {
        url: 'https://images.unsplash.com/photo-1507048821117-6573c21c4388?auto=format&fit=crop&w=1200&q=80',
        title: '신선한 야채 샐러드와 건강 식단',
        tag: '건강 식단',
      },
    ],
  },
  {
    category: 'finance',
    categoryName: '재테크 & 생활 경제',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&q=80',
        title: '스마트한 자산 관리와 금융 재테크',
        tag: '자산 관리',
      },
      {
        url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
        title: '실시간 증시 차트와 글로벌 경제 동향',
        tag: '경제 동향',
      },
    ],
  },
  {
    category: 'travel',
    categoryName: '여행 & 힐링 나들이',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
        title: '자연과 함께하는 힐링 국내 여행지',
        tag: '국내 여행',
      },
      {
        url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
        title: '상쾌한 드라이브와 주말 나들이 명소',
        tag: '주말 나들이',
      },
    ],
  },
  {
    category: 'news',
    categoryName: '시사 & 뉴스 브리핑',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
        title: '최신 신문 지면과 실시간 뉴스 브리핑',
        tag: '뉴스 속보',
      },
      {
        url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
        title: '언론 미디어 보도와 팩트체크 리포트',
        tag: '미디어 보도',
      },
    ],
  },
];
