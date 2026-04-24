import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FileText, ChevronLeft, ChevronRight, Plus, Save, Printer, Copy, RefreshCw, Trash, AlertCircle, Mail, Film, Calendar, Edit2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TEAM_MEMBERS, INQUIRY_CATEGORIES, INQUIRY_STATUS } from '../../config/constants';
import { formatDateLocal, parseLocalDate } from '../../utils/dateUtils';
import EmptyState from '../common/EmptyState';

// ════════════════════════════════════════════════
// 유틸 함수 (컴포넌트 외부)
// ════════════════════════════════════════════════

const getMondayOf = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getWeekdayDates = (monday) =>
    Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        return d;
    });

const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

const generateOverviewText = (weekStartDate, weekEndDate, plans, weekTasks) => {
    const startLabel = `${weekStartDate.getMonth() + 1}월 ${weekStartDate.getDate()}일`;
    const endLabel = `${weekEndDate.getMonth() + 1}월 ${weekEndDate.getDate()}일`;
    const active = plans.filter(p => p.status === 'active').length;
    const draft = plans.filter(p => p.status === 'draft').length;
    const completed = plans.filter(p => p.status === 'completed').length;
    const total = weekTasks.length;
    const done = weekTasks.filter(t => t.status === 'done').length;
    const inProgress = weekTasks.filter(t => t.status === 'in_progress').length;
    const todo = weekTasks.filter(t => t.status === 'todo').length;
    return `이번 주(${startLabel} ~ ${endLabel}) 팀 운영 현황입니다.\n\n현재 제작 중인 프로젝트는 ${active}건, 기획 단계 ${draft}건, 완료 ${completed}건입니다.\n\n이번 주 등록된 업무 일정은 총 ${total}건으로, 완료 ${done}건 / 진행중 ${inProgress}건 / 대기 ${todo}건입니다.`;
};

const buildReportDraft = (weekMonday, plans, tasks, managements) => {
    const weekDates = getWeekdayDates(weekMonday);
    const weekStartStr = formatDateLocal(weekDates[0]);
    const weekEndStr = formatDateLocal(weekDates[4]);

    const weekTasks = tasks.filter(t =>
        !t.isDraftPlaceholder &&
        t.workStartDate <= weekEndStr &&
        t.workEndDate >= weekStartStr
    );

    const weekInquiries = managements.filter(m =>
        m.category === 'inquiry' &&
        m.receivedDate >= weekStartStr &&
        m.receivedDate <= weekEndStr
    );

    const projectsWithProgress = plans.map(p => {
        const planTasks = tasks.filter(t => t.planId === p.id && !t.isDraftPlaceholder);
        let totalDays = 0, completedDays = 0;
        planTasks.forEach(t => {
            const start = parseLocalDate(t.workStartDate);
            const end = parseLocalDate(t.workEndDate);
            const duration = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            if (duration > 0) totalDays += duration;
            if (t.completedDates) completedDays += t.completedDates.length;
        });
        const progress = totalDays === 0 ? 0 : Math.min(100, Math.round((completedDays / totalDays) * 100));
        return { id: p.id, topic: p.topic, type: p.type, status: p.status, planner: p.planner, uploadDate: p.uploadDate, progress, memo: '' };
    });

    const overview = generateOverviewText(weekDates[0], weekDates[4], plans, weekTasks);
    return { snapshot: { projects: projectsWithProgress, tasks: weekTasks, inquiries: weekInquiries }, overview, specialNotes: '' };
};

const generateClipboardText = (weekLabel, weekDates, overview, snapshot, specialNotes) => {
    const DAY_KR = ['월', '화', '수', '목', '금'];
    const statusLabel = { draft: '기획', active: '제작중', completed: '완료' };
    const catLabel = { sponsor: '협찬', partnership: '제휴', inquiry: '문의', other: '기타' };
    const inquiryStatusLabel = { reviewing: '검토 중', accepted: '수락', rejected: '거절', pending: '보류' };

    let text = `📋 ${weekLabel} 주간 운영 보고서\n`;
    text += `기간: ${formatDateLocal(weekDates[0])} ~ ${formatDateLocal(weekDates[4])}\n`;
    text += `\n━━━━━━━━━━━━━━━━━━━━\n■ 운영 개요\n${overview}\n`;
    text += `\n━━━━━━━━━━━━━━━━━━━━\n■ 프로젝트 현황\n`;
    snapshot.projects.forEach(p => {
        text += `• [${statusLabel[p.status]}] ${p.type === 'shorts' ? '⚡' : '🎬'} ${p.topic}`;
        if (p.status === 'active') text += ` (${p.progress}%)`;
        if (p.memo) text += `\n  └ ${p.memo}`;
        text += '\n';
    });
    text += `\n━━━━━━━━━━━━━━━━━━━━\n■ 팀원별 업무 일정\n`;
    TEAM_MEMBERS.forEach(member => {
        text += `\n[${member}]\n`;
        weekDates.forEach((date, i) => {
            const dateStr = formatDateLocal(date);
            const dayTasks = snapshot.tasks.filter(t =>
                t.author === member && t.workStartDate <= dateStr && t.workEndDate >= dateStr
            );
            text += `  ${DAY_KR[i]}(${date.getMonth() + 1}/${date.getDate()}): `;
            text += dayTasks.length > 0 ? dayTasks.map(t => (t.category?.[0] ? t.category[0] + ' ' : '') + (t.details || '업무')).join(' / ') : '—';
            text += '\n';
        });
    });
    if (snapshot.inquiries.length > 0) {
        text += `\n━━━━━━━━━━━━━━━━━━━━\n■ 이번 주 수신 문의\n`;
        snapshot.inquiries.forEach(inq => {
            text += `• [${catLabel[inq.type] || inq.type}] ${inq.sender} — "${inq.subject}" (${inquiryStatusLabel[inq.status] || inq.status})\n`;
        });
    }
    if (specialNotes?.trim()) {
        text += `\n━━━━━━━━━━━━━━━━━━━━\n■ 특이사항\n${specialNotes}\n`;
    }
    return text;
};

// ════════════════════════════════════════════════
// 메인 컴포넌트
// ════════════════════════════════════════════════

const WeeklyReportTab = () => {
    const { plans, tasks, managements, operations, reports, profile, showToast, openConfirm } = useApp();

    const [weekMonday, setWeekMonday] = useState(() => getMondayOf(new Date()));
    const [reportId, setReportId] = useState(null);
    const [overview, setOverview] = useState('');
    const [specialNotes, setSpecialNotes] = useState('');
    const [snapshot, setSnapshot] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);

    const weekDates = useMemo(() => getWeekdayDates(weekMonday), [weekMonday]);
    const weekStartStr = useMemo(() => formatDateLocal(weekDates[0]), [weekDates]);
    const weekEndStr = useMemo(() => formatDateLocal(weekDates[4]), [weekDates]);
    const weekNumber = useMemo(() => getWeekNumber(weekMonday), [weekMonday]);
    const weekLabel = `${weekMonday.getFullYear()}년 ${weekNumber}주차`;
    const todayStr = formatDateLocal(new Date());

    // 현재 주차에 해당하는 저장된 보고서 찾기
    const existingReport = useMemo(() =>
        reports.find(r => r.weekStart === weekStartStr),
        [reports, weekStartStr]
    );

    // 주차 변경 시 해당 주 보고서 로드
    useEffect(() => {
        if (existingReport) {
            setReportId(existingReport.id);
            setOverview(existingReport.overview || '');
            setSpecialNotes(existingReport.specialNotes || '');
            setSnapshot(existingReport.snapshot || null);
        } else {
            setReportId(null);
            setOverview('');
            setSpecialNotes('');
            setSnapshot(null);
        }
        setIsDirty(false);
        setEditingProjectId(null);
    }, [weekStartStr]); // weekStartStr 변경 시에만 리로드

    // 보고서 초안 생성
    const handleGenerateDraft = useCallback(() => {
        const doGenerate = () => {
            const draft = buildReportDraft(weekMonday, plans, tasks, managements);
            setOverview(draft.overview);
            setSpecialNotes('');
            setSnapshot(draft.snapshot);
            setIsDirty(true);
        };
        if (snapshot && isDirty) {
            openConfirm('현재 작성 중인 내용이 초기화됩니다. 새로 생성할까요?', doGenerate);
        } else {
            doGenerate();
        }
    }, [snapshot, isDirty, weekMonday, plans, tasks, managements, openConfirm]);

    // 스냅샷만 최신 데이터로 새로고침 (overview, specialNotes, 프로젝트 메모 유지)
    const handleRefreshSnapshot = useCallback(() => {
        openConfirm(
            '최신 프로젝트·일정·문의 데이터를 반영합니다.\n※ 운영 개요, 특이사항, 프로젝트 메모는 유지됩니다.',
            () => {
                const draft = buildReportDraft(weekMonday, plans, tasks, managements);
                // 기존 프로젝트 메모 보존
                const existingMemos = {};
                if (snapshot?.projects) {
                    snapshot.projects.forEach(p => { if (p.memo) existingMemos[p.id] = p.memo; });
                }
                setSnapshot({
                    ...draft.snapshot,
                    projects: draft.snapshot.projects.map(p => ({ ...p, memo: existingMemos[p.id] || '' }))
                });
                setIsDirty(true);
                showToast('데이터가 새로고침 되었습니다.', 'success');
            }
        );
    }, [weekMonday, plans, tasks, managements, snapshot, openConfirm, showToast]);

    // 저장
    const handleSave = useCallback(async () => {
        if (!snapshot) return;
        setIsSaving(true);
        const result = await operations.saveReport({
            id: reportId,
            weekStart: weekStartStr,
            weekEnd: weekEndStr,
            weekLabel,
            overview,
            specialNotes,
            snapshot
        });
        if (result?.success) {
            showToast('보고서가 저장되었습니다.', 'success');
            setIsDirty(false);
            if (!reportId && result.id) setReportId(result.id);
        }
        setIsSaving(false);
    }, [snapshot, reportId, weekStartStr, weekEndStr, weekLabel, overview, specialNotes, operations, showToast]);

    // 삭제
    const handleDelete = useCallback((id, label) => {
        openConfirm(`"${label}" 보고서를 삭제하시겠습니까?`, async () => {
            const ok = await operations.deleteReport(id, label);
            if (ok) showToast('보고서가 삭제되었습니다.', 'success');
        });
    }, [operations, openConfirm, showToast]);

    // 텍스트 복사
    const handleCopyText = useCallback(() => {
        if (!snapshot) return;
        const text = generateClipboardText(weekLabel, weekDates, overview, snapshot, specialNotes);
        navigator.clipboard.writeText(text).then(() => showToast('클립보드에 복사하였습니다.', 'success'));
    }, [snapshot, weekLabel, weekDates, overview, specialNotes, showToast]);

    // 프로젝트 메모 업데이트
    const updateProjectMemo = useCallback((planId, memo) => {
        setSnapshot(prev => ({
            ...prev,
            projects: prev.projects.map(p => p.id === planId ? { ...p, memo } : p)
        }));
        setIsDirty(true);
    }, []);

    const statusColor = { draft: '#857460', active: '#a0714a', completed: '#5d7a5d' };
    const statusLabel = { draft: '기획', active: '제작중', completed: '완료' };
    const DAY_KR = ['월', '화', '수', '목', '금'];

    const navPrevWeek = () => { const d = new Date(weekMonday); d.setDate(d.getDate() - 7); setWeekMonday(d); };
    const navNextWeek = () => { const d = new Date(weekMonday); d.setDate(d.getDate() + 7); setWeekMonday(d); };
    const navThisWeek = () => setWeekMonday(getMondayOf(new Date()));

    return (
        <>
            {/* 인쇄용 스타일 */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-area { overflow: visible !important; max-height: none !important; padding: 0 !important; }
                    body { background: white; }
                }
            `}</style>

            <div className="flex h-[calc(100vh-140px)] gap-0 rounded-2xl overflow-hidden border border-[#d4c4ac]">

                {/* ═══ 좌측: 이력 패널 ═══ */}
                <div className="no-print w-52 flex-shrink-0 bg-[#f0e9de] border-r border-[#d4c4ac] flex flex-col">
                    <div className="p-4 border-b border-[#d4c4ac]">
                        <h3 className="font-black text-sm text-[#42392e] flex items-center gap-2">
                            <FileText size={15} className="text-[#a0714a]" />보고서 이력
                        </h3>
                        <p className="text-[10px] text-[#a89880] mt-0.5">저장된 보고서 목록</p>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {reports.length === 0 ? (
                            <div className="text-xs text-[#c4b49a] text-center py-10 px-2">저장된 보고서가 없습니다</div>
                        ) : (
                            reports.map(r => (
                                <div
                                    key={r.id}
                                    onClick={() => setWeekMonday(getMondayOf(new Date(r.weekStart + 'T00:00:00')))}
                                    className={`group p-3 rounded-xl mb-1 cursor-pointer transition-all border ${r.weekStart === weekStartStr ? 'border-[#a0714a] bg-[#faf6ef] shadow-sm' : 'border-transparent hover:bg-[#e8dcc8]'}`}
                                >
                                    <div className="flex items-start justify-between gap-1">
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-[#42392e] truncate">{r.weekLabel}</div>
                                            <div className="text-[10px] text-[#a89880] mt-0.5">{r.weekStart} ~</div>
                                            {r.createdBy && <div className="text-[10px] text-[#c4b49a] mt-0.5">작성: {r.createdBy}</div>}
                                        </div>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDelete(r.id, r.weekLabel); }}
                                            className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 hover:bg-[#9b4d4d]/20 rounded-lg transition-all"
                                        >
                                            <Trash size={11} className="text-[#9b4d4d]" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ═══ 우측: 메인 편집 영역 ═══ */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#faf6ef]">

                    {/* 상단 컨트롤 바 */}
                    <div className="no-print px-5 py-3 border-b border-[#d4c4ac] bg-[#f0e9de] flex items-center justify-between gap-4 flex-shrink-0">
                        {/* 주차 네비게이션 */}
                        <div className="flex items-center gap-2">
                            <button onClick={navPrevWeek} className="p-1.5 bg-[#faf6ef] border border-[#d4c4ac] rounded-lg hover:bg-[#e8dcc8] transition-all">
                                <ChevronLeft size={16} className="text-[#857460]" />
                            </button>
                            <div className="text-center min-w-[160px]">
                                <div className="font-black text-base text-[#42392e]">{weekLabel}</div>
                                <div className="text-[11px] text-[#a89880]">{weekStartStr} ~ {weekEndStr}</div>
                            </div>
                            <button onClick={navNextWeek} className="p-1.5 bg-[#faf6ef] border border-[#d4c4ac] rounded-lg hover:bg-[#e8dcc8] transition-all">
                                <ChevronRight size={16} className="text-[#857460]" />
                            </button>
                            <button onClick={navThisWeek} className="px-2.5 py-1.5 bg-[#faf6ef] border border-[#d4c4ac] rounded-lg text-xs font-bold text-[#857460] hover:bg-[#e8dcc8] transition-all">
                                이번주
                            </button>
                            {isDirty && <span className="text-[10px] text-[#a0714a] font-bold bg-[#a0714a]/10 px-2 py-0.5 rounded-full">수정됨</span>}
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex items-center gap-2">
                            {snapshot && (
                                <>
                                    <button onClick={handleRefreshSnapshot} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#faf6ef] border border-[#d4c4ac] text-[#857460] font-bold rounded-lg text-xs hover:bg-[#e8dcc8] transition-all" title="최신 일정 데이터로 새로고침 (텍스트 유지)">
                                        <RefreshCw size={13} /> 일정 동기화
                                    </button>
                                    <button onClick={handleCopyText} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#faf6ef] border border-[#d4c4ac] text-[#857460] font-bold rounded-lg text-xs hover:bg-[#e8dcc8] transition-all">
                                        <Copy size={13} /> 텍스트 복사
                                    </button>
                                    <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#faf6ef] border border-[#d4c4ac] text-[#857460] font-bold rounded-lg text-xs hover:bg-[#e8dcc8] transition-all">
                                        <Printer size={13} /> 인쇄
                                    </button>
                                </>
                            )}
                            {!snapshot ? (
                                <button onClick={handleGenerateDraft} className="flex items-center gap-1.5 px-4 py-2 vj-btn-primary text-[#faf6ef] font-bold rounded-lg text-xs">
                                    <Plus size={13} /> 보고서 자동 생성
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !isDirty}
                                    className={`flex items-center gap-1.5 px-4 py-2 font-bold rounded-lg text-xs transition-all ${isDirty ? 'vj-btn-primary text-[#faf6ef]' : 'bg-[#f0e9de] border border-[#d4c4ac] text-[#c4b49a] cursor-not-allowed'}`}
                                >
                                    <Save size={13} /> {isSaving ? '저장 중...' : isDirty ? '저장' : '저장됨 ✓'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ═══ 보고서 본문 ═══ */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar print-area">
                        {!snapshot ? (
                            /* 빈 상태 */
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-20 h-20 bg-[#f0e9de] rounded-2xl flex items-center justify-center mb-4">
                                    <FileText size={40} className="text-[#d4c4ac]" />
                                </div>
                                <div className="text-xl font-black text-[#857460] mb-2">{weekLabel} 보고서</div>
                                <div className="text-sm text-[#a89880] mb-8">
                                    {existingReport ? '보고서를 불러오는 중...' : '아직 작성된 보고서가 없습니다'}
                                </div>
                                {!existingReport && (
                                    <button onClick={handleGenerateDraft} className="flex items-center gap-2 px-6 py-3 vj-btn-primary text-[#faf6ef] font-bold rounded-xl text-sm">
                                        <Plus size={16} /> 이번 주 보고서 자동 생성
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* ── 보고서 헤더 ── */}
                                <div className="vj-card bg-gradient-to-r from-[#3d342a] to-[#5a4d40] rounded-2xl p-6 text-[#faf6ef] shadow-md">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="text-xs text-[#a89880] mb-1 font-bold tracking-widest">V미디어팀 내부 문서</div>
                                            <h1 className="text-2xl font-black leading-tight">{weekLabel} 주간 운영 보고서</h1>
                                            <div className="text-sm text-[#c4b49a] mt-2 flex items-center gap-3">
                                                <span>📅 {weekStartStr}(월) ~ {weekEndStr}(금)</span>
                                                <span>·</span>
                                                <span>✍️ {existingReport?.createdBy || profile}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-[10px] text-[#a89880] mb-0.5">최종 수정</div>
                                            <div className="text-sm font-bold text-[#d4c4ac]">
                                                {existingReport?.updatedAt
                                                    ? new Date(existingReport.updatedAt).toLocaleDateString('ko-KR')
                                                    : new Date().toLocaleDateString('ko-KR')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── ① 운영 개요 ── */}
                                <div className="vj-card bg-[#faf6ef] rounded-2xl border border-[#d4c4ac] overflow-hidden">
                                    <div className="px-5 py-3 bg-[#f0e9de] border-b border-[#d4c4ac] flex items-center gap-2">
                                        <span className="text-base">📌</span>
                                        <span className="font-bold text-sm text-[#42392e]">운영 개요</span>
                                        <span className="text-[10px] text-[#a89880] ml-auto bg-[#e8dcc8] px-2 py-0.5 rounded-full">자동 생성 · 직접 편집 가능</span>
                                    </div>
                                    <div className="p-5">
                                        <textarea
                                            value={overview}
                                            onChange={e => { setOverview(e.target.value); setIsDirty(true); }}
                                            className="w-full bg-transparent text-sm text-[#42392e] leading-relaxed resize-none focus:outline-none placeholder-[#c4b49a]"
                                            rows={5}
                                            placeholder="운영 개요를 입력하세요..."
                                        />
                                    </div>
                                </div>

                                {/* ── ② 프로젝트 현황 ── */}
                                <div className="vj-card bg-[#faf6ef] rounded-2xl border border-[#d4c4ac] overflow-hidden">
                                    <div className="px-5 py-3 bg-[#f0e9de] border-b border-[#d4c4ac] flex items-center gap-2">
                                        <Film size={15} className="text-[#a0714a]" />
                                        <span className="font-bold text-sm text-[#42392e]">프로젝트 현황</span>
                                        <span className="text-[10px] text-[#a0714a] bg-[#a0714a]/10 px-2 py-0.5 rounded-full font-bold">{snapshot.projects.length}건</span>
                                        <span className="text-[10px] text-[#a89880] ml-auto">프로젝트 행 클릭 → 메모 입력</span>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        {snapshot.projects.length === 0 ? (
                                            <EmptyState icon={Film} iconSize={28} title="등록된 프로젝트가 없습니다" compact />
                                        ) : (
                                            // 상태 순서로 정렬: active → draft → completed
                                            [...snapshot.projects]
                                                .sort((a, b) => {
                                                    const order = { active: 0, draft: 1, completed: 2 };
                                                    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
                                                })
                                                .map(project => (
                                                    <div key={project.id} className="p-4 bg-[#f5f0e6] rounded-xl border border-[#e8dcc8] transition-all hover:border-[#d4c4ac]">
                                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                                            <span className="text-[11px] px-2 py-0.5 rounded font-bold" style={{ background: statusColor[project.status] + '22', color: statusColor[project.status] }}>
                                                                {statusLabel[project.status]}
                                                            </span>
                                                            <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-[#5d6a7a]/15 text-[#5d6a7a]">
                                                                {project.type === 'shorts' ? '⚡ Shorts' : '🎬 Main'}
                                                            </span>
                                                            <span className="font-bold text-sm text-[#42392e] flex-1 min-w-0 truncate">{project.topic}</span>
                                                            <span className="text-xs text-[#a89880] flex-shrink-0">{project.planner}</span>
                                                            {project.uploadDate && (
                                                                <span className="text-[11px] text-[#a89880] flex-shrink-0">업로드: {project.uploadDate}</span>
                                                            )}
                                                        </div>
                                                        {project.status === 'active' && (
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="flex-1 h-1.5 bg-[#e8dcc8] rounded-full overflow-hidden">
                                                                    <div className="h-full bg-[#a0714a] rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                                                                </div>
                                                                <span className="text-xs font-bold text-[#a0714a] flex-shrink-0">{project.progress}%</span>
                                                            </div>
                                                        )}
                                                        {/* 프로젝트별 메모 */}
                                                        {editingProjectId === project.id ? (
                                                            <input
                                                                autoFocus
                                                                value={project.memo || ''}
                                                                onChange={e => updateProjectMemo(project.id, e.target.value)}
                                                                onBlur={() => setEditingProjectId(null)}
                                                                onKeyDown={e => e.key === 'Enter' && setEditingProjectId(null)}
                                                                placeholder="이 프로젝트에 대한 메모를 입력하세요..."
                                                                className="w-full mt-1 px-2.5 py-1.5 bg-[#faf6ef] border border-[#a0714a]/50 rounded-lg text-xs text-[#42392e] focus:outline-none"
                                                            />
                                                        ) : (
                                                            <div
                                                                onClick={() => setEditingProjectId(project.id)}
                                                                className="mt-1 px-2 py-1 rounded-lg text-xs cursor-pointer hover:bg-[#faf6ef] transition-all group/memo"
                                                            >
                                                                {project.memo ? (
                                                                    <span className="text-[#6a5d50] flex items-center gap-1">
                                                                        <Edit2 size={10} className="text-[#a89880] opacity-0 group-hover/memo:opacity-100 transition-opacity flex-shrink-0" />
                                                                        {project.memo}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[#c4b49a] flex items-center gap-1 opacity-0 group-hover/memo:opacity-100 transition-opacity">
                                                                        <Edit2 size={10} /> 메모 추가...
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>

                                {/* ── ③ 팀원별·요일별 업무 일정 ── */}
                                <div className="vj-card bg-[#faf6ef] rounded-2xl border border-[#d4c4ac] overflow-hidden">
                                    <div className="px-5 py-3 bg-[#f0e9de] border-b border-[#d4c4ac] flex items-center gap-2">
                                        <Calendar size={15} className="text-[#a0714a]" />
                                        <span className="font-bold text-sm text-[#42392e]">팀원별 업무 일정</span>
                                        <span className="text-[10px] text-[#a89880] bg-[#a0714a]/10 px-2 py-0.5 rounded-full font-bold">{snapshot.tasks.length}건</span>
                                    </div>
                                    <div className="p-5 overflow-x-auto">
                                        <table className="w-full border-collapse text-sm min-w-[500px]">
                                            <thead>
                                                <tr>
                                                    <th className="w-24 py-2.5 px-3 text-left text-xs font-bold text-[#857460] bg-[#f0e9de] border-b-2 border-[#d4c4ac] rounded-tl-lg">
                                                        팀원
                                                    </th>
                                                    {weekDates.map((date, i) => {
                                                        const dateStr = formatDateLocal(date);
                                                        const isToday = dateStr === todayStr;
                                                        return (
                                                            <th key={i} className={`py-2.5 px-2 text-center text-xs font-bold border-b-2 border-[#d4c4ac] min-w-[90px] ${isToday ? 'bg-[#a0714a]/15 text-[#a0714a]' : 'bg-[#f0e9de] text-[#857460]'}`}>
                                                                <div>{DAY_KR[i]}</div>
                                                                <div className={`text-[10px] ${isToday ? 'text-[#a0714a] font-black' : 'text-[#a89880] font-normal'}`}>
                                                                    {date.getMonth() + 1}/{date.getDate()}
                                                                    {isToday && ' ●'}
                                                                </div>
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {TEAM_MEMBERS.map((member, mi) => (
                                                    <tr key={member} className={mi % 2 === 0 ? 'bg-[#faf6ef]' : 'bg-[#f5f0e6]'}>
                                                        <td className="py-3 px-3 font-bold text-xs text-[#42392e] border-r border-[#e8dcc8] whitespace-nowrap align-middle">
                                                            {member}
                                                        </td>
                                                        {weekDates.map((date, di) => {
                                                            const dateStr = formatDateLocal(date);
                                                            const dayTasks = snapshot.tasks.filter(t =>
                                                                t.author === member &&
                                                                t.workStartDate <= dateStr &&
                                                                t.workEndDate >= dateStr
                                                            );
                                                            const isToday = dateStr === todayStr;
                                                            return (
                                                                <td key={di} className={`py-2 px-2 align-top border-r border-[#f0e9de] ${isToday ? 'bg-[#a0714a]/5' : ''}`}>
                                                                    {dayTasks.length === 0 ? (
                                                                        <span className="text-[#d4c4ac] text-[10px]">—</span>
                                                                    ) : (
                                                                        <div className="space-y-1">
                                                                            {dayTasks.map(task => {
                                                                                const cat = task.category?.[0];
                                                                                const label = (cat ? `${cat} ` : '') + (task.details || '업무');
                                                                                return (
                                                                                    <div key={task.id} className="text-[10px] px-1.5 py-0.5 bg-[#a0714a]/12 text-[#5a3a1a] rounded font-bold leading-tight" style={{ backgroundColor: 'rgba(160,113,74,0.12)' }} title={task.details}>
                                                                                        {label.length > 14 ? label.slice(0, 13) + '…' : label}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {snapshot.tasks.length === 0 && (
                                            <p className="text-xs text-[#c4b49a] text-center mt-4">이번 주 등록된 업무 일정이 없습니다</p>
                                        )}
                                    </div>
                                </div>

                                {/* ── ④ 이번 주 수신 문의 ── */}
                                <div className="vj-card bg-[#faf6ef] rounded-2xl border border-[#d4c4ac] overflow-hidden">
                                    <div className="px-5 py-3 bg-[#f0e9de] border-b border-[#d4c4ac] flex items-center gap-2">
                                        <Mail size={15} className="text-[#a0714a]" />
                                        <span className="font-bold text-sm text-[#42392e]">이번 주 수신 문의</span>
                                        {snapshot.inquiries.length > 0 && (
                                            <span className="text-[10px] text-[#a0714a] bg-[#a0714a]/10 px-2 py-0.5 rounded-full font-bold">{snapshot.inquiries.length}건</span>
                                        )}
                                    </div>
                                    <div className="p-5">
                                        {snapshot.inquiries.length === 0 ? (
                                            <div className="text-sm text-[#c4b49a] text-center py-3">이번 주 수신된 외부 문의가 없습니다</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {snapshot.inquiries.map(inq => {
                                                    const cat = INQUIRY_CATEGORIES[inq.type];
                                                    const status = INQUIRY_STATUS[inq.status];
                                                    return (
                                                        <div key={inq.id} className="flex items-center gap-3 p-3 bg-[#f5f0e6] rounded-xl border border-[#e8dcc8] flex-wrap">
                                                            {cat && (
                                                                <span className={`text-[11px] px-2 py-0.5 rounded font-bold border flex-shrink-0 ${cat.color}`}>
                                                                    {cat.label}
                                                                </span>
                                                            )}
                                                            {inq.receivedDate && (
                                                                <span className="text-[10px] text-[#a89880] flex-shrink-0">{inq.receivedDate}</span>
                                                            )}
                                                            <span className="font-bold text-sm text-[#42392e]">{inq.sender}</span>
                                                            {inq.subject && (
                                                                <span className="text-sm text-[#6a5d50] flex-1 min-w-0 truncate">— "{inq.subject}"</span>
                                                            )}
                                                            {status && (
                                                                <span className={`text-[11px] px-2 py-0.5 rounded font-bold border ml-auto flex-shrink-0 ${status.color}`}>
                                                                    {status.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ── ⑤ 특이사항 ── */}
                                <div className="vj-card bg-[#faf6ef] rounded-2xl border border-[#d4c4ac] overflow-hidden">
                                    <div className="px-5 py-3 bg-[#f0e9de] border-b border-[#d4c4ac] flex items-center gap-2">
                                        <AlertCircle size={15} className="text-[#a0714a]" />
                                        <span className="font-bold text-sm text-[#42392e]">특이사항</span>
                                        <span className="text-[10px] text-[#a89880] ml-auto">직접 입력</span>
                                    </div>
                                    <div className="p-5">
                                        <textarea
                                            value={specialNotes}
                                            onChange={e => { setSpecialNotes(e.target.value); setIsDirty(true); }}
                                            placeholder="이번 주 특이사항을 자유롭게 입력하세요..."
                                            className="w-full bg-transparent text-sm text-[#42392e] leading-relaxed resize-none focus:outline-none placeholder-[#c4b49a] min-h-[100px]"
                                            rows={4}
                                        />
                                    </div>
                                </div>

                                {/* 하단 여백 */}
                                <div className="h-4" />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default WeeklyReportTab;
