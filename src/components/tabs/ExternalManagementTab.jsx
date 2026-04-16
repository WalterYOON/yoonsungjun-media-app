// ExternalManagementTab - FinanceSplitView, FinanceSubTab, InquiryGridView, InquirySubTab, ExternalManagementTab 통합
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, DollarSign, ShoppingBag, Mail, Search, Download, Edit, ExternalLink, LayoutGrid, Columns, Briefcase, Activity, Inbox, X, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INQUIRY_CATEGORIES, INQUIRY_STATUS } from '../../config/constants';
import { formatDateLocal, parseLocalDate } from '../../utils/dateUtils';
import useDebounce from '../../hooks/useDebounce';

// FinanceSplitView
const FinanceSplitView = ({ filteredItems, plans, onItemClick }) => {
    const categorizedItems = useMemo(() => ({
        income: filteredItems.filter(i => i.type === 'income').sort((a, b) => new Date(b.datetime || 0) - new Date(a.datetime || 0)),
        expense: filteredItems.filter(i => i.type === 'expense').sort((a, b) => new Date(b.datetime || 0) - new Date(a.datetime || 0))
    }), [filteredItems]);
    const totalIncome = useMemo(() => categorizedItems.income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0), [categorizedItems.income]);
    const totalExpense = useMemo(() => categorizedItems.expense.reduce((sum, i) => sum + (Number(i.amount) || 0), 0), [categorizedItems.expense]);
    const FinanceCard = ({ item }) => {
        const plan = plans.find(p => p.id === item.planId);
        return (
            <div onClick={() => onItemClick(item)} className="bg-[#f0e9de] p-4 rounded-xl border border-[#d4c4ac] hover:border-[#a0714a] cursor-pointer transition-all group">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-[#42392e] text-sm group-hover:text-[#a0714a] transition-colors flex items-center gap-2">
                        {item.title}
                        {item.productUrl && (<a href={item.productUrl.startsWith('http') ? item.productUrl : `https://${item.productUrl}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#5d6a7a] hover:text-blue-300" title="제품 링크"><ExternalLink size={12} /></a>)}
                    </h4>
                    <span className={`text-sm font-bold font-mono ${item.type === 'income' ? 'text-[#5d7a5d]' : 'text-[#9b4d4d]'}`}>{item.type === 'income' ? '+' : '-'}₩{Number(item.amount).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-[#857460]">{item.datetime || '-'}</span>
                    <span className="text-[#a89880] truncate max-w-[120px]">{plan?.topic || '-'}</span>
                </div>
                {item.memo && (<p className="text-xs text-[#a89880] mt-2 line-clamp-1">{item.memo}</p>)}
            </div>
        );
    };
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px]">
            <div className="vj-card bg-[#faf6ef] rounded-2xl border border-[#d4c4ac] flex flex-col overflow-hidden">
                <div className="p-5 border-b border-[#d4c4ac] bg-emerald-900/20 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2"><DollarSign size={20} className="text-[#5d7a5d]" /><h3 className="font-bold text-[#5d7a5d] text-sm">수입</h3><span className="ml-auto bg-[#5d7a5d]/20 text-[#5d7a5d] px-2 py-0.5 rounded-full text-xs font-bold">{categorizedItems.income.length}건</span></div>
                    <div className="text-2xl font-black text-[#5d7a5d]">₩{totalIncome.toLocaleString()}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {categorizedItems.income.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-[#5d7a5d]/30"><DollarSign size={48} className="mb-2" /><span className="text-xs">수입 내역 없음</span></div>) : (categorizedItems.income.map(item => (<FinanceCard key={item.id} item={item} />)))}
                </div>
            </div>
            <div className="vj-card bg-[#faf6ef] rounded-2xl border border-[#d4c4ac] flex flex-col overflow-hidden">
                <div className="p-5 border-b border-[#d4c4ac] bg-rose-900/20 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2"><ShoppingBag size={20} className="text-[#9b4d4d]" /><h3 className="font-bold text-[#9b4d4d] text-sm">지출</h3><span className="ml-auto bg-[#9b4d4d]/20 text-[#9b4d4d] px-2 py-0.5 rounded-full text-xs font-bold">{categorizedItems.expense.length}건</span></div>
                    <div className="text-2xl font-black text-[#9b4d4d]">₩{totalExpense.toLocaleString()}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {categorizedItems.expense.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-[#9b4d4d]/30"><ShoppingBag size={48} className="mb-2" /><span className="text-xs">지출 내역 없음</span></div>) : (categorizedItems.expense.map(item => (<FinanceCard key={item.id} item={item} />)))}
                </div>
            </div>
        </div>
    );
};

// InquiryGridView (상태 배지 + 클릭 팝오버 버전)
const InquiryGridView = ({ filteredInquiries, onInquiryClick, onStatusChange }) => {
    const [activePopover, setActivePopover] = useState(null);
    const popoverRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setActivePopover(null);
            }
        };
        if (activePopover) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activePopover]);

    const categorizedInquiries = useMemo(() => ({
        sponsor: filteredInquiries.filter(i => i.type === 'sponsor').sort((a, b) => new Date(b.receivedDate || 0) - new Date(a.receivedDate || 0)),
        partnership: filteredInquiries.filter(i => i.type === 'partnership').sort((a, b) => new Date(b.receivedDate || 0) - new Date(a.receivedDate || 0)),
        inquiry: filteredInquiries.filter(i => i.type === 'inquiry').sort((a, b) => new Date(b.receivedDate || 0) - new Date(a.receivedDate || 0)),
        other: filteredInquiries.filter(i => i.type === 'other').sort((a, b) => new Date(b.receivedDate || 0) - new Date(a.receivedDate || 0))
    }), [filteredInquiries]);

    const handleCardClick = useCallback((e, item) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setActivePopover(prev => prev?.item?.id === item.id ? null : { item, rect });
    }, []);

    const StatusBadge = ({ status }) => {
        const s = INQUIRY_STATUS[status] || INQUIRY_STATUS['reviewing'];
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.color}`}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.dot }} />
                {s.label}
            </span>
        );
    };

    const InquiryCard = ({ item }) => {
        const categoryInfo = INQUIRY_CATEGORIES[item.type] || INQUIRY_CATEGORIES['other'];
        const isActive = activePopover?.item?.id === item.id;
        return (
            <div
                onClick={(e) => handleCardClick(e, item)}
                className={`bg-[#f0e9de] p-3.5 rounded-xl border cursor-pointer transition-all group relative ${isActive ? 'border-[#a0714a] shadow-md' : 'border-[#d4c4ac] hover:border-[#a0714a]/60'}`}
            >
                <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${categoryInfo.color}`}>{categoryInfo.label}</span>
                    <span className="text-xs text-[#a89880] font-mono">{item.receivedDate}</span>
                </div>
                <h4 className={`font-bold text-base mb-1 transition-colors ${isActive ? 'text-[#a0714a]' : 'text-[#42392e] group-hover:text-[#a0714a]'}`}>{item.sender}</h4>
                <p className="text-sm text-[#857460] line-clamp-1 mb-2.5">{item.subject}</p>
                <div className="flex justify-between items-center">
                    <StatusBadge status={item.status || 'reviewing'} />
                    <ChevronRight size={14} className={`text-[#a89880] transition-transform ${isActive ? 'rotate-90 text-[#a0714a]' : ''}`} />
                </div>
            </div>
        );
    };

    const InquirySection = ({ type, label, items }) => (
        <div className="vj-card bg-[#faf6ef] rounded-2xl border border-[#d4c4ac] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#d4c4ac] bg-[#f0e9de] flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#42392e] text-base flex items-center gap-2"><Mail size={17} className="text-[#a0714a]" />{label}</h3>
                    <span className="bg-[#44403c] text-[#857460] px-2.5 py-0.5 rounded-full text-sm font-bold">{items.length}</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#44403c] py-8">
                        <Inbox size={32} className="mb-2 opacity-50" />
                        <span className="text-xs">내역 없음</span>
                    </div>
                ) : (items.map(item => (<InquiryCard key={item.id} item={item} />)))}
            </div>
        </div>
    );

    return (
        <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ height: '600px' }}>
                <InquirySection type="sponsor" label={INQUIRY_CATEGORIES.sponsor.label} items={categorizedInquiries.sponsor} />
                <InquirySection type="partnership" label={INQUIRY_CATEGORIES.partnership.label} items={categorizedInquiries.partnership} />
                <InquirySection type="inquiry" label={INQUIRY_CATEGORIES.inquiry.label} items={categorizedInquiries.inquiry} />
                <InquirySection type="other" label={INQUIRY_CATEGORIES.other.label} items={categorizedInquiries.other} />
            </div>

            {/* 클릭 팝오버 */}
            {activePopover && (() => {
                const item = activePopover.item;
                const categoryInfo = INQUIRY_CATEGORIES[item.type] || INQUIRY_CATEGORIES['other'];
                const statusInfo = INQUIRY_STATUS[item.status || 'reviewing'];
                return (
                    <div
                        ref={popoverRef}
                        className="fixed z-[200] bg-[#faf6ef] border border-[#d4c4ac] rounded-2xl shadow-2xl overflow-hidden"
                        style={{
                            width: '480px',
                            top: Math.min(activePopover.rect.top, window.innerHeight - 480),
                            left: Math.min(activePopover.rect.right + 12, window.innerWidth - 496),
                        }}
                    >
                        {/* 헤더 */}
                        <div className="p-5 bg-[#f0e9de] border-b border-[#d4c4ac] flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${categoryInfo.color}`}>{categoryInfo.label}</span>
                                    <span className="text-xs text-[#a89880] font-mono">{item.receivedDate}</span>
                                </div>
                                <h4 className="font-bold text-[#42392e] text-lg">{item.sender}</h4>
                                <p className="text-sm text-[#857460] mt-1 line-clamp-1">{item.subject}</p>
                            </div>
                            <button onClick={() => setActivePopover(null)} className="p-1.5 hover:bg-[#d4c4ac]/50 rounded-full ml-2 flex-shrink-0">
                                <X size={16} className="text-[#857460]" />
                            </button>
                        </div>

                        {/* 본문 */}
                        <div className="p-5 max-h-60 overflow-y-auto custom-scrollbar">
                            <p className="text-sm text-[#42392e] leading-relaxed whitespace-pre-wrap">{item.content || '(내용 없음)'}</p>
                        </div>

                        {/* 대응 상태 변경 */}
                        <div className="p-5 border-t border-[#d4c4ac] bg-[#f5f0e8]">
                            <p className="text-xs font-bold text-[#857460] mb-2.5">대응 상태</p>
                            <div className="flex gap-2 flex-wrap">
                                {Object.entries(INQUIRY_STATUS).map(([key, val]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            onStatusChange(item.id, key);
                                            setActivePopover(prev => prev ? { ...prev, item: { ...prev.item, status: key } } : null);
                                        }}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-all ${(item.status || 'reviewing') === key ? val.color : 'bg-[#f0e9de] text-[#857460] border-[#d4c4ac] hover:bg-[#e8dcc8]'}`}
                                    >
                                        {val.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 수정 버튼 */}
                        <div className="px-5 pb-5">
                            <button
                                onClick={() => { onInquiryClick(item); setActivePopover(null); }}
                                className="w-full py-2.5 vj-btn-primary text-[#faf6ef] font-bold rounded-xl text-sm flex items-center justify-center gap-2"
                            >
                                <Edit size={14} />상세 수정
                            </button>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

// FinanceSubTab
const FinanceSubTab = () => {
    const { managements, plans, toggleModal, setSelectedItems, showToast } = useApp();
    const [subTab, setSubTab] = useState('all');
    const [periodFilter, setPeriodFilter] = useState('all');
    const [localSelectedDate, setLocalSelectedDate] = useState(formatDateLocal(new Date()));
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('split');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const financeItems = useMemo(() => managements.filter(m => m.category === 'finance'), [managements]);
    const filteredItems = useMemo(() => {
        const filterByPeriod = (items) => {
            if (periodFilter === 'all') return items;
            const selected = parseLocalDate(localSelectedDate);
            return items.filter(item => {
                if (!item.datetime) return false;
                const itemDate = new Date(item.datetime);
                if (periodFilter === 'day') return formatDateLocal(itemDate) === localSelectedDate;
                if (periodFilter === 'week') {
                    const weekStart = new Date(selected);
                    weekStart.setDate(selected.getDate() - selected.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    return itemDate >= weekStart && itemDate <= weekEnd;
                }
                if (periodFilter === 'month') return itemDate.getFullYear() === selected.getFullYear() && itemDate.getMonth() === selected.getMonth();
                return true;
            });
        };
        return filterByPeriod(financeItems.filter(i => {
            const typeMatch = subTab === 'all' || i.type === subTab;
            const searchMatch = !debouncedSearchTerm || i.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            return typeMatch && searchMatch;
        })).sort((a, b) => new Date(b.datetime || 0) - new Date(a.datetime || 0));
    }, [financeItems, subTab, periodFilter, localSelectedDate, debouncedSearchTerm]);
    const periodItems = useMemo(() => {
        if (periodFilter === 'all') return financeItems;
        const selected = parseLocalDate(localSelectedDate);
        return financeItems.filter(item => {
            if (!item.datetime) return false;
            const itemDate = new Date(item.datetime);
            if (periodFilter === 'day') return formatDateLocal(itemDate) === localSelectedDate;
            if (periodFilter === 'week') {
                const weekStart = new Date(selected);
                weekStart.setDate(selected.getDate() - selected.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return itemDate >= weekStart && itemDate <= weekEnd;
            }
            if (periodFilter === 'month') return itemDate.getFullYear() === selected.getFullYear() && itemDate.getMonth() === selected.getMonth();
            return true;
        });
    }, [financeItems, periodFilter, localSelectedDate]);
    const totalIncome = useMemo(() => periodItems.filter(i => i.type === 'income').reduce((sum, i) => sum + (Number(i.amount) || 0), 0), [periodItems]);
    const totalExpense = useMemo(() => periodItems.filter(i => i.type === 'expense').reduce((sum, i) => sum + (Number(i.amount) || 0), 0), [periodItems]);
    const balance = totalIncome - totalExpense;
    const handleExportCSV = () => {
        if (filteredItems.length === 0) { showToast('내보낼 데이터가 없습니다.', 'error'); return; }
        const csvData = filteredItems.map(item => {
            const plan = plans.find(p => p.id === item.planId);
            return { 날짜: item.datetime || '', 구분: item.type === 'income' ? '수입' : '지출', 항목명: item.title || '', 금액: item.amount || 0, 프로젝트: plan?.topic || '-', 메모: item.memo || '' };
        });
        const headers = Object.keys(csvData[0]).join(',');
        const rows = csvData.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const csvContent = '\uFEFF' + headers + '\n' + rows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `재무내역_${formatDateLocal(new Date())}.csv`;
        link.click();
        showToast('CSV 파일이 다운로드되었습니다.', 'success');
    };
    const FinanceListView = () => (
        <div className="vj-card bg-[#faf6ef] rounded-2xl border border-[#d4c4ac] overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                {filteredItems.length === 0 ? (
                    <div className="p-12 text-center"><DollarSign size={48} className="text-[#d4c4ac] mx-auto mb-4" /><p className="text-[#857460]">등록된 재무 내역이 없습니다.</p></div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-[#f0e9de] sticky top-0 z-10">
                            <tr className="text-left text-xs text-[#857460]">
                                <th className="px-5 py-3 font-bold">날짜</th>
                                <th className="px-5 py-3 font-bold w-[70px]">구분</th>
                                <th className="px-5 py-3 font-bold">항목명</th>
                                <th className="px-5 py-3 font-bold text-right">금액</th>
                                <th className="px-5 py-3 font-bold">연결 프로젝트</th>
                                <th className="px-5 py-3 font-bold">메모</th>
                                <th className="px-5 py-3 font-bold w-[60px] text-right">수정</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => {
                                const plan = plans.find(p => p.id === item.planId);
                                return (
                                    <tr key={item.id} onClick={() => { setSelectedItems(prev => ({ ...prev, edit: item })); toggleModal('finance', true); }} className="border-t border-[#e8dcc8] hover:bg-[#f5f0e6] cursor-pointer group transition-all">
                                        <td className="px-5 py-3 text-xs text-[#a89880] font-mono">{item.datetime || '-'}</td>
                                        <td className="px-5 py-3"><span className={`inline-block whitespace-nowrap text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${item.type === 'income' ? 'bg-[#5d7a5d]/20 text-[#5d7a5d] border-[#5d7a5d]/30' : 'bg-[#9b4d4d]/20 text-[#9b4d4d] border-[#9b4d4d]/30'}`}>{item.type === 'income' ? '수입' : '지출'}</span></td>
                                        <td className="px-5 py-3"><div className="flex items-center gap-2"><span className="text-sm font-bold text-[#42392e] group-hover:text-[#a0714a] transition-colors">{item.title}</span>{item.productUrl && (<a href={item.productUrl.startsWith('http') ? item.productUrl : `https://${item.productUrl}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[#5d6a7a] hover:text-blue-400" title="제품 링크"><ExternalLink size={12} /></a>)}</div></td>
                                        <td className={`px-5 py-3 text-sm font-bold font-mono text-right ${item.type === 'income' ? 'text-[#5d7a5d]' : 'text-[#9b4d4d]'}`}>{item.type === 'income' ? '+' : '-'}₩{Number(item.amount).toLocaleString()}</td>
                                        <td className="px-5 py-3 text-xs text-[#857460] truncate max-w-[120px]">{plan?.topic || '-'}</td>
                                        <td className="px-5 py-3 text-xs text-[#a89880] truncate max-w-[150px]">{item.memo || '-'}</td>
                                        <td className="px-5 py-3 text-right"><button onClick={e => { e.stopPropagation(); setSelectedItems(prev => ({ ...prev, edit: item })); toggleModal('finance', true); }} className="p-1.5 text-[#857460] hover:bg-[#d4c4ac]/50 rounded transition-all opacity-0 group-hover:opacity-100"><Edit size={14} /></button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <div className="vj-card bg-[#faf6ef] rounded-2xl p-4 border border-[#d4c4ac]"><div className="flex items-center gap-2 mb-1"><DollarSign size={16} className="text-[#5d7a5d]" /><span className="text-xs text-[#857460]">총 수입</span></div><div className="text-xl font-black text-[#5d7a5d]">₩{totalIncome.toLocaleString()}</div></div>
                <div className="vj-card bg-[#faf6ef] rounded-2xl p-4 border border-[#d4c4ac]"><div className="flex items-center gap-2 mb-1"><ShoppingBag size={16} className="text-[#9b4d4d]" /><span className="text-xs text-[#857460]">총 지출</span></div><div className="text-xl font-black text-[#9b4d4d]">₩{totalExpense.toLocaleString()}</div></div>
                <div className="vj-card bg-[#faf6ef] rounded-2xl p-4 border border-[#d4c4ac]"><div className="flex items-center gap-2 mb-1"><Activity size={16} className={balance >= 0 ? 'text-[#a0714a]' : 'text-[#9b4d4d]'} /><span className="text-xs text-[#857460]">수지</span></div><div className={`text-xl font-black ${balance >= 0 ? 'text-[#a0714a]' : 'text-[#9b4d4d]'}`}>{balance >= 0 ? '+' : ''}₩{balance.toLocaleString()}</div></div>
            </div>
            <div className="vj-card bg-[#faf6ef] rounded-2xl p-4 border border-[#d4c4ac]">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px] relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a89880]" /><input type="text" placeholder="검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-[#f0e9de] border border-[#d4c4ac] rounded-xl text-sm text-[#42392e] placeholder-[#a89880] focus:outline-none focus:border-[#a0714a]" /></div>
                    <div className="flex p-1 bg-[#f0e9de] rounded-xl">{['all', 'month', 'week', 'day'].map(p => (<button key={p} onClick={() => setPeriodFilter(p)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${periodFilter === p ? 'bg-[#a0714a] text-[#faf6ef]' : 'text-[#857460] hover:bg-[#e8dcc8]'}`}>{p === 'all' ? '전체' : p === 'month' ? '월' : p === 'week' ? '주' : '일'}</button>))}</div>
                    {periodFilter !== 'all' && (<input type="date" value={localSelectedDate} onChange={e => setLocalSelectedDate(e.target.value)} className="px-4 py-2 bg-[#f0e9de] border border-[#d4c4ac] rounded-xl text-sm text-[#42392e]" />)}
                    <div className="flex p-1 bg-[#f0e9de] rounded-xl">{['all', 'income', 'expense'].map(t => (<button key={t} onClick={() => setSubTab(t)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${subTab === t ? (t === 'income' ? 'bg-[#5d7a5d] text-[#faf6ef]' : t === 'expense' ? 'bg-[#9b4d4d] text-[#faf6ef]' : 'bg-[#a0714a] text-[#faf6ef]') : 'text-[#857460] hover:bg-[#e8dcc8]'}`}>{t === 'all' ? '전체' : t === 'income' ? '수입' : '지출'}</button>))}</div>
                    <div className="flex p-1 bg-[#f0e9de] rounded-xl">
                        <button onClick={() => setViewMode('split')} className={`p-2 rounded-lg transition-all ${viewMode === 'split' ? 'bg-[#a0714a] text-[#faf6ef]' : 'text-[#857460] hover:bg-[#e8dcc8]'}`} title="분할 뷰"><LayoutGrid size={16} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#a0714a] text-[#faf6ef]' : 'text-[#857460] hover:bg-[#e8dcc8]'}`} title="리스트 뷰"><Columns size={16} /></button>
                    </div>
                    <button onClick={handleExportCSV} className="px-4 py-2 bg-[#f0e9de] border border-[#d4c4ac] text-[#42392e] font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-[#e8dcc8] transition-all"><Download size={14} /> CSV</button>
                    <button onClick={() => { setSelectedItems(prev => ({ ...prev, edit: null })); toggleModal('finance', true); }} className="px-4 py-2 vj-btn-primary text-[#faf6ef] font-bold rounded-xl text-xs flex items-center gap-2"><Plus size={14} /> 등록</button>
                </div>
            </div>
            {viewMode === 'split' ? (
                <FinanceSplitView filteredItems={filteredItems} plans={plans} onItemClick={(item) => { setSelectedItems(prev => ({ ...prev, edit: item })); toggleModal('finance', true); }} />
            ) : (
                <FinanceListView />
            )}
        </div>
    );
};

// InquirySubTab
const InquirySubTab = () => {
    const { managements, toggleModal, setSelectedItems, operations, showToast } = useApp();
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const inquiries = useMemo(() => managements.filter(m => m.category === 'inquiry').sort((a, b) => new Date(b.receivedDate || 0) - new Date(a.receivedDate || 0)), [managements]);
    const filteredInquiries = useMemo(() => inquiries.filter(item => {
        const typeMatch = filterType === 'all' || item.type === filterType;
        const searchMatch = !debouncedSearchTerm || item.sender?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || item.subject?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || item.content?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        return typeMatch && searchMatch;
    }), [inquiries, filterType, debouncedSearchTerm]);

    const handleStatusChange = useCallback(async (itemId, newStatus) => {
        const item = managements.find(m => m.id === itemId);
        if (!item) return;
        const updated = { ...item, status: newStatus };
        if (await operations.saveManagement(updated, 'inquiry')) {
            showToast('상태가 변경되었습니다.', 'success');
        }
    }, [managements, operations, showToast]);

    return (
        <div className="space-y-4">
            <div className="vj-card bg-[#faf6ef] rounded-2xl p-4 border border-[#d4c4ac]">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px] relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a89880]" /><input type="text" placeholder="검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-[#f0e9de] border border-[#d4c4ac] rounded-xl text-sm text-[#42392e] placeholder-[#a89880] focus:outline-none focus:border-[#a0714a]" /></div>
                    <div className="flex p-1 bg-[#f0e9de] rounded-xl">
                        <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-[#a0714a] text-[#faf6ef]' : 'text-[#857460] hover:bg-[#e8dcc8]'}`}>전체</button>
                        {Object.entries(INQUIRY_CATEGORIES).map(([key, val]) => (<button key={key} onClick={() => setFilterType(key)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === key ? 'bg-[#a0714a] text-[#faf6ef]' : 'text-[#857460] hover:bg-[#e8dcc8]'}`}>{val.label}</button>))}
                    </div>
                    <div className="flex p-1 bg-[#f0e9de] rounded-xl">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#a0714a] text-[#faf6ef]' : 'text-[#857460] hover:bg-[#e8dcc8]'}`}><LayoutGrid size={16} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#a0714a] text-[#faf6ef]' : 'text-[#857460] hover:bg-[#e8dcc8]'}`}><Columns size={16} /></button>
                    </div>
                    <button onClick={() => { setSelectedItems(prev => ({ ...prev, inquiry: null })); toggleModal('inquiry', true); }} className="px-4 py-2 vj-btn-primary text-[#faf6ef] font-bold rounded-xl text-xs flex items-center gap-2"><Plus size={14} /> 등록</button>
                </div>
            </div>
            {viewMode === 'grid' ? (
                <InquiryGridView
                    filteredInquiries={filteredInquiries}
                    onInquiryClick={(item) => { setSelectedItems(prev => ({ ...prev, inquiry: item })); toggleModal('inquiry', true); }}
                    onStatusChange={handleStatusChange}
                />
            ) : (
                <div className="vj-card bg-[#faf6ef] rounded-2xl border border-[#d4c4ac] overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                        {filteredInquiries.length === 0 ? (
                            <div className="text-center py-12"><Inbox size={48} className="text-[#857460] mx-auto mb-4 opacity-50" /><p className="text-[#857460]">등록된 문의 내역이 없습니다.</p></div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-[#f0e9de] sticky top-0">
                                    <tr className="text-left text-xs text-[#a89880]">
                                        <th className="px-5 py-3">분류</th>
                                        <th className="px-5 py-3">대응 상태</th>
                                        <th className="px-5 py-3">보낸 곳</th>
                                        <th className="px-5 py-3">제목 (내용)</th>
                                        <th className="px-5 py-3">수신일</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInquiries.map(item => {
                                        const statusInfo = INQUIRY_STATUS[item.status || 'reviewing'];
                                        return (
                                            <tr key={item.id} onClick={() => { setSelectedItems(prev => ({ ...prev, inquiry: item })); toggleModal('inquiry', true); }} className="border-t border-[#d4c4ac] hover:bg-[#f5f0e6] cursor-pointer group">
                                                <td className="px-5 py-4"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${INQUIRY_CATEGORIES[item.type]?.color || 'bg-[#857460]/20 text-[#857460] border-[#857460]/30'}`}>{INQUIRY_CATEGORIES[item.type]?.label || '기타'}</span></td>
                                                <td className="px-5 py-4"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusInfo.dot }} />{statusInfo.label}</span></td>
                                                <td className="px-5 py-4 text-sm text-[#42392e] font-bold">{item.sender}</td>
                                                <td className="px-5 py-4"><div className="text-sm text-[#42392e] mb-0.5">{item.subject}</div><div className="text-xs text-[#a89880] line-clamp-1 group-hover:text-[#857460]">{item.content}</div></td>
                                                <td className="px-5 py-4 text-xs text-[#a89880] font-mono">{item.receivedDate}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ExternalManagementTab
const ExternalManagementTab = () => {
    const [activeSubTab, setActiveSubTab] = useState('finance');
    return (
        <div className="space-y-4">
            <div className="vj-card bg-[#faf6ef] rounded-2xl p-4 border border-[#d4c4ac]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black text-[#42392e] flex items-center gap-2"><Briefcase size={24} className="text-[#a0714a]" />외부관리</h2>
                        <div className="flex p-1 bg-[#f0e9de] rounded-xl">
                            <button onClick={() => setActiveSubTab('finance')} className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeSubTab === 'finance' ? 'bg-[#a0714a] text-[#faf6ef]' : 'text-[#857460] hover:bg-[#e8dcc8]'}`}><DollarSign size={16} /> 재무</button>
                            <button onClick={() => setActiveSubTab('inquiry')} className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeSubTab === 'inquiry' ? 'bg-[#a0714a] text-[#faf6ef]' : 'text-[#857460] hover:bg-[#e8dcc8]'}`}><Mail size={16} /> 제휴/문의</button>
                        </div>
                    </div>
                </div>
            </div>
            {activeSubTab === 'finance' ? (<FinanceSubTab />) : (<InquirySubTab />)}
        </div>
    );
};

export default ExternalManagementTab;
