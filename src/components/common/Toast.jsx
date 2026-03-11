import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Plus, Trash, Edit } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast = () => {
    const { toast, hideToast } = useApp();
    const toastKey = toast ? `${toast.type}-${toast.message}` : null;
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => hideToast(), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastKey, hideToast]);
    if (!toast) return null;
    return (<div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-6 py-3 shadow-xl rounded-full animate-in fade-in slide-in-from-bottom-4 duration-300 ${toast.type === 'error' ? 'bg-[#faf6ef] border border-[#9b4d4d]/40 text-[#8b3d3d]' : 'bg-[#4a3d30] text-[#faf6ef]'}`}>{toast.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}<span className="font-medium text-sm tracking-wide">{toast.message}</span></div>);
};

export const LogItem = React.memo(({ log }) => {
    const timeString = new Date(log.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    let icon = <Edit size={12} className="text-[#5d6a7a]" />;
    if (log.type === 'create') icon = <Plus size={12} className="text-[#5d7a5d]" />;
    if (log.type === 'delete') icon = <Trash size={12} className="text-[#9b4d4d]" />;
    return (
        <div className="flex gap-3 py-3 border-b border-[#d4c4ac] last:border-0 hover:bg-[#f5f0e6] px-2 rounded-lg transition-colors">
            <div className="mt-1">{icon}</div>
            <div className="flex-1">
                <p className="text-xs text-[#42392e] leading-relaxed">
                    <span className="font-bold text-[#42392e]">{log.user}</span>님이 {log.message}
                </p>
                <span className="text-[10px] text-[#857460] font-mono">{timeString}</span>
            </div>
        </div>
    );
}, (prev, next) => prev.log.id === next.log.id && prev.log.message === next.log.message && prev.log.createdAt === next.log.createdAt);

export const HighlightText = ({ text, highlight }) => { if (!highlight || !text) return <span>{text}</span>; const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const parts = text.split(new RegExp(`(${escaped})`, 'gi')); return <span>{parts.map((part, i) => part.toLowerCase() === highlight.toLowerCase() ? <span key={i} className="bg-[#c4a574]/30 text-[#32291e] font-bold px-0.5 rounded">{part}</span> : part)}</span>; };
