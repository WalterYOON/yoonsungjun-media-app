import { Film, Zap, FileEdit, Video, Scissors, RefreshCcw, Plane, Coffee, MapPin, User, Smile } from 'lucide-react';

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

export const AUTHORS = ['윤성준', '이현경', '석재균'];
export const TEAM_MEMBERS = AUTHORS;
export const DEFAULT_AUTHOR = AUTHORS[0];

export const HOLIDAYS = {
    '2025-12-25': '성탄절', '2026-01-01': '신정', '2026-02-16': '설날 연휴', '2026-02-17': '설날',
    '2026-02-18': '설날 연휴', '2026-03-01': '3.1절', '2026-03-02': '대체공휴일(3.1절)',
    '2026-05-05': '어린이날', '2026-05-06': '대체공휴일(어린이날)', '2026-05-24': '부처님오신날',
    '2026-05-25': '대체공휴일(부처님오신날)', '2026-06-06': '현충일', '2026-08-15': '광복절',
    '2026-09-24': '추석 연휴', '2026-09-25': '추석', '2026-09-26': '추석 연휴',
    '2026-10-03': '개천절', '2026-10-09': '한글날', '2026-12-25': '성탄절'
};
