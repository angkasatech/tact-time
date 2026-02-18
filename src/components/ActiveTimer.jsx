import React, { useState, useEffect } from 'react';
import { formatElapsedTime, getElapsedTime } from '../utils/timer';
import './ActiveTimer.css';

const ActiveTimer = ({ vin, category, startTime, onFinish }) => {
    const [elapsed, setElapsed] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseStartTime, setPauseStartTime] = useState(null);
    const [totalPausedTime, setTotalPausedTime] = useState(0);

    useEffect(() => {
        // Load pause state from localStorage if exists
        const savedState = localStorage.getItem('tacttime_pause_state');
        if (savedState) {
            const { isPaused: savedPaused, pauseStartTime: savedPauseStart, totalPausedTime: savedTotal } = JSON.parse(savedState);
            setIsPaused(savedPaused);
            setPauseStartTime(savedPauseStart);
            setTotalPausedTime(savedTotal || 0);
        }
    }, []);

    useEffect(() => {
        // Save pause state to localStorage
        localStorage.setItem('tacttime_pause_state', JSON.stringify({
            isPaused,
            pauseStartTime,
            totalPausedTime
        }));
    }, [isPaused, pauseStartTime, totalPausedTime]);

    useEffect(() => {
        if (isPaused) return; // Don't update timer when paused

        // Update timer every second
        const interval = setInterval(() => {
            const rawElapsed = getElapsedTime(startTime);
            const currentPauseTime = pauseStartTime ? getElapsedTime(pauseStartTime) : 0;
            setElapsed(rawElapsed - totalPausedTime - currentPauseTime);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime, isPaused, totalPausedTime, pauseStartTime]);

    const handlePause = () => {
        setIsPaused(true);
        setPauseStartTime(Date.now());
    };

    const handleResume = () => {
        if (pauseStartTime) {
            const pauseDuration = getElapsedTime(pauseStartTime);
            setTotalPausedTime(prev => prev + pauseDuration);
        }
        setIsPaused(false);
        setPauseStartTime(null);
    };

    const handleFinish = () => {
        // Clear pause state from localStorage
        localStorage.removeItem('tacttime_pause_state');

        // If paused when finishing, add current pause duration
        let finalPausedTime = totalPausedTime;
        if (isPaused && pauseStartTime) {
            finalPausedTime += getElapsedTime(pauseStartTime);
        }

        onFinish(finalPausedTime);
    };

    return (
        <div className="timer-container glass-card">
            <div className="timer-header">
                <div className={`recording-indicator ${isPaused ? 'paused' : ''}`}>
                    <span className={isPaused ? 'pause-icon' : 'pulse-dot'}></span>
                    <span>{isPaused ? 'Paused' : 'Recording'}</span>
                </div>
            </div>

            <div className="timer-display">
                <div className="timer-value">{formatElapsedTime(elapsed)}</div>
                <div className="timer-label">Work Time</div>
                {totalPausedTime > 0 && (
                    <div className="pause-time-info">
                        Break time: {formatElapsedTime(totalPausedTime)}
                    </div>
                )}
            </div>

            <div className="timer-info">
                <div className="info-item">
                    <div className="info-label">VIN Number</div>
                    <div className="info-value vin-text">{vin}</div>
                </div>
                <div className="info-item">
                    <div className="info-label">Category</div>
                    <div className="info-value">
                        <span className="badge badge-success">{category}</span>
                    </div>
                </div>
                <div className="info-item">
                    <div className="info-label">Started At</div>
                    <div className="info-value">
                        {new Date(startTime).toLocaleTimeString()}
                    </div>
                </div>
            </div>

            <div className="timer-actions">
                {isPaused ? (
                    <button className="btn btn-primary btn-resume" onClick={handleResume}>
                        ▶️ Resume
                    </button>
                ) : (
                    <button className="btn btn-warning btn-pause" onClick={handlePause}>
                        ⏸️ Pause
                    </button>
                )}
                <button className="btn btn-success btn-finish" onClick={handleFinish}>
                    ✅ Finish Recording
                </button>
            </div>
        </div>
    );
};

export default ActiveTimer;
