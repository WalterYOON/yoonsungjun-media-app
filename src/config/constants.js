import { Film, Zap, FileEdit, Video, Scissors, RefreshCcw, Plane, Coffee, MapPin, User, Smile } from 'lucide-react';

// 제휴/문의 대응 상태
export const INQUIRY_STATUS = {
    'reviewing': { label: '검토 중', color: 'bg-[#b8860b]/20 text-[#b8860b] border-[#b8860b]/40', dot: '#b8860b' },
    'accepted':  { label: '수락',    color: 'bg-[#5d7a5d]/20 text-[#5d7a5d] border-[#5d7a5d]/40', dot: '#5d7a5d' },
    'rejected':  { label: '거절',    color: 'bg-[#9b4d4d]/20 text-[#9b4d4d] border-[#9b4d4d]/40', dot: '#9b4d4d' },
    'pending':   { label: '보류',    color: 'bg-[#857460]/20 text-[#857460] border-[#857460]/40', dot: '#857460' },
};

// 제휴/문의 분류
export const INQUIRY_CATEGORIES = {
    'sponsor': { label: '협찬', color: 'bg-[#a0714a]/20 text-[#a0714a] border-[#a0714a]/30' },
    'partnership': { label: '제휴', color: 'bg-[#5d6a7a]/20 text-[#5d6a7a] border-[#5d6a7a]/30' },
    'inquiry': { label: '문의', color: 'bg-[#5d7a5d]/20 text-[#5d7a5d] border-[#5d7a5d]/30' },
    'other': { label: '기타', color: 'bg-[#857460]/20 text-[#857460] border-[#857460]/30' },
};

export const PROJECT_TYPES = {
    'main': { label: '본편', icon: Film, color: 'text-[#a0714a] bg-[#a0714a]/20 border-[#a0714a]/30' },
    'shorts': { label: '숏츠', icon: Zap, color: 'text-[#b8860b] bg-[#b8860b]/20 border-[#b8860b]/30' }
};

export const WORK_CATEGORIES = {
    '대본': { color: 'bg-[#5d6a7a]/20 text-[#5d6a7a] border-[#5d6a7a]/30', bar: 'bg-[#5d6a7a]', icon: FileEdit },
    '촬영': { color: 'bg-[#9b4d4d]/20 text-[#9b4d4d] border-[#9b4d4d]/30', bar: 'bg-[#9b4d4d]', icon: Video },
    '편집': { color: 'bg-[#6a5d7a]/20 text-[#6a5d7a] border-[#6a5d7a]/30', bar: 'bg-[#6a5d7a]', icon: Scissors },
    '업데이트': { color: 'bg-[#5d7a5d]/20 text-[#5d7a5d] border-[#5d7a5d]/30', bar: 'bg-[#5d7a5d]', icon: RefreshCcw },
};

export const PERSONAL_CATEGORIES = {
    '연차': { color: 'bg-[#7a5d6a]/20 text-[#7a5d6a] border-[#7a5d6a]/30', bar: 'bg-[#7a5d6a]', icon: Plane },
    '오전반차': { color: 'bg-[#6a5d7a]/20 text-[#6a5d7a] border-[#6a5d7a]/30', bar: 'bg-[#6a5d7a]', icon: Coffee },
    '오후반차': { color: 'bg-[#7a6a5d]/20 text-[#7a6a5d] border-[#7a6a5d]/30', bar: 'bg-[#7a6a5d]', icon: Coffee },
    '외근': { color: 'bg-[#b8860b]/20 text-[#b8860b] border-[#b8860b]/30', bar: 'bg-[#b8860b]', icon: MapPin },
    '미팅': { color: 'bg-[#a0714a]/20 text-[#a0714a] border-[#a0714a]/30', bar: 'bg-[#a0714a]', icon: User },
    '기타': { color: 'bg-[#857460]/20 text-[#857460] border-[#857460]/30', bar: 'bg-[#857460]', icon: Smile },
};

export const PLAN_COLUMNS = {
    'draft': { label: '기획 대기', color: 'bg-[#857460]/20 text-[#857460] border-[#857460]/30' },
    'active': { label: '진행 중', color: 'bg-[#a0714a]/20 text-[#a0714a] border-[#a0714a]/30' },
    'completed': { label: '완료', color: 'bg-[#5d7a5d]/20 text-[#5d7a5d] border-[#5d7a5d]/30' }
};

export const AUTHORS = ['윤성준', '이현경'];
export const TEAM_MEMBERS = AUTHORS;
export const DEFAULT_AUTHOR = AUTHORS[0];

// 로그인 계정 정보 (Firebase 이메일+비밀번호 인증용)
export const TEAM_ACCOUNTS = [
    { name: '윤성준', email: 'sungjun.yoon@fairplay142.com', avatar: '윤', color: 'bg-[#4a7ab5]' },
    { name: '이현경', email: 'hyungyung.lee@fairplay142.com', avatar: '이', color: 'bg-[#7a5a9b]' },
    { name: '강일훈', email: 'kgnsl1@fairplay142.com', avatar: '강', color: 'bg-[#5d7a5d]' },
    { name: '이정주', email: 'jeongju.lee@fairplay142.com', avatar: '정', color: 'bg-[#a0714a]' },
];

// 담당자별 캘린더 블록 배경색 (방식 1)
export const MEMBER_COLORS = {
    '윤성준': { bg: 'rgba(74, 122, 181, 0.75)', text: '#ffffff', hoverBg: 'rgba(74, 122, 181, 0.90)' },
    '이현경': { bg: 'rgba(122, 90, 155, 0.75)', text: '#ffffff', hoverBg: 'rgba(122, 90, 155, 0.90)' },
};
export const MEMBER_COLORS_DEFAULT = { bg: 'rgba(100, 100, 100, 0.65)', text: '#ffffff', hoverBg: 'rgba(100,100,100,0.85)' };

// B-2: 프로젝트 타입별 상단 바 + 전체 테두리 색상 (본편=파랑, 숏츠=주황, 개인=갈색)
export const PROJECT_TYPE_COLORS = {
    'main':     '#2d6ec2',
    'shorts':   '#d4640a',
    'personal': '#a0714a',
};

// 프로젝트 왼쪽 테두리 색상 팔레트 (planId 해시 → 인덱스)
export const PROJECT_BORDER_COLORS = [
    '#e07b4a', // 주황
    '#5d9b5d', // 초록
    '#b8860b', // 황금
    '#9b4d4d', // 빨강
    '#4a8a9b', // 청록
    '#7a5d9b', // 보라
    '#9b7a3d', // 갈색
    '#4a7a6a', // 청녹
];

export const HOLIDAYS = {
    '2025-12-25': '성탄절', '2026-01-01': '신정', '2026-02-16': '설날 연휴', '2026-02-17': '설날',
    '2026-02-18': '설날 연휴', '2026-03-01': '3.1절', '2026-03-02': '대체공휴일(3.1절)',
    '2026-05-05': '어린이날', '2026-05-06': '대체공휴일(어린이날)', '2026-05-24': '부처님오신날',
    '2026-05-25': '대체공휴일(부처님오신날)', '2026-06-06': '현충일', '2026-08-15': '광복절',
    '2026-09-24': '추석 연휴', '2026-09-25': '추석', '2026-09-26': '추석 연휴',
    '2026-10-03': '개천절', '2026-10-09': '한글날', '2026-12-25': '성탄절'
};
