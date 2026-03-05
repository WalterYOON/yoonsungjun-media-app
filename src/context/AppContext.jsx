import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db, appId, auth, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, writeBatch, query, where, getDocs, orderBy, limit, signInWithEmailAndPassword, signOut, onAuthStateChanged } from '../config/firebase';
import { TEAM_ACCOUNTS } from '../config/constants';
import { SAMPLE_PLANS, SAMPLE_TASKS, SAMPLE_FINANCES, SAMPLE_INQUIRIES } from '../data/sampleData';
import { formatDateLocal, getDaysDifference, changeDate, parseLocalDate, isHolidayOrWeekend, getDatesInRange, getWeekDays } from '../utils/dateUtils';
import { validateTask, validatePlan, validateManagement, validateBackupFile } from '../utils/validation';
import { handleFirebaseError, retryWithBackoff, generateGroupId } from '../utils/firebaseUtils';

const AppContext = createContext();
export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: 'basic', message: '', onConfirm: null, onOption: null });
    const [selectedAuthors, setSelectedAuthors] = useState([]);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [modals, setModals] = useState({ schedule: false, plan: false, report: false, finance: false, external: false, detail: false, search: false, memberDetail: false, thumbnail: false, inquiry: false });
    const [selectedItems, setSelectedItems] = useState({ management: null, task: null, plan: null, member: null, edit: null });
    const [modalType, setModalType] = useState('');
    const [plans, setPlans] = useState(SAMPLE_PLANS);
    const [tasks, setTasks] = useState(SAMPLE_TASKS);
    const [logs, setLogs] = useState([]);
    const [managements, setManagements] = useState([...SAMPLE_FINANCES, ...SAMPLE_INQUIRIES]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    const showToast = useCallback((msg, type = 'success') => setToast({ message: msg, type }), []);
    const hideToast = useCallback(() => setToast(null), []);
    const closeConfirm = useCallback(() => setConfirmDialog(prev => ({ ...prev, isOpen: false })), []);
    const openConfirm = useCallback((message, action, optionAction = null, type = 'basic') => { setConfirmDialog({ isOpen: true, type, message, onConfirm: async () => { await action(); closeConfirm(); }, onOption: optionAction ? async () => { await optionAction(); closeConfirm(); } : null }); }, [closeConfirm]);
    const toggleModal = useCallback((name, isOpen) => setModals(prev => ({ ...prev, [name]: isOpen })), []);
    const toggleAuthor = useCallback((author) => { setSelectedAuthors(prev => { if (prev.includes(author)) return prev.filter(a => a !== author); return [...prev, author]; }); }, []);
    const next = useCallback(() => { setCurrentDate(prev => { const d = new Date(prev); if (viewMode === 'week') d.setDate(d.getDate() + 7); else d.setMonth(d.getMonth() + 1); return d; }); }, [viewMode]);
    const prev = useCallback(() => { setCurrentDate(prev => { const d = new Date(prev); if (viewMode === 'week') d.setDate(d.getDate() - 7); else d.setMonth(d.getMonth() - 1); return d; }); }, [viewMode]);
    const today = useCallback(() => setCurrentDate(new Date()), []);

    useEffect(() => {
        // 세션 가드: 브라우저 탭/창을 닫고 새로 열면 자동 로그아웃
        const SESSION_KEY = 'fp_session_active';
        // ※ initialCheckDone: 첫 번째 콜백(캐시 복원 여부 확인)에만 세션 검사 적용
        //    이후 콜백(신규 로그인)에는 적용하지 않음
        let initialCheckDone = false;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!initialCheckDone) {
                initialCheckDone = true;
                if (firebaseUser && !sessionStorage.getItem(SESSION_KEY)) {
                    // 새 브라우저 세션인데 Firebase가 캐시된 사용자를 복원한 경우 → 강제 로그아웃
                    await signOut(auth);
                    return;
                }
            }
            setUser(firebaseUser);
            if (firebaseUser) {
                sessionStorage.setItem(SESSION_KEY, '1');
                // 이메일로 팀원 이름 자동 매핑
                const account = TEAM_ACCOUNTS.find(a => a.email === firebaseUser.email);
                setProfile(account ? account.name : (firebaseUser.email || '사용자'));
            } else {
                sessionStorage.removeItem(SESSION_KEY);
                setProfile(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;

        const baseRef = doc(db, 'artifacts', appId, 'public', 'data');
        const plansQuery = collection(baseRef, 'weekly_plans_live');
        const tasksQuery = collection(baseRef, 'weekly_schedule_live');
        const logsQuery = query(collection(baseRef, 'weekly_logs'), orderBy('createdAt', 'desc'), limit(50));
        const mgmtQuery = collection(baseRef, 'weekly_management');

        const unsubPlans = onSnapshot(plansQuery, (snap) => {
            const firebaseData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const localModifiedPlans = JSON.parse(localStorage.getItem('modified_sample_plans') || '{}');
            const deletedSamplePlans = JSON.parse(localStorage.getItem('deleted_sample_plans') || '[]');
            const baseSamplePlans = SAMPLE_PLANS
                .filter(sp => !deletedSamplePlans.includes(sp.id))
                .map(sp => localModifiedPlans[sp.id] ? { ...sp, ...localModifiedPlans[sp.id] } : sp);
            const mergedPlans = [...baseSamplePlans.filter(sp => !firebaseData.some(fp => fp.id === sp.id)), ...firebaseData];
            setPlans(mergedPlans.sort((a, b) => new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0)));
        });
        const unsubTasks = onSnapshot(tasksQuery, (snap) => {
            const firebaseData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const localModifiedTasks = JSON.parse(localStorage.getItem('modified_sample_tasks') || '{}');
            const deletedSampleTasks = JSON.parse(localStorage.getItem('deleted_sample_tasks') || '[]');
            const baseSampleTasks = SAMPLE_TASKS
                .filter(st => !deletedSampleTasks.includes(st.id))
                .map(st => localModifiedTasks[st.id] ? { ...st, ...localModifiedTasks[st.id] } : st);
            const mergedTasks = [...baseSampleTasks.filter(st => !firebaseData.some(ft => ft.id === st.id)), ...firebaseData];
            setTasks(mergedTasks);
            setLoading(false);
        });
        const unsubLogs = onSnapshot(logsQuery, (snap) => { setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
        const unsubMgmt = onSnapshot(mgmtQuery, (snap) => {
            const firebaseData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const localModifiedMgmt = JSON.parse(localStorage.getItem('modified_sample_mgmt') || '{}');
            const deletedSampleMgmt = JSON.parse(localStorage.getItem('deleted_sample_mgmt') || '[]');
            const sampleMgmt = [...SAMPLE_FINANCES, ...SAMPLE_INQUIRIES]
                .filter(sm => !deletedSampleMgmt.includes(sm.id))
                .map(sm => localModifiedMgmt[sm.id] ? { ...sm, ...localModifiedMgmt[sm.id] } : sm);
            const mergedMgmt = [...sampleMgmt.filter(sm => !firebaseData.some(fm => fm.id === sm.id)), ...firebaseData];
            setManagements(mergedMgmt.sort((a, b) => new Date(b.datetime || b.receivedDate || 0) - new Date(a.datetime || a.receivedDate || 0)));
        });

        return () => { unsubPlans(); unsubTasks(); unsubLogs(); unsubMgmt(); };
    }, [user]);

    const handleSetProfile = useCallback((name) => { setProfile(name); }, []);
    const logout = useCallback(async () => { await signOut(auth); }, []);
    const logActivity = useCallback(async (type, message) => { if (!profile) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'weekly_logs'), { type, message, user: profile, createdAt: new Date().toISOString() }); }, [profile]);

    const exportAllData = useCallback(async () => {
        try {
            const backup = { version: '1.0.0', exportDate: new Date().toISOString(), appId, exportedBy: profile, data: { plans, tasks, managements }, stats: { totalPlans: plans.length, totalTasks: tasks.length, totalManagements: managements.length } };
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `weekly-report-backup-${formatDateLocal(new Date())}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            showToast(`백업 완료! (프로젝트 ${backup.stats.totalPlans}개, 일정 ${backup.stats.totalTasks}개)`, 'success');
            logActivity('backup', '데이터 백업 수행');
        } catch (error) { showToast('백업 실패: ' + error.message, 'error'); }
    }, [plans, tasks, managements, profile, showToast, logActivity]);

    const operations = useMemo(() => {
        const saveTask = async (taskData, isEdit, includeWeekends = false, syncGroup = true) => {
            if (!user) return { success: false, message: "로그인이 필요합니다." };
            const validation = validateTask(taskData, plans);
            if (!validation.valid) return { success: false, message: validation.message };

            try {
                const plan = plans.find(p => p.id === taskData.planId);
                const topic = plan?.topic || taskData.topic || (taskData.type === 'personal' ? '개인 일정' : '일정');
                const safeAuthor = taskData.author || profile || 'Unknown';
                const payload = { ...taskData, author: safeAuthor, topic, updatedAt: new Date().toISOString(), lastModifiedBy: profile || 'Unknown', isDraftPlaceholder: false };

                const isSampleTask = isEdit && taskData.id && taskData.id.startsWith('task-');
                if (isSampleTask) {
                    setTasks(prev => prev.map(t => t.id === taskData.id ? { ...t, ...payload } : t));
                    const localModifiedTasks = JSON.parse(localStorage.getItem('modified_sample_tasks') || '{}');
                    localModifiedTasks[taskData.id] = payload;
                    localStorage.setItem('modified_sample_tasks', JSON.stringify(localModifiedTasks));
                    return { success: true, message: "수정되었습니다" };
                }

                const { id, ...firestoreData } = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== undefined));

                await retryWithBackoff(async () => {
                    const groupId = isEdit ? (taskData.groupId || generateGroupId()) : generateGroupId();

                    if (isEdit) {
                        if (taskData.groupId && syncGroup) {
                            const batch = writeBatch(db);
                            const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'weekly_schedule_live'), where('groupId', '==', taskData.groupId));
                            const snapshot = await getDocs(q);
                            snapshot.forEach(docSnap => {
                                const { workStartDate, workEndDate, completedDates, ...rest } = firestoreData;
                                batch.update(docSnap.ref, { ...rest, updatedAt: new Date().toISOString() });
                            });
                            const specificDoc = doc(db, 'artifacts', appId, 'public', 'data', 'weekly_schedule_live', id);
                            batch.update(specificDoc, { workStartDate: firestoreData.workStartDate, workEndDate: firestoreData.workEndDate, ...firestoreData });
                            await batch.commit();
                            logActivity('edit', `'${firestoreData.topic}' 그룹 일괄 업데이트됨`);
                        } else {
                            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'weekly_schedule_live', id), { ...firestoreData, groupId: syncGroup ? groupId : null });
                            logActivity('edit', `'${firestoreData.topic}' 수정됨`);
                        }
                    } else {
                        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'weekly_schedule_live'), {
                            ...firestoreData, createdBy: profile || 'Unknown', createdAt: new Date().toISOString(), groupId, status: firestoreData.status || 'todo', completedDates: firestoreData.completedDates || []
                        });
                        logActivity('create', `'${firestoreData.topic}' 등록됨`);
                    }
                }, { maxRetries: 3, context: 'saveTask' });
                return { success: true, message: isEdit ? "수정되었습니다" : "추가되었습니다" };
            } catch (error) {
                const { message } = handleFirebaseError(error, 'saveTask');
                return { success: false, message };
            }
        };

        const moveTask = async (task, targetDateStr) => {
            try {
                const duration = getDaysDifference(task.workStartDate, task.workEndDate);
                const newEndDate = changeDate(targetDateStr, duration);
                return await saveTask({ ...task, workStartDate: targetDateStr, workEndDate: newEndDate }, true, true, false);
            } catch (e) { return { success: false, message: "이동 실패: " + e.message }; }
        };

        const deleteTask = async (id, topic, groupId = null) => {
            if (!user) return false;
            const isSampleTask = id && id.startsWith('task-');
            if (isSampleTask) {
                setTasks(prev => prev.filter(t => t.id !== id));
                const deletedSampleTasks = JSON.parse(localStorage.getItem('deleted_sample_tasks') || '[]');
                if (!deletedSampleTasks.includes(id)) { deletedSampleTasks.push(id); localStorage.setItem('deleted_sample_tasks', JSON.stringify(deletedSampleTasks)); }
                showToast(`'${topic || '일정'}' 삭제됨`, 'success');
                return true;
            }
            try {
                await retryWithBackoff(async () => {
                    if (groupId) {
                        const batch = writeBatch(db);
                        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'weekly_schedule_live'), where('groupId', '==', groupId));
                        const snapshot = await getDocs(q);
                        snapshot.forEach(d => batch.delete(d.ref));
                        await batch.commit();
                    } else { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'weekly_schedule_live', id)); }
                    logActivity('delete', `'${topic || '일정'}' 삭제됨`);
                }, { context: 'deleteTask' });
                return true;
            } catch (e) {
                const { message } = handleFirebaseError(e, 'deleteTask');
                showToast(message, 'error');
                return false;
            }
        };

        const savePlan = async (planData) => {
            if (!user) return { success: false };
            const validation = validatePlan(planData);
            if (!validation.valid) { showToast(validation.message, 'error'); return { success: false, message: validation.message }; }
            try {
                const rawPayload = { ...planData, status: planData.status || 'draft' };
                const payload = Object.fromEntries(Object.entries(rawPayload).filter(([_, v]) => v !== undefined));
                const isSamplePlan = payload.id && payload.id.startsWith('plan-');
                if (isSamplePlan) {
                    setPlans(prev => prev.map(p => p.id === payload.id ? { ...p, ...payload } : p));
                    const localModifiedPlans = JSON.parse(localStorage.getItem('modified_sample_plans') || '{}');
                    localModifiedPlans[payload.id] = payload;
                    localStorage.setItem('modified_sample_plans', JSON.stringify(localModifiedPlans));
                    return { success: true, id: payload.id };
                }
                let resultId = null;
                await retryWithBackoff(async () => {
                    if (payload.id) {
                        const { id, ...updateData } = payload;
                        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'weekly_plans_live', id), updateData);
                        logActivity('edit', `'${payload.topic}' 프로젝트 업데이트`);
                        resultId = id;
                    } else {
                        const newPlanRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'weekly_plans_live'), { ...payload, createdBy: profile, createdAt: new Date().toISOString() });
                        logActivity('create', `'${payload.topic}' 프로젝트 기획안 생성`);
                        resultId = newPlanRef.id;
                    }
                }, { context: 'savePlan' });
                return { success: true, id: resultId };
            } catch (e) {
                const { message } = handleFirebaseError(e, 'savePlan');
                showToast(message, 'error');
                return { success: false, message };
            }
        };

        const saveManagement = async (data, colName) => {
            const validation = validateManagement(data, colName);
            if (!validation.valid) { showToast(validation.message, 'error'); return false; }
            try {
                const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
                const isSampleData = cleanData.id && (cleanData.id.startsWith('fin-') || cleanData.id.startsWith('inq-'));
                if (isSampleData) {
                    setManagements(prev => prev.map(m => m.id === cleanData.id ? { ...m, ...cleanData } : m));
                    const localModifiedMgmt = JSON.parse(localStorage.getItem('modified_sample_mgmt') || '{}');
                    localModifiedMgmt[cleanData.id] = cleanData;
                    localStorage.setItem('modified_sample_mgmt', JSON.stringify(localModifiedMgmt));
                    return true;
                }
                await retryWithBackoff(async () => {
                    if (cleanData.id) {
                        const { id, ...updateData } = cleanData;
                        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'weekly_management', id), updateData);
                    } else { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'weekly_management'), { ...cleanData, category: colName, createdBy: profile, createdAt: new Date().toISOString() }); }
                }, { context: 'saveManagement' });
                return true;
            } catch (e) {
                const { message } = handleFirebaseError(e, 'saveManagement');
                showToast(message, 'error');
                return false;
            }
        };

        const deleteManagement = async (id) => {
            const isSampleData = id && (id.startsWith('fin-') || id.startsWith('inq-'));
            if (isSampleData) {
                setManagements(prev => prev.filter(m => m.id !== id));
                const deletedSampleMgmt = JSON.parse(localStorage.getItem('deleted_sample_mgmt') || '[]');
                if (!deletedSampleMgmt.includes(id)) { deletedSampleMgmt.push(id); localStorage.setItem('deleted_sample_mgmt', JSON.stringify(deletedSampleMgmt)); }
                showToast('삭제되었습니다.', 'success');
                return true;
            }
            try {
                await retryWithBackoff(async () => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'weekly_management', id)); }, { context: 'deleteManagement' });
                return true;
            } catch (e) {
                const { message } = handleFirebaseError(e, 'deleteManagement');
                showToast(message, 'error');
                return false;
            }
        };

        const deletePlan = async (planId, topic) => {
            const isSamplePlan = planId && planId.startsWith('plan-');
            if (isSamplePlan) {
                setPlans(prev => prev.filter(p => p.id !== planId));
                setTasks(prev => prev.filter(t => t.planId !== planId));
                const deletedSamplePlans = JSON.parse(localStorage.getItem('deleted_sample_plans') || '[]');
                if (!deletedSamplePlans.includes(planId)) { deletedSamplePlans.push(planId); localStorage.setItem('deleted_sample_plans', JSON.stringify(deletedSamplePlans)); }
                const deletedSampleTasks = JSON.parse(localStorage.getItem('deleted_sample_tasks') || '[]');
                SAMPLE_TASKS.filter(t => t.planId === planId).forEach(t => { if (!deletedSampleTasks.includes(t.id)) deletedSampleTasks.push(t.id); });
                localStorage.setItem('deleted_sample_tasks', JSON.stringify(deletedSampleTasks));
                showToast(`'${topic || '프로젝트'}' 기획안 삭제됨`, 'success');
                return true;
            }
            try {
                await retryWithBackoff(async () => {
                    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'weekly_schedule_live'), where('planId', '==', planId));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) { const batch = writeBatch(db); snapshot.forEach(docSnap => batch.delete(docSnap.ref)); await batch.commit(); }
                    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'weekly_plans_live', planId));
                    logActivity('delete', `'${topic || '프로젝트'}' 기획안 삭제됨`);
                }, { context: 'deletePlan' });
                return true;
            } catch (e) {
                const { message } = handleFirebaseError(e, 'deletePlan');
                showToast(message, 'error');
                return false;
            }
        };

        const importAllData = async (file) => {
            try {
                const text = await file.text();
                const backup = JSON.parse(text);
                const validation = validateBackupFile(backup);
                if (!validation.valid) {
                    const errorMsg = `백업 파일 검증 실패 (${validation.errors.length}개 오류)\n\n` + validation.errors.slice(0, 5).join('\n') + (validation.errors.length > 5 ? `\n... 외 ${validation.errors.length - 5}개` : '');
                    showToast(errorMsg, 'error');
                    return false;
                }
                if (validation.warnings.length > 0) { console.warn('Backup warnings:', validation.warnings); }
                const { plans: importPlans, tasks: importTasks, managements: importManagements } = backup.data;
                const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
                const importWithRetry = async (importFn, item, itemType, maxRetries = 3) => {
                    for (let attempt = 1; attempt <= maxRetries; attempt++) {
                        try { return await importFn(item); }
                        catch (error) {
                            if (attempt === maxRetries) throw error;
                            const delay = error.code === 'resource-exhausted' ? 2000 * attempt : 500 * attempt;
                            await sleep(delay);
                        }
                    }
                };

                return new Promise((resolve) => {
                    const message = `다음 데이터를 복원하시겠습니까?\n\n프로젝트: ${importPlans?.length || 0}개\n일정: ${importTasks?.length || 0}개\n관리항목: ${importManagements?.length || 0}개\n\n복원 방식을 선택해주세요:`;
                    const performRestore = async (clearFirst) => {
                        try {
                            let successCount = 0; let errorCount = 0; const errors = []; const BATCH_SIZE = 5;
                            if (clearFirst) {
                                showToast('기존 데이터 삭제 중...', 'success');
                                await retryWithBackoff(async () => { const s = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'weekly_plans_live')); const b = writeBatch(db); s.forEach(doc => b.delete(doc.ref)); await b.commit(); }, { context: 'clearPlans' });
                                await retryWithBackoff(async () => { const s = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'weekly_schedule_live')); const b = writeBatch(db); s.forEach(doc => b.delete(doc.ref)); await b.commit(); }, { context: 'clearTasks' });
                                await retryWithBackoff(async () => { const s = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'weekly_management')); const b = writeBatch(db); s.forEach(doc => b.delete(doc.ref)); await b.commit(); }, { context: 'clearMgmt' });
                            }
                            const planIdMap = {};
                            if (importPlans && Array.isArray(importPlans)) {
                                for (let i = 0; i < importPlans.length; i += BATCH_SIZE) {
                                    const batch = importPlans.slice(i, i + BATCH_SIZE);
                                    await Promise.all(batch.map(async (plan) => {
                                        try {
                                            const { id: oldId, ...planData } = plan;
                                            if (!planData.topic) throw new Error("프로젝트 주제(topic) 누락");
                                            const newPlanRef = await importWithRetry(async (data) => await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'weekly_plans_live'), data), { ...planData, importedAt: new Date().toISOString(), importedBy: profile }, 'Plan');
                                            if (oldId) planIdMap[oldId] = newPlanRef.id;
                                            successCount++;
                                        } catch (e) { errorCount++; errors.push({ type: 'Plan', name: plan.topic || 'Unknown', error: e.message }); }
                                    }));
                                    if (i + BATCH_SIZE < importPlans.length) await sleep(1000);
                                }
                            }
                            if (importTasks && Array.isArray(importTasks)) {
                                for (let i = 0; i < importTasks.length; i += BATCH_SIZE) {
                                    const batch = importTasks.slice(i, i + BATCH_SIZE);
                                    await Promise.all(batch.map(async (task) => {
                                        try {
                                            const { id, planId: oldPlanId, ...taskData } = task;
                                            if (!taskData.author) throw new Error("담당자 누락");
                                            let newPlanId = oldPlanId;
                                            if (taskData.type === 'personal') { newPlanId = null; }
                                            else if (oldPlanId) { if (planIdMap[oldPlanId]) newPlanId = planIdMap[oldPlanId]; else if (oldPlanId.startsWith('plan-')) newPlanId = oldPlanId; else newPlanId = null; }
                                            const payload = { ...taskData, importedAt: new Date().toISOString(), importedBy: profile };
                                            if (newPlanId !== undefined) payload.planId = newPlanId;
                                            await importWithRetry(async (data) => { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'weekly_schedule_live'), data); }, payload, 'Task');
                                            successCount++;
                                        } catch (e) { errorCount++; errors.push({ type: 'Task', name: task.details || 'Unknown', error: e.message }); }
                                    }));
                                    if (i + BATCH_SIZE < importTasks.length) await sleep(1000);
                                }
                            }
                            if (importManagements && Array.isArray(importManagements)) {
                                for (let i = 0; i < importManagements.length; i += BATCH_SIZE) {
                                    const batch = importManagements.slice(i, i + BATCH_SIZE);
                                    await Promise.all(batch.map(async (mgmt) => {
                                        try {
                                            const { id, planId: oldPlanId, ...mgmtData } = mgmt;
                                            let newPlanId = oldPlanId;
                                            if (oldPlanId && planIdMap[oldPlanId]) newPlanId = planIdMap[oldPlanId];
                                            const payload = { ...mgmtData, importedAt: new Date().toISOString(), importedBy: profile };
                                            if (newPlanId !== undefined) payload.planId = newPlanId;
                                            await importWithRetry(async (data) => { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'weekly_management'), data); }, payload, 'Management');
                                            successCount++;
                                        } catch (e) { errorCount++; errors.push({ type: 'Mgmt', name: mgmt.title || mgmt.product || 'Unknown', error: e.message }); }
                                    }));
                                    if (i + BATCH_SIZE < importManagements.length) await sleep(1000);
                                }
                            }
                            if (errorCount > 0) { showToast(`복원 완료 (일부 실패): 성공 ${successCount}, 실패 ${errorCount}`, 'error'); }
                            else { showToast(`✅ 복원 완료! 총 ${successCount}개 항목이 성공적으로 복원되었습니다.`, 'success'); }
                            logActivity('import', `데이터 복원 (${clearFirst ? '전체 교체' : '병합'}) - 성공: ${successCount}, 실패: ${errorCount}`);
                            resolve(true);
                        } catch (error) { showToast('복원 중 치명적 오류: ' + error.message, 'error'); resolve(false); }
                    };
                    openConfirm(message, async () => await performRestore(true), async () => await performRestore(false), 'restore_option');
                });
            } catch (error) { showToast('복원 실패: ' + error.message, 'error'); return false; }
        };

        return {
            saveTask, moveTask,
            updateStatus: async (task, newStatus) => {
                try {
                    const result = await saveTask({ ...task, status: newStatus }, true, true, true);
                    if (result.success && task.planId) {
                        const plan = plans.find(p => p.id === task.planId);
                        const isSamplePlan = plan?.id && plan.id.startsWith('plan-');
                        if (plan && plan.status === 'completed' && (newStatus === 'todo' || newStatus === 'in_progress')) {
                            if (isSamplePlan) { setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: 'active' } : p)); }
                            else { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'weekly_plans_live', plan.id), { status: 'active' }); }
                        }
                    }
                    return result;
                } catch (e) { return { success: false }; }
            },
            deleteTask, savePlan, deletePlan, saveManagement, deleteManagement, exportAllData, importAllData
        };
    }, [user, plans, profile, logActivity, showToast, openConfirm, exportAllData]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const authorMatch = selectedAuthors.length === 0 || selectedAuthors.includes(t.author);
            const statusMatch = filterStatus === 'All' || t.status === filterStatus;
            if (t.type === 'personal') return authorMatch && statusMatch;
            if (t.isDraftPlaceholder) return false;
            const linkedPlan = plans.find(p => p.id === t.planId);
            // 연결된 플랜이 없는 경우 (고아 task) 제외
            if (!linkedPlan) { if (t.planId && !t.planId.startsWith('plan-')) { console.warn(`[Orphan Task] 연결된 프로젝트 없음: task.id=${t.id}, planId=${t.planId}`); } return false; }
            // draft 포함 모든 존재하는 플랜의 task를 표시 (삭제된 플랜만 제외)
            return authorMatch && statusMatch;
        });
    }, [tasks, selectedAuthors, filterStatus, plans]);

    const tasksByDate = useMemo(() => {
        const map = {};
        filteredTasks.forEach(task => {
            if (task.isDraftPlaceholder || !task.workStartDate || !task.workEndDate) return;
            const start = parseLocalDate(task.workStartDate);
            const end = parseLocalDate(task.workEndDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return;
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const MAX_DAYS = 365;
            const loopCount = Math.min(diffDays, MAX_DAYS);
            let curr = new Date(start);
            for (let i = 0; i <= loopCount; i++) {
                const dStr = formatDateLocal(curr);
                if (!isHolidayOrWeekend(dStr) || task.type === 'personal') { if (!map[dStr]) map[dStr] = []; map[dStr].push(task); }
                curr.setDate(curr.getDate() + 1);
            }
        });
        return map;
    }, [filteredTasks]);

    const value = {
        user, profile, setProfile: handleSetProfile, logout, plans, tasks, logs, managements, loading, operations, viewMode, setViewMode, currentDate, setCurrentDate, next, prev, today, filteredTasks, tasksByDate, selectedDate, setSelectedDate, toast, showToast, hideToast, confirmDialog, openConfirm, closeConfirm, selectedAuthors, setSelectedAuthors, toggleAuthor, filterStatus, setFilterStatus, searchTerm, setSearchTerm, modals, toggleModal, selectedItems, setSelectedItems, modalType, setModalType, onOpenPlan: (plan) => { setSelectedItems(prev => ({ ...prev, plan })); toggleModal('plan', true); }
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
