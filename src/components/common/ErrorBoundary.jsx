// ErrorBoundary component
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#faf6ef] p-8">
                    <div className="max-w-md text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-xl font-black text-[#42392e] mb-2">오류가 발생했습니다</h2>
                        <p className="text-sm text-[#857460] mb-4">
                            {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-[#a0714a] text-[#faf6ef] font-bold rounded-xl text-sm hover:bg-[#8a5d3a] transition-all"
                        >
                            새로고침
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
