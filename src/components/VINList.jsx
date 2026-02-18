import React, { useEffect, useState } from 'react';
import { getAllRecords, onRecordSaved } from '../utils/database';
import { formatDurationMinutes } from '../utils/timer';
import './VINList.css';

const VINList = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadRecords = async () => {
        const allRecords = await getAllRecords();
        // Sort by dateCreated descending (latest first)
        const sorted = allRecords.sort((a, b) =>
            new Date(b.dateCreated) - new Date(a.dateCreated)
        );
        setRecords(sorted);
        setLoading(false);
    };

    useEffect(() => {
        loadRecords();

        // Listen for new records from other tabs/users
        const cleanup = onRecordSaved(() => {
            loadRecords();
        });

        return cleanup;
    }, []);

    if (loading) {
        return (
            <div className="vin-list-container glass-card">
                <h3>Recent Completions</h3>
                <div className="loading-state">
                    <div className="loader"></div>
                    <p>Loading records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="vin-list-container glass-card">
            <h3>Recent Completions</h3>

            {records.length === 0 ? (
                <div className="empty-state">
                    <p>No records yet</p>
                    <p className="text-muted">Completed VINs will appear here</p>
                </div>
            ) : (
                <div className="records-list">
                    {records.map((record) => (
                        <div key={record.id} className="record-card">
                            <div className="record-header">
                                <div className="vin-number">{record.vin}</div>
                                <div className="duration-badge">
                                    {formatDurationMinutes(record.durationMinutes)}
                                </div>
                            </div>
                            <div className="record-details">
                                <span className="badge">{record.category}</span>
                                <span className="record-time">
                                    {new Date(record.dateCreated).toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VINList;
