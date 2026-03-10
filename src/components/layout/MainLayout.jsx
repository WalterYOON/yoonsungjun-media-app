// MainLayout - 원본 라인 4044~4081
import React, { useState, useEffect } from 'react';
import { Layout, Calendar as CalendarIcon, Film, Briefcase, Settings, Loader } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import VintageStyles from '../../styles/VintageStyles';
import { Toast } from '../common/Toast';
import ConfirmModal from '../common/ConfirmModal';
import UserSelectModal from '../common/UserSelectModal';
import PlanModal from '../modals/PlanModal';
import ScheduleModal from '../modals/ScheduleModal';
import FinanceModal from '../modals/FinanceModal';
import InquiryModal from '../modals/InquiryModal';
import { ReportDraftModal, DetailModal, SearchResultModal, TeamMemberDetailModal, ThumbnailModal, ExternalModal } from '../modals/SmallModals';
import { DashboardTab, ScheduleTab } from '../tabs/DashboardScheduleTabs';
import ProjectTab from '../tabs/ProjectTab';
import ExternalManagementTab from '../tabs/ExternalManagementTab';
import SettingsTab from '../tabs/SettingsTab';

const MAIN_TABS = [
    { key: 'dashboard', label: '대시보드', icon: Layout },
    { key: 'schedule', label: '일정', icon: CalendarIcon },
    { key: 'project', label: '프로젝트', icon: Film },
    { key: 'external', label: '외부관리', icon: Briefcase },
    { key: 'settings', label: '설정', icon: Settings },
];

const MainLayout = () => {
    const { profile, loading, modals, toggleModal } = useApp();
    const [mainTab, setMainTab] = useState('dashboard');

    // Esc 키로 열린 모달 닫기
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key !== 'Escape') return;
            // 우선순위 순으로 열린 모달 닫기
            const priority = ['schedule', 'plan', 'finance', 'inquiry', 'external', 'report', 'detail', 'search', 'memberDetail', 'thumbnail'];
            const openModal = priority.find(key => modals[key]);
            if (openModal) toggleModal(openModal, false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modals, toggleModal]);

    if (loading) return (<div className="min-h-screen vj-texture flex items-center justify-center"><Loader className="animate-spin text-[#a0714a]" size={48} /></div>);
    if (!profile) return <><VintageStyles /><UserSelectModal /></>;

    return (
        <div className="min-h-screen vj-texture text-[#42392e]">
            <VintageStyles />
            <Toast /><ConfirmModal />
            <PlanModal /><ScheduleModal /><ReportDraftModal /><FinanceModal /><InquiryModal /><DetailModal /><SearchResultModal /><TeamMemberDetailModal /><ThumbnailModal /><ExternalModal />
            <header className="vj-card border-b border-[#d4c4ac] sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-6">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4"><div className="w-14 h-14 bg-gradient-to-br from-[#a0714a] to-[#8a5d3a] rounded-xl flex items-center justify-center shadow-md"><Film size={26} className="text-[#faf6ef]" /></div><div><h1 className="text-3xl font-black text-[#42392e]">주간 업무 리포트</h1><p className="text-sm text-[#857460]">팀 업무 현황 통합 관리 · <span className="text-[#a0714a] font-bold">{profile}</span></p></div></div>
                    </div>
                    <div className="flex">{MAIN_TABS.map(tab => { const Icon = tab.icon; const isActive = mainTab === tab.key; return (<button key={tab.key} onClick={() => setMainTab(tab.key)} className={`flex-1 py-6 text-lg font-bold rounded-t-xl flex items-center justify-center gap-2.5 transition-all ${isActive ? 'bg-[#f0e9de] text-[#a0714a] border-t-2 border-x border-[#a0714a] border-[#d4c4ac]' : 'text-[#857460] hover:text-[#42392e] hover:bg-[#f5f0e6]'}`}><Icon size={21} /> {tab.label}</button>); })}</div>
                </div>
            </header>
            <main className="max-w-[1600px] mx-auto p-6">
                {mainTab === 'dashboard' && <DashboardTab />}
                {mainTab === 'schedule' && <ScheduleTab />}
                {mainTab === 'project' && <ProjectTab />}
                {mainTab === 'external' && <ExternalManagementTab />}
                {mainTab === 'settings' && <SettingsTab />}
            </main>
        </div>
    );
};

export default MainLayout;
