// RichTextEditor component - 이미지 삽입 + % 리사이즈 + 드래그 리사이즈 지원
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, ImagePlus, X } from 'lucide-react';

const RichTextEditor = ({ value, onChange, placeholder, className }) => {
    const editorRef = useRef(null);
    const isComposing = useRef(false);
    const fileInputRef = useRef(null);

    // 선택된 이미지 관련 상태
    const [selectedImg, setSelectedImg] = useState(null); // {el, rect}
    const [imgToolbar, setImgToolbar] = useState(null);   // {top, left}

    // 드래그 리사이즈 관련 ref
    const resizingRef = useRef(null); // { img, startX, startY, startW, startH }

    // ── 초기값 동기화 ──────────────────────────────────────────────────
    useEffect(() => {
        if (editorRef.current && editorRef.current !== document.activeElement) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    // ── execCommand 헬퍼 ──────────────────────────────────────────────
    const execCommand = useCallback((command, val = null) => {
        document.execCommand(command, false, val);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    }, [onChange]);

    // ── 이미지 삽입 ──────────────────────────────────────────────────
    const handleImageInsert = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            // 에디터에 포커스 복원 후 이미지 삽입
            editorRef.current?.focus();
            document.execCommand('insertHTML', false,
                `<img src="${ev.target.result}" style="max-width:100%;width:50%;height:auto;cursor:pointer;display:inline-block;vertical-align:top;" data-rte-img />`
            );
            if (editorRef.current) onChange(editorRef.current.innerHTML);
        };
        reader.readAsDataURL(file);
        // 같은 파일 재선택 허용
        e.target.value = '';
    }, [onChange]);

    // ── 이미지 클릭 → 툴바 표시 ──────────────────────────────────────
    const handleEditorClick = useCallback((e) => {
        const target = e.target;
        if (target.tagName === 'IMG') {
            setSelectedImg(target);
            const editorRect = editorRef.current.getBoundingClientRect();
            const imgRect = target.getBoundingClientRect();
            setImgToolbar({
                top: imgRect.top - editorRect.top - 44,
                left: imgRect.left - editorRect.left,
            });
        } else {
            setSelectedImg(null);
            setImgToolbar(null);
        }
    }, []);

    // ── % 리사이즈 ───────────────────────────────────────────────────
    const resizeSelectedImg = useCallback((pct) => {
        if (!selectedImg) return;
        selectedImg.style.width = `${pct}%`;
        selectedImg.style.height = 'auto';
        // 툴바 위치 재계산
        const editorRect = editorRef.current.getBoundingClientRect();
        const imgRect = selectedImg.getBoundingClientRect();
        setImgToolbar({
            top: imgRect.top - editorRect.top - 44,
            left: imgRect.left - editorRect.left,
        });
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    }, [selectedImg, onChange]);

    // ── 이미지 삭제 ──────────────────────────────────────────────────
    const deleteSelectedImg = useCallback(() => {
        if (!selectedImg) return;
        selectedImg.remove();
        setSelectedImg(null);
        setImgToolbar(null);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    }, [selectedImg, onChange]);

    // ── 드래그 리사이즈 핸들 ─────────────────────────────────────────
    // SE 모서리에 작은 핸들을 그려주고 mousedown으로 드래그 시작
    const ResizeHandle = ({ img }) => {
        if (!img) return null;
        const editorEl = editorRef.current;
        if (!editorEl) return null;
        const editorRect = editorEl.getBoundingClientRect();
        const imgRect = img.getBoundingClientRect();

        const handleMouseDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            resizingRef.current = {
                img,
                startX: e.clientX,
                startY: e.clientY,
                startW: img.offsetWidth,
            };

            const onMouseMove = (me) => {
                if (!resizingRef.current) return;
                const { img: rImg, startX, startW } = resizingRef.current;
                const dx = me.clientX - startX;
                const newW = Math.max(40, startW + dx);
                rImg.style.width = `${newW}px`;
                rImg.style.height = 'auto';
                // 툴바 위치 갱신
                const er = editorEl.getBoundingClientRect();
                const ir = rImg.getBoundingClientRect();
                setImgToolbar({ top: ir.top - er.top - 44, left: ir.left - er.left });
            };

            const onMouseUp = () => {
                if (resizingRef.current && editorRef.current) {
                    onChange(editorRef.current.innerHTML);
                }
                resizingRef.current = null;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };

        return (
            <div
                onMouseDown={handleMouseDown}
                style={{
                    position: 'absolute',
                    top: imgRect.bottom - editorRect.top - 10,
                    left: imgRect.right - editorRect.left - 10,
                    width: 14,
                    height: 14,
                    backgroundColor: '#4d5a6a',
                    borderRadius: 3,
                    cursor: 'se-resize',
                    zIndex: 20,
                    border: '2px solid #faf6ef',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}
                title="드래그하여 크기 조절"
            />
        );
    };

    const toolbarButtons = [
        { icon: Bold, cmd: 'bold', title: '굵게' },
        { icon: Italic, cmd: 'italic', title: '기울임' },
        { icon: Underline, cmd: 'underline', title: '밑줄' },
        { icon: List, cmd: 'insertUnorderedList', title: '목록' },
        { icon: AlignLeft, cmd: 'justifyLeft', title: '왼쪽' },
        { icon: AlignCenter, cmd: 'justifyCenter', title: '가운데' },
        { icon: AlignRight, cmd: 'justifyRight', title: '오른쪽' },
    ];

    return (
        <div className={`border border-[#d4c4ac] rounded-xl overflow-hidden flex flex-col ${className || ''}`}>
            {/* ── 툴바 ── */}
            <div className="flex items-center gap-1 p-2 border-b border-[#e8dcc8] bg-[#f0e9de] flex-wrap flex-shrink-0">
                {toolbarButtons.map(({ icon: Icon, cmd, title }) => (
                    <button
                        key={cmd}
                        onMouseDown={(e) => { e.preventDefault(); execCommand(cmd); }}
                        className="p-1.5 rounded hover:bg-[#e8dcc8] text-[#857460] hover:text-[#42392e] transition-colors"
                        title={title}
                    >
                        <Icon size={14} />
                    </button>
                ))}
                <div className="w-px h-5 bg-[#d4c4ac] mx-1" />
                <select
                    onChange={(e) => execCommand('fontSize', e.target.value)}
                    className="text-xs bg-transparent text-[#857460] border-none outline-none cursor-pointer"
                    defaultValue="3"
                >
                    <option value="1">작게</option>
                    <option value="3">보통</option>
                    <option value="5">크게</option>
                    <option value="7">매우 크게</option>
                </select>
                <div className="w-px h-5 bg-[#d4c4ac] mx-1" />
                {/* 이미지 삽입 버튼 */}
                <button
                    onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                    className="p-1.5 rounded hover:bg-[#e8dcc8] text-[#857460] hover:text-[#42392e] transition-colors"
                    title="이미지 삽입"
                >
                    <ImagePlus size={14} />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageInsert}
                />
            </div>

            {/* ── 에디터 영역 (relative로 툴바/핸들 포지셔닝 기준) ── */}
            <div className="relative flex-1 min-h-[200px]">
                {/* 이미지 선택 시 % 리사이즈 툴바 */}
                {selectedImg && imgToolbar && (
                    <div
                        className="absolute z-10 flex items-center gap-1 bg-[#42392e] text-[#faf6ef] rounded-lg px-2 py-1 shadow-xl text-[11px] font-bold select-none"
                        style={{ top: Math.max(4, imgToolbar.top), left: imgToolbar.left }}
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        <span className="text-[#a89880] mr-1">사이즈</span>
                        {[25, 50, 75, 100].map(pct => (
                            <button
                                key={pct}
                                onClick={() => resizeSelectedImg(pct)}
                                className="px-2 py-0.5 rounded hover:bg-[#6a5d50] transition-colors"
                            >
                                {pct}%
                            </button>
                        ))}
                        <div className="w-px h-4 bg-[#6a5d50] mx-1" />
                        <button
                            onClick={deleteSelectedImg}
                            className="p-0.5 rounded hover:bg-[#9b4d4d] transition-colors"
                            title="이미지 삭제"
                        >
                            <X size={12} />
                        </button>
                    </div>
                )}

                {/* SE 드래그 핸들 */}
                {selectedImg && <ResizeHandle img={selectedImg} />}

                {/* 선택 이미지 테두리 표시 */}
                {selectedImg && (() => {
                    const editorRect = editorRef.current?.getBoundingClientRect();
                    const imgRect = selectedImg.getBoundingClientRect();
                    if (!editorRect) return null;
                    return (
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                top: imgRect.top - editorRect.top,
                                left: imgRect.left - editorRect.left,
                                width: imgRect.width,
                                height: imgRect.height,
                                outline: '2px solid #4d5a6a',
                                borderRadius: 2,
                                zIndex: 5,
                            }}
                        />
                    );
                })()}

                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="p-4 h-full text-sm text-[#42392e] bg-[#faf6ef] focus:outline-none leading-relaxed overflow-y-auto"
                    style={{ minHeight: '200px' }}
                    data-placeholder={placeholder || ''}
                    onCompositionStart={() => { isComposing.current = true; }}
                    onCompositionEnd={() => {
                        isComposing.current = false;
                        if (editorRef.current) onChange(editorRef.current.innerHTML);
                    }}
                    onInput={() => {
                        if (!isComposing.current && editorRef.current) {
                            onChange(editorRef.current.innerHTML);
                        }
                    }}
                    onClick={handleEditorClick}
                />
            </div>
        </div>
    );
};

export default RichTextEditor;
