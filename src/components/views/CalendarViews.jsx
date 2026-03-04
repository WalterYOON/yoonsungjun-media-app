import React, { useState, useMemo, useCallback } from 'react';
import { CheckCircle, ClipboardList, Plus, User, Calendar as CalendarIcon, FileText, Activity, StickyNote } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HOLIDAYS, WORK_CATEGORIES, PERSONAL_CATEGORIES, PLAN_COLUMNS, MEMBER_COLORS, MEMBER_COLORS_DEFAULT, PROJECT_BORDER_COLORS } from '../../config/constants';
import { formatDateLocal, getWeekDays, getDaysDifference, parseLocalDate } from '../../utils/dateUtils';

// planId → 프로젝트 고유 테두리 색상 결정 (해시 기반, 항상 동일)
const getProjectBorderColor = (planId) => {
    if (!planId) return '#a89880';
    const hash = planId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return PROJECT_BORDER_COLORS[hash % PROJECT_BORDER_COLORS.length];
};

// 담당자 기반 색상 결정 함수 (방식 1: 배경=담당자, 테두리=프로젝트)
export const getTaskColorByMember = (task, linkedPlan) => {
    const isDraft = linkedPlan?.status === 'draft';
    const isCompleted = linkedPlan?.status === 'completed';
    if (task.type === 'personal') return { type: 'personal', isDraft: false, isCompleted: false };
    return { type: 'task', isDraft, isCompleted };
};

// TaskBar (방식 1: 배경=담당자색, 왼쪽 테두리=프로젝트색)
export const TaskBar = React.memo(({ task, plans, isPersonal, onClick }) => {
    const linkedPlan = useMemo(() => isPersonal ? null : plans.find(p => p.id === task.planId), [isPersonal, plans, task.planId]);
    const isDraft = !isPersonal && linkedPlan?.status === 'draft';
    const isCompleted = !isPersonal && linkedPlan?.status === 'completed';
    const memberColor = isPersonal ? null : (MEMBER_COLORS[task.author] || MEMBER_COLORS_DEFAULT);
    const projectBorderColor = isPersonal ? '#a0714a' : getProjectBorderColor(task.planId);
    let IconComp = null;
    if (isPersonal) { const cat = task.category?.[0]; IconComp = PERSONAL_CATEGORIES[cat]?.icon; }
    else { const primaryCategory = task.category?.[0]; IconComp = WORK_CATEGORIES[primaryCategory]?.icon || FileText; }
    const totalWorkDays = getDaysDifference(task.workStartDate, task.workEndDate) + 1;
    const getProgress = () => { if (task.status === 'done') return 100; if (!task.completedDates || task.completedDates.length === 0) return 0; if (totalWorkDays <= 0) return 0; return Math.round((task.completedDates.length / totalWorkDays) * 100); };
    const progress = getProgress();
    // 인라인 스타일로 색상 적용 (Tailwind 동적 클래스 제한 우회)
    const getDraftBg = (rgbaStr) => rgbaStr.replace(/[\d.]+\)$/, '0.35)');
    const blockStyle = isPersonal
        ? { backgroundColor: 'rgba(160, 113, 74, 0.35)', color: '#c4a06a', borderLeft: `4px solid ${projectBorderColor}` }
        : isCompleted
            ? { backgroundColor: 'rgba(68,64,60,0.7)', color: '#a89880', borderLeft: `4px solid ${projectBorderColor}`, opacity: 0.65 }
            : isDraft
                ? { backgroundColor: getDraftBg(memberColor.bg), color: memberColor.text, borderLeft: `4px solid ${projectBorderColor}`, outline: '1px dashed rgba(255,255,255,0.35)' }
                : { backgroundColor: memberColor.bg, color: memberColor.text, borderLeft: `4px solid ${projectBorderColor}` };
    const displayText = isPersonal
        ? (task.details || task.category?.[0] || '개인')
        : (linkedPlan?.topic || task.details || task.topic || '업무');
    return (
        <div
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('taskId', task.id); e.dataTransfer.setData('source', 'calendar'); e.dataTransfer.effectAllowed = 'move'; }}
            onClick={(e) => { e.stopPropagation(); onClick(task); }}
            className={`relative group p-1.5 rounded text-xs font-bold shadow-sm cursor-grab active:cursor-grabbing hover:brightness-110 transition-all flex items-center gap-1 overflow-hidden ${isCompleted ? 'line-through decoration-[#78716c]' : ''}`}
            style={blockStyle}
            title={`${task.author} · ${linkedPlan?.topic || task.details}`}
        >
            {IconComp && <IconComp size={8} className="opacity-80 flex-shrink-0" />}
            <span className="truncate flex-1">{displayText}</span>
            {!isPersonal && <span className="text-[9px] opacity-70 flex-shrink-0">{task.category?.[0]}</span>}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
                <div className="h-full bg-white/60 transition-all" style={{ width: `${progress}%` }} />
            </div>
            {task.status === 'done' && (<CheckCircle size={10} className="absolute -top-1 -right-1 text-white bg-green-600 rounded-full fill-green-400 shadow-sm z-10" />)}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-[#faf6ef] text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {task.author} · {linkedPlan?.topic || task.details} · {progress}% ({task.completedDates?.length || 0}/{totalWorkDays}일)
            </div>
        </div>
    );
}, (prev, next) => {
    return prev.task.id === next.task.id && prev.task.status === next.task.status && prev.task.author === next.task.author && prev.task.planId === next.task.planId && prev.task.category?.[0] === next.task.category?.[0] && prev.task.workStartDate === next.task.workStartDate && prev.task.workEndDate === next.task.workEndDate && prev.task.completedDates?.length === next.task.completedDates?.length && prev.plans.length === next.plans.length;
});

// PlanCard
export const PlanCard = React.memo(({ plan, tasks, operations, onClick, onTaskStatusChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const summary = useMemo(() => {
        const realTasks = tasks.filter(t => !t.isDraftPlaceholder && t.type !== 'personal');
        let totalDays = 0; let completedDaysCount = 0;
        realTasks.forEach(t => { const start = parseLocalDate(t.workStartDate); const end = parseLocalDate(t.workEndDate); const duration = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1; if (duration > 0) totalDays += duration; if (t.completedDates && Array.isArray(t.completedDates)) { completedDaysCount += t.completedDates.length; } });
        const progress = totalDays === 0 ? 0 : Math.min(100, Math.round((completedDaysCount / totalDays) * 100));
        const pendingTasks = realTasks.filter(t => t.status !== 'done'); let nextDue = null;
        if (pendingTasks.length > 0) { const sorted = [...pendingTasks].sort((a, b) => new Date(a.workEndDate) - new Date(b.workEndDate)); nextDue = sorted[0].workEndDate; }
        return { total: realTasks.length, progress, nextDue, realTasks };
    }, [tasks]);
    const handleTaskCheck = (e, task) => { e.stopPropagation(); const newStatus = task.status === 'done' ? 'in_progress' : 'done'; onTaskStatusChange(task, newStatus); };
    const isShorts = plan.type === 'shorts';
    return (
        <div className={`bg-[#faf6ef] rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${isExpanded ? 'ring-2 ring-[#5d6a7a]/30 border-[#5d6a7a]/50' : 'border-[#d4c4ac]'}`}>
            <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}><div className="flex justify-between items-start mb-2"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isShorts ? 'bg-[#9b4d4d]/10 text-[#8b3d3d]' : 'bg-[#6a5d7a]/10 text-[#5a4d6a]'}`}>{isShorts ? 'Shorts' : 'Main'}</span>{plan.status === 'active' && (<div className="flex items-center gap-1"><span className="text-xs font-bold text-[#4d5a6a]">{summary.progress}%</span><div className="w-10 h-1.5 bg-[#f5f0e6] rounded-full overflow-hidden"><div className="h-full bg-[#5d6a7a] transition-all duration-500" style={{ width: `${summary.progress}%` }} /></div></div>)}</div><h4 className="font-bold text-[#42392e] text-sm mb-1 line-clamp-2 leading-snug">{plan.topic}</h4><div className="flex items-center justify-between mt-2"><span className="text-xs text-[#6a5d50] flex items-center gap-1"><User size={12} /> {plan.planner}</span>{summary.nextDue && (<span className="text-[10px] font-mono text-[#9b4d4d] bg-[#9b4d4d]/10 px-1.5 py-0.5 rounded flex items-center gap-1"><CalendarIcon size={10} /> ~{summary.nextDue.slice(5)}</span>)}</div></div>
            {isExpanded && (<div className="px-4 pb-4 pt-0 border-t border-[#f5f0e6] bg-[#faf6ef]/50 rounded-b-xl animate-in slide-in-from-top-2 duration-200"><div className="mt-3 space-y-2">{summary.realTasks.length > 0 ? (summary.realTasks.map(task => { const completedCount = task.completedDates ? task.completedDates.length : 0; const start = parseLocalDate(task.workStartDate); const end = parseLocalDate(task.workEndDate); const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1; const percent = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0; return (<div key={task.id} className="flex flex-col gap-1 p-2 bg-[#faf6ef] rounded-lg border border-[#e8dcc8] hover:border-[#5d6a7a]/40 transition-colors"><div className="flex items-center gap-2"><button onClick={(e) => handleTaskCheck(e, task)} className={`p-1 rounded-full transition-colors ${task.status === 'done' ? 'text-[#5d7a5d] bg-[#5d7a5d]/10' : 'text-slate-300 hover:text-[#5d6a7a]'}`}><CheckCircle size={16} className={task.status === 'done' ? 'fill-emerald-500 text-[#faf6ef]' : ''} /></button><div className="flex-1 min-w-0" onClick={() => onClick(task)}><div className={`text-xs font-medium truncate cursor-pointer ${task.status === 'done' ? 'text-[#857460] line-through' : 'text-[#4a3d30]'}`}>{task.details || '상세 내용 없음'}</div><div className="text-[10px] text-[#857460] flex gap-2"><span>{task.author}</span><span>{task.category?.join(', ')}</span></div></div></div><div className="w-full bg-[#f5f0e6] h-1 rounded-full overflow-hidden mt-1"><div className="bg-[#5d6a7a] h-full" style={{ width: `${percent}%` }}></div></div></div>) })) : (<div className="text-center py-4 text-xs text-[#857460]">{plan.status === 'draft' ? '기획 승인 후 일정이 생성됩니다.' : '등록된 상세 업무가 없습니다.'}</div>)}<div className="flex justify-end gap-2 mt-3 pt-2 border-t border-[#e8dcc8]"><button onClick={(e) => { e.stopPropagation(); onClick(null, plan); }} className="text-xs font-bold text-[#6a5d50] hover:text-[#4d5a6a] px-2 py-1">기획안 보기</button>{plan.status === 'active' && (<button onClick={(e) => { e.stopPropagation(); onClick({ planId: plan.id, status: 'in_progress', type: 'task' }); }} className="text-xs font-bold bg-[#5d6a7a]/20 text-[#4d5a6a] px-3 py-1 rounded-lg hover:bg-blue-200">+ 업무 추가</button>)}</div></div></div>)}
        </div>
    );
}, (prev, next) => { return prev.plan.id === next.plan.id && prev.plan.status === next.plan.status && prev.tasks.length === next.tasks.length && prev.tasks.every((t, i) => t.id === next.tasks[i]?.id && t.status === next.tasks[i]?.status && t.completedDates?.length === next.tasks[i]?.completedDates?.length); });

// MonthView
export const MonthView = () => {
    const { currentDate, tasksByDate, filteredTasks, plans, toggleModal, setSelectedItems, setSelectedDate, operations } = useApp();
    const getCalendarDays = (date) => { const year = date.getFullYear(); const month = date.getMonth(); const startDate = new Date(year, month, 1); startDate.setDate(1 - startDate.getDay()); const days = []; for (let i = 0; i < 42; i++) { const d = new Date(startDate); d.setDate(startDate.getDate() + i); days.push({ date: d, isCurrentMonth: d.getMonth() === month }); } return days; };
    const calendarDays = useMemo(() => getCalendarDays(currentDate), [currentDate]);
    const handleDrop = async (e, dateStr) => { e.preventDefault(); const taskId = e.dataTransfer.getData('taskId'); if (taskId) { const task = filteredTasks.find(t => t.id === taskId); if (task) await operations.moveTask(task, dateStr); } };
    return (
        <div className="grid grid-cols-7 gap-px bg-[#d4c4ac] border border-[#d4c4ac] rounded-lg overflow-hidden">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (<div key={day} className={`bg-[#f0e9de] py-3 text-center text-xs font-bold ${i === 0 ? 'text-[#9b4d4d]' : 'text-[#a89880]'}`}>{day}</div>))}
            {calendarDays.map((dayObj, idx) => {
                const dateStr = formatDateLocal(dayObj.date); const isToday = formatDateLocal(new Date()) === dateStr; const holidayName = HOLIDAYS[dateStr]; const dayTasks = tasksByDate[dateStr] || []; return (
                    <div key={idx} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, dateStr)} onClick={() => { setSelectedDate(dateStr); setSelectedItems(prev => ({ ...prev, task: null })); toggleModal('schedule', true); }} className={`bg-[#faf6ef] h-[120px] p-2 hover:bg-[#f5f0e6] transition-colors cursor-pointer relative group flex flex-col ${!dayObj.isCurrentMonth ? 'opacity-30 bg-[#f0e9de]' : ''}`}>
                        <div className="flex justify-between items-start mb-1 flex-shrink-0"><div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[#a0714a] text-[#faf6ef]' : (holidayName || dayObj.date.getDay() === 0 ? 'text-[#9b4d4d]' : 'text-[#42392e]')}`}>{dayObj.date.getDate()}</div>{holidayName && <span className="text-[9px] font-bold text-[#9b4d4d] bg-[#9b4d4d]/10 px-1.5 py-0.5 rounded truncate max-w-[70px]">{holidayName}</span>}</div>
                        <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar min-h-0">{dayTasks.slice(0, 3).map(t => (<TaskBar key={t.id} task={t} plans={plans} isPersonal={t.type === 'personal'} onClick={(task) => { setSelectedItems(prev => ({ ...prev, task })); toggleModal('schedule', true); }} />))}{dayTasks.length > 3 && (<div onClick={(e) => { e.stopPropagation(); setSelectedDate(dateStr); setSelectedItems(prev => ({ ...prev, task: null })); toggleModal('schedule', true); }} className="text-[9px] text-[#a0714a] font-bold text-center py-0.5 bg-[#a0714a]/10 hover:bg-[#a0714a]/20 rounded cursor-pointer transition-colors">+{dayTasks.length - 3}개 더보기</div>)}</div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={14} className="text-[#a0714a]" /></div>
                    </div>
                );
            })}
        </div>
    );
};

// WeekView
export const WeekView = () => {
    const { currentDate, tasksByDate, filteredTasks, plans, toggleModal, setSelectedItems, setSelectedDate, operations } = useApp();
    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
    const handleDrop = async (e, dateStr) => { e.preventDefault(); const taskId = e.dataTransfer.getData('taskId'); if (taskId) { const task = filteredTasks.find(t => t.id === taskId); if (task) await operations.moveTask(task, dateStr); } };
    return (<div className="flex h-full border border-[#d4c4ac] rounded-lg overflow-hidden vj-card bg-[#faf6ef]">{weekDays.map((day, i) => { const dateStr = formatDateLocal(day); const isToday = formatDateLocal(new Date()) === dateStr; const holidayName = HOLIDAYS[dateStr]; const dayTasks = tasksByDate[dateStr] || []; return (<div key={dateStr} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, dateStr)} onClick={() => { setSelectedDate(dateStr); setSelectedItems(prev => ({ ...prev, task: null })); toggleModal('schedule', true); }} className="flex-1 border-r border-[#d4c4ac] last:border-0 flex flex-col min-w-[100px] group hover:bg-[#f5f0e6] transition-colors"><div className={`p-3 text-center border-b border-[#d4c4ac] ${isToday ? 'bg-[#f5f0e6]' : 'bg-[#f0e9de]'}`}><div className={`text-xs font-bold mb-1 ${i === 0 ? 'text-[#9b4d4d]' : 'text-[#a89880]'}`}>{['일', '월', '화', '수', '목', '금', '토'][day.getDay()]}</div><div className={`text-lg font-black ${isToday ? 'text-[#a0714a]' : (i === 0 ? 'text-[#9b4d4d]' : 'text-[#42392e]')}`}>{day.getDate()}</div>{holidayName && <div className="text-[10px] text-[#9b4d4d] mt-1 truncate">{holidayName}</div>}</div><div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar relative">{dayTasks.map(t => (<TaskBar key={t.id} task={t} plans={plans} isPersonal={t.type === 'personal'} onClick={(task) => { setSelectedItems(prev => ({ ...prev, task })); toggleModal('schedule', true); }} />))}<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-10 pointer-events-none"><Plus className="text-[#44403c]" size={24} /></div></div></div>); })}</div>);
};

// KanbanView
export const KanbanView = () => {
    const { plans, filteredTasks, toggleModal, setSelectedItems, operations, showToast } = useApp();
    const aggregatedPlans = useMemo(() => { const grouped = {}; plans.forEach(plan => { grouped[plan.id] = { plan: plan, tasks: [] }; }); filteredTasks.forEach(task => { if (task.planId && grouped[task.planId]) { grouped[task.planId].tasks.push(task); } }); return Object.values(grouped); }, [plans, filteredTasks]);
    const handleTaskStatusChange = useCallback(async (task, newStatus) => { const result = await operations.saveTask({ ...task, status: newStatus }, true, false, false); if (result.success) { showToast('업무 상태가 변경되었습니다.'); } }, [operations, showToast]);
    const handleItemClick = useCallback((task, plan = null) => { if (task) { setSelectedItems(prev => ({ ...prev, task })); toggleModal('schedule', true); } else if (plan) { setSelectedItems(prev => ({ ...prev, plan })); toggleModal('plan', true); } }, [setSelectedItems, toggleModal]);
    return (<div className="flex gap-4 h-full overflow-x-auto pb-4 px-2">{Object.entries(PLAN_COLUMNS).map(([statusKey, config]) => { const columnItems = aggregatedPlans.filter(item => item.plan.status === statusKey); return (<div key={statusKey} className="flex-1 min-w-[320px] max-w-[400px] flex flex-col h-full bg-[#f0e9de] rounded-2xl border border-[#d4c4ac]"><div className={`p-4 rounded-t-2xl border-b border-[#d4c4ac] flex justify-between items-center vj-card bg-[#faf6ef]`}><h3 className={`font-black text-sm flex items-center gap-2 text-[#42392e]`}>{statusKey === 'draft' ? <StickyNote size={18} className="text-[#857460]" /> : (statusKey === 'active' ? <Activity size={18} className="text-[#a0714a]" /> : <CheckCircle size={18} className="text-[#5d7a5d]" />)}{config.label}</h3><span className="bg-[#44403c] text-[#857460] px-2.5 py-0.5 rounded-full text-xs font-bold">{columnItems.length}</span></div><div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">{columnItems.length > 0 ? (columnItems.map(({ plan, tasks }) => (<PlanCard key={plan.id} plan={plan} tasks={tasks} operations={operations} onClick={handleItemClick} onTaskStatusChange={handleTaskStatusChange} />))) : (<div className="h-32 flex flex-col items-center justify-center text-[#44403c] border-2 border-dashed border-[#d4c4ac] rounded-xl vj-card bg-[#faf6ef]/30"><ClipboardList size={24} className="mb-2 opacity-50" /><span className="text-xs font-bold">프로젝트 없음</span></div>)}</div></div>); })}</div>);
};
