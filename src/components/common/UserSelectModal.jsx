import React, { useState } from 'react';
import { User, ChevronRight, ArrowLeft, Lock, Loader, Film } from 'lucide-react';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { TEAM_ACCOUNTS } from '../../config/constants';

const UserSelectModal = () => {
    const [step, setStep] = useState('select'); // 'select' | 'password'
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSelectAccount = (account) => {
        setSelectedAccount(account);
        setPassword('');
        setError('');
        setStep('password');
    };

    const handleBack = () => {
        setStep('select');
        setSelectedAccount(null);
        setPassword('');
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!password.trim()) { setError('비밀번호를 입력해주세요.'); return; }
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, selectedAccount.email, password);
            // onAuthStateChanged가 profile 자동 설정 → UserSelectModal 사라짐
        } catch (err) {
            console.error('Login error:', err.code);
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('비밀번호가 올바르지 않습니다.');
            } else if (err.code === 'auth/user-not-found') {
                setError('등록되지 않은 계정입니다.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.');
            } else if (err.code === 'auth/network-request-failed') {
                setError('네트워크 연결을 확인해주세요.');
            } else {
                setError('로그인에 실패했습니다. 다시 시도해주세요.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] bg-[#2a2018]/90 flex items-center justify-center backdrop-blur-sm">
            <div className="w-[420px] mx-4">
                {/* 헤더 */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#a0714a] to-[#7a5130] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Film size={28} className="text-[#faf6ef]" />
                    </div>
                    <h1 className="text-2xl font-black text-[#faf6ef]">주간 업무 리포트</h1>
                    <p className="text-[#c4b49a] text-sm mt-1">페어플레이 미디어팀</p>
                </div>

                <div className="bg-[#faf6ef] rounded-2xl shadow-2xl overflow-hidden">
                    {step === 'select' ? (
                        /* ── 1단계: 팀원 선택 ── */
                        <div className="p-8">
                            <h2 className="text-lg font-black text-[#42392e] mb-1">로그인</h2>
                            <p className="text-sm text-[#857460] mb-6">본인 계정을 선택해주세요</p>
                            <div className="space-y-2">
                                {TEAM_ACCOUNTS.map((account) => (
                                    <button
                                        key={account.email}
                                        onClick={() => handleSelectAccount(account)}
                                        className="w-full flex items-center gap-4 p-4 bg-[#faf6ef] border border-[#d4c4ac] rounded-xl hover:border-[#a0714a] hover:bg-[#f5ede0] transition-all group"
                                    >
                                        <div className={`w-10 h-10 ${account.color} rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                                            {account.avatar}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-bold text-[#42392e] text-sm">{account.name}</p>
                                            <p className="text-xs text-[#857460]">{account.email}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-[#c4b49a] group-hover:text-[#a0714a] transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* ── 2단계: 비밀번호 입력 ── */
                        <form onSubmit={handleLogin} className="p-8">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex items-center gap-1 text-sm text-[#857460] hover:text-[#42392e] mb-6 transition-colors"
                            >
                                <ArrowLeft size={14} />
                                다른 계정 선택
                            </button>

                            {/* 선택한 계정 표시 */}
                            <div className="flex items-center gap-3 mb-6 p-3 bg-[#f5ede0] rounded-xl border border-[#d4c4ac]">
                                <div className={`w-10 h-10 ${selectedAccount.color} rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                                    {selectedAccount.avatar}
                                </div>
                                <div>
                                    <p className="font-bold text-[#42392e] text-sm">{selectedAccount.name}</p>
                                    <p className="text-xs text-[#857460]">{selectedAccount.email}</p>
                                </div>
                            </div>

                            {/* 비밀번호 입력 */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-[#857460] mb-2 uppercase tracking-wide">
                                    비밀번호
                                </label>
                                <div className="relative">
                                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c4b49a]" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                        placeholder="비밀번호 입력"
                                        autoFocus
                                        className="w-full pl-9 pr-4 py-3 bg-white border border-[#d4c4ac] rounded-xl text-sm text-[#42392e] focus:outline-none focus:border-[#a0714a] focus:ring-2 focus:ring-[#a0714a]/20"
                                    />
                                </div>
                                {error && (
                                    <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-[#a0714a] to-[#8a5d3a] text-[#faf6ef] font-bold rounded-xl hover:from-[#8a5d3a] hover:to-[#7a4d2a] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><Loader size={16} className="animate-spin" /> 로그인 중...</>
                                ) : '로그인'}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-[#857460] text-xs mt-4">
                    비밀번호를 모르는 경우 관리자에게 문의하세요
                </p>
            </div>
        </div>
    );
};

export default UserSelectModal;
