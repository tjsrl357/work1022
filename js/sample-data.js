/**
 * 2027 국방예산 정부안 기본 샘플 데이터셋
 * 사용자 업로드 전 기본 뷰를 풍부하게 시각화하기 위한 데이터
 */
const DEFAULT_SAMPLE_DATA = [
  {
    id: 1,
    category: "① 자주국방 & 전작권 전환",
    title: "전작권 전환 및 자주국방 핵심전력 확보",
    unit: "억원",
    prevAmount: 90222,
    currAmount: 121744,
    diffAmount: 31522,
    diffRate: 34.9,
    details: "전작권 전환 및 자주국방 예산 34.9% 대폭 증액 (KF-21 양산 착수, 핵추진잠수함 40년 장기프로젝트 착수, L-SAM 조기전력화, 230mm 천무 무유도탄 양산)",
    isNew: false
  },
  {
    id: 2,
    category: "② 효율적 군 인력구조 전환",
    title: "상비예비군 운영 예산",
    unit: "억원",
    prevAmount: 87,
    currAmount: 256,
    diffAmount: 169,
    diffRate: 194.3,
    details: "평시 추가훈련을 통한 전시 즉각 전투력 발휘 보장 (+169억원 증액, 3,700명 -> 7,000명으로 2배 확대)",
    isNew: false
  },
  {
    id: 3,
    category: "② 효율적 군 인력구조 전환",
    title: "예비군 훈련비 총예산",
    unit: "억원",
    prevAmount: 688,
    currAmount: 903,
    diffAmount: 215,
    diffRate: 31.3,
    details: "'30년까지 최저시급 수준 지급 목표 단계적 인상 (+215억원, +31.3%, 동원1형 9.5만->13만원 인상)",
    isNew: false
  },
  {
    id: 4,
    category: "② 효율적 군 인력구조 전환",
    title: "비전투분야 민간 아웃소싱 시범사업",
    unit: "억원",
    prevAmount: 0,
    currAmount: 150,
    diffAmount: 150,
    diffRate: 100.0,
    details: "(신규사업) 주둔지 시설관리(제초·제설), 민통초소 근무, 학교부대 경비 등 비전투분야 민간위탁 시범 도입",
    isNew: true
  },
  {
    id: 5,
    category: "③ AI·유·무인 복합체계",
    title: "국방 소버린 AI 인프라 구축",
    unit: "억원",
    prevAmount: 120,
    currAmount: 551,
    diffAmount: 431,
    diffRate: 359.2,
    details: "국방 전용 GPU 1,137장 확보(2028년까지) 및 국방 지능형 통합플랫폼 구축 착수",
    isNew: false
  },
  {
    id: 6,
    category: "③ AI·유·무인 복합체계",
    title: "피지컬 AI (D.AX 프로젝트)",
    unit: "억원",
    prevAmount: 0,
    currAmount: 430,
    diffAmount: 430,
    diffRate: 100.0,
    details: "(신규사업) 전투 다족보행로봇 200대, 휴머노이드 2대, UGV 지상무인차량 4대 시범 도입 및 실전배치",
    isNew: true
  },
  {
    id: 7,
    category: "③ AI·유·무인 복합체계",
    title: "AI 객체인식 GOP 과학화경계 성능개량",
    unit: "억원",
    prevAmount: 245,
    currAmount: 680,
    diffAmount: 435,
    diffRate: 177.6,
    details: "GOP 전선 AI 딥러닝 기반 지능형 영상분석 및 무인지상감시센서 융합 경계망 구축",
    isNew: false
  },
  {
    id: 8,
    category: "④ 드론 & 대드론 방어체계",
    title: "50만 드론전사 양성 및 훈련체계",
    unit: "억원",
    prevAmount: 296,
    currAmount: 771,
    diffAmount: 475,
    diffRate: 160.5,
    details: "교육용 상용드론 1.7만 대 확보, 전군 드론 실기비행장 구축 및 교육훈련 여건 획기적 개선",
    isNew: false
  },
  {
    id: 9,
    category: "④ 드론 & 대드론 방어체계",
    title: "휴대용 통합형 대드론건 및 방공체계",
    unit: "억원",
    prevAmount: 0,
    currAmount: 291,
    diffAmount: 291,
    diffRate: 100.0,
    details: "(신규사업) 국가 및 군사 중요시설 침투 드론 무력화용 통합형 대드론건 8종 전력화 및 레이저대공무기 투자",
    isNew: true
  },
  {
    id: 10,
    category: "⑤ 장병 복무여건 & 처우개선",
    title: "초급간부 보수 및 단기복무 장려금 인상",
    unit: "억원",
    prevAmount: 3410,
    currAmount: 4620,
    diffAmount: 1210,
    diffRate: 35.5,
    details: "하사 1호봉 기준 월평균 300만원 달성, 단기복무장려금 1,000만원 -> 1,200만원 상향",
    isNew: false
  },
  {
    id: 11,
    category: "⑤ 장병 복무여건 & 처우개선",
    title: "단기복무 부사관 적금 매칭지원금",
    unit: "억원",
    prevAmount: 0,
    currAmount: 189,
    diffAmount: 189,
    diffRate: 100.0,
    details: "(신규사업) 월 최대 30만원 지원(36개월), 3년 만기 시 약 2,310만원 자산 형성 지원",
    isNew: true
  },
  {
    id: 12,
    category: "⑤ 장병 복무여건 & 처우개선",
    title: "병사 단체상해보험 신설",
    unit: "억원",
    prevAmount: 0,
    currAmount: 69,
    diffAmount: 69,
    diffRate: 100.0,
    details: "(신규사업) 현역·상근예비역 29만 명 대상 군 복무 중 질병·상해 보장 강화 민간보험 가입 지원",
    isNew: true
  },
  {
    id: 13,
    category: "⑥ 미래 국방기술 주권",
    title: "국방반도체 독자 기술개발 R&D",
    unit: "억원",
    prevAmount: 0,
    currAmount: 565,
    diffAmount: 565,
    diffRate: 100.0,
    details: "(신규사업) 국방반도체법 시행에 따른 무기체계용 맞춤형 국산 반도체 설계·파운드리 기술개발",
    isNew: true
  },
  {
    id: 14,
    category: "⑥ 미래 국방기술 주권",
    title: "한국형 첨단항공엔진 국산화 R&D",
    unit: "억원",
    prevAmount: 180,
    currAmount: 450,
    diffAmount: 270,
    diffRate: 150.0,
    details: "차세대전투기(16,000 lbf급) 및 무인편대기용 터보팬 첨단추진체계 독자 기술개발 본격 착수",
    isNew: false
  },
  {
    id: 15,
    category: "⑦ 방산 중소·벤처기업 육성",
    title: "K-방산 스타트업 도약 패키지 지원",
    unit: "억원",
    prevAmount: 54,
    currAmount: 124,
    diffAmount: 70,
    diffRate: 129.6,
    details: "진입-성장-자립 3단계 지원 패키지, 방산혁신기업200 확대, 글로벌 공급망(GVC30) 진입 지원",
    isNew: false
  },
  {
    id: 16,
    category: "⑧ AI·디지털 병무 서비스",
    title: "생성형 AI 병무상담 챗봇 및 디지털 행정",
    unit: "억원",
    prevAmount: 0,
    currAmount: 19,
    diffAmount: 19,
    diffRate: 100.0,
    details: "(신규사업) RAG 및 초거대 AI 기반 24시간 원스톱 병무민원 상담 및 스마트 입영신청 체계",
    isNew: true
  }
];
