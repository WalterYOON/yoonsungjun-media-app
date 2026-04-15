// ProjectTab - 원본 라인 2541~3016
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Film, Edit, CheckCircle, Activity, ClipboardList, List, LayoutGrid, X } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { useApp } from '../../context/AppContext';
import { PROJECT_TYPES, TEAM_MEMBERS, WORK_CATEGORIES, DEFAULT_AUTHOR } from '../../config/constants';
import { formatDateLocal, parseLocalDate } from '../../utils/dateUtils';
import RichTextEditor from '../common/RichTextEditor';

const ProjectTab = () => {
    const { plans, tasks, filteredTasks, toggleModal, setSelectedItems, operations, showToast, openConfirm, profile } = useApp();
    const [selected, setSelected] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newP, setNewP] = useState({ topic: '', type: 'main', planner: '', uploadDate: '', shootType: 'indoor' });
    const [editingInfo, setEditingInfo] = useState(false);
    const [editingScenario, setEditingScenario] = useState(false);
    const [addingSchedule, setAddingSchedule] = useState(false);
    const [infoForm, setInfoForm] = useState({});
    const [scenarioVal, setScenarioVal] = useState('');
    const [newSchedule, setNewSchedule] = useState({ category: ['대본'], author: '', workStartDate: '', workEndDate: '', details: '', status: 'todo' });
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
    const [kanbanSelected, setKanbanSelected] = useState(null);

    useEffect(() => { if (!newP.planner) setNewP(p => ({ ...p, planner: profile || TEAM_MEMBERS[0] })); }, [profile]);

    const filteredPlans = useMemo(() => {
        let result = plans;
        if (typeFilter !== 'all') result = result.filter(p => p.type === typeFilter);
        if (statusFilter !== 'all') result = result.filter(p => p.status === statusFilter);
        if (searchQuery.trim()) result = result.filter(p => p.topic?.toLowerCase().includes(searchQuery.trim().toLowerCase()));
        return result.sort((a, b) => new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0));
    }, [plans, typeFilter, statusFilter, searchQuery]);

    // 칸반용: 상태 필터 없이 type + 검색만 적용
    const kanbanPlans = useMemo(() => {
        let result = plans;
        if (typeFilter !== 'all') result = result.filter(p => p.type === typeFilter);
        if (searchQuery.trim()) result = result.filter(p => p.topic?.toLowerCase().includes(searchQuery.trim().toLowerCase()));
        return result;
    }, [plans, typeFilter, searchQuery]);

    const calcProgress = useCallback((plan) => {
        const planTasks = filteredTasks.filter(t => t.planId === plan.id && !t.isDraftPlaceholder && t.type !== 'personal');
        let totalDays = 0, completedDaysCount = 0;
        planTasks.forEach(t => {
            const start = parseLocalDate(t.workStartDate);
            const end = parseLocalDate(t.workEndDate);
            const duration = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (duration > 0) totalDays += duration;
            if (t.completedDates && Array.isArray(t.completedDates)) completedDaysCount += t.completedDates.length;
        });
        return totalDays === 0 ? 0 : Math.min(100, Math.round((completedDaysCount / totalDays) * 100));
    }, [filteredTasks]);

    const getPlanTasks = useCallback((planId) => tasks.filter(t => t.planId === planId && !t.isDraftPlaceholder && t.type !== 'personal'), [tasks]);

    const calcDDay = (uploadDate) => {
        if (!uploadDate) return null;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const upload = new Date(uploadDate);
        const diff = Math.round((upload - today) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'D-day';
        if (diff > 0) return `D-${diff}`;
        return `D+${Math.abs(diff)}`;
    };

    const getDDayStyle = (dday) => {
        if (!dday) return null;
        if (dday === 'D-day') return { color: '#9b4d4d', bg: '#9b4d4d18' };
        if (dday.startsWith('D-')) {
            const n = parseInt(dday.slice(2));
            if (n <= 3) return { color: '#9b4d4d', bg: '#9b4d4d18' };
            if (n <= 7) return { color: '#c47c2a', bg: '#c47c2a18' };
            return { color: '#5d7a5d', bg: '#5d7a5d18' };
        }
        return { color: '#857460', bg: '#85746018' };
    };

    const selectPlan = (plan) => { setSelected(plan); setShowCreate(false); setEditingInfo(false); setEditingScenario(false); setAddingSchedule(false); };
    const handleCreate = async () => { if (!newP.topic?.trim()) return; const result = await operations.savePlan({ ...newP, status: 'draft' }); if (result?.success) { showToast('프로젝트가 등록되었습니다.', 'success'); setShowCreate(false); setNewP({ topic: '', type: 'main', planner: profile || TEAM_MEMBERS[0], uploadDate: '', shootType: 'indoor' }); } };
    const handleSaveInfo = async () => { const result = await operations.savePlan({ ...selected, ...infoForm }); if (result?.success) { setSelected(prev => ({ ...prev, ...infoForm })); setEditingInfo(false); showToast('기획 정보가 저장되었습니다.', 'success'); } };
    const handleSaveScenario = async () => { const result = await operations.savePlan({ ...selected, reportDraft: scenarioVal }); if (result?.success) { setSelected(prev => ({ ...prev, reportDraft: scenarioVal })); setEditingScenario(false); showToast('시나리오가 저장되었습니다.', 'success'); } };
    const handleAddSchedule = async () => {
        if (!newSchedule.workStartDate || !newSchedule.workEndDate || !newSchedule.author) {
            showToast('시작일, 종료일, 담당자를 모두 입력해주세요.', 'error');
            return;
        }
        const result = await operations.saveTask({
            ...newSchedule,
            planId: selected.id,
            topic: selected.topic,
            type: 'task',
            completedDates: [],
            skipPlanCheck: true,
        }, false, false, false);
        if (result?.success) {
            setAddingSchedule(false);
            setNewSchedule({ category: ['대본'], author: profile || TEAM_MEMBERS[0], workStartDate: '', workEndDate: '', details: '', status: 'todo' });
            showToast('일정이 추가되었습니다.', 'success');
        } else {
            showToast(result?.message || '일정 추가에 실패했습니다.', 'error');
        }
    };
    const handleStatusChange = async (plan, newStatus) => {
        const result = await operations.savePlan({ ...plan, status: newStatus });
        if (result?.success) {
            if (selected?.id === plan.id) setSelected(prev => ({ ...prev, status: newStatus }));
            if (kanbanSelected?.id === plan.id) setKanbanSelected(prev => ({ ...prev, status: newStatus }));
            showToast('상태가 변경되었습니다.', 'success');
        }
    };
    const handleDelete = async (plan) => {
        openConfirm(`"${plan.topic}" 프로젝트를 삭제하시겠습니까?`, async () => {
            await operations.deletePlan(plan.id, plan.topic);
            if (selected?.id === plan.id) setSelected(null);
            if (kanbanSelected?.id === plan.id) setKanbanSelected(null);
        });
    };

    const statusColor = { draft: '#857460', active: '#a0714a', completed: '#5d7a5d' };
    const statusLabel = { draft: '기획', active: '제작중', completed: '완료' };
    const TaskStatusIcon = ({ status }) => {
        if (status === 'done') return <CheckCircle size={12} className="text-[#5d7a5d]" />;
        if (status === 'in_progress') return <Activity size={12} className="text-[#a0714a]" />;
        return <div className="w-3 h-3 rounded-full border-2 border-[#d4c4ac]" />;
    };

    // 칸반 컬럼 정의
    const kanbanColumns = [
        { key: 'draft',     label: '기획',   icon: '📋', color: '#857460', headerBg: '#ede8e0', cardsBg: '#f0ece4' },
        { key: 'active',    label: '제작중', icon: '🎬', color: '#a0714a', headerBg: '#f0e6d8', cardsBg: '#f5ead9' },
        { key: 'completed', label: '완료',   icon: '✅', color: '#5d7a5d', headerBg: '#e4ede4', cardsBg: '#eaf2ea' },
    ];

    // 뷰 전환 토글 버튼
    const ViewToggle = () => (
        <div className="flex border border-[#d4c4ac] rounded-lg overflow-hidden flex-shrink-0">
            <button
                onClick={() => setViewMode('list')}
                title="목록 뷰"
                className={`px-2.5 py-1.5 flex items-center transition-all ${viewMode === 'list' ? 'bg-[#a0714a] text-white' : 'bg-[#faf6ef] text-[#857460] hover:bg-[#e8dcc8]'}`}
            >
                <List size={13} />
            </button>
            <button
                onClick={() => setViewMode('kanban')}
                title="칸반 뷰"
                className={`px-2.5 py-1.5 flex items-center transition-all ${viewMode === 'kanban' ? 'bg-[#a0714a] text-white' : 'bg-[#faf6ef] text-[#857460] hover:bg-[#e8dcc8]'}`}
            >
                <LayoutGrid size={13} />
            </button>
        </div>
    );

    // 칸반 카드 렌더링
    const renderKanbanCard = (plan) => {
        const progress = calcProgress(plan);
        const dday = calcDDay(plan.uploadDate);
        const ddayStyle = getDDayStyle(dday);
        const isSelected = kanbanSelected?.id === plan.id;
        return (
            <div
                key={plan.id}
                onClick={() => setKanbanSelected(isSelected ? null : plan)}
                className={`p-3 rounded-xl mb-2 cursor-pointer transition-all border bg-[#faf6ef] ${
                    isSelected
                        ? 'border-[#a0714a] shadow-md ring-1 ring-[#a0714a]/20'
                        : 'border-[#e8dcc8] hover:border-[#c4a882] hover:shadow-sm'
                }`}
                style={{ transition: 'all 0.15s ease' }}
            >
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[#5d6a7a]/15 text-[#5d6a7a]">
                        {plan.type === 'shorts' ? 'Shorts' : 'Main'}
                    </span>
                    {dday && ddayStyle && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: ddayStyle.color, background: ddayStyle.bg }}>
                            {dday}
                        </span>
                    )}
                </div>
                <div className="font-bold text-sm text-[#42392e] leading-snug mb-1 line-clamp-2">{plan.topic}</div>
                <div className="text-xs text-[#a89880]">{plan.planner}</div>
                {plan.status === 'active' && (
                    <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-[#a89880]">진행률</span>
                            <span className="text-[10px] font-bold text-[#a0714a]">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-[#e8dcc8] rounded-full overflow-hidden">
                            <div className="h-full bg-[#a0714a] rounded-full" style={{ width: `${progress}%`, transition: 'width 0.4s ease' }} />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // 칸반 우측 상세 패널
    const renderKanbanDetail = () => {
        if (!kanbanSelected) return null;
        const plan = plans.find(p => p.id === kanbanSelected.id) || kanbanSelected;
        const progress = calcProgress(plan);
        const planTasks = getPlanTasks(plan.id);
        const dday = calcDDay(plan.uploadDate);
        const ddayStyle = getDDayStyle(dday);

        return (
            <div className="w-[340px] flex-shrink-0 bg-[#faf6ef] border-l border-[#d4c4ac] flex flex-col overflow-hidden">
                {/* 상세 헤더 */}
                <div className="px-4 py-3 border-b border-[#d4c4ac] bg-[#f0e9de]">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex gap-1.5 flex-wrap">
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: statusColor[plan.status] + '22', color: statusColor[plan.status] }}>
                                {statusLabel[plan.status]}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#5d6a7a]/15 text-[#5d6a7a]">
                                {plan.type === 'shorts' ? 'Shorts' : 'Main'}
                            </span>
                            {dday && ddayStyle && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: ddayStyle.color, background: ddayStyle.bg }}>
                                    {dday}
                                </span>
                            )}
                        </div>
                        <button onClick={() => setKanbanSelected(null)} className="p-1 rounded-lg hover:bg-[#e8dcc8] transition-colors flex-shrink-0">
                            <X size={14} className="text-[#857460]" />
                        </button>
                    </div>
                    <div className="font-black text-base text-[#42392e] leading-snug mb-0.5">{plan.topic}</div>
                    <div className="text-xs text-[#a89880] mb-2">{plan.planner} · {plan.uploadDate || '업로드일 미정'}</div>
                    {plan.status === 'active' && (
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 h-1.5 bg-[#e8dcc8] rounded-full overflow-hidden">
                                <div className="h-full bg-[#a0714a] rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs font-bold text-[#a0714a]">{progress}%</span>
                        </div>
                    )}
                    {/* 액션 버튼들 */}
                    <div className="flex gap-1.5 flex-wrap">
                        {plan.status === 'draft' && (
                            <button onClick={() => handleStatusChange(plan, 'active')} className="px-2.5 py-1 text-[10px] font-bold text-[#a0714a] border border-[#a0714a]/40 rounded-lg hover:bg-[#a0714a]/10 transition-all">▶ 제작시작</button>
                        )}
                        {plan.status === 'active' && (
                            <button onClick={() => handleStatusChange(plan, 'completed')} className="px-2.5 py-1 text-[10px] font-bold text-[#5d7a5d] border border-[#5d7a5d]/40 rounded-lg hover:bg-[#5d7a5d]/10 transition-all">✓ 완료처리</button>
                        )}
                        {plan.status === 'completed' && (
                            <button onClick={() => handleStatusChange(plan, 'active')} className="px-2.5 py-1 text-[10px] font-bold text-[#857460] border border-[#857460]/40 rounded-lg hover:bg-[#857460]/10 transition-all">↩ 재오픈</button>
                        )}
                        <button
                            onClick={() => { selectPlan(plan); setViewMode('list'); setKanbanSelected(null); }}
                            className="px-2.5 py-1 text-[10px] font-bold text-[#5d6a7a] border border-[#5d6a7a]/40 rounded-lg hover:bg-[#5d6a7a]/10 transition-all"
                        >
                            ✏️ 상세편집
                        </button>
                        <button onClick={() => handleDelete(plan)} className="px-2.5 py-1 text-[10px] font-bold text-[#9b4d4d] border border-[#9b4d4d]/40 rounded-lg hover:bg-[#9b4d4d]/10 transition-all">삭제</button>
                    </div>
                </div>
                {/* 상세 내용 */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                    {plan.description && (
                        <div className="bg-[#f0e9de] rounded-xl p-3 border border-[#e8dcc8]">
                            <div className="text-xs font-bold text-[#857460] mb-1">기획 의도</div>
                            <div className="text-sm text-[#6a5d50] leading-relaxed">{plan.description}</div>
                        </div>
                    )}
                    {plan.reportDraft && (
                        <div className="bg-[#f0e9de] rounded-xl p-3 border border-[#e8dcc8]">
                            <div className="text-xs font-bold text-[#857460] mb-1">📝 시나리오</div>
                            <div className="text-sm text-[#6a5d50] leading-relaxed line-clamp-4" dangerouslySetInnerHTML={{ __html: plan.reportDraft }} />
                        </div>
                    )}
                    <div className="bg-[#f0e9de] rounded-xl border border-[#e8dcc8] overflow-hidden">
                        <div className="px-3 py-2 border-b border-[#e8dcc8] bg-[#ede5d8] flex items-center justify-between">
                            <span className="text-xs font-bold text-[#42392e]">📅 일정 ({planTasks.length}건)</span>
                        </div>
                        <div className="p-2">
                            {planTasks.length === 0 ? (
                                <div className="text-xs text-[#c4b49a] text-center py-4">등록된 일정이 없습니다</div>
                            ) : (
                                planTasks.slice(0, 6).map(task => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-2 p-2 hover:bg-[#e8dcc8] rounded-lg cursor-pointer transition-all"
                                        onClick={() => { setSelectedItems(prev => ({ ...prev, task })); toggleModal('schedule', true); }}
                                    >
                                        <TaskStatusIcon status={task.status} />
                                        <div className="flex gap-1 flex-shrink-0">
                                            {(task.category || []).slice(0, 1).map(c => (
                                                <span key={c} className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${WORK_CATEGORIES[c]?.color || 'bg-[#857460]/20 text-[#857460]'}`}>{c}</span>
                                            ))}
                                        </div>
                                        <span className="flex-1 text-xs text-[#42392e] truncate">{task.details || '내용 없음'}</span>
                                        <span className="text-[10px] text-[#a89880] flex-shrink-0">{task.author}</span>
                                    </div>
                                ))
                            )}
                            {planTasks.length > 6 && (
                                <div className="text-xs text-center text-[#a89880] pt-1 pb-1">+{planTasks.length - 6}건 더 있음</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-0 rounded-2xl overflow-hidden border border-[#d4c4ac]">

            {/* ===== 목록 뷰 ===== */}
            {viewMode === 'list' && (
                <>
                    {/* 좌측 목록 */}
                    <div className="w-[440px] flex-shrink-0 bg-[#faf6ef] border-r border-[#d4c4ac] flex flex-col">
                        <div className="p-4 border-b border-[#d4c4ac] bg-[#f0e9de]">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-black text-base text-[#42392e] flex items-center gap-2"><Film size={18} className="text-[#a0714a]" />프로젝트</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-[#a89880]">{filteredPlans.length}개</span>
                                    <ViewToggle />
                                </div>
                            </div>
                            <div className="flex gap-1 mb-2">{[['all', '전체'], ['draft', '기획'], ['active', '제작중'], ['completed', '완료']].map(([key, label]) => (<button key={key} onClick={() => setStatusFilter(key)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === key ? 'bg-[#a0714a] text-[#faf6ef]' : 'text-[#857460] hover:bg-[#e8dcc8]'}`}>{label}</button>))}</div>
                            <div className="flex gap-1 mb-2">{[['all', '전체'], ['main', '본편'], ['shorts', '숏츠']].map(([key, label]) => (<button key={key} onClick={() => setTypeFilter(key)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === key ? 'bg-[#5d6a7a] text-[#faf6ef]' : 'text-[#857460] hover:bg-[#e8dcc8]'}`}>{label}</button>))}</div>
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="프로젝트 검색..." className="w-full px-3 py-2 bg-[#faf6ef] border border-[#d4c4ac] rounded-lg text-sm text-[#42392e] focus:outline-none focus:border-[#a0714a] placeholder-[#c4b49a]" />
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">{filteredPlans.map(plan => { const progress = calcProgress(plan); const isSelected = selected?.id === plan.id && !showCreate; return (<div key={plan.id} onClick={() => selectPlan(plan)} className={`p-3 rounded-xl mb-1 cursor-pointer transition-all border ${isSelected ? 'border-[#a0714a] bg-[#f0e9de]' : 'border-transparent hover:bg-[#f5f0e6]'}`}><div className="flex gap-1.5 mb-1.5"><span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: statusColor[plan.status] + '22', color: statusColor[plan.status] }}>{statusLabel[plan.status]}</span><span className="text-xs px-1.5 py-0.5 rounded font-bold bg-[#5d6a7a]/20 text-[#5d6a7a]">{plan.type === 'shorts' ? 'Shorts' : 'Main'}</span></div><div className="font-bold text-sm text-[#42392e] truncate">{plan.topic}</div><div className="text-xs text-[#a89880] mt-0.5">{plan.planner}</div>{plan.status === 'active' && (<div className="mt-2 h-1.5 bg-[#e8dcc8] rounded-full overflow-hidden"><div className="h-full bg-[#a0714a] rounded-full" style={{ width: `${progress}%` }} /></div>)}</div>); })}</div>
                        <div className="p-3 border-t border-[#d4c4ac]">
                            <button onClick={() => { setShowCreate(true); setSelected(null); }} className="w-full py-2.5 vj-btn-primary text-[#faf6ef] font-bold rounded-xl text-sm flex items-center justify-center gap-2"><Plus size={15} /> 새 프로젝트</button>
                        </div>
                    </div>

                    {/* 우측 상세/생성 */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-[#f5f0e6]">
                        {showCreate && (<><div className="px-6 py-4 border-b border-[#d4c4ac] bg-[#faf6ef]"><div className="font-black text-lg text-[#42392e]">새 프로젝트 등록</div><div className="text-xs text-[#a89880] mt-1">기본 정보만 입력하면 바로 등록됩니다.</div></div><div className="flex-1 overflow-y-auto p-8"><div className="grid grid-cols-2 gap-x-8 gap-y-5"><div className="col-span-2"><label className="text-xs text-[#a89880] block mb-1.5">프로젝트 제목 *</label><input className="w-full px-4 py-3 bg-[#faf6ef] border border-[#d4c4ac] rounded-xl text-sm text-[#42392e] focus:outline-none focus:border-[#a0714a]" placeholder="예: 25SS 시즌 룩북 영상 제작" value={newP.topic || ''} onChange={e => setNewP(p => ({ ...p, topic: e.target.value }))} /></div><div><label className="text-xs text-[#a89880] block mb-1.5">구분</label><div className="flex gap-2">{[['main', '🎬 본편'], ['shorts', '⚡ 숏츠']].map(([key, label]) => (<button key={key} onClick={() => setNewP(p => ({ ...p, type: key }))} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${newP.type === key ? 'bg-[#a0714a] text-[#faf6ef] border-[#a0714a]' : 'bg-[#f0e9de] text-[#857460] border-[#d4c4ac] hover:border-[#a0714a]'}`}>{label}</button>))}</div></div><div><label className="text-xs text-[#a89880] block mb-1.5">촬영 유형</label><div className="flex gap-2">{[['indoor', '🏢 내부 스튜디오'], ['outdoor', '📍 외부 로케이션']].map(([key, label]) => (<button key={key} onClick={() => setNewP(p => ({ ...p, shootType: key }))} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${newP.shootType === key ? 'bg-[#44403c] text-[#faf6ef] border-[#44403c]' : 'bg-[#f0e9de] text-[#857460] border-[#d4c4ac] hover:border-[#44403c]'}`}>{label}</button>))}</div></div><div><label className="text-xs text-[#a89880] block mb-1.5">업로드 예정일</label><input type="date" className="w-full px-4 py-3 bg-[#faf6ef] border border-[#d4c4ac] rounded-xl text-sm text-[#42392e] focus:outline-none focus:border-[#a0714a]" value={newP.uploadDate || ''} onChange={e => setNewP(p => ({ ...p, uploadDate: e.target.value }))} /></div><div><label className="text-xs text-[#a89880] block mb-1.5">기획 담당자</label><select className="w-full px-4 py-3 bg-[#faf6ef] border border-[#d4c4ac] rounded-xl text-sm text-[#42392e] focus:outline-none focus:border-[#a0714a]" value={newP.planner || ''} onChange={e => setNewP(p => ({ ...p, planner: e.target.value }))}>{TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}</select></div><div className="col-span-2"><label className="text-xs text-[#a89880] block mb-1.5">기획 의도 <span className="text-[#c4b49a]">(선택)</span></label><textarea className="w-full px-4 py-3 bg-[#faf6ef] border border-[#d4c4ac] rounded-xl text-sm text-[#42392e] focus:outline-none focus:border-[#a0714a] resize-none" rows={3} placeholder="어떤 영상인지 간단히 설명해주세요..." value={newP.description || ''} onChange={e => setNewP(p => ({ ...p, description: e.target.value }))} /></div><div className="col-span-2 flex gap-3 pt-2"><button onClick={() => setShowCreate(false)} className="px-6 py-3 bg-[#f0e9de] border border-[#d4c4ac] text-[#42392e] font-bold rounded-xl text-sm">취소</button><button onClick={handleCreate} disabled={!newP.topic?.trim()} className="flex-1 py-3 vj-btn-primary text-[#faf6ef] font-bold rounded-xl text-sm disabled:opacity-50">등록하기</button></div></div></div></>)}

                        {!showCreate && selected && (() => {
                            const plan = plans.find(p => p.id === selected.id) || selected; const progress = calcProgress(plan); const planTasks = getPlanTasks(plan.id); return (<><div className="px-6 py-4 border-b border-[#d4c4ac] bg-[#faf6ef]"><div className="flex items-start justify-between gap-4"><div className="flex-1 min-w-0"><div className="flex gap-2 mb-2"><span className="text-[11px] px-2 py-0.5 rounded font-bold" style={{ background: statusColor[plan.status] + '22', color: statusColor[plan.status] }}>{statusLabel[plan.status]}</span><span className="text-[11px] px-2 py-0.5 rounded font-bold bg-[#5d6a7a]/20 text-[#5d6a7a]">{plan.type === 'shorts' ? 'Shorts' : 'Main'}</span></div><div className="font-black text-xl text-[#42392e] truncate">{plan.topic}</div><div className="text-xs text-[#a89880] mt-1">{plan.planner} · {plan.uploadDate || '업로드일 미정'}</div></div><div className="flex gap-2 flex-shrink-0">{plan.status === 'draft' && (<button onClick={() => handleStatusChange(plan, 'active')} className="px-3 py-1.5 text-xs font-bold text-[#a0714a] border border-[#a0714a]/40 rounded-lg hover:bg-[#a0714a]/10 transition-all">▶ 제작시작</button>)}{plan.status === 'active' && (<button onClick={() => handleStatusChange(plan, 'completed')} className="px-3 py-1.5 text-xs font-bold text-[#5d7a5d] border border-[#5d7a5d]/40 rounded-lg hover:bg-[#5d7a5d]/10 transition-all">✓ 완료처리</button>)}{plan.status === 'completed' && (<button onClick={() => handleStatusChange(plan, 'active')} className="px-3 py-1.5 text-xs font-bold text-[#857460] border border-[#857460]/40 rounded-lg hover:bg-[#857460]/10 transition-all">↩ 재오픈</button>)}<button onClick={() => handleDelete(plan)} className="px-3 py-1.5 text-xs font-bold text-[#9b4d4d] border border-[#9b4d4d]/40 rounded-lg hover:bg-[#9b4d4d]/10 transition-all">삭제</button></div></div>{plan.status === 'active' && (<div className="flex items-center gap-3 mt-3"><div className="flex-1 h-2 bg-[#e8dcc8] rounded-full overflow-hidden"><div className="h-full bg-[#a0714a] rounded-full transition-all" style={{ width: `${progress}%` }} /></div><span className="text-sm font-bold text-[#a0714a]">{progress}%</span></div>)}</div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                                    {/* ① 기획 정보 */}
                                    <div className={`bg-[#faf6ef] rounded-2xl border transition-all ${editingInfo ? 'border-[#a0714a]' : 'border-[#d4c4ac]'} overflow-hidden`}><div className="flex items-center justify-between px-5 py-3 border-b border-[#e8dcc8] bg-[#f0e9de]"><span className="font-bold text-[#42392e] text-sm">📋 기획 정보</span>{!editingInfo ? (<button onClick={() => { setInfoForm({ topic: plan.topic, type: plan.type, shootType: plan.shootType, planner: plan.planner, uploadDate: plan.uploadDate, description: plan.description }); setEditingInfo(true); }} className="text-xs font-bold text-[#857460] hover:text-[#a0714a] transition-colors">수정</button>) : (<div className="flex gap-2"><button onClick={() => setEditingInfo(false)} className="text-xs font-bold text-[#857460]">취소</button><button onClick={handleSaveInfo} className="text-xs font-bold text-[#a0714a]">저장</button></div>)}</div><div className="p-5">{!editingInfo ? (<div className="grid grid-cols-2 gap-4">{[['프로젝트명', plan.topic], ['구분', plan.type === 'shorts' ? 'Shorts' : 'Main'], ['촬영 유형', plan.shootType === 'outdoor' ? '외부 로케이션' : '내부 스튜디오'], ['담당자', plan.planner], ['업로드 예정일', plan.uploadDate || '-']].map(([l, v]) => (<div key={l}><div className="text-xs text-[#a89880] mb-1">{l}</div><div className="font-bold text-sm text-[#42392e]">{v}</div></div>))}{plan.description && (<div className="col-span-2"><div className="text-xs text-[#a89880] mb-1">기획 의도</div><div className="text-sm text-[#6a5d50] leading-relaxed">{plan.description}</div></div>)}</div>) : (<div className="space-y-3"><div><label className="text-xs text-[#a89880] block mb-1">프로젝트명</label><input className="w-full px-3 py-2 bg-[#f0e9de] border border-[#d4c4ac] rounded-lg text-sm focus:outline-none focus:border-[#a0714a]" value={infoForm.topic || ''} onChange={e => setInfoForm(f => ({ ...f, topic: e.target.value }))} /></div><div className="grid grid-cols-2 gap-3"><div><label className="text-xs text-[#a89880] block mb-1">구분</label><select className="w-full px-3 py-2 bg-[#f0e9de] border border-[#d4c4ac] rounded-lg text-sm focus:outline-none" value={infoForm.type || 'main'} onChange={e => setInfoForm(f => ({ ...f, type: e.target.value }))}><option value="main">본편</option><option value="shorts">숏츠</option></select></div><div><label className="text-xs text-[#a89880] block mb-1">담당자</label><select className="w-full px-3 py-2 bg-[#f0e9de] border border-[#d4c4ac] rounded-lg text-sm focus:outline-none" value={infoForm.planner || ''} onChange={e => setInfoForm(f => ({ ...f, planner: e.target.value }))}>{TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}</select></div><div><label className="text-xs text-[#a89880] block mb-1">업로드 예정일</label><input type="date" className="w-full px-3 py-2 bg-[#f0e9de] border border-[#d4c4ac] rounded-lg text-sm focus:outline-none" value={infoForm.uploadDate || ''} onChange={e => setInfoForm(f => ({ ...f, uploadDate: e.target.value }))} /></div><div><label className="text-xs text-[#a89880] block mb-1">촬영 유형</label><select className="w-full px-3 py-2 bg-[#f0e9de] border border-[#d4c4ac] rounded-lg text-sm focus:outline-none" value={infoForm.shootType || 'indoor'} onChange={e => setInfoForm(f => ({ ...f, shootType: e.target.value }))}><option value="indoor">내부 스튜디오</option><option value="outdoor">외부 로케이션</option></select></div></div><div><label className="text-xs text-[#a89880] block mb-1">기획 의도</label><textarea className="w-full px-3 py-2 bg-[#f0e9de] border border-[#d4c4ac] rounded-lg text-sm focus:outline-none resize-none" rows={3} value={infoForm.description || ''} onChange={e => setInfoForm(f => ({ ...f, description: e.target.value }))} /></div></div>)}</div></div>
                                    {/* ② 시나리오 */}
                                    <div className={`bg-[#faf6ef] rounded-2xl border transition-all ${editingScenario ? 'border-[#a0714a]' : 'border-[#d4c4ac]'} overflow-hidden`}><div className="flex items-center justify-between px-5 py-3 border-b border-[#e8dcc8] bg-[#f0e9de]"><span className="font-bold text-[#42392e] text-sm">📝 시나리오 / 대본</span>{!editingScenario ? (<button onClick={() => { setScenarioVal(plan.reportDraft || ''); setEditingScenario(true); }} className="text-xs font-bold text-[#857460] hover:text-[#a0714a] transition-colors">{plan.reportDraft ? '수정' : '작성'}</button>) : (<div className="flex items-center gap-3"><button onClick={() => setEditingScenario(false)} className="text-xs font-bold text-[#857460]">취소</button><button onClick={handleSaveScenario} className="text-xs font-bold text-[#a0714a]">저장</button></div>)}</div><div className="p-5">{!editingScenario ? (plan.reportDraft ? <div className="text-sm text-[#6a5d50] leading-relaxed" dangerouslySetInnerHTML={{ __html: plan.reportDraft }} /> : <div className="text-sm text-[#c4b49a] py-4 text-center">아직 작성된 시나리오가 없습니다.</div>) : (<RichTextEditor value={scenarioVal} onChange={setScenarioVal} />)}</div></div>
                                    {/* ③ 일정 관리 */}
                                    <div className={`bg-[#faf6ef] rounded-2xl border transition-all ${addingSchedule ? 'border-[#a0714a]' : 'border-[#d4c4ac]'} overflow-hidden`}><div className="flex items-center justify-between px-5 py-3 border-b border-[#e8dcc8] bg-[#f0e9de]"><span className="font-bold text-[#42392e] text-sm">📅 일정 관리 <span className="text-xs text-[#a89880] font-normal">({planTasks.length}건)</span></span>{!addingSchedule ? (<button onClick={() => { setNewSchedule({ category: ['대본'], author: profile || TEAM_MEMBERS[0], workStartDate: '', workEndDate: '', details: '', status: 'todo' }); setAddingSchedule(true); }} className="text-xs font-bold text-[#857460] hover:text-[#a0714a] transition-colors">+ 일정 추가</button>) : (<div className="flex gap-2"><button onClick={() => setAddingSchedule(false)} className="text-xs font-bold text-[#857460]">취소</button><button onClick={handleAddSchedule} className="text-xs font-bold text-[#a0714a]">추가</button></div>)}</div><div className="p-5">{addingSchedule && (<div className="bg-[#f0e9de] rounded-xl p-4 border border-[#d4c4ac] mb-4 space-y-3"><div><label className="text-xs text-[#a89880] block mb-1.5">업무 구분 <span className="text-[10px] text-[#c4b49a]">(복수 선택 가능)</span></label><div className="flex gap-2 flex-wrap">{Object.keys(WORK_CATEGORIES).map(c => { const isActive = (newSchedule.category || []).includes(c); return (<button key={c} type="button" onClick={() => setNewSchedule(s => ({ ...s, category: isActive ? (s.category || []).filter(x => x !== c) : [...(s.category || []), c] }))} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${isActive ? WORK_CATEGORIES[c].color : 'bg-[#faf6ef] border-[#d4c4ac] text-[#6a5d50] hover:border-[#a0714a]'}`}>{c}</button>); })}</div></div><div className="grid grid-cols-2 gap-3"><div className="col-span-2"><label className="text-xs text-[#a89880] block mb-1">담당자</label><select className="w-full px-3 py-2 bg-[#faf6ef] border border-[#d4c4ac] rounded-lg text-sm focus:outline-none" value={newSchedule.author} onChange={e => setNewSchedule(s => ({ ...s, author: e.target.value }))}>{TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}</select></div><div><label className="text-xs text-[#a89880] block mb-1">시작일</label><input type="date" className="w-full px-3 py-2 bg-[#faf6ef] border border-[#d4c4ac] rounded-lg text-sm focus:outline-none" value={newSchedule.workStartDate} onChange={e => setNewSchedule(s => ({ ...s, workStartDate: e.target.value }))} /></div><div><label className="text-xs text-[#a89880] block mb-1">종료일</label><input type="date" className="w-full px-3 py-2 bg-[#faf6ef] border border-[#d4c4ac] rounded-lg text-sm focus:outline-none" value={newSchedule.workEndDate} onChange={e => setNewSchedule(s => ({ ...s, workEndDate: e.target.value }))} /></div></div><div><label className="text-xs text-[#a89880] block mb-1">업무 내용</label><input className="w-full px-3 py-2 bg-[#faf6ef] border border-[#d4c4ac] rounded-lg text-sm focus:outline-none focus:border-[#a0714a]" placeholder="업무 상세 내용" value={newSchedule.details} onChange={e => setNewSchedule(s => ({ ...s, details: e.target.value }))} /></div></div>)}{planTasks.length === 0 && !addingSchedule && (<EmptyState icon={ClipboardList} iconSize={28} title="등록된 일정이 없습니다" description="'+ 일정 추가' 버튼을 눌러 등록하세요" compact />)}<div className="space-y-2">{planTasks.map(task => (<div key={task.id} onClick={() => { setSelectedItems(prev => ({ ...prev, task })); toggleModal('schedule', true); }} className="flex items-center gap-3 p-3 bg-[#f0e9de] rounded-xl border border-[#e8dcc8] hover:border-[#a0714a] cursor-pointer transition-all group"><TaskStatusIcon status={task.status} /><div className="flex gap-1 flex-wrap">{(task.category || []).map(c => (<span key={c} className={`text-xs px-2 py-0.5 rounded font-bold ${WORK_CATEGORIES[c]?.color || 'bg-[#857460]/20 text-[#857460]'}`}>{c}</span>))}</div><span className="flex-1 text-sm text-[#42392e] font-bold truncate">{task.details || '내용 없음'}</span><span className="text-xs text-[#857460]">{task.author}</span><span className="text-xs text-[#a89880] font-mono">{task.workStartDate}~{task.workEndDate}</span><Edit size={12} className="text-[#d4c4ac] group-hover:text-[#a0714a] transition-colors flex-shrink-0" /></div>))}</div></div></div>
                                </div>
                            </>);
                        })()}

                        {!showCreate && !selected && (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <EmptyState icon={Film} iconSize={48} title="프로젝트를 선택하거나 새로 만드세요" description="좌측 목록에서 프로젝트를 선택하거나 새 프로젝트를 등록하세요" />
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ===== 칸반 뷰 ===== */}
            {viewMode === 'kanban' && (
                <div className="flex flex-col flex-1 bg-[#f5f0e6] overflow-hidden">
                    {/* 칸반 상단 필터바 */}
                    <div className="px-5 py-3 border-b border-[#d4c4ac] bg-[#f0e9de] flex items-center gap-3 flex-shrink-0">
                        <span className="font-black text-sm text-[#42392e] flex items-center gap-2 flex-shrink-0">
                            <Film size={16} className="text-[#a0714a]" />칸반 보드
                        </span>
                        <div className="flex gap-1">
                            {[['all', '전체'], ['main', '본편'], ['shorts', '숏츠']].map(([key, label]) => (
                                <button key={key} onClick={() => setTypeFilter(key)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${typeFilter === key ? 'bg-[#5d6a7a] text-[#faf6ef]' : 'text-[#857460] hover:bg-[#e8dcc8]'}`}>{label}</button>
                            ))}
                        </div>
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="프로젝트 검색..."
                            className="flex-1 px-3 py-1.5 bg-[#faf6ef] border border-[#d4c4ac] rounded-lg text-xs text-[#42392e] focus:outline-none focus:border-[#a0714a] placeholder-[#c4b49a]"
                        />
                        <ViewToggle />
                        <button
                            onClick={() => { setViewMode('list'); setShowCreate(true); setSelected(null); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 vj-btn-primary text-[#faf6ef] font-bold rounded-lg text-xs flex-shrink-0"
                        >
                            <Plus size={12} /> 새 프로젝트
                        </button>
                    </div>

                    {/* 칸반 컬럼 + 우측 상세 패널 */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* 3 컬럼 */}
                        <div className="flex flex-1 gap-3 p-4 overflow-x-auto min-w-0">
                            {kanbanColumns.map(col => {
                                const colPlans = kanbanPlans.filter(p => p.status === col.key);
                                return (
                                    <div
                                        key={col.key}
                                        className="flex flex-col min-w-[200px] flex-1 rounded-2xl overflow-hidden border border-[#d4c4ac]"
                                        style={{ background: col.cardsBg }}
                                    >
                                        {/* 컬럼 헤더 */}
                                        <div
                                            className="px-4 py-3 flex items-center justify-between flex-shrink-0 border-b-2"
                                            style={{ background: col.headerBg, borderColor: col.color + '55' }}
                                        >
                                            <span className="font-black text-sm flex items-center gap-2" style={{ color: col.color }}>
                                                <span>{col.icon}</span>{col.label}
                                            </span>
                                            <span
                                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                style={{ background: col.color + '22', color: col.color }}
                                            >
                                                {colPlans.length}
                                            </span>
                                        </div>
                                        {/* 카드 목록 */}
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                            {colPlans.length === 0 ? (
                                                <div className="text-xs text-[#c4b49a] text-center py-10">프로젝트 없음</div>
                                            ) : (
                                                colPlans.map(plan => renderKanbanCard(plan))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 우측 슬라이드인 상세 패널 */}
                        {kanbanSelected && renderKanbanDetail()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectTab;
