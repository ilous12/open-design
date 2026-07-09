import type { InstalledPluginRecord } from '@nn-design/contracts';

const HOME_REFERENCE_CLONE_BASE = '/reference-remix';
const HOME_REFERENCE_PLUGIN_ID_PREFIX = 'uupm-';

interface WebsiteReference {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  style: string;
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  ctaColor: string;
  prompt: string;
}

export const HOME_WEBSITE_REFERENCES = [
  { slug: 'saas-analytics-dashboard', name: 'SaaS 분석 대시보드', category: 'SaaS', categorySlug: 'saas', style: 'Glassmorphism + Flat Design', mode: 'light', primaryColor: '#0080FF', secondaryColor: '#8B00FF', ctaColor: '#22C55E', prompt: '글래스모피즘 카드와 플랫 디자인을 활용한 현대적인 SaaS 분석 대시보드 웹 프로토타입을 만들어 주세요. 실시간 데이터 시각화를 보여주는 히어로 영역, 아이콘 기반 기능 요약, 가격표, 신뢰 배지를 포함하고 명확하고 전문적인 인상을 우선해 주세요.' },
  { slug: 'educational-platform', name: '교육 플랫폼', category: '교육', categorySlug: 'education', style: 'Claymorphism + Vibrant & Block-based', mode: 'light', primaryColor: '#FDBCB4', secondaryColor: '#ADD8E6', ctaColor: '#22C55E', prompt: '클레이모피즘 카드와 생동감 있는 블록형 구성을 활용한 교육 플랫폼 웹 프로토타입을 만들어 주세요. 강의 카탈로그 미리보기, 학습 진도 데모, 수강생 후기, 등록 버튼을 포함하고 밝고 몰입감 있는 색감을 유지해 주세요.' },
  { slug: 'pet-grooming', name: '반려동물 그루밍 스파', category: '반려동물 서비스', categorySlug: 'pet-services', style: 'Claymorphism + Vibrant & Block-based', mode: 'light', primaryColor: '#FF9F43', secondaryColor: '#87CEEB', ctaColor: '#FF9F43', prompt: '친근한 반려동물 그루밍 서비스 웹 프로토타입을 만들어 주세요. 클레이모피즘 카드, 서비스 패키지, 반려동물 갤러리, 예약 시스템, 보호자 후기를 포함하고 따뜻하고 발랄한 색감을 사용해 주세요.' },
  { slug: 'ai-chatbot-platform', name: 'AI 챗봇 플랫폼', category: 'AI/챗봇', categorySlug: 'ai-chatbot', style: 'AI-Native UI + Minimalism', mode: 'light', primaryColor: '#6366F1', secondaryColor: '#10B981', ctaColor: '#6366F1', prompt: '미니멀한 AI 챗봇 플랫폼 웹 프로토타입을 만들어 주세요. 대화형 UI 미리보기, 스트리밍 텍스트 애니메이션 데모, AI 기능 카드, 연동 로고, 눈에 잘 띄는 체험 버튼을 포함하고 중립적인 톤에 AI 퍼플 포인트를 적용해 주세요.' },
  { slug: 'luxury-ecommerce', name: '럭셔리 이커머스', category: '이커머스', categorySlug: 'e-commerce', style: 'Liquid Glass + Glassmorphism', mode: 'light', primaryColor: '#000000', secondaryColor: '#FFD700', ctaColor: '#FFD700', prompt: '리퀴드 글래스 효과와 글래스모피즘을 활용한 고급 이커머스 웹 프로토타입을 만들어 주세요. 프리미엄 상품 쇼케이스, 브랜드 스토리텔링 섹션, 고급 브랜드 가치, 멤버십 가입 버튼을 포함하고 세련됨과 독점성을 강조해 주세요.' },
  { slug: 'fintech-crypto', name: '핀테크 크립토 대시보드', category: '핀테크/크립토', categorySlug: 'fintech-crypto', style: 'Glassmorphism + Dark Mode (OLED)', mode: 'dark', primaryColor: '#0080FF', secondaryColor: '#39FF14', ctaColor: '#39FF14', prompt: '다크 모드 기반의 핀테크/크립토 웹 프로토타입을 만들어 주세요. 글래스모피즘 카드, 실시간 가격 차트 미리보기, 보안 기능 강조, 지갑 연동 쇼케이스, 신뢰 지표를 포함하고 보안성과 현대적인 기술감을 중심으로 구성해 주세요.' },
  { slug: 'health-wellness', name: '헬스 웰니스 앱', category: '헬스케어', categorySlug: 'healthcare', style: 'Neumorphism + Soft UI Evolution', mode: 'light', primaryColor: '#87CEEB', secondaryColor: '#90EE90', ctaColor: '#22C55E', prompt: '차분한 헬스 및 웰니스 앱 웹 프로토타입을 만들어 주세요. 소프트 UI 요소, 뉴모피즘 카드, 명상/피트니스 트래킹 기능 쇼케이스, 사용자 후기, 앱 다운로드 버튼을 포함하고 안정감을 주는 부드러운 색감을 사용해 주세요.' },
  { slug: 'creative-agency', name: '크리에이티브 에이전시 포트폴리오', category: '크리에이티브', categorySlug: 'creative', style: 'Brutalism + Motion-Driven', mode: 'light', primaryColor: '#FF0000', secondaryColor: '#0000FF', ctaColor: '#FFFF00', prompt: '대담한 크리에이티브 에이전시 포트폴리오 웹 프로토타입을 만들어 주세요. 브루탈리즘 요소, 모션 중심 인터랙션, 케이스 스터디 미리보기, 팀 소개, 문의 폼을 포함하고 창의성과 독창성을 강하게 보여 주세요.' },
  { slug: 'real-estate', name: '럭셔리 부동산', category: '부동산', categorySlug: 'real-estate', style: 'Glassmorphism + Minimalism', mode: 'light', primaryColor: '#0077B6', secondaryColor: '#FFD700', ctaColor: '#0077B6', prompt: '우아한 부동산 웹 프로토타입을 만들어 주세요. 글래스모피즘 매물 카드, 가상 투어 미리보기, 추천 매물, 에이전트 프로필, 문의 폼을 포함하고 신뢰감과 프리미엄 이미지를 중심으로 구성해 주세요.' },
  { slug: 'gaming-platform', name: '게임 플랫폼', category: '게임', categorySlug: 'gaming', style: '3D & Hyperrealism + Retro-Futurism', mode: 'dark', primaryColor: '#FF006E', secondaryColor: '#00FFFF', ctaColor: '#39FF14', prompt: '몰입감 있는 게임 플랫폼 웹 프로토타입을 만들어 주세요. 3D 요소, 레트로 퓨처리즘 스타일, 게임 쇼케이스 캐러셀, 커뮤니티 기능, 다운로드 버튼을 포함하고 어두운 배경 위에 선명한 네온 색감을 활용해 주세요.' },
  { slug: 'restaurant-food', name: '레스토랑 및 푸드', category: '푸드/레스토랑', categorySlug: 'food-restaurant', style: 'Vibrant & Block-based + Motion-Driven', mode: 'light', primaryColor: '#FF6B35', secondaryColor: '#8B4513', ctaColor: '#FF6B35', prompt: '따뜻한 레스토랑 웹 프로토타입을 만들어 주세요. 생동감 있는 음식 이미지, 메뉴 미리보기, 예약 시스템, 셰프 스토리, 위치 지도 섹션을 포함하고 식욕을 돋우는 따뜻한 색감을 사용해 주세요.' },
  { slug: 'fitness-gym', name: '피트니스 짐 앱', category: '피트니스', categorySlug: 'fitness', style: 'Vibrant & Block-based + Dark Mode (OLED)', mode: 'dark', primaryColor: '#FF6B35', secondaryColor: '#0080FF', ctaColor: '#FF6B35', prompt: '에너지 있는 피트니스 앱 웹 프로토타입을 만들어 주세요. 다크 모드, 운동 미리보기 카드, 진행률 트래킹 데모, 트레이너 프로필, 구독 버튼을 포함하고 동기부여가 되는 강한 색감을 사용해 주세요.' },
  { slug: 'travel-tourism', name: '여행 및 관광', category: '여행', categorySlug: 'travel', style: 'Aurora UI + Motion-Driven', mode: 'light', primaryColor: '#0080FF', secondaryColor: '#FF7F00', ctaColor: '#FF7F00', prompt: '영감을 주는 여행사 웹 프로토타입을 만들어 주세요. 오로라 UI 그라디언트, 여행지 쇼케이스, 예약 미리보기, 여행자 후기, 여행 플래너 버튼을 포함하고 목적지의 생동감이 느껴지는 색감을 활용해 주세요.' },
  { slug: 'nft-web3', name: 'NFT 및 Web3 플랫폼', category: 'NFT/Web3', categorySlug: 'nft-web3', style: 'Cyberpunk UI + Glassmorphism', mode: 'dark', primaryColor: '#FF00FF', secondaryColor: '#00FFFF', ctaColor: '#FFD700', prompt: '사이버펑크 스타일의 NFT 플랫폼 웹 프로토타입을 만들어 주세요. 글래스모피즘 카드, 대표 NFT 갤러리, 지갑 연결 데모, 크리에이터 스포트라이트, 마켓플레이스 미리보기를 포함하고 어두운 배경 위 네온 색감을 사용해 주세요.' },
  { slug: 'beauty-spa', name: '뷰티 스파 서비스', category: '뷰티/스파', categorySlug: 'beauty-spa', style: 'Soft UI Evolution + Neumorphism', mode: 'light', primaryColor: '#FFB6C1', secondaryColor: '#90EE90', ctaColor: '#FFD700', prompt: '차분한 뷰티 스파 웹 프로토타입을 만들어 주세요. 소프트 UI 요소, 서비스 메뉴, 전후 비교 갤러리, 예약 시스템 미리보기, 사용자 후기를 포함하고 부드러운 파스텔 톤과 안정적인 분위기를 유지해 주세요.' },
  { slug: 'developer-tools', name: '개발자 도구', category: '개발자 도구', categorySlug: 'developer-tools', style: 'Dark Mode (OLED) + Minimalism', mode: 'dark', primaryColor: '#39FF14', secondaryColor: '#0080FF', ctaColor: '#39FF14', prompt: '미니멀한 개발자 도구 웹 프로토타입을 만들어 주세요. 다크 모드, 코드 스니펫 미리보기, 기능 비교표, 연동 로고, 문서 링크를 포함하고 구문 강조 색상을 자연스럽게 활용해 주세요.' },
  { slug: 'music-streaming', name: '음악 스트리밍', category: '엔터테인먼트', categorySlug: 'entertainment', style: 'Dark Mode (OLED) + Vibrant & Block-based', mode: 'dark', primaryColor: '#1DB954', secondaryColor: '#FF1493', ctaColor: '#1DB954', prompt: '다크 모드 기반의 음악 스트리밍 웹 프로토타입을 만들어 주세요. 선명한 포인트 컬러, 플레이리스트 쇼케이스, 오디오 플레이어 미리보기, 아티스트 스포트라이트, 프리미엄 구독 버튼을 포함하고 앨범 아트에서 영감을 받은 색감을 사용해 주세요.' },
  { slug: 'legal-services', name: '법률 서비스', category: '법률', categorySlug: 'legal', style: 'Trust & Authority + Minimalism', mode: 'light', primaryColor: '#1E3A5F', secondaryColor: '#FFD700', ctaColor: '#1E3A5F', prompt: '신뢰감 있는 법률 서비스 웹 프로토타입을 만들어 주세요. 미니멀한 디자인, 업무 분야 소개, 변호사 프로필, 사건 성과, 상담 예약 흐름을 포함하고 전문적인 네이비와 골드 톤을 활용해 주세요.' },
  { slug: 'wedding-events', name: '웨딩 및 이벤트', category: '이벤트', categorySlug: 'events', style: 'Soft UI Evolution + Aurora UI', mode: 'light', primaryColor: '#FFD6E0', secondaryColor: '#FFD700', ctaColor: '#FFD700', prompt: '로맨틱한 웨딩 플래닝 웹 프로토타입을 만들어 주세요. 소프트 UI, 포트폴리오 갤러리, 벤더 디렉터리 미리보기, 플래닝 도구 쇼케이스, 문의 폼을 포함하고 부드러운 핑크와 골드 포인트를 사용해 주세요.' },
  { slug: 'coworking-space', name: '코워킹 스페이스', category: '공간 서비스', categorySlug: 'beauty-spa', style: 'Vibrant & Block-based + Glassmorphism', mode: 'light', primaryColor: '#FFB6C1', secondaryColor: '#90EE90', ctaColor: '#FFD700', prompt: '활기 있는 코워킹 스페이스 웹 프로토타입을 만들어 주세요. 글래스모피즘 카드, 공간 투어 미리보기, 멤버십 플랜, 편의시설 쇼케이스, 예약 버튼을 포함하고 에너지 있는 현대적인 색감을 사용해 주세요.' },
  { slug: 'sustainability-platform', name: '지속가능성 플랫폼', category: '지속가능성', categorySlug: 'ai-chatbot', style: 'Organic Biophilic + Minimalism', mode: 'light', primaryColor: '#6366F1', secondaryColor: '#10B981', ctaColor: '#6366F1', prompt: '친환경 지속가능성 플랫폼 웹 프로토타입을 만들어 주세요. 유기적인 바이오필릭 요소, 탄소 발자국 계산기 미리보기, 임팩트 지표, 인증 배지를 포함하고 자연스러운 어스 톤과 그린 계열을 활용해 주세요.' },
  { slug: 'veterinary-clinic', name: '동물병원', category: '기타', categorySlug: 'other', style: 'Soft UI Evolution + Accessible & Ethical', mode: 'light', primaryColor: '#0080FF', secondaryColor: '#8B00FF', ctaColor: '#22C55E', prompt: '따뜻한 동물병원 웹 프로토타입을 만들어 주세요. 소프트 UI 요소, 진료 서비스 개요, 수의사 팀 프로필, 응급 연락 섹션, 예약 기능을 포함하고 반려동물 친화적인 차분한 색감을 사용해 주세요.' },
  { slug: 'pet-adoption', name: '반려동물 입양 플랫폼', category: '반려동물 서비스', categorySlug: 'pet-services', style: 'Motion-Driven + Claymorphism', mode: 'light', primaryColor: '#FF9F43', secondaryColor: '#87CEEB', ctaColor: '#FF9F43', prompt: '따뜻한 반려동물 입양 플랫폼 웹 프로토타입을 만들어 주세요. 모션 중심 반려동물 카드, 검색 필터 미리보기, 입양 성공 사례, 보호소 파트너십, 입양 버튼을 포함하고 환영받는 느낌의 따뜻한 색감을 사용해 주세요.' },
  { slug: 'medical-clinic', name: '의료 클리닉 포털', category: '기타', categorySlug: 'other', style: 'Accessible & Ethical + Minimalism', mode: 'light', primaryColor: '#0080FF', secondaryColor: '#8B00FF', ctaColor: '#22C55E', prompt: '신뢰감 있는 의료 클리닉 웹 프로토타입을 만들어 주세요. 접근성 높은 디자인, 진료 서비스 디렉터리, 의사 프로필, 환자 포털 미리보기, 예약 흐름을 포함하고 신뢰와 접근성을 중심으로 구성해 주세요.' },
  { slug: 'telemedicine', name: '원격진료 플랫폼', category: '헬스케어', categorySlug: 'healthcare', style: 'Soft UI Evolution + AI-Native UI', mode: 'light', primaryColor: '#87CEEB', secondaryColor: '#90EE90', ctaColor: '#22C55E', prompt: '현대적인 원격진료 플랫폼 웹 프로토타입을 만들어 주세요. 소프트 UI, 화상 상담 미리보기, 전문의 디렉터리, 건강 추적 기능, 앱 다운로드 버튼을 포함하고 차분한 헬스케어 색감을 사용해 주세요.' },
  { slug: 'mental-health', name: '멘탈 헬스 앱', category: '헬스케어', categorySlug: 'healthcare', style: 'Neumorphism + Accessible & Ethical', mode: 'light', primaryColor: '#87CEEB', secondaryColor: '#90EE90', ctaColor: '#22C55E', prompt: '차분한 멘탈 헬스 앱 웹 프로토타입을 만들어 주세요. 뉴모피즘 요소, 감정 기록 미리보기, 상담 예약, 리소스 라이브러리, 위기 지원 섹션을 포함하고 안정감을 주는 파스텔 톤을 사용해 주세요.' },
  { slug: 'digital-banking', name: '디지털 뱅킹 앱', category: '기타', categorySlug: 'other', style: 'Glassmorphism + Trust & Authority', mode: 'light', primaryColor: '#0080FF', secondaryColor: '#8B00FF', ctaColor: '#22C55E', prompt: '세련된 디지털 뱅킹 웹 프로토타입을 만들어 주세요. 글래스모피즘 카드, 계좌 개요 미리보기, 거래 기능, 보안 강조 영역, 모바일 앱 다운로드를 포함하고 신뢰감을 주는 색감을 사용해 주세요.' },
  { slug: 'investment-platform', name: '투자 플랫폼', category: '핀테크/크립토', categorySlug: 'fintech-crypto', style: 'Dark Mode (OLED) + Data-Dense Dashboard', mode: 'dark', primaryColor: '#0080FF', secondaryColor: '#39FF14', ctaColor: '#39FF14', prompt: '전문적인 투자 플랫폼 웹 프로토타입을 만들어 주세요. 다크 모드, 포트폴리오 분석 미리보기, 시장 데이터 위젯, 교육 리소스, 계정 가입 흐름을 포함하고 신뢰와 데이터 밀도를 중심으로 구성해 주세요.' },
  { slug: 'payment-gateway', name: '결제 게이트웨이', category: '핀테크/크립토', categorySlug: 'fintech-crypto', style: 'Minimalism + Trust & Authority', mode: 'light', primaryColor: '#0080FF', secondaryColor: '#8B00FF', ctaColor: '#22C55E', prompt: '전환 중심의 결제 게이트웨이 웹 프로토타입을 만들어 주세요. 미니멀한 디자인, 연동 코드 미리보기, 가격 플랜, 보안 인증, 개발자 문서 링크를 포함하고 전문적인 색감을 사용해 주세요.' },
  { slug: 'crypto-wallet', name: '크립토 지갑', category: '핀테크/크립토', categorySlug: 'fintech-crypto', style: 'Glassmorphism + Dark Mode (OLED)', mode: 'dark', primaryColor: '#0080FF', secondaryColor: '#39FF14', ctaColor: '#39FF14', prompt: '안전한 크립토 지갑 웹 프로토타입을 만들어 주세요. 다크 글래스모피즘, 멀티체인 지원 쇼케이스, 보안 기능, 거래 미리보기, 다운로드 버튼을 포함하고 크립토 서비스에 맞는 다크 테마를 사용해 주세요.' },
  { slug: 'defi-yield', name: 'DeFi 수익 플랫폼', category: '핀테크/크립토', categorySlug: 'fintech-crypto', style: 'Cyberpunk UI + Glassmorphism', mode: 'dark', primaryColor: '#0080FF', secondaryColor: '#39FF14', ctaColor: '#39FF14', prompt: 'DeFi 수익 파밍 플랫폼 웹 프로토타입을 만들어 주세요. 사이버펑크 감성, APY 계산기, 유동성 풀 미리보기, 토크노믹스 섹션, 지갑 연결 흐름을 포함하고 어두운 화면 위 네온 포인트를 사용해 주세요.' },
  { slug: 'cex-trading', name: '중앙화 거래소 플랫폼', category: '핀테크/크립토', categorySlug: 'fintech-crypto', style: 'Dark Mode (OLED) + Data-Dense Dashboard', mode: 'dark', primaryColor: '#0080FF', secondaryColor: '#39FF14', ctaColor: '#39FF14', prompt: '전문적인 중앙화 거래소 웹 프로토타입을 만들어 주세요. 다크 모드, 거래 인터페이스 미리보기, 마켓 페어, 보안 기능, 가입 흐름을 포함하고 신뢰와 성능을 강조해 주세요.' },
  { slug: 'dex-swap', name: 'DEX 스왑 인터페이스', category: '핀테크/크립토', categorySlug: 'fintech-crypto', style: 'Glassmorphism + Cyberpunk UI', mode: 'dark', primaryColor: '#0080FF', secondaryColor: '#39FF14', ctaColor: '#39FF14', prompt: '탈중앙화 거래소 웹 프로토타입을 만들어 주세요. 글래스모피즘 스왑 인터페이스 미리보기, 지원 토큰, 유동성 제공자 혜택, 거버넌스 기능, 지갑 연동을 포함하고 Web3 감성을 반영해 주세요.' },
  { slug: 'nft-marketplace', name: 'NFT 마켓플레이스', category: 'NFT/Web3', categorySlug: 'nft-web3', style: 'Bento Box Grid + Motion-Driven', mode: 'dark', primaryColor: '#FF00FF', secondaryColor: '#00FFFF', ctaColor: '#FFD700', prompt: 'NFT 마켓플레이스 웹 프로토타입을 만들어 주세요. 벤토 그리드 레이아웃, 대표 컬렉션, 크리에이터 스포트라이트, 경매 미리보기, 지갑 연결을 포함하고 어두운 배경 위 예술 중심의 선명한 색감을 사용해 주세요.' },
  { slug: 'nft-art-gallery', name: 'NFT 아트 갤러리', category: 'NFT/Web3', categorySlug: 'nft-web3', style: 'Minimalism + Motion-Driven', mode: 'light', primaryColor: '#0080FF', secondaryColor: '#8B00FF', ctaColor: '#22C55E', prompt: '우아한 NFT 아트 갤러리 웹 프로토타입을 만들어 주세요. 미니멀한 디자인, 큐레이션 컬렉션, 아티스트 프로필, 전시 미리보기, 민팅 인터페이스를 포함하고 작품 감상이 돋보이게 구성해 주세요.' },
  { slug: 'generative-art-platform', name: '생성형 아트 플랫폼', category: 'AI/챗봇', categorySlug: 'ai-chatbot', style: 'Minimalism + Gen Z Chaos', mode: 'dark', primaryColor: '#0080FF', secondaryColor: '#8B00FF', ctaColor: '#22C55E', prompt: '생성형 아트 플랫폼 웹 프로토타입을 만들어 주세요. 다크 모드, AI 아트 생성 미리보기, 스타일 갤러리, 크리에이터 도구 쇼케이스, 민팅 흐름을 포함하고 캔버스 중심의 중립 톤에 선명한 포인트를 더해 주세요.' },
  { slug: 'sales-crm-platform', name: '세일즈 CRM 플랫폼', category: 'SaaS', categorySlug: 'saas', style: 'Feature-Rich Showcase + Trust & Authority', mode: 'light', primaryColor: '#0080FF', secondaryColor: '#8B00FF', ctaColor: '#22C55E', prompt: '전문적인 세일즈 CRM 웹 프로토타입을 만들어 주세요. 풍부한 기능 쇼케이스, 파이프라인 시각화 미리보기, 연동 로고, 고객 성공 사례, 무료 체험 버튼을 포함하고 신뢰감 있는 색감을 사용해 주세요.' },
  { slug: 'customer-support-crm', name: '고객지원 CRM', category: 'SaaS', categorySlug: 'saas', style: 'Soft UI Evolution + Feature-Rich Showcase', mode: 'light', primaryColor: '#0080FF', secondaryColor: '#8B00FF', ctaColor: '#22C55E', prompt: '친근한 고객지원 CRM 웹 프로토타입을 만들어 주세요. 소프트 UI, 티켓 관리 미리보기, 옴니채널 기능, AI 챗봇 연동, 가격 비교를 포함하고 접근하기 쉬운 색감을 사용해 주세요.' },
  { slug: 'ai-writing-assistant', name: 'AI 글쓰기 어시스턴트', category: 'AI/챗봇', categorySlug: 'ai-chatbot', style: 'AI-Native UI + Minimalism', mode: 'light', primaryColor: '#6366F1', secondaryColor: '#10B981', ctaColor: '#6366F1', prompt: 'AI 글쓰기 어시스턴트 웹 프로토타입을 만들어 주세요. 미니멀한 인터페이스, 실시간 글쓰기 데모, 사용 사례 쇼케이스, 연동 옵션, 구독 플랜을 포함하고 중립적인 톤에 AI 퍼플 포인트를 적용해 주세요.' },
] as const satisfies readonly WebsiteReference[];

export function homeReferenceCloneUrl(slug: string): string {
  return `${HOME_REFERENCE_CLONE_BASE}/${slug}/index.html`;
}

export function isHomeReferencePluginId(id: string): boolean {
  return id.startsWith(HOME_REFERENCE_PLUGIN_ID_PREFIX);
}

export function homeReferenceSlugFromPluginId(id: string): string | null {
  if (!isHomeReferencePluginId(id)) return null;
  const slug = id.slice(HOME_REFERENCE_PLUGIN_ID_PREFIX.length);
  return HOME_WEBSITE_REFERENCES.some((reference) => reference.slug === slug) ? slug : null;
}

function thumbnailUrl(slug: string): string {
  return `${HOME_REFERENCE_CLONE_BASE}/_thumbnails/${slug}.png`;
}

function referenceDescription(reference: WebsiteReference): string {
  const mode = reference.mode === 'dark' ? '다크 모드' : '라이트 모드';
  return `${reference.category} 웹 프로토타입 레퍼런스입니다. ${reference.style} · ${mode} · 주요 색상 ${reference.primaryColor}, 보조 색상 ${reference.secondaryColor}, 행동 버튼 ${reference.ctaColor}.`;
}

function buildReferenceRecord(reference: WebsiteReference, index: number): InstalledPluginRecord {
  const id = `${HOME_REFERENCE_PLUGIN_ID_PREFIX}${reference.slug}`;
  const cloneUrl = homeReferenceCloneUrl(reference.slug);
  return {
    id,
    title: reference.name,
    version: '1.0.0',
    sourceKind: 'bundled',
    source: cloneUrl,
    marketplaceTrust: 'official',
    trust: 'bundled',
    capabilitiesGranted: [],
    fsPath: '',
    installedAt: 0,
    updatedAt: 0,
    manifest: {
      specVersion: '1.0.0',
      name: id,
      title: reference.name,
      version: '1.0.0',
      description: referenceDescription(reference),
      author: {
        name: 'UI UX Pro Max',
        url: 'https://uupm.cc/',
      },
      homepage: cloneUrl,
      tags: [
        'prototype',
        'web-prototype',
        'web',
        'landing',
        'landing-page',
        'reference',
        'remix',
        reference.categorySlug,
        reference.mode,
        reference.style.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      ],
      od: {
        kind: 'scenario',
        mode: 'prototype',
        taskKind: 'new-generation',
        surface: 'web',
        scenario: 'web-prototype',
        featured: index < 6,
        preview: {
          type: 'image',
          poster: thumbnailUrl(reference.slug),
        },
        useCase: {
          query: [
            reference.prompt,
            '',
            `${reference.name}의 앱 내 로컬 HTML 복제본을 기준으로 리믹스해 주세요.`,
            `레퍼런스 복제 ID: ${reference.slug}`,
            `로컬 레퍼런스 파일: apps/web/public${cloneUrl}`,
            '원본 외부 레퍼런스 URL을 가져오거나, 인용하거나, 의존하지 마세요.',
          ].join('\n'),
        },
      },
    },
  };
}

export const HOME_REFERENCE_PLUGINS: InstalledPluginRecord[] =
  HOME_WEBSITE_REFERENCES.map(buildReferenceRecord);

export function isHomeReferencePlugin(record: InstalledPluginRecord): boolean {
  return isHomeReferencePluginId(record.id);
}

export function homeReferencePrompt(record: InstalledPluginRecord): string {
  const query = record.manifest?.od?.useCase?.query;
  return typeof query === 'string' ? query.trim() : '';
}
