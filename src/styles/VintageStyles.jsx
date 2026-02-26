import React from 'react';

const VintageStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700;900&display=swap');
    
    :root {
      --vj-bg: #f0e9de;
      --vj-card: #faf6ef;
      --vj-card-hover: #f5f0e6;
      --vj-border: #d4c4ac;
      --vj-border-light: #e8dcc8;
      --vj-text: #42392e;
      --vj-text-sub: #857460;
      --vj-text-muted: #a89880;
      --vj-accent: #a0714a;
      --vj-accent-light: #c4a574;
      --vj-accent-hover: #8a5d3a;
      --vj-success: #5d7a5d;
      --vj-warning: #b8860b;
      --vj-danger: #9b4d4d;
      --vj-info: #5d6a7a;
    }
    
    * {
      font-family: 'Noto Serif KR', 'Nanum Myeongjo', Georgia, serif !important;
    }
    
    .vj-texture {
      background-color: var(--vj-bg);
      background-image: 
        linear-gradient(90deg, rgba(139,119,101,0.03) 1px, transparent 1px),
        linear-gradient(rgba(139,119,101,0.03) 1px, transparent 1px),
        radial-gradient(circle at 50% 50%, rgba(180,160,130,0.05) 0%, transparent 100%);
      background-size: 20px 20px, 20px 20px, 100% 100%;
    }
    
    .vj-card {
      background: linear-gradient(145deg, var(--vj-card) 0%, #f7f2e8 50%, var(--vj-card) 100%);
      box-shadow: 
        0 1px 3px rgba(66,57,46,0.08),
        0 4px 12px rgba(66,57,46,0.04),
        inset 0 1px 0 rgba(255,255,255,0.6),
        inset 0 -1px 0 rgba(139,119,101,0.1);
      border: 1px solid var(--vj-border-light);
    }
    
    .vj-card:hover {
      box-shadow: 
        0 2px 8px rgba(66,57,46,0.12),
        0 8px 24px rgba(66,57,46,0.08),
        inset 0 1px 0 rgba(255,255,255,0.6);
    }
    
    .vj-input {
      background: #fdfbf7;
      border: 1px solid var(--vj-border);
      color: var(--vj-text);
      transition: all 0.2s ease;
    }
    
    .vj-input:focus {
      border-color: var(--vj-accent);
      box-shadow: 0 0 0 3px rgba(160,113,74,0.15);
      outline: none;
    }
    
    .vj-input::placeholder {
      color: var(--vj-text-muted);
    }
    
    .vj-btn-primary {
      background: linear-gradient(135deg, var(--vj-accent) 0%, #8a5d3a 100%);
      color: #faf6ef;
      border: none;
      box-shadow: 0 2px 8px rgba(160,113,74,0.3);
      transition: all 0.2s ease;
    }
    
    .vj-btn-primary:hover {
      background: linear-gradient(135deg, #8a5d3a 0%, #7a4d2a 100%);
      box-shadow: 0 4px 12px rgba(160,113,74,0.4);
      transform: translateY(-1px);
    }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: var(--vj-bg);
      border-radius: 4px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: var(--vj-border);
      border-radius: 4px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: var(--vj-text-muted);
    }
    
    .vj-badge {
      background: rgba(160,113,74,0.15);
      color: var(--vj-accent);
      border: 1px solid rgba(160,113,74,0.3);
    }
  `}</style>
);

export default VintageStyles;
