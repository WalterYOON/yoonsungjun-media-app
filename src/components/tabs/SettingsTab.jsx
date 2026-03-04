// SettingsTab - 원본 라인 3900~4038
import React, { useState, useRef } from 'react';
import { Settings, LogOut, Archive, Upload, Loader, AlertTriangle, Zap, Trash, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TEAM_MEMBERS } from '../../config/constants';
import { SAMPLE_PLANS, SAMPLE_TASKS, SAMPLE_FINANCES, SAMPLE_INQUIRIES } from '../../data/sampleData';
import { formatDateLocal } from '../../utils/dateUtils';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db, appId, auth } from '../../config/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const SettingsTab = () => {
    const { profile, logout, operations, showToast, openConfirm } = useApp();
    const fileInputRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    // 비밀번호 변경 상태
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState(false);
    const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

    const toggleShow = (field) => setShowPw(prev => ({ ...prev, [field]: !prev[field] }));

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess(false);
        if (pwForm.next.length < 6) { setPwError('비밀번호는 6자 이상이어야 합니다.'); return; }
        if (pwForm.next !== pwForm.confirm) { setPwError('새 비밀번호가 일치하지 않습니다.'); return; }
        if (pwForm.current === pwForm.next) { setPwError('현재 비밀번호와 동일한 비밀번호로는 변경할 수 없습니다.'); return; }
        setPwLoading(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error('not-authenticated');
            // 재인증 (보안: 변경 전 현재 비밀번호 확인)
            const credential = EmailAuthProvider.credential(currentUser.email, pwForm.current);
            await reauthenticateWithCredential(currentUser, credential);
            // 비밀번호 변경
            await updatePassword(currentUser, pwForm.next);
            setPwSuccess(true);
            setPwForm({ current: '', next: '', confirm: '' });
            showToast('비밀번호가 변경되었습니다.', 'success');
            setTimeout(() => setPwSuccess(false), 3000);
        } catch (err) {
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setPwError('현재 비밀번호가 올바르지 않습니다.');
            } else if (err.code === 'auth/too-many-requests') {
                setPwError('너무 많은 시도. 잠시 후 다시 시도해주세요.');
            } else if (err.code === 'auth/requires-recent-login') {
                setPwError('보안을 위해 로그아웃 후 다시 로그인해주세요.');
            } else if (err.message === 'not-authenticated') {
                setPwError('로그인 상태가 아닙니다.');
            } else {
                setPwError('비밀번호 변경에 실패했습니다.');
            }
        } finally {
            setPwLoading(false);
        }
    };

    const handleExport = async () => { setIsExporting(true); await operations.exportAllData(); setIsExporting(false); };
    const handleImport = async (e) => { const file = e.target.files?.[0]; if (!file) return; if (!file.name.endsWith('.json')) { alert('JSON 파일만 업로드 가능합니다.'); return; } setIsImporting(true); await operations.importAllData(file); setIsImporting(false); if (fileInputRef.current) { fileInputRef.current.value = ''; } };
    const rndDate = (min, max) => { const d = new Date(); d.setDate(d.getDate() + Math.floor(Math.random() * (max - min + 1)) + min); return formatDateLocal(d); };

    const handleGenerateSample = async () => {
        setIsGenerating(true);
        try {
            const draftPlans = [
                { topic: '[예시] 여름 패션 하울', type: 'main', status: 'draft', planner: TEAM_MEMBERS[0], description: '여름 신상 의류 리뷰', uploadDate: rndDate(7, 14), isSample: true },
                { topic: '[예시] 먹방 챌린지 숏츠', type: 'shorts', status: 'draft', planner: TEAM_MEMBERS[1] || TEAM_MEMBERS[0], description: '인기 음식 챌린지', uploadDate: rndDate(5, 10), isSample: true },
            ];
            const activePlans = [
                { topic: '[예시] 제주도 여행 브이로그', type: 'main', status: 'active', planner: TEAM_MEMBERS[0], description: '제주도 여행 기록', uploadDate: rndDate(3, 7), isSample: true },
                { topic: '[예시] 게임 리뷰 특집', type: 'main', status: 'active', planner: TEAM_MEMBERS[1] || TEAM_MEMBERS[0], description: '2026 기대작 TOP5', uploadDate: rndDate(2, 5), isSample: true },
            ];
            const createdActiveIds = [];
            for (const plan of [...draftPlans, ...activePlans]) { const result = await operations.savePlan(plan); if (result?.success && result?.id && plan.status === 'active') { createdActiveIds.push({ id: result.id, topic: plan.topic }); } }
            for (const { id: planId, topic } of createdActiveIds) { const tasks = [{ details: '[예시] 대본 작성', type: 'task', category: ['대본'], author: TEAM_MEMBERS[0], workStartDate: rndDate(-3, -1), workEndDate: rndDate(0, 1), status: 'done', planId, completedDates: [], topic, skipPlanCheck: true, isSample: true }, { details: '[예시] 촬영', type: 'task', category: ['촬영'], author: TEAM_MEMBERS[0], workStartDate: rndDate(1, 2), workEndDate: rndDate(3, 4), status: 'in_progress', planId, completedDates: [], topic, skipPlanCheck: true, isSample: true }, { details: '[예시] 편집', type: 'task', category: ['편집'], author: TEAM_MEMBERS[1] || TEAM_MEMBERS[0], workStartDate: rndDate(4, 5), workEndDate: rndDate(6, 8), status: 'todo', planId, completedDates: [], topic, skipPlanCheck: true, isSample: true },]; for (const task of tasks) { await operations.saveTask(task, false, false, false); } }
            const finances = [{ type: 'income', title: '[예시] 브랜드 협찬비', amount: 1500000, datetime: rndDate(-10, -5), memo: 'A브랜드 협찬', isSample: true }, { type: 'income', title: '[예시] 유튜브 광고 수익', amount: 820000, datetime: rndDate(-7, -3), memo: '월 광고 수익', isSample: true }, { type: 'income', title: '[예시] 슈퍼챗 수익', amount: 350000, datetime: rndDate(-5, -1), memo: '라이브 방송', isSample: true }, { type: 'expense', title: '[예시] 스튜디오 대여비', amount: 300000, datetime: rndDate(-8, -4), memo: '월 정기 대여', isSample: true }, { type: 'expense', title: '[예시] 카메라 장비 구매', amount: 450000, datetime: rndDate(-6, -2), memo: '촬영 장비', isSample: true }, { type: 'expense', title: '[예시] 편집 외주비', amount: 200000, datetime: rndDate(-4, -1), memo: '숏폼 편집', isSample: true },];
            for (const item of finances) { await operations.saveManagement(item, 'finance'); }
            const inquiries = [{ type: 'sponsor', sender: '[예시] A패션브랜드', subject: 'S/S 협찬 제안', content: '봄/여름 시즌 협찬을 제안드립니다.', receivedDate: rndDate(-7, -3), isSample: true }, { type: 'partnership', sender: '[예시] B엔터테인먼트', subject: 'MCN 파트너십 논의', content: '크리에이터 파트너십 미팅을 요청드립니다.', receivedDate: rndDate(-5, -2), isSample: true }, { type: 'inquiry', sender: '[예시] 일반 구독자', subject: '촬영 장비 문의', content: '사용하시는 카메라가 궁금합니다.', receivedDate: rndDate(-3, -1), isSample: true },];
            for (const item of inquiries) { await operations.saveManagement(item, 'inquiry'); }
            showToast('예시 데이터가 생성되었습니다.', 'success');
        } catch (e) { console.error(e); showToast('생성 중 오류가 발생했습니다.', 'error'); }
        setIsGenerating(false);
    };

    const isSampleDoc = (d) => {
        const data = d.data();
        return data.isSample === true
            || data.topic?.includes('[예시]')
            || data.details?.includes('[예시]')
            || data.title?.includes('[예시]')
            || data.sender?.includes('[예시]')
            || data.subject?.includes('[예시]');
    };

    const handleClearSample = () => {
        openConfirm('[예시] 데이터를 모두 삭제하시겠습니까?', async () => {
            setIsClearing(true); try {
                const baseRef = (col) => collection(db, 'artifacts', appId, 'public', 'data', col);
                // 1. 예시 플랜 삭제 & 삭제된 planId 수집 (cascade용)
                const plansSnap = await getDocs(baseRef('weekly_plans_live'));
                const samplePlanIds = new Set();
                const plansBatch = writeBatch(db);
                plansSnap.docs.forEach(d => { if (isSampleDoc(d)) { samplePlanIds.add(d.id); plansBatch.delete(d.ref); } });
                await plansBatch.commit();
                // 2. 예시 일정 삭제: isSample 플래그 OR [예시] 텍스트 OR 삭제된 플랜에 연결된 항목
                const tasksSnap = await getDocs(baseRef('weekly_schedule_live'));
                const tasksBatch = writeBatch(db);
                tasksSnap.docs.forEach(d => { if (isSampleDoc(d) || samplePlanIds.has(d.data().planId)) { tasksBatch.delete(d.ref); } });
                await tasksBatch.commit();
                // 3. 재무/문의 삭제
                const mgmtSnap = await getDocs(baseRef('weekly_management'));
                const mgmtBatch = writeBatch(db);
                mgmtSnap.docs.forEach(d => { if (isSampleDoc(d)) { mgmtBatch.delete(d.ref); } });
                await mgmtBatch.commit();
                showToast('예시 데이터가 삭제되었습니다.', 'success');
            } catch (e) { console.error(e); showToast('삭제 중 오류가 발생했습니다.', 'error'); } setIsClearing(false);
        });
    };

    const handleClearAll = () => {
        openConfirm('⚠️ 전체 데이터를 초기화하시겠습니까?\n\n플랜, 일정, 재무, 문의 데이터가 모두 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.', async () => {
            setIsClearing(true);
            try {
                // 1. Firebase 전체 삭제
                const baseRef = (col) => collection(db, 'artifacts', appId, 'public', 'data', col);
                const collections = ['weekly_plans_live', 'weekly_schedule_live', 'weekly_management'];
                for (const col of collections) {
                    const snap = await getDocs(baseRef(col));
                    const batch = writeBatch(db);
                    snap.docs.forEach(d => batch.delete(d.ref));
                    await batch.commit();
                }
                // 2. 하드코딩 샘플 데이터 숨기기 (localStorage 삭제된 ID 등록)
                const allPlanIds = SAMPLE_PLANS.map(p => p.id);
                const allTaskIds = SAMPLE_TASKS.map(t => t.id);
                const allMgmtIds = [...SAMPLE_FINANCES, ...SAMPLE_INQUIRIES].map(m => m.id);
                localStorage.setItem('deleted_sample_plans', JSON.stringify(allPlanIds));
                localStorage.setItem('deleted_sample_tasks', JSON.stringify(allTaskIds));
                localStorage.setItem('deleted_sample_mgmt', JSON.stringify(allMgmtIds));
                localStorage.removeItem('modified_sample_plans');
                localStorage.removeItem('modified_sample_tasks');
                localStorage.removeItem('modified_sample_mgmt');
                showToast('전체 데이터가 초기화되었습니다.', 'success');
            } catch (e) { console.error(e); showToast('초기화 중 오류가 발생했습니다.', 'error'); }
            setIsClearing(false);
        });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <div className="vj-card bg-[#faf6ef] rounded-2xl p-6 border border-[#d4c4ac]"><h2 className="text-xl font-black text-[#42392e] flex items-center gap-2 mb-6"><Settings size={24} className="text-[#a0714a]" />설정</h2><div className="mb-6 pb-6 border-b border-[#d4c4ac]"><h3 className="text-sm font-bold text-[#857460] mb-3">현재 사용자</h3><div className="flex items-center gap-4"><div className="w-16 h-16 bg-gradient-to-br from-[#a0714a] to-[#8a5d3a] rounded-2xl flex items-center justify-center"><span className="text-2xl font-black text-[#faf6ef]">{profile?.charAt(0)}</span></div><div><div className="text-xl font-bold text-[#42392e]">{profile}</div><div className="text-sm text-[#857460]">팀 멤버</div></div></div></div><button onClick={logout} className="w-full py-3 bg-[#f0e9de] border border-[#d4c4ac] hover:border-[#9b4d4d] text-[#9b4d4d] rounded-xl text-sm font-bold flex items-center justify-center gap-2"><LogOut size={16} />로그아웃</button></div>
            <div className="vj-card bg-[#faf6ef] rounded-2xl p-6 border border-[#d4c4ac]"><div className="flex items-center gap-2 mb-4"><Lock size={20} className="text-[#a0714a]" /><h3 className="text-lg font-bold text-[#42392e]">비밀번호 변경</h3></div>
                <form onSubmit={handlePasswordChange} className="space-y-3">
                    {[{ key: 'current', label: '현재 비밀번호' }, { key: 'next', label: '새 비밀번호' }, { key: 'confirm', label: '새 비밀번호 확인' }].map(({ key, label }) => (
                        <div key={key}>
                            <label className="block text-xs font-bold text-[#857460] mb-1">{label}</label>
                            <div className="relative">
                                <input
                                    type={showPw[key] ? 'text' : 'password'}
                                    value={pwForm[key]}
                                    onChange={e => { setPwForm(prev => ({ ...prev, [key]: e.target.value })); setPwError(''); }}
                                    placeholder={label}
                                    className="w-full pr-10 pl-3 py-2.5 bg-white border border-[#d4c4ac] rounded-xl text-sm text-[#42392e] focus:outline-none focus:border-[#a0714a] focus:ring-2 focus:ring-[#a0714a]/20"
                                />
                                <button type="button" onClick={() => toggleShow(key)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c4b49a] hover:text-[#857460]">
                                    {showPw[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>
                    ))}
                    {pwError && <p className="text-xs text-red-500 font-medium">{pwError}</p>}
                    {pwSuccess && <p className="text-xs text-green-600 font-medium flex items-center gap-1"><Check size={12} />비밀번호가 변경되었습니다.</p>}
                    <button type="submit" disabled={pwLoading || !pwForm.current || !pwForm.next || !pwForm.confirm} className="w-full py-2.5 vj-btn-primary text-[#faf6ef] font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                        {pwLoading ? <><Loader size={14} className="animate-spin" />변경 중...</> : <><Lock size={14} />비밀번호 변경</>}
                    </button>
                </form>
            </div>
            <div className="vj-card bg-[#faf6ef] rounded-2xl p-6 border border-[#d4c4ac]"><div className="flex items-center gap-2 mb-4"><Archive size={20} className="text-[#a0714a]" /><h3 className="text-lg font-bold text-[#42392e]">데이터 백업 / 복원</h3></div><p className="text-sm text-[#857460] mb-6 leading-relaxed">프로젝트, 일정, 재무 데이터를 안전하게 백업하고 복원할 수 있습니다.<br />백업 파일은 JSON 형식으로 저장됩니다.</p><div className="space-y-3"><button onClick={handleExport} disabled={isExporting} className="w-full py-3 vj-btn-primary text-[#faf6ef] font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{isExporting ? (<><Loader size={16} className="animate-spin" />백업 중...</>) : (<><Archive size={16} />데이터 백업 (다운로드)</>)}</button><input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" /><button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="w-full py-3 bg-[#f0e9de] border-2 border-[#d4c4ac] text-[#42392e] font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:border-[#a0714a] transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isImporting ? (<><Loader size={16} className="animate-spin" />복원 중...</>) : (<><Upload size={16} />데이터 복원 (업로드)</>)}</button></div><div className="mt-4 p-3 bg-[#a0714a]/10 border border-[#a0714a]/30 rounded-xl"><div className="flex gap-2"><AlertTriangle size={16} className="text-[#a0714a] flex-shrink-0 mt-0.5" /><div className="text-xs text-[#a0714a] leading-relaxed"><span className="font-bold">주의사항:</span><ul className="list-disc list-inside mt-1 space-y-0.5"><li>복원 시 기존 데이터는 유지되고 새 데이터가 추가됩니다.</li><li>중복 방지를 위해 복원 전 백업 파일 내용을 확인하세요.</li><li>정기적인 백업을 권장합니다 (주 1회 이상).</li></ul></div></div></div></div>
            <div className="vj-card bg-[#faf6ef] rounded-2xl p-6 border border-[#d4c4ac]"><div className="flex items-center gap-2 mb-4"><Zap size={20} className="text-[#a0714a]" /><h3 className="text-lg font-bold text-[#42392e]">예시 데이터</h3></div><p className="text-sm text-[#857460] mb-4 leading-relaxed">테스트용 예시 데이터를 생성하거나 삭제합니다.<br /><span className="font-bold text-[#42392e]">[예시]</span> 표시 항목 또는 예시 플래그가 있는 항목이 삭제됩니다.</p><div className="flex gap-3 mb-3"><button onClick={handleGenerateSample} disabled={isGenerating || isClearing} className="flex-1 py-3 vj-btn-primary text-[#faf6ef] font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">{isGenerating ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}{isGenerating ? '생성 중...' : '예시 데이터 생성'}</button><button onClick={handleClearSample} disabled={isGenerating || isClearing} className="flex-1 py-3 bg-[#f0e9de] border border-[#9b4d4d]/40 text-[#9b4d4d] font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#9b4d4d]/10 transition-all">{isClearing ? <Loader size={16} className="animate-spin" /> : <Trash size={16} />}{isClearing ? '삭제 중...' : '예시 데이터 삭제'}</button></div><div className="pt-3 border-t border-[#d4c4ac]"><p className="text-xs text-[#9b4d4d] font-bold mb-2 flex items-center gap-1"><AlertTriangle size={12} />전체 초기화 (주의)</p><button onClick={handleClearAll} disabled={isGenerating || isClearing} className="w-full py-2.5 bg-[#9b4d4d]/10 border border-[#9b4d4d]/60 text-[#9b4d4d] font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#9b4d4d]/20 transition-all">{isClearing ? <Loader size={14} className="animate-spin" /> : <Trash size={14} />}{isClearing ? '초기화 중...' : '전체 데이터 초기화 (구 예시 포함)'}</button></div></div>
        </div>
    );
};

export default SettingsTab;
