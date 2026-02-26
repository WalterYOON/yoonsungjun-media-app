import React, { useState } from 'react';
import { User, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TEAM_MEMBERS } from '../../config/constants';

const UserSelectModal = () => {
    const { profile, setProfile, showToast } = useApp();
    const [customName, setCustomName] = useState('');
    if (profile) return null;
    const handleCustomLogin = () => { if (customName.trim()) { setProfile(customName.trim()); showToast(`${customName.trim()}님 환영합니다!`); } else { showToast('이름을 입력해주세요.', 'error'); } };
    return (<div className="fixed inset-0 z-[150] bg-[#42392e]/80 flex items-center justify-center backdrop-blur-sm"><div className="bg-[#faf6ef] p-8 rounded-2xl w-96 text-center shadow-2xl"><div className="mb-6"><div className="w-16 h-16 bg-[#5d6a7a]/20 rounded-full flex items-center justify-center mx-auto mb-4"><User size={32} className="text-[#4d5a6a]" /></div><h2 className="text-2xl font-black text-[#42392e]">로그인</h2></div><div className="space-y-2 mb-6">{TEAM_MEMBERS.map(m => (<button key={m} onClick={() => { setProfile(m); showToast(`${m}님 환영합니다!`); }} className="block w-full p-4 bg-[#faf6ef] border border-[#d4c4ac] rounded-xl hover:bg-[#5d6a7a]/10 hover:border-[#5d6a7a]/40 hover:text-[#3d4a5a] font-bold text-[#4a3d30] transition-all flex items-center justify-between group"><span>{m}</span><ChevronRight size={16} className="text-slate-300 group-hover:text-[#5d6a7a]" /></button>))}</div><div className="relative flex py-2 items-center"><div className="flex-grow border-t border-[#d4c4ac]"></div><span className="flex-shrink-0 mx-4 text-[#857460] text-xs">또는 직접 입력</span><div className="flex-grow border-t border-[#d4c4ac]"></div></div><div className="mt-4 flex gap-2"><input type="text" placeholder="이름 입력 (예: 관리자)" value={customName} onChange={(e) => setCustomName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCustomLogin()} className="flex-1 p-3 bg-[#faf6ef] border border-[#d4c4ac] rounded-xl text-sm focus:outline-none focus:border-[#5d6a7a] text-[#32291e]" /><button onClick={handleCustomLogin} className="px-4 py-2 bg-[#4a3d30] text-[#faf6ef] rounded-xl font-bold text-sm hover:bg-[#5a4d40] transition-colors">입장</button></div></div></div>);
};

export default UserSelectModal;
