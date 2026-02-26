import React from 'react';
import { AlertTriangle, Trash, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ConfirmModal = () => {
    const { confirmDialog, closeConfirm } = useApp();
    if (!confirmDialog.isOpen) return null;
    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-[#3a2d20]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#faf6ef] p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-all scale-100 border border-[#e8dcc8]">
                <h3 className="font-bold text-lg mb-2 text-[#42392e] flex items-center gap-2">
                    <AlertTriangle className="text-[#9b4d4d]" size={24} />
                    {confirmDialog.type === 'delete_option' ? '일정 삭제 옵션' :
                        confirmDialog.type === 'restore_option' ? '복원 방식 선택' : '확인'}
                </h3>
                <p className="text-[#5a4d40] mb-6 text-sm leading-relaxed whitespace-pre-wrap">
                    {confirmDialog.message}
                </p>

                {confirmDialog.type === 'restore_option' ? (
                    <div className="flex flex-col gap-2">
                        <button onClick={confirmDialog.onConfirm} className="w-full py-3 bg-[#9b4d4d] text-[#faf6ef] rounded-lg text-sm font-bold hover:bg-rose-600 transition-colors shadow-md flex items-center justify-center gap-2">
                            <Trash size={16} /> 전체 삭제 후 복원 (덮어쓰기)
                        </button>
                        <button onClick={confirmDialog.onOption} className="w-full py-3 bg-[#faf6ef] border border-[#5d6a7a]/40 text-[#4d5a6a] rounded-lg text-sm font-bold hover:bg-[#5d6a7a]/10 transition-colors flex items-center justify-center gap-2">
                            <Plus size={16} /> 기존 유지 + 추가 (병합)
                        </button>
                        <button onClick={closeConfirm} className="w-full py-2 text-[#857460] text-xs font-bold hover:text-[#5a4d40] mt-2">취소</button>
                    </div>
                ) : confirmDialog.type === 'delete_option' ? (
                    <div className="flex flex-col gap-2">
                        <button onClick={confirmDialog.onConfirm} className="w-full py-3 bg-[#9b4d4d] text-[#faf6ef] rounded-lg text-sm font-bold hover:bg-rose-600 transition-colors shadow-md flex items-center justify-center gap-2">
                            <Trash size={16} /> 전체 일정 삭제 (모든 날짜)
                        </button>
                        <button onClick={confirmDialog.onOption} className="w-full py-3 bg-[#faf6ef] border border-[#9b4d4d]/40 text-[#8b3d3d] rounded-lg text-sm font-bold hover:bg-[#9b4d4d]/10 transition-colors flex items-center justify-center gap-2">
                            <CalendarIcon size={16} /> 이 날짜만 제외
                        </button>
                        <button onClick={closeConfirm} className="w-full py-2 text-[#857460] text-xs font-bold hover:text-[#5a4d40] mt-2">취소</button>
                    </div>
                ) : (
                    <div className="flex justify-end gap-2">
                        <button onClick={closeConfirm} className="px-4 py-2 bg-[#f5f0e6] text-[#5a4d40] rounded-lg text-sm font-bold hover:bg-[#e8dcc8] transition-colors">취소</button>
                        <button onClick={confirmDialog.onConfirm} className="px-4 py-2 bg-[#9b4d4d] text-[#faf6ef] rounded-lg text-sm font-bold hover:bg-rose-600 transition-colors shadow-md">확인 / 삭제</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfirmModal;
