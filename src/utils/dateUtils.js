import { HOLIDAYS } from '../config/constants';

export const parseLocalDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return new Date();
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date();
    const [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date();
    if (year < 1900 || year > 2100) return new Date();
    return new Date(year, month - 1, day, 12, 0, 0);
};

export const formatDateLocal = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const changeDate = (dateStr, days) => {
    const date = parseLocalDate(dateStr);
    date.setDate(date.getDate() + days);
    return formatDateLocal(date);
};

export const getDaysDifference = (startStr, endStr) => {
    const start = parseLocalDate(startStr);
    const end = parseLocalDate(endStr);
    const diffTime = end - start;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getWeekDays = (baseDate) => {
    const date = new Date(baseDate);
    const day = date.getDay();
    const diff = date.getDate() - day;
    const sunday = new Date(date.getFullYear(), date.getMonth(), diff);
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        days.push(d);
    }
    return days;
};

export const getDatesInRange = (startDate, endDate) => {
    if (!startDate || !endDate) return [];
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);

    if (start > end) return [];

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
        console.warn(`Date range too large: ${diffDays} days, limiting to 365`);
        return [];
    }

    const dates = [];
    const curr = new Date(start);

    for (let i = 0; i <= diffDays && i < 366; i++) {
        dates.push(formatDateLocal(curr));
        curr.setDate(curr.getDate() + 1);
    }
    return dates;
};

export const isHolidayOrWeekend = (dateStr) => {
    const date = parseLocalDate(dateStr);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return true;
    if (HOLIDAYS[dateStr]) return true;
    return false;
};
