import React from 'react';

/**
 * EmptyState — 공통 빈 상태 컴포넌트
 *
 * Props:
 *   icon       : lucide-react 아이콘 컴포넌트 (예: Film, ClipboardList)
 *   iconSize   : 아이콘 크기 (default: 40)
 *   title      : 메인 문구 (string)
 *   description: 부 설명 문구 (string, optional)
 *   action     : 버튼 설정 { label: string, onClick: fn } (optional)
 *   className  : 추가 CSS 클래스 (optional)
 *   compact    : true 이면 패딩을 줄여 작은 영역에 맞음
 */
const EmptyState = ({
    icon: Icon,
    iconSize = 40,
    title,
    description,
    action,
    className = '',
    compact = false,
}) => (
    <div
        className={`flex flex-col items-center justify-center text-center
            ${compact ? 'py-6 gap-2' : 'py-12 gap-3'}
            ${className}`}
    >
        {Icon && (
            <Icon
                size={iconSize}
                className="text-[#c4b49a] opacity-60"
            />
        )}
        {title && (
            <p className={`font-bold ${compact ? 'text-sm' : 'text-base'} text-[#a89880]`}>
                {title}
            </p>
        )}
        {description && (
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-[#c4b49a]`}>
                {description}
            </p>
        )}
        {action && (
            <button
                onClick={action.onClick}
                className="mt-1 px-4 py-2 bg-[#a0714a]/10 hover:bg-[#a0714a]/20 text-[#a0714a] font-bold text-sm rounded-lg border border-[#a0714a]/30 transition-all"
            >
                {action.label}
            </button>
        )}
    </div>
);

export default EmptyState;
