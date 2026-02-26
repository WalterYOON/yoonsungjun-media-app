// RichTextEditor component - 원본에서 사용되는 간단한 리치텍스트 에디터
import React, { useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';

const RichTextEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);
    const isComposing = useRef(false);

    // 초기값 및 외부에서 value가 바뀔 때만 innerHTML을 동기화
    // (단, 현재 포커스 중이면 커서 위치 보호를 위해 무시)
    useEffect(() => {
        if (editorRef.current && editorRef.current !== document.activeElement) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const execCommand = useCallback((command, val = null) => {
        document.execCommand(command, false, val);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

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
        <div className="border border-[#d4c4ac] rounded-xl overflow-hidden">
            <div className="flex items-center gap-1 p-2 border-b border-[#e8dcc8] bg-[#f0e9de]">
                {toolbarButtons.map(({ icon: Icon, cmd, title }) => (
                    <button
                        key={cmd}
                        onMouseDown={(e) => {
                            // 툴바 버튼 클릭 시 에디터의 포커스/선택 영역이 사라지지 않도록 방지
                            e.preventDefault();
                            execCommand(cmd);
                        }}
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
            </div>
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="p-4 min-h-[200px] text-sm text-[#42392e] bg-[#faf6ef] focus:outline-none leading-relaxed"
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
            />
        </div>
    );
};

export default RichTextEditor;
