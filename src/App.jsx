import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import BarcodeScanner from './components/BarcodeScanner';
import CategorySelector from './components/CategorySelector';
import Login from './components/Login';
import {
    getActiveRecording,
    saveActiveRecording,
    clearActiveRecording
} from './utils/storage';
import { saveRecord, initializeDatabase } from './utils/database';
import './App.css';

function App() {
    const [view, setView] = useState('dashboard'); // 'dashboard', 'scanner', 'category'
    const [scannedVin, setScannedVin] = useState('');
    const [activeRecording, setActiveRecording] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check for existing session
        const session = localStorage.getItem('tacttime_session');
        if (session) {
            setIsLoggedIn(true);
        }

        // Initialize database on mount
        initializeDatabase();

        // Check for active recording on mount (persist across page refreshes)
        const active = getActiveRecording();
        if (active) {
            setActiveRecording(active);
            setView('dashboard');
        }
    }, []);

    const handleLogin = (username) => {
        setIsLoggedIn(true);
    };

    const handleStartNew = () => {
        setView('scanner');
    };

    const handleScanComplete = (vin) => {
        setScannedVin(vin);
        setView('category');
    };

    const handleCategorySelect = (category) => {
        const recording = {
            vin: scannedVin,
            category,
            startTime: new Date().toISOString()
        };

        // Save to localStorage
        saveActiveRecording(recording);
        setActiveRecording(recording);
        setView('dashboard');
    };

    const handleFinish = async (totalPausedTime = 0) => {
        if (!activeRecording) return;

        const record = {
            vin: activeRecording.vin,
            category: activeRecording.category,
            startTime: activeRecording.startTime,
            endTime: new Date().toISOString(),
            totalPausedTime // Store pause time in milliseconds
        };

        // Save to database
        const success = await saveRecord(record);

        if (success) {
            // Clear active recording
            clearActiveRecording();
            setActiveRecording(null);
            setScannedVin('');
            setView('dashboard');
        } else {
            alert('Failed to save record. Please try again.');
        }
    };

    const handleBack = () => {
        setView('dashboard');
    };

    // Show login screen if not authenticated
    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="app">
            {view === 'dashboard' && (
                <Dashboard
                    activeRecording={activeRecording}
                    onStartNew={handleStartNew}
                    onFinish={handleFinish}
                />
            )}

            {view === 'scanner' && (
                <div className="single-view">
                    <button className="btn btn-secondary back-button" onClick={handleBack}>
                        ← Back to Dashboard
                    </button>
                    <BarcodeScanner onScanComplete={handleScanComplete} />
                </div>
            )}

            {view === 'category' && (
                <div className="single-view">
                    <button className="btn btn-secondary back-button" onClick={handleBack}>
                        ← Back to Dashboard
                    </button>
                    <CategorySelector
                        vin={scannedVin}
                        onCategorySelect={handleCategorySelect}
                    />
                </div>
            )}
        </div>
    );
}

export default App;
