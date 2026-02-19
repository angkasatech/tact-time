import React, { useState, useEffect } from 'react';
import ActiveTimer from './ActiveTimer';
import VINList from './VINList';
import { exportToExcel } from '../utils/excelExport';
import { getAllRecords } from '../utils/database';
import './Dashboard.css';

const Dashboard = ({ activeRecording, onStartNew, onFinish, onOpenAnalytics }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Hidden keyboard shortcut for admin export (Ctrl+Shift+E)
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                handleExport();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    const handleExport = async () => {
        const records = await getAllRecords();
        exportToExcel(records);
    };

    return (
        <div className="dashboard-layout">
            <div className="dashboard-main">
                <div className="dashboard-header">
                    <div className="logo-container">
                        <img src="/logo.png" alt="Company Logo" className="company-logo" />
                    </div>
                    <div className="header-title">
                        <h1>Tact Time Tracker</h1>
                        <p className="dashboard-subtitle">Record repair station tact times</p>
                    </div>
                    <div className="header-right">
                        <button
                            className="btn btn-secondary analytics-nav-btn"
                            onClick={onOpenAnalytics}
                        >
                            📊 Analytics
                        </button>
                        <div className="datetime-display">
                            <div className="date-text">{currentTime.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                            <div className="time-text">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        </div>
                    </div>
                </div>

                {activeRecording ? (
                    <ActiveTimer
                        vin={activeRecording.vin}
                        category={activeRecording.category}
                        startTime={activeRecording.startTime}
                        onFinish={onFinish}
                    />
                ) : (
                    <div className="start-container glass-card">
                        <div className="start-content">
                            {/* <div className="start-icon">🚀</div> */}
                            <h2>Ready to Start</h2>
                            <p className="text-muted">
                                Click below to scan a VIN and begin recording
                            </p>
                            <button className="btn btn-primary btn-large" onClick={onStartNew}>
                                Start New Recording
                            </button>
                        </div>
                    </div>
                )}

                {/* Export button hidden - Use Ctrl+Shift+E to export */}
            </div>

            <div className="dashboard-sidebar">
                <VINList />
            </div>
        </div>
    );
};

export default Dashboard;
