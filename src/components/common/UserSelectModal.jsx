import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, Loader, Film } from 'lucide-react';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const DOMAIN = '@fairplay142.com';
const REMEMBER_KEY = 'fp_saved_id';

const UserSelectModal = () => {
    const [idPrefix, setIdPrefix] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const idInputRef = useRef(null);

    // 저장된 아이디 불러오기
    useEffect(() => {
        const saved = localStorage.getItem(REMEMBER_KEY);
        if (saved) {
            setIdPrefix(saved);
            setRememberMe(true);
            // 아이디가 채워져 있으면 비밀번호 필드로 포커스
            setTimeout(() => {
                const pwInput = document.getElementById('fp-password-input');
                if (pwInput) pwInput.focus();
            }, 100);
        } else {
            setTimeout(() => idInputRef.current?.focus(), 100);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        const prefix = idPrefix.trim();
        if (!prefix) { setError('아이디를 입력해주세요.'); idInputRef.current?.focus(); return; }
        if (!password.trim()) { setError('비밀번호를 입력해주세요.'); return; }

        setLoading(true);
        setError('');
        try {
            const email = prefix + DOMAIN;
            await signInWithEmailAndPassword(auth, email, password);
            // 아이디 기억하기 처리
            if (rememberMe) {
                localStorage.setItem(REMEMBER_KEY, prefix);
            } else {
                localStorage.removeItem(REMEMBER_KEY);
            }
            // onAuthStateChanged가 로그인 상태 감지 → 모달 자동 닫힘
        } catch (err) {
            console.error('Login error:', err.code);
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('아이디 또는 비밀번호가 올바르지 않습니다.');
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
            <div className="w-[440px] mx-4">
                {/* 헤더 */}
                <div className="text-center mb-8">
                    <div className="w-18 h-18 bg-gradient-to-br from-[#a0714a] to-[#7a5130] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ width: 72, height: 72 }}>
                        <Film size={32} className="text-[#faf6ef]" />
                    </div>
                    <h1 className="text-3xl font-black text-[#faf6ef]">주간 업무 리포트</h1>
                    <p className="text-[#c4b49a] text-base mt-1">페어플레이 미디어팀</p>
                </div>

                <div className="bg-[#faf6ef] rounded-2xl shadow-2xl overflow-hidden">
                    <form onSubmit={handleLogin} className="p-8">
                        <h2 className="text-2xl font-black text-[#42392e] mb-1">로그인</h2>
                        <p className="text-base text-[#857460] mb-7">아이디와 비밀번호를 입력해주세요</p>

                        {/* 아이디 입력 */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-[#857460] mb-2">
                                아이디
                            </label>
                            <div className="flex items-center bg-white border border-[#d4c4ac] rounded-xl overflow-hidden focus-within:border-[#a0714a] focus-within:ring-2 focus-within:ring-[#a0714a]/20 transition-all">
                                <input
                                    ref={idInputRef}
                                    type="text"
                                    value={idPrefix}
                                    onChange={(e) => { setIdPrefix(e.target.value.replace(/\s/g, '')); setError(''); }}
                                    placeholder="예: sungjun.yoon"
                                    autoComplete="username"
                                    className="flex-1 pl-4 py-3.5 bg-transparent text-base text-[#42392e] focus:outline-none"
                                />
                                <span className="pr-4 text-base text-[#a0714a] font-semibold whitespace-nowrap select-none">
                                    {DOMAIN}
                                </span>
                            </div>
                        </div>

                        {/* 비밀번호 입력 */}
                        <div className="mb-5">
                            <label className="block text-sm font-bold text-[#857460] mb-2">
                                비밀번호
                            </label>
                            <div className="flex items-center bg-white border border-[#d4c4ac] rounded-xl overflow-hidden focus-within:border-[#a0714a] focus-within:ring-2 focus-within:ring-[#a0714a]/20 transition-all">
                                <Lock size={16} className="ml-4 text-[#c4b49a] flex-shrink-0" />
                                <input
                                    id="fp-password-input"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    placeholder="비밀번호 입력"
                                    autoComplete="current-password"
                                    className="flex-1 px-3 py-3.5 bg-transparent text-base text-[#42392e] focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="pr-4 text-[#c4b49a] hover:text-[#857460] transition-colors"
                                    tabIndex={-1}
                                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {error && (
                                <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>
                            )}
                        </div>

                        {/* 아이디 기억하기 */}
                        <div className="flex items-center mb-6">
                            <label className="flex items-center gap-2 cursor-pointer select-none group">
                                <div
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${rememberMe
                                            ? 'bg-[#a0714a] border-[#a0714a]'
                                            : 'bg-white border-[#d4c4ac] group-hover:border-[#a0714a]'
                                        }`}
                                    onClick={() => setRememberMe(v => !v)}
                                >
                                    {rememberMe && (
                                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                                            <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={e => setRememberMe(e.target.checked)}
                                    className="sr-only"
                                />
                                <span className="text-sm text-[#857460] group-hover:text-[#42392e] transition-colors">
                                    아이디 기억하기
                                </span>
                            </label>
                        </div>

                        {/* 로그인 버튼 */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-[#a0714a] to-[#8a5d3a] text-[#faf6ef] text-base font-bold rounded-xl hover:from-[#8a5d3a] hover:to-[#7a4d2a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
                        >
                            {loading ? (
                                <><Loader size={18} className="animate-spin" /> 로그인 중...</>
                            ) : '로그인'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[#857460] text-sm mt-5">
                    비밀번호를 모르는 경우 관리자에게 문의하세요
                </p>
            </div>
        </div>
    );
};

export default UserSelectModal;
