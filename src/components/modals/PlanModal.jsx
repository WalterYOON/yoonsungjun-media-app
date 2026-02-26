import React, { useState, useEffect } from 'react';
import { X, Layout, Trash, Minimize2, Maximize2, Save, Loader, Star, Archive, FileText, StickyNote, Briefcase, Plus, ArrowRight, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PROJECT_TYPES, TEAM_MEMBERS, DEFAULT_AUTHOR } from '../../config/constants';
import { formatDateLocal } from '../../utils/dateUtils';
import RichTextEditor from '../common/RichTextEditor';

const PlanModal = () => {
    const { modals, toggleModal, selectedItems, setSelectedItems, profile, tasks, operations, showToast, openConfirm } = useApp();
    const { plan: initialData } = selectedItems;
    const [tab, setTab] = useState('basic');
    const [formData, setFormData] = useState({ topic: '', type: 'main', uploadDate: '', description: '', planner: profile || '', status: 'draft', script: '', shootType: 'indoor', location: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isScriptMode, setIsScriptMode] = useState(false);
    const [pendingTasks, setPendingTasks] = useState([]);
    const [newTask, setNewTask] = useState({ author: '', category: [], start: formatDateLocal(new Date()), end: formatDateLocal(new Date()), detail: '' });

    useEffect(() => {
        if (modals.plan) {
            if (initialData) {
                setFormData({ ...initialData, status: initialData.status || 'draft', script: initialData.script || '', shootType: initialData.shootType || 'indoor', location: initialData.location || '' });
            } else {
                setFormData({ topic: '', type: 'main', uploadDate: '', description: '', planner: profile || DEFAULT_AUTHOR, status: 'draft', script: '', shootType: 'indoor', location: '' });
            }
            setTab('basic'); setPendingTasks([]); setNewTask({ author: profile || DEFAULT_AUTHOR, category: [], start: formatDateLocal(new Date()), end: formatDateLocal(new Date()), detail: '' });
        }
    }, [modals.plan, profile, initialData]);

    const handleAddPendingTask = () => {
        const currentAuthor = newTask.author?.trim(); const currentDetail = newTask.detail?.trim();
        if (!currentAuthor || !currentDetail) { showToast("담당자와 내용을 입력해주세요.", 'error'); return; }
        const taskToAdd = { ...newTask, author: currentAuthor, detail: currentDetail, id: Date.now() };
        setPendingTasks(prev => [...prev, taskToAdd]); setNewTask(prev => ({ ...prev, detail: '' }));
    };
    const handleRemovePendingTask = (id) => { setPendingTasks(pendingTasks.filter(t => t.id !== id)); };
    if (!modals.plan) return null;

    const handleSubmit = async (e, forceStatus) => {
        e.preventDefault();
        if (forceStatus && !initialData?.id) { showToast("오류: 저장되지 않은 기획안은 상태를 변경할 수 없습니다. 먼저 저장해주세요.", 'error'); return; }
        setIsSaving(true);
        const nextStatus = forceStatus || formData.status;
        const finalData = { ...formData, location: formData.shootType === 'indoor' ? '' : formData.location, status: nextStatus, id: initialData?.id };
        const res = await operations.savePlan(finalData);
        if (res.success) {
            const planId = res.id;
            if (pendingTasks.length > 0) {
                for (const t of pendingTasks) {
                    await operations.saveTask({
                        planId: planId, topic: formData.topic, details: t.detail,
                        status: nextStatus === 'active' ? 'in_progress' : 'todo',
                        workStartDate: t.start, workEndDate: t.end, author: t.author,
                        type: 'task', category: t.category, isDraftPlaceholder: false, skipPlanCheck: true
                    }, false, false, false);
                }
            }
            setIsSaving(false); toggleModal('plan', false);
            if ((forceStatus === 'active' || nextStatus === 'active') && (!initialData || initialData.status === 'draft')) { showToast("기획이 승인되었습니다. 제작이 시작됩니다!"); }
            else if (forceStatus === 'completed') { showToast("프로젝트가 완료 처리되었습니다."); }
            else { showToast("저장되었습니다."); }
        } else { setIsSaving(false); showToast("오류 발생", 'error'); }
    };

    const handleDelete = async () => { if (!initialData) return; openConfirm("이 기획안과 연결된 모든 일정을 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.", async () => { const result = await operations.deletePlan(initialData.id, initialData.topic); if (result) { showToast("기획안이 삭제되었습니다."); toggleModal('plan', false); } else { showToast("삭제 실패", 'error'); } }); };
    const relatedTasks = initialData ? tasks.filter(t => t.planId === initialData.id).sort((a, b) => new Date(a.workStartDate) - new Date(b.workStartDate)) : [];
    const statusBadge = formData.status === 'draft' ? <span className="text-[10px] bg-[#e8dcc8] text-[#5a4d40] px-2 py-1 rounded-full font-bold">기획(Draft)</span> : (formData.status === 'completed' ? <span className="text-[10px] bg-[#5d7a5d]/20 text-[#4d6a4d] px-2 py-1 rounded-full font-bold">완료(Done)</span> : <span className="text-[10px] bg-[#5d6a7a]/20 text-[#4d5a6a] px-2 py-1 rounded-full font-bold">진행중(Active)</span>);

    const FullScreenEditor = () => (
        <div className="fixed inset-0 z-[200] bg-[#faf6ef] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[#e8dcc8] flex justify-between items-center bg-[#faf6ef]"><h3 className="font-bold text-lg text-[#42392e] flex items-center gap-2"><FileText size={20} /> 기획안 전체화면</h3><button onClick={() => setIsScriptMode(false)} className="p-2 bg-[#faf6ef] border border-[#d4c4ac] rounded-lg text-[#6a5d50] hover:bg-[#f5f0e6] font-bold text-sm flex items-center gap-2"><Minimize2 size={16} /> 닫기</button></div><div className="flex-1 p-6 bg-[#faf6ef] overflow-hidden flex flex-col"><RichTextEditor className="flex-1 shadow-sm h-full" value={formData.script} onChange={(val) => setFormData(prev => ({ ...prev, script: val }))} placeholder="여기에 기획 내용, 대본, 큐시트를 작성하세요." /></div>
        </div>
    );

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#3a2d20]/30 backdrop-blur-sm p-4 ${isFullScreen ? 'p-0' : 'p-4'}`}>
            {isScriptMode && <FullScreenEditor />}
            <div className={`bg-[#faf6ef] w-full rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${isFullScreen ? 'h-full w-full max-w-none rounded-none' : 'max-w-3xl max-h-[90vh]'}`}>
                <div className="p-5 border-b border-[#e8dcc8] flex justify-between items-center bg-[#faf6ef] rounded-t-2xl"><div className="flex items-center gap-3"><div className="bg-[#4d5a6a] text-[#faf6ef] p-2 rounded-lg"><Layout size={20} /></div><div><h3 className="font-bold text-lg text-[#42392e]">{initialData ? '프로젝트 기획 수정' : '새 프로젝트 기획'}</h3><div className="flex items-center gap-2 mt-0.5">{statusBadge} <span className="text-xs text-[#857460]">작성자: {formData.planner}</span></div></div></div><div className="flex gap-2">{initialData && (<button onClick={handleDelete} className="p-2 text-[#9b4d4d] hover:bg-[#9b4d4d]/10 rounded-full"><Trash size={20} /></button>)}<button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 text-[#857460] hover:text-[#4d5a6a] hover:bg-[#5d6a7a]/10 rounded-full transition-colors">{isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button><button onClick={() => toggleModal('plan', false)} className="p-2 text-[#857460] hover:text-[#8b3d3d] hover:bg-[#9b4d4d]/10 rounded-full transition-colors"><X size={20} /></button></div></div>
                <div className="flex border-b border-[#e8dcc8] px-6 pt-4 gap-6 bg-[#faf6ef] sticky top-0 z-10"><button onClick={() => setTab('basic')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${tab === 'basic' ? 'border-[#4d5a6a] text-[#4d5a6a]' : 'border-transparent text-[#857460] hover:text-[#5a4d40]'}`}><StickyNote size={16} /> 기본 정보</button><button onClick={() => setTab('detail')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${tab === 'detail' ? 'border-[#4d5a6a] text-[#4d5a6a]' : 'border-transparent text-[#857460] hover:text-[#5a4d40]'}`}><FileText size={16} /> 상세 기획 / 대본</button><button onClick={() => setTab('schedule')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${tab === 'schedule' ? 'border-[#4d5a6a] text-[#4d5a6a]' : 'border-transparent text-[#857460] hover:text-[#5a4d40]'}`}><Briefcase size={16} /> 일정 관리 ({relatedTasks.length + pendingTasks.length})</button></div>
                <div className="flex-1 overflow-y-auto p-6 bg-[#faf6ef]">
                    {tab === 'basic' && (<div className="flex flex-col gap-6"><div className="bg-[#faf6ef] p-6 rounded-xl border border-[#d4c4ac] shadow-sm space-y-5"><div><label className="text-xs font-bold text-[#6a5d50] mb-2 block uppercase">프로젝트 구분</label><div className="flex gap-3">{Object.entries(PROJECT_TYPES).map(([key, config]) => { const Icon = config.icon; const isSelected = formData.type === key; return (<button key={key} type="button" onClick={() => setFormData({ ...formData, type: key })} className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${isSelected ? config.color + ' border-current ring-2 ring-offset-1 ring-current shadow-md' : 'border-[#e8dcc8] bg-[#faf6ef] text-[#857460] hover:bg-[#f5f0e6]'}`}><Icon size={18} /> {config.label}</button>) })}</div></div><div><label className="text-xs font-bold text-[#6a5d50] mb-2 block uppercase">프로젝트 주제 (제목)</label><input required value={formData.topic || ''} onChange={e => setFormData({ ...formData, topic: e.target.value })} placeholder="예: 25SS 시즌 룩북 영상 제작" className="w-full p-4 bg-[#faf6ef] border border-[#d4c4ac] rounded-xl focus:outline-none focus:border-[#5d6a7a] font-bold text-lg text-[#32291e]" /></div><div><label className="text-xs font-bold text-[#6a5d50] mb-2 block uppercase">촬영 유형</label><div className="flex gap-3 mb-3"><button type="button" onClick={() => setFormData({ ...formData, shootType: 'indoor' })} className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${formData.shootType === 'indoor' ? 'bg-[#4a3d30] text-[#faf6ef] border-slate-800 shadow-md' : 'bg-[#faf6ef] border-[#d4c4ac] text-[#6a5d50] hover:bg-[#faf6ef]'}`}><Briefcase size={16} /> 내부 스튜디오</button><button type="button" onClick={() => setFormData({ ...formData, shootType: 'outdoor' })} className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${formData.shootType === 'outdoor' ? 'bg-[#5d7a5d] text-[#faf6ef] border-[#5d7a5d] shadow-md' : 'bg-[#faf6ef] border-[#d4c4ac] text-[#6a5d50] hover:bg-[#faf6ef]'}`}><MapPin size={16} /> 외부 로케이션</button></div>{formData.shootType === 'outdoor' && (<div><textarea value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="촬영 장소 및 세부 정보를 입력하세요." className="w-full p-4 bg-[#5d7a5d]/10 border border-[#5d7a5d]/40 rounded-xl focus:outline-none focus:border-[#5d7a5d] font-medium text-sm text-[#5d7a5d] placeholder-[#5d7a5d]/60 h-32 resize-none leading-relaxed" /></div>)}</div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold text-[#6a5d50] mb-2 block uppercase">업로드 예정일</label><input required type="date" value={formData.uploadDate || ''} onChange={e => setFormData({ ...formData, uploadDate: e.target.value })} className="w-full p-3 bg-[#faf6ef] border border-[#d4c4ac] rounded-xl focus:outline-none focus:border-[#5d6a7a] font-mono text-sm text-[#32291e]" /></div><div><label className="text-xs font-bold text-[#6a5d50] mb-2 block uppercase">기획 담당자</label><input type="text" value={formData.planner || ''} onChange={e => setFormData({ ...formData, planner: e.target.value })} className="w-full p-3 bg-[#faf6ef] border border-[#d4c4ac] rounded-xl focus:outline-none focus:border-[#5d6a7a] font-bold text-[#32291e]" /></div></div><div><label className="text-xs font-bold text-[#6a5d50] mb-2 block uppercase">기획 의도 (간략)</label><textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="기획 의도를 간략히 입력하세요." className="w-full p-4 bg-[#faf6ef] border border-[#d4c4ac] rounded-xl focus:outline-none focus:border-[#5d6a7a] h-24 resize-none leading-relaxed text-sm text-[#32291e]" /></div></div></div>)}
                    {tab === 'detail' && (<div className="flex flex-col gap-6 h-full"><div className="bg-[#faf6ef] p-6 rounded-xl border border-[#d4c4ac] shadow-sm flex flex-col flex-1 min-h-[400px]"><label className="text-xs font-bold text-[#6a5d50] mb-2 block uppercase flex justify-between items-center"><span>🎥 상세 기획 내용 (대본/큐시트)</span><button onClick={() => setIsScriptMode(true)} className="flex items-center gap-1 text-[10px] bg-[#5d6a7a]/10 text-[#4d5a6a] px-2 py-1 rounded-full font-bold hover:bg-[#5d6a7a]/20 transition-colors"><Maximize2 size={10} /> 크게 보기</button></label><RichTextEditor className="flex-1 min-h-[300px]" value={formData.script} onChange={(val) => setFormData(prev => ({ ...prev, script: val }))} placeholder="여기에 기획 내용, 대본, 큐시트를 작성하세요." /></div></div>)}
                    {tab === 'schedule' && (<div className="bg-[#faf6ef] p-6 rounded-xl border border-[#d4c4ac] shadow-sm"><div className="mb-6 p-4 bg-[#5d6a7a]/10/50 rounded-xl border border-[#5d6a7a]/30"><label className="text-xs font-bold text-[#4d5a6a] uppercase flex items-center gap-1 mb-3"><Plus size={12} /> 세부 일정 추가</label><div className="space-y-3"><div className="grid grid-cols-2 gap-2"><input placeholder="담당자" value={newTask.author} onChange={e => setNewTask({ ...newTask, author: e.target.value })} className="p-2 border border-[#d4c4ac] rounded-lg text-sm text-[#32291e]" /><input placeholder="업무 내용" value={newTask.detail} onChange={e => setNewTask({ ...newTask, detail: e.target.value })} className="p-2 border border-[#d4c4ac] rounded-lg text-sm text-[#32291e]" /></div><div className="grid grid-cols-2 gap-2"><input type="date" value={newTask.start} onChange={e => setNewTask({ ...newTask, start: e.target.value })} className="p-2 border border-[#d4c4ac] rounded-lg text-sm text-[#32291e]" /><input type="date" value={newTask.end} onChange={e => setNewTask({ ...newTask, end: e.target.value })} className="p-2 border border-[#d4c4ac] rounded-lg text-sm text-[#32291e]" /></div><button type="button" onClick={handleAddPendingTask} className="w-full py-2 bg-[#4d5a6a] text-[#faf6ef] font-bold rounded-lg text-sm hover:bg-[#3d4a5a]">리스트에 추가</button></div></div><div className="flex justify-between items-center mb-4"><label className="text-xs font-bold text-[#6a5d50] uppercase flex items-center gap-1">업무 일정 목록 ({relatedTasks.length + pendingTasks.length})</label></div><div className="space-y-2 max-h-[300px] overflow-y-auto">{pendingTasks.map(task => (<div key={task.id} className="flex items-center justify-between p-3 bg-[#5d6a7a]/10 rounded-xl border border-[#5d6a7a]/40"><div className="flex flex-col"><span className="text-xs font-bold text-blue-800">{task.detail} <span className="text-[#5d6a7a] font-normal">({task.author})</span></span><span className="text-[10px] text-[#5d6a7a]">{task.start} ~ {task.end}</span></div><button type="button" onClick={() => handleRemovePendingTask(task.id)} className="text-[#857460] hover:text-[#9b4d4d]"><X size={16} /></button></div>))}{relatedTasks.length > 0 ? relatedTasks.map(task => (<div key={task.id} onClick={() => { setSelectedItems(prev => ({ ...prev, task })); toggleModal('schedule', true); }} className="flex items-center justify-between p-3 bg-[#faf6ef] rounded-xl border border-[#e8dcc8] hover:border-[#5d6a7a]/50 cursor-pointer group transition-all"><div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-[#5d7a5d]' : task.status === 'in_progress' ? 'bg-[#5d6a7a]' : 'bg-[#d4c4ac]'}`}></div><div className="flex flex-col"><span className="text-xs font-bold text-[#4a3d30]">{task.details}</span><span className="text-[10px] text-[#857460]">{task.workStartDate} ~ {task.workEndDate} • {task.author}</span></div></div><ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" /></div>)) : (pendingTasks.length === 0 && <div className="text-center py-10 text-xs text-[#857460] bg-[#faf6ef] rounded-xl border border-dashed border-[#d4c4ac]">등록된 업무 일정이 없습니다.</div>)}</div></div>)}
                </div>
                <div className="p-5 border-t border-[#e8dcc8] flex justify-between items-center bg-[#faf6ef] rounded-b-2xl"><div className="text-xs text-[#857460] font-medium">{formData.status === 'draft' ? '📢 현재 기획 단계입니다.' : (formData.status === 'completed' ? '🎉 완료된 프로젝트입니다.' : '✅ 제작이 승인된 프로젝트입니다.')}</div><div className="flex gap-3">{formData.status === 'draft' && initialData && (<button onClick={(e) => handleSubmit(e, 'active')} className="px-5 py-2.5 bg-[#5a4d6a] text-[#faf6ef] font-bold rounded-xl shadow-lg hover:bg-[#4a3d5a] hover:scale-105 transition-all flex items-center gap-2"><Star size={16} /> 기획 승인 / 제작 착수</button>)}{formData.status === 'active' && initialData && (<button onClick={(e) => handleSubmit(e, 'completed')} className="px-5 py-2.5 bg-emerald-600 text-[#faf6ef] font-bold rounded-xl shadow-lg hover:bg-emerald-700 hover:scale-105 transition-all flex items-center gap-2"><Archive size={16} /> 프로젝트 완료 처리</button>)}<button onClick={() => toggleModal('plan', false)} className="px-5 py-2.5 text-[#6a5d50] font-bold hover:bg-[#f5f0e6] rounded-xl transition-colors">닫기</button><button onClick={handleSubmit} disabled={isSaving} className="px-6 py-2.5 bg-[#3a2d20] text-[#faf6ef] font-bold rounded-xl shadow-md hover:bg-[#5a4d40] transition-colors flex items-center gap-2 disabled:opacity-50">{isSaving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />} {initialData ? '저장' : '기획안 생성'}</button></div></div>
            </div>
        </div>
    );
};

export default PlanModal;
