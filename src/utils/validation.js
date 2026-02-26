import { WORK_CATEGORIES, PERSONAL_CATEGORIES, PROJECT_TYPES, PLAN_COLUMNS } from '../config/constants';
import { parseLocalDate } from './dateUtils';

export const validateDate = (dateStr, fieldName = '날짜') => {
    if (!dateStr) return { valid: false, message: `${fieldName}을(를) 입력해주세요.` };
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return { valid: false, message: `${fieldName} 형식이 올바르지 않습니다 (YYYY-MM-DD).` };
    const date = new Date(dateStr);
    const timestamp = date.getTime();
    if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) return { valid: false, message: `${fieldName}이(가) 유효하지 않습니다.` };
    const [year, month, day] = dateStr.split('-').map(Number);
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return { valid: false, message: `${fieldName}이(가) 존재하지 않는 날짜입니다.` };
    if (year < 1900 || year > 2100) return { valid: false, message: `${fieldName}은(는) 1900년~2100년 사이여야 합니다.` };
    return { valid: true, message: '' };
};

export const validateDateRange = (startDate, endDate, maxDays = 365) => {
    if (!startDate || !endDate) return { valid: false, message: '시작일과 종료일이 필요합니다.' };
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    if (start > end) return { valid: false, message: '종료일이 시작일보다 빠를 수 없습니다.' };
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > maxDays) return { valid: false, message: `기간은 최대 ${maxDays}일을 초과할 수 없습니다.` };
    return { valid: true, message: '' };
};

export const validateRequiredString = (value, fieldName, minLength = 1, maxLength = 500) => {
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) return { valid: false, message: `${fieldName}을(를) 입력해주세요.` };
    const strVal = String(value).trim();
    if (strVal.length < minLength) return { valid: false, message: `${fieldName}은(는) 최소 ${minLength}자 이상이어야 합니다.` };
    if (strVal.length > maxLength) return { valid: false, message: `${fieldName}은(는) 최대 ${maxLength}자까지 입력 가능합니다.` };
    return { valid: true, message: '' };
};

export const validateEnum = (value, enumObj, fieldName) => {
    if (!value || !enumObj[value]) return { valid: false, message: `유효하지 않은 ${fieldName} 값입니다: ${value}` };
    return { valid: true, message: '' };
};

export const validatePlanReference = (planId, plans) => {
    if (!planId) return { valid: false, message: '프로젝트 ID가 누락되었습니다.' };
    if (!plans || !Array.isArray(plans)) return { valid: true, message: '' };
    const exists = plans.some(p => p.id === planId);
    if (!exists) return { valid: false, message: '존재하지 않는 프로젝트입니다.' };
    return { valid: true, message: '' };
};

export const validateTask = (task, plans = []) => {
    const errors = [];
    const authorCheck = validateRequiredString(task.author, '담당자', 1, 50);
    if (!authorCheck.valid) errors.push(authorCheck.message);
    const detailsCheck = validateRequiredString(task.details, '내용', 1, 1000);
    if (!detailsCheck.valid) errors.push(detailsCheck.message);
    const startCheck = validateDate(task.workStartDate, '시작일');
    if (!startCheck.valid) errors.push(startCheck.message);
    const endCheck = validateDate(task.workEndDate, '종료일');
    if (!endCheck.valid) errors.push(endCheck.message);
    if (startCheck.valid && endCheck.valid) {
        const rangeCheck = validateDateRange(task.workStartDate, task.workEndDate, 365);
        if (!rangeCheck.valid) errors.push(rangeCheck.message);
    }
    if (!['task', 'personal'].includes(task.type)) errors.push('유효하지 않은 일정 타입입니다.');
    if (task.type === 'task') {
        if (!task.planId) errors.push('프로젝트를 선택해주세요.');
        else if (plans.length > 0 && !task.skipPlanCheck) {
            const planRef = validatePlanReference(task.planId, plans);
            if (!planRef.valid) errors.push(planRef.message);
        }
        if (task.category && Array.isArray(task.category)) {
            task.category.forEach(cat => { if (!WORK_CATEGORIES[cat]) errors.push(`잘못된 업무 카테고리: ${cat}`); });
        }
    }
    if (task.type === 'personal' && task.category && Array.isArray(task.category)) {
        task.category.forEach(cat => { if (!PERSONAL_CATEGORIES[cat]) errors.push(`잘못된 개인 일정 카테고리: ${cat}`); });
    }
    return { valid: errors.length === 0, message: errors.join('\n'), errors };
};

export const validatePlan = (plan) => {
    const errors = [];
    const topicCheck = validateRequiredString(plan.topic, '프로젝트 주제', 1, 200);
    if (!topicCheck.valid) errors.push(topicCheck.message);
    const plannerCheck = validateRequiredString(plan.planner, '기획자', 1, 50);
    if (!plannerCheck.valid) errors.push(plannerCheck.message);
    // 업로드 예정일 - 입력된 경우에만 형식 검증 (선택 항목)
    if (plan.uploadDate && plan.uploadDate.trim()) {
        const uploadDateCheck = validateDate(plan.uploadDate, '업로드 예정일');
        if (!uploadDateCheck.valid) errors.push(uploadDateCheck.message);
    }
    const typeCheck = validateEnum(plan.type, PROJECT_TYPES, '프로젝트 타입');
    if (!typeCheck.valid) errors.push(typeCheck.message);
    if (plan.status && !PLAN_COLUMNS[plan.status]) errors.push('유효하지 않은 상태 값입니다.');
    if (plan.shootType && !['indoor', 'outdoor'].includes(plan.shootType)) errors.push('촬영 타입은 indoor 또는 outdoor만 가능합니다.');
    // 외부 로케이션은 필수 아님 (입력 권장만)
    return { valid: errors.length === 0, message: errors.join('\n'), errors };
};

export const validateManagement = (data, category) => {
    const errors = [];
    if (category === 'finance') {
        const titleCheck = validateRequiredString(data.title, '항목명', 1, 200);
        if (!titleCheck.valid) errors.push(titleCheck.message);
        if (!['income', 'expense'].includes(data.type)) errors.push('재무 타입 오류');
        if (data.amount === undefined || data.amount === null || isNaN(Number(data.amount))) errors.push('금액을 숫자로 입력해주세요.');
        else if (Number(data.amount) < 0) errors.push('금액은 0 이상이어야 합니다.');
        else if (Number(data.amount) > 10000000000) errors.push('금액 허용 범위를 초과했습니다.');
        const dateCheck = validateDate(data.datetime, '거래일');
        if (!dateCheck.valid) errors.push(dateCheck.message);
        if (data.productUrl && data.productUrl.trim() && !/^https?:\/\//.test(data.productUrl)) errors.push('URL은 http:// 또는 https://로 시작해야 합니다.');
    }
    if (category === 'inquiry') {
        const senderCheck = validateRequiredString(data.sender, '발신자', 1, 100);
        if (!senderCheck.valid) errors.push(senderCheck.message);
        const validTypes = ['sponsor', 'partnership', 'inquiry', 'other'];
        if (!validTypes.includes(data.type)) errors.push('유효하지 않은 문의 타입입니다.');
        if (data.receivedDate) {
            const dateCheck = validateDate(data.receivedDate, '수신일');
            if (!dateCheck.valid) errors.push(dateCheck.message);
        }
    }
    return { valid: errors.length === 0, message: errors.join('\n'), errors };
};

export const validateBackupFile = (backup) => {
    const errors = [];
    const warnings = [];
    if (!backup.version) errors.push('백업 파일 버전 정보 누락');
    if (!backup.data) errors.push('데이터 객체 누락');
    if (backup.data) {
        if (backup.data.plans && !Array.isArray(backup.data.plans)) errors.push('plans 데이터 형식 오류 (배열이어야 함)');
        if (backup.data.tasks && !Array.isArray(backup.data.tasks)) errors.push('tasks 데이터 형식 오류 (배열이어야 함)');
        if (backup.data.managements && !Array.isArray(backup.data.managements)) errors.push('managements 데이터 형식 오류 (배열이어야 함)');
        if (Array.isArray(backup.data.plans)) {
            backup.data.plans.slice(0, 5).forEach((p, i) => { const res = validatePlan(p); if (!res.valid) warnings.push(`Plan[${i}] 경고: ${res.message}`); });
        }
        if (Array.isArray(backup.data.tasks)) {
            backup.data.tasks.slice(0, 5).forEach((t, i) => { const res = validateTask(t, []); if (!res.valid) warnings.push(`Task[${i}] 경고: ${res.message}`); });
        }
    }
    return { valid: errors.length === 0, message: errors.join('\n'), errors, warnings };
};
