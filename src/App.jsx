// App.jsx - 원본 라인 4086~4094
import React from 'react';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';

const App = () => (
    <ErrorBoundary>
        <AppProvider>
            <MainLayout />
        </AppProvider>
    </ErrorBoundary>
);

export default App;
