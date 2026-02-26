export const handleFirebaseError = (error, context = '작업') => {
    console.error(`[${context}] Error:`, error);
    let userMessage = '알 수 없는 오류가 발생했습니다.';
    let isRetryable = false;
    if (error.code) {
        switch (error.code) {
            case 'permission-denied': userMessage = '권한이 없습니다.'; break;
            case 'unavailable': userMessage = '네트워크 연결 불안정.'; isRetryable = true; break;
            case 'resource-exhausted': userMessage = '요청량 초과.'; isRetryable = true; break;
            case 'deadline-exceeded': userMessage = '응답 시간 초과.'; isRetryable = true; break;
            default: userMessage = `오류 (${error.code})`;
        }
    } else { userMessage = error.message; }
    return { message: userMessage, isRetryable };
};

export const retryWithBackoff = async (operation, options = {}) => {
    const { maxRetries = 3, baseDelay = 1000, context = 'operation' } = options;
    let retries = 0;
    while (true) {
        try { return await operation(); }
        catch (error) {
            const { isRetryable } = handleFirebaseError(error, context);
            if (retries >= maxRetries || !isRetryable) throw error;
            retries++;
            const delay = baseDelay * Math.pow(2, retries - 1) + Math.random() * 100;
            console.log(`[${context}] 재시도 ${retries}/${maxRetries} (${delay.toFixed(0)}ms)`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

export const generateGroupId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
