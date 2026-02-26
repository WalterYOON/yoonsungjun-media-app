// SettingsTab - 원본 라인 3900~4038
import React, { useState, useRef } from 'react';
import { Settings, LogOut, Archive, Upload, Loader, AlertTriangle, Zap, Trash } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TEAM_MEMBERS } from '../../config/constants';
import { formatDateLocal } from '../../utils/dateUtils';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';

const SettingsTab = () => {
    const { profile, logout, operations, showToast, openConfirm } = useApp();
    const fileInputRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const handleExport = async () => { setIsExporting(true); await operations.exportAllData(); setIsExporting(false); };
    const handleImport = async (e) => { const file = e.target.files?.[0]; if (!file) return; if (!file.name.endsWith('.json')) { alert('JSON 파일만 업로드 가능합니다.'); return; } setIsImporting(true); await operations.importAllData(file); setIsImporting(false); if (fileInputRef.current) { fileInputRef.current.value = ''; } };
    const rndDate = (min, max) => { const d = new Date(); d.setDate(d.getDate() + Math.floor(Math.random() * (max - min + 1)) + min); return formatDateLocal(d); };

    const handleGenerateSample = async () => {
        setIsGenerating(true);
        try {
            const draftPlans = [
                { topic: '[예시] 여름 패션 하울', type: 'main', status: 'draft', planner: TEAM_MEMBERS[0], description: '여름 신상 의류 리뷰', uploadDate: rndDate(7, 14) },
                { topic: '[예시] 먹방 챌린지 숏츠', type: 'shorts', status: 'draft', planner: TEAM_MEMBERS[1] || TEAM_MEMBERS[0], description: '인기 음식 챌린지', uploadDate: rndDate(5, 10) },
            ];
            const activePlans = [
                { topic: '[예시] 제주도 여행 브이로그', type: 'main', status: 'active', planner: TEAM_MEMBERS[0], description: '제주도 여행 기록', uploadDate: rndDate(3, 7) },
                { topic: '[예시] 게임 리뷰 특집', type: 'main', status: 'active', planner: TEAM_MEMBERS[1] || TEAM_MEMBERS[0], description: '2026 기대작 TOP5', uploadDate: rndDate(2, 5) },
            ];
            const createdActiveIds = [];
            for (const plan of [...draftPlans, ...activePlans]) { const result = await operations.savePlan(plan); if (result?.success && result?.id && plan.status === 'active') { createdActiveIds.push({ id: result.id, topic: plan.topic }); } }
            for (const { id: planId, topic } of createdActiveIds) { const tasks = [{ details: '[예시] 대본 작성', type: 'task', category: ['대본'], author: TEAM_MEMBERS[0], workStartDate: rndDate(-3, -1), workEndDate: rndDate(0, 1), status: 'done', planId, completedDates: [], topic, skipPlanCheck: true }, { details: '[예시] 촬영', type: 'task', category: ['촬영'], author: TEAM_MEMBERS[0], workStartDate: rndDate(1, 2), workEndDate: rndDate(3, 4), status: 'in_progress', planId, completedDates: [], topic, skipPlanCheck: true }, { details: '[예시] 편집', type: 'task', category: ['편집'], author: TEAM_MEMBERS[1] || TEAM_MEMBERS[0], workStartDate: rndDate(4, 5), workEndDate: rndDate(6, 8), status: 'todo', planId, completedDates: [], topic, skipPlanCheck: true },]; for (const task of tasks) { await operations.saveTask(task, false, false, false); } }
            const finances = [{ type: 'income', title: '[예시] 브랜드 협찬비', amount: 1500000, datetime: rndDate(-10, -5), memo: 'A브랜드 협찬' }, { type: 'income', title: '[예시] 유튜브 광고 수익', amount: 820000, datetime: rndDate(-7, -3), memo: '월 광고 수익' }, { type: 'income', title: '[예시] 슈퍼챗 수익', amount: 350000, datetime: rndDate(-5, -1), memo: '라이브 방송' }, { type: 'expense', title: '[예시] 스튜디오 대여비', amount: 300000, datetime: rndDate(-8, -4), memo: '월 정기 대여' }, { type: 'expense', title: '[예시] 카메라 장비 구매', amount: 450000, datetime: rndDate(-6, -2), memo: '촬영 장비' }, { type: 'expense', title: '[예시] 편집 외주비', amount: 200000, datetime: rndDate(-4, -1), memo: '숏폼 편집' },];
            for (const item of finances) { await operations.saveManagement(item, 'finance'); }
            const inquiries = [{ type: 'sponsor', sender: '[예시] A패션브랜드', subject: 'S/S 협찬 제안', content: '봄/여름 시즌 협찬을 제안드립니다.', receivedDate: rndDate(-7, -3) }, { type: 'partnership', sender: '[예시] B엔터테인먼트', subject: 'MCN 파트너십 논의', content: '크리에이터 파트너십 미팅을 요청드립니다.', receivedDate: rndDate(-5, -2) }, { type: 'inquiry', sender: '[예시] 일반 구독자', subject: '촬영 장비 문의', content: '사용하시는 카메라가 궁금합니다.', receivedDate: rndDate(-3, -1) },];
            for (const item of inquiries) { await operations.saveManagement(item, 'inquiry'); }
            showToast('예시 데이터가 생성되었습니다.', 'success');
        } catch (e) { console.error(e); showToast('생성 중 오류가 발생했습니다.', 'error'); }
        setIsGenerating(false);
    };

    const handleClearSample = () => { openConfirm('[예시] 데이터를 모두 삭제하시겠습니까?', async () => { setIsClearing(true); try { const baseRef = (col) => collection(db, 'artifacts', appId, 'public', 'data', col); const plansSnap = await getDocs(baseRef('weekly_plans_live')); const plansBatch = writeBatch(db); plansSnap.docs.filter(d => d.data().topic?.includes('[예시]')).forEach(d => plansBatch.delete(d.ref)); await plansBatch.commit(); const tasksSnap = await getDocs(baseRef('weekly_schedule_live')); const tasksBatch = writeBatch(db); tasksSnap.docs.filter(d => d.data().details?.includes('[예시]')).forEach(d => tasksBatch.delete(d.ref)); await tasksBatch.commit(); const mgmtSnap = await getDocs(baseRef('weekly_management')); const mgmtBatch = writeBatch(db); mgmtSnap.docs.filter(d => d.data().title?.includes('[예시]') || d.data().sender?.includes('[예시]')).forEach(d => mgmtBatch.delete(d.ref)); await mgmtBatch.commit(); showToast('예시 데이터가 삭제되었습니다.', 'success'); } catch (e) { console.error(e); showToast('삭제 중 오류가 발생했습니다.', 'error'); } setIsClearing(false); }); };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <div className="vj-card bg-[#faf6ef] rounded-2xl p-6 border border-[#d4c4ac]"><h2 className="text-xl font-black text-[#42392e] flex items-center gap-2 mb-6"><Settings size={24} className="text-[#a0714a]" />설정</h2><div className="mb-6 pb-6 border-b border-[#d4c4ac]"><h3 className="text-sm font-bold text-[#857460] mb-3">현재 사용자</h3><div className="flex items-center gap-4"><div className="w-16 h-16 bg-gradient-to-br from-[#a0714a] to-[#8a5d3a] rounded-2xl flex items-center justify-center"><span className="text-2xl font-black text-[#faf6ef]">{profile?.charAt(0)}</span></div><div><div className="text-xl font-bold text-[#42392e]">{profile}</div><div className="text-sm text-[#857460]">팀 멤버</div></div></div></div><button onClick={logout} className="w-full py-3 bg-[#f0e9de] border border-[#d4c4ac] hover:border-[#9b4d4d] text-[#9b4d4d] rounded-xl text-sm font-bold flex items-center justify-center gap-2"><LogOut size={16} />로그아웃</button></div>
            <div className="vj-card bg-[#faf6ef] rounded-2xl p-6 border border-[#d4c4ac]"><div className="flex items-center gap-2 mb-4"><Archive size={20} className="text-[#a0714a]" /><h3 className="text-lg font-bold text-[#42392e]">데이터 백업 / 복원</h3></div><p className="text-sm text-[#857460] mb-6 leading-relaxed">프로젝트, 일정, 재무 데이터를 안전하게 백업하고 복원할 수 있습니다.<br />백업 파일은 JSON 형식으로 저장됩니다.</p><div className="space-y-3"><button onClick={handleExport} disabled={isExporting} className="w-full py-3 vj-btn-primary text-[#faf6ef] font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{isExporting ? (<><Loader size={16} className="animate-spin" />백업 중...</>) : (<><Archive size={16} />데이터 백업 (다운로드)</>)}</button><input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" /><button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="w-full py-3 bg-[#f0e9de] border-2 border-[#d4c4ac] text-[#42392e] font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:border-[#a0714a] transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isImporting ? (<><Loader size={16} className="animate-spin" />복원 중...</>) : (<><Upload size={16} />데이터 복원 (업로드)</>)}</button></div><div className="mt-4 p-3 bg-[#a0714a]/10 border border-[#a0714a]/30 rounded-xl"><div className="flex gap-2"><AlertTriangle size={16} className="text-[#a0714a] flex-shrink-0 mt-0.5" /><div className="text-xs text-[#a0714a] leading-relaxed"><span className="font-bold">주의사항:</span><ul className="list-disc list-inside mt-1 space-y-0.5"><li>복원 시 기존 데이터는 유지되고 새 데이터가 추가됩니다.</li><li>중복 방지를 위해 복원 전 백업 파일 내용을 확인하세요.</li><li>정기적인 백업을 권장합니다 (주 1회 이상).</li></ul></div></div></div></div>
            <div className="vj-card bg-[#faf6ef] rounded-2xl p-6 border border-[#d4c4ac]"><div className="flex items-center gap-2 mb-4"><Zap size={20} className="text-[#a0714a]" /><h3 className="text-lg font-bold text-[#42392e]">예시 데이터</h3></div><p className="text-sm text-[#857460] mb-6 leading-relaxed">테스트용 예시 데이터를 생성하거나 삭제합니다.<br />제목에 <span className="font-bold text-[#42392e]">[예시]</span>가 포함된 항목만 삭제됩니다.</p><div className="flex gap-3"><button onClick={handleGenerateSample} disabled={isGenerating || isClearing} className="flex-1 py-3 vj-btn-primary text-[#faf6ef] font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">{isGenerating ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}{isGenerating ? '생성 중...' : '예시 데이터 생성'}</button><button onClick={handleClearSample} disabled={isGenerating || isClearing} className="flex-1 py-3 bg-[#f0e9de] border border-[#9b4d4d]/40 text-[#9b4d4d] font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#9b4d4d]/10 transition-all">{isClearing ? <Loader size={16} className="animate-spin" /> : <Trash size={16} />}{isClearing ? '삭제 중...' : '예시 데이터 삭제'}</button></div></div>
        </div>
    );
};

export default SettingsTab;
