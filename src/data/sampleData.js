export const SAMPLE_PLANS = [
    // ========== 윤성준 담당 ==========
    { id: 'plan-001', topic: '겨울 패션 하울', type: 'main', uploadDate: '2026-02-05', description: '겨울 시즌 오프 및 신상 리뷰', planner: '윤성준', status: 'active', shootType: 'indoor', location: '' },
    { id: 'plan-002', topic: '카페 투어 #shorts', type: 'shorts', uploadDate: '2026-02-08', description: '성수동 신상 카페 탐방', planner: '윤성준', status: 'active', shootType: 'outdoor', location: '성수동' },
    { id: 'plan-003', topic: '발렌타인 초콜릿 만들기', type: 'main', uploadDate: '2026-02-13', description: '수제 초콜릿 DIY 콘텐츠', planner: '윤성준', status: 'active', shootType: 'indoor', location: '' },
    { id: 'plan-006', topic: '설날 특집 먹방', type: 'main', uploadDate: '2026-02-17', description: '명절 음식 ASMR', planner: '윤성준', status: 'draft', shootType: 'indoor', location: '' },
    { id: 'plan-009', topic: '신년 특집 브이로그', type: 'main', uploadDate: '2026-01-15', description: '2026년 새해 목표 선언', planner: '윤성준', status: 'completed', shootType: 'outdoor', location: '남산타워' },

    // ========== 이현경 담당 ==========
    { id: 'plan-011', topic: '봄 코디 추천', type: 'main', uploadDate: '2026-02-10', description: '2026 S/S 트렌드 코디 가이드', planner: '이현경', status: 'active', shootType: 'indoor', location: '' },
    { id: 'plan-012', topic: '홈카페 레시피 #shorts', type: 'shorts', uploadDate: '2026-02-06', description: '집에서 만드는 달고나 커피', planner: '이현경', status: 'active', shootType: 'indoor', location: '' },
    { id: 'plan-013', topic: '다이어트 식단 일기', type: 'main', uploadDate: '2026-02-18', description: '2주 건강식 챌린지', planner: '이현경', status: 'draft', shootType: 'indoor', location: '' },
    { id: 'plan-014', topic: '아이돌 커버댄스 #shorts', type: 'shorts', uploadDate: '2026-02-22', description: '에스파 신곡 포인트 안무', planner: '이현경', status: 'draft', shootType: 'outdoor', location: '한강공원' },
    { id: 'plan-015', topic: '겨울 스킨케어 루틴', type: 'main', uploadDate: '2026-01-20', description: '건조한 피부 집중 케어', planner: '이현경', status: 'completed', shootType: 'indoor', location: '' },
];

export const SAMPLE_TASKS = [
    // ========== 윤성준 프로젝트 업무 ==========
    { id: 'task-001', planId: 'plan-009', topic: '신년 특집 브이로그', author: '윤성준', type: 'task', category: ['대본'], details: '신년 기획안 작성', workStartDate: '2026-01-05', workEndDate: '2026-01-06', status: 'done', completedDates: ['2026-01-05', '2026-01-06'] },
    { id: 'task-002', planId: 'plan-009', topic: '신년 특집 브이로그', author: '윤성준', type: 'task', category: ['촬영'], details: '남산타워 야외 촬영', workStartDate: '2026-01-08', workEndDate: '2026-01-08', status: 'done', completedDates: ['2026-01-08'] },
    { id: 'task-003', planId: 'plan-009', topic: '신년 특집 브이로그', author: '이현경', type: 'task', category: ['편집'], details: '컷편집 및 자막', workStartDate: '2026-01-09', workEndDate: '2026-01-13', status: 'done', completedDates: ['2026-01-09', '2026-01-10', '2026-01-12', '2026-01-13'] },

    { id: 'task-008', planId: 'plan-001', topic: '겨울 패션 하울', author: '윤성준', type: 'task', category: ['대본'], details: '의상 착장 리스트업', workStartDate: '2026-01-28', workEndDate: '2026-01-28', status: 'done', completedDates: ['2026-01-28'] },
    { id: 'task-009', planId: 'plan-001', topic: '겨울 패션 하울', author: '윤성준', type: 'task', category: ['촬영'], details: '스튜디오 룩북 촬영', workStartDate: '2026-01-30', workEndDate: '2026-01-30', status: 'done', completedDates: ['2026-01-30'] },
    { id: 'task-010', planId: 'plan-001', topic: '겨울 패션 하울', author: '이현경', type: 'task', category: ['편집'], details: '하울 영상 편집', workStartDate: '2026-02-01', workEndDate: '2026-02-03', status: 'in_progress', completedDates: ['2026-02-01', '2026-02-02'] },

    { id: 'task-012', planId: 'plan-002', topic: '카페 투어 #shorts', author: '윤성준', type: 'task', category: ['촬영'], details: '성수동 카페 촬영', workStartDate: '2026-02-02', workEndDate: '2026-02-02', status: 'done', completedDates: ['2026-02-02'] },
    { id: 'task-013', planId: 'plan-002', topic: '카페 투어 #shorts', author: '이현경', type: 'task', category: ['편집'], details: '카페 무드 편집', workStartDate: '2026-02-04', workEndDate: '2026-02-05', status: 'in_progress', completedDates: ['2026-02-04'] },

    { id: 'task-014', planId: 'plan-003', topic: '발렌타인 초콜릿 만들기', author: '윤성준', type: 'task', category: ['대본'], details: '레시피 및 재료 준비', workStartDate: '2026-02-05', workEndDate: '2026-02-05', status: 'done', completedDates: ['2026-02-05'] },
    { id: 'task-015', planId: 'plan-003', topic: '발렌타인 초콜릿 만들기', author: '윤성준', type: 'task', category: ['촬영'], details: '쿠킹 영상 촬영', workStartDate: '2026-02-07', workEndDate: '2026-02-07', status: 'in_progress', completedDates: [] },
    { id: 'task-016', planId: 'plan-003', topic: '발렌타인 초콜릿 만들기', author: '이현경', type: 'task', category: ['편집'], details: '발렌타인 편집', workStartDate: '2026-02-09', workEndDate: '2026-02-11', status: 'todo', completedDates: [] },

    // ========== 이현경 프로젝트 업무 ==========
    { id: 'task-030', planId: 'plan-015', topic: '겨울 스킨케어 루틴', author: '이현경', type: 'task', category: ['대본'], details: '스킨케어 순서 정리', workStartDate: '2026-01-10', workEndDate: '2026-01-11', status: 'done', completedDates: ['2026-01-10', '2026-01-11'] },
    { id: 'task-031', planId: 'plan-015', topic: '겨울 스킨케어 루틴', author: '이현경', type: 'task', category: ['촬영'], details: '스킨케어 GRWM 촬영', workStartDate: '2026-01-13', workEndDate: '2026-01-14', status: 'done', completedDates: ['2026-01-13', '2026-01-14'] },
    { id: 'task-032', planId: 'plan-015', topic: '겨울 스킨케어 루틴', author: '윤성준', type: 'task', category: ['편집'], details: '스킨케어 영상 편집', workStartDate: '2026-01-16', workEndDate: '2026-01-18', status: 'done', completedDates: ['2026-01-16', '2026-01-17', '2026-01-18'] },

    { id: 'task-033', planId: 'plan-011', topic: '봄 코디 추천', author: '이현경', type: 'task', category: ['대본'], details: 'S/S 트렌드 리서치', workStartDate: '2026-02-03', workEndDate: '2026-02-04', status: 'done', completedDates: ['2026-02-03', '2026-02-04'] },
    { id: 'task-034', planId: 'plan-011', topic: '봄 코디 추천', author: '이현경', type: 'task', category: ['촬영'], details: '코디 착장 촬영', workStartDate: '2026-02-06', workEndDate: '2026-02-07', status: 'in_progress', completedDates: ['2026-02-06'] },
    { id: 'task-035', planId: 'plan-011', topic: '봄 코디 추천', author: '윤성준', type: 'task', category: ['편집'], details: '코디 영상 편집', workStartDate: '2026-02-09', workEndDate: '2026-02-10', status: 'todo', completedDates: [] },

    { id: 'task-036', planId: 'plan-012', topic: '홈카페 레시피 #shorts', author: '이현경', type: 'task', category: ['촬영'], details: '달고나 만들기 촬영', workStartDate: '2026-02-01', workEndDate: '2026-02-01', status: 'done', completedDates: ['2026-02-01'] },
    { id: 'task-037', planId: 'plan-012', topic: '홈카페 레시피 #shorts', author: '윤성준', type: 'task', category: ['편집'], details: '숏폼 편집', workStartDate: '2026-02-03', workEndDate: '2026-02-04', status: 'in_progress', completedDates: ['2026-02-03'] },

    // ========== 개인 일정 ==========
    { id: 'task-022', planId: null, topic: '개인 일정', author: '이현경', type: 'personal', category: ['오전반차'], details: '병원 검진', workStartDate: '2026-02-06', workEndDate: '2026-02-06', status: 'done', completedDates: ['2026-02-06'] },
    { id: 'task-023', planId: null, topic: '개인 일정', author: '윤성준', type: 'personal', category: ['미팅'], details: '광고주 미팅', workStartDate: '2026-02-09', workEndDate: '2026-02-09', status: 'todo', completedDates: [] }
];

export const SAMPLE_FINANCES = [
    { id: 'fin-001', category: 'finance', type: 'income', title: '1월 광고 수익', amount: 3500000, datetime: '2026-01-25', planId: null, memo: '유튜브 애드센스' },
    { id: 'fin-002', category: 'finance', type: 'income', title: '패션 브랜드 협찬비', amount: 2000000, datetime: '2026-01-20', planId: 'plan-002', memo: 'A브랜드 협찬' },
    { id: 'fin-003', category: 'finance', type: 'expense', title: '카메라 렌즈 구매', amount: 1200000, datetime: '2026-01-15', planId: null, memo: '소니 24-70mm', productUrl: 'https://store.sony.co.kr' },
    { id: 'fin-004', category: 'finance', type: 'expense', title: '편집 외주비', amount: 500000, datetime: '2026-01-18', planId: 'plan-003', memo: '숏폼 편집 외주' },
    { id: 'fin-005', category: 'finance', type: 'income', title: '슈퍼챗 수익', amount: 450000, datetime: '2026-01-22', planId: null, memo: '라이브 방송 후원' },
    { id: 'fin-006', category: 'finance', type: 'expense', title: '조명 장비 구매', amount: 380000, datetime: '2026-01-10', planId: null, memo: 'LED 패널 조명', productUrl: 'https://www.coupang.com' },
    { id: 'fin-007', category: 'finance', type: 'income', title: '멤버십 수익', amount: 800000, datetime: '2026-01-28', planId: null, memo: '채널 멤버십' },
    { id: 'fin-008', category: 'finance', type: 'expense', title: '촬영 소품 구매', amount: 150000, datetime: '2026-01-12', planId: 'plan-001', memo: '신년 소품' },
    { id: 'fin-009', category: 'finance', type: 'income', title: '뷰티 브랜드 협찬', amount: 1500000, datetime: '2026-02-01', planId: 'plan-005', memo: 'B코스메틱 협찬' },
    { id: 'fin-010', category: 'finance', type: 'expense', title: '교통비', amount: 85000, datetime: '2026-01-22', planId: 'plan-002', memo: '카페 투어 이동' },
    { id: 'fin-011', category: 'finance', type: 'income', title: '게임사 협찬', amount: 1800000, datetime: '2026-02-05', planId: 'plan-009', memo: 'C게임사 스폰서' },
    { id: 'fin-012', category: 'finance', type: 'expense', title: '마이크 구매', amount: 320000, datetime: '2026-01-08', planId: null, memo: '슈어 SM7B', productUrl: 'https://www.shure.com' },
    { id: 'fin-013', category: 'finance', type: 'expense', title: '스튜디오 월세', amount: 1500000, datetime: '2026-01-05', planId: null, memo: '1월분 임대료' },
    { id: 'fin-014', category: 'finance', type: 'income', title: '브랜드 광고 계약금', amount: 5000000, datetime: '2026-01-30', planId: 'plan-004', memo: 'D브랜드 연간 계약' },
    { id: 'fin-015', category: 'finance', type: 'expense', title: '간식비', amount: 120000, datetime: '2026-01-25', planId: null, memo: '팀 회식' },
];

export const SAMPLE_INQUIRIES = [
    { id: 'inq-001', category: 'inquiry', type: 'sponsor', sender: 'A패션브랜드', subject: '2026 S/S 협찬 제안', content: '안녕하세요, A패션브랜드입니다. 2026년 봄/여름 시즌 협찬을 제안드립니다.', receivedDate: '2026-01-20' },
    { id: 'inq-002', category: 'inquiry', type: 'partnership', sender: 'B엔터테인먼트', subject: 'MCN 파트너십 논의', content: '크리에이터 파트너십 관련하여 미팅을 요청드립니다.', receivedDate: '2026-01-18' },
    { id: 'inq-003', category: 'inquiry', type: 'inquiry', sender: '개인 구독자', subject: '촬영 장비 문의', content: '영상에서 사용하시는 카메라가 궁금합니다.', receivedDate: '2026-01-22' },
    { id: 'inq-004', category: 'inquiry', type: 'sponsor', sender: 'C코스메틱', subject: '뷰티 콘텐츠 협찬', content: '신제품 출시 관련 협찬 콘텐츠 제작을 요청드립니다.', receivedDate: '2026-01-25' },
    { id: 'inq-005', category: 'inquiry', type: 'other', sender: '언론사 D', subject: '인터뷰 요청', content: '유튜버 특집 기사 관련 인터뷰를 요청드립니다.', receivedDate: '2026-01-15' },
    { id: 'inq-006', category: 'inquiry', type: 'partnership', sender: 'E게임사', subject: '게임 콜라보 제안', content: '신작 게임 홍보 콜라보를 제안드립니다.', receivedDate: '2026-01-28' },
    { id: 'inq-007', category: 'inquiry', type: 'sponsor', sender: 'F전자', subject: '가전제품 협찬', content: '신형 카메라 제품 협찬을 제안드립니다.', receivedDate: '2026-01-12' },
    { id: 'inq-008', category: 'inquiry', type: 'inquiry', sender: '대학생 G', subject: '콘텐츠 제작 조언', content: '유튜브 시작하려는 학생입니다. 조언 부탁드립니다.', receivedDate: '2026-01-19' },
    { id: 'inq-009', category: 'inquiry', type: 'partnership', sender: 'H여행사', subject: '해외 촬영 지원', content: '일본 여행 콘텐츠 제작 시 항공/숙박 지원을 제안드립니다.', receivedDate: '2026-01-26' },
    { id: 'inq-010', category: 'inquiry', type: 'sponsor', sender: 'I식품', subject: '먹방 협찬', content: '설날 특집 음식 협찬을 제안드립니다.', receivedDate: '2026-01-30' },
    { id: 'inq-011', category: 'inquiry', type: 'other', sender: '방송국 J', subject: '출연 섭외', content: '예능 프로그램 게스트 출연을 요청드립니다.', receivedDate: '2026-01-17' },
    { id: 'inq-012', category: 'inquiry', type: 'inquiry', sender: '기업 담당자 K', subject: '광고 단가 문의', content: '브랜디드 콘텐츠 광고 단가를 문의드립니다.', receivedDate: '2026-01-23' },
    { id: 'inq-013', category: 'inquiry', type: 'sponsor', sender: 'L스포츠', subject: '운동 용품 협찬', content: '피트니스 콘텐츠 관련 운동 용품 협찬을 제안드립니다.', receivedDate: '2026-01-21' },
    { id: 'inq-014', category: 'inquiry', type: 'partnership', sender: 'M플랫폼', subject: '숏폼 플랫폼 입점', content: '저희 플랫폼에 크리에이터로 입점을 제안드립니다.', receivedDate: '2026-01-29' },
    { id: 'inq-015', category: 'inquiry', type: 'other', sender: '팬클럽 N', subject: '팬미팅 개최 문의', content: '오프라인 팬미팅 개최 가능 여부를 문의드립니다.', receivedDate: '2026-01-24' },
];
