import React, { useState, useEffect } from 'react';
import { formatElapsedTime, getElapsedTime } from '../utils/timer';
import './ActiveTimer.css';

const ActiveTimer = ({ vin, category, startTime, onFinish }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        // Update timer every second
        const interval = setInterval(() => {
            setElapsed(getElapsedTime(startTime));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="timer-container glass-card">
            <div className="timer-header">
                <div className="recording-indicator">
                    <span className="pulse-dot"></span>
                    <span>Recording</span>
                </div>
            </div>

            <div className="timer-display">
                <div className="timer-value">{formatElapsedTime(elapsed)}</div>
                <div className="timer-label">Elapsed Time</div>
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

            <button className="btn btn-success btn-finish" onClick={onFinish}>
                ✅ Finish Recording
            </button>
        </div>
    );
};

export default ActiveTimer;
