import React, { useState, useEffect, useRef } from 'react';
import { formatElapsedTime, getElapsedTime } from '../utils/timer';
import { Play, PauseCircle, CheckCircle, Loader2 } from 'lucide-react';
import './ActiveTimer.css';

const PAUSE_STATE_PREFIX = 'tacttime_pause_state_';

const ActiveTimer = ({ vin, category, startTime, onFinish }) => {
    const [elapsed, setElapsed] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [pauseStartTime, setPauseStartTime] = useState(null);
    const [totalPausedTime, setTotalPausedTime] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ref mirror of isPaused so the interval callback always reads the
    // latest value without needing to be recreated (fixes the "last tick"
    // race condition – Bug 3).
    const isPausedRef = useRef(false);

    // Scope the localStorage key to this specific recording so a stale
    // pause state from a previous session can NEVER bleed in (fixes Bug 1 & 4).
    const pauseStateKey = `${PAUSE_STATE_PREFIX}${startTime}`;

    // --- Load pause state scoped to this recording on mount ---
    useEffect(() => {
        const savedState = localStorage.getItem(pauseStateKey);
        if (savedState) {
            try {
                const {
                    isPaused: savedPaused,
                    pauseStartTime: savedPauseStart,
                    totalPausedTime: savedTotal
                } = JSON.parse(savedState);

                const paused = Boolean(savedPaused);
                isPausedRef.current = paused;
                setIsPaused(paused);
                setPauseStartTime(savedPauseStart || null);
                setTotalPausedTime(savedTotal || 0);
            } catch {
                // Corrupted state – start fresh
                localStorage.removeItem(pauseStateKey);
            }
        }

        // Cleanup any orphaned pause state keys from old sessions that are
        // not this recording's key (safety net).
        try {
            Object.keys(localStorage)
                .filter(k => k.startsWith(PAUSE_STATE_PREFIX) && k !== pauseStateKey)
                .forEach(k => localStorage.removeItem(k));
        } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally run once on mount only

    // --- Persist pause state to localStorage whenever it changes ---
    useEffect(() => {
        localStorage.setItem(pauseStateKey, JSON.stringify({
            isPaused,
            pauseStartTime,    // stored as ISO string (consistent – fixes Bug 2)
            totalPausedTime
        }));
    }, [isPaused, pauseStartTime, totalPausedTime, pauseStateKey]);

    // --- Tick the elapsed counter every second (only when not paused) ---
    useEffect(() => {
        const interval = setInterval(() => {
            // Read from the ref (not the closure-captured state) so we always
            // have the latest isPaused value even within the same render cycle.
            if (isPausedRef.current) return;

            const rawElapsed = getElapsedTime(startTime);
            // totalPausedTime is already accumulated for all *finished* pauses.
            // If currently paused this branch is skipped, so currentPauseTime
            // is always 0 here.
            setElapsed(Math.max(0, rawElapsed - totalPausedTime));
        }, 1000);

        return () => clearInterval(interval);
    // Recreate when totalPausedTime changes (i.e. after each resume) so the
    // displayed time immediately reflects the updated baseline.
    }, [startTime, totalPausedTime]);

    const handlePause = () => {
        isPausedRef.current = true;
        setIsPaused(true);
        // Store as ISO string for safe, consistent serialisation (fixes Bug 2).
        setPauseStartTime(new Date().toISOString());
    };

    const handleResume = () => {
        if (pauseStartTime) {
            const pauseDuration = getElapsedTime(pauseStartTime);
            setTotalPausedTime(prev => prev + pauseDuration);
        }
        isPausedRef.current = false;
        setIsPaused(false);
        setPauseStartTime(null);
    };

    const handleFinish = async () => {
        // Guard: if already submitting (e.g. user tapped twice on lag) do nothing.
        if (isSubmitting) return;

        setIsSubmitting(true);

        // Remove scoped pause state key for this recording (clean slate).
        localStorage.removeItem(pauseStateKey);

        // If still paused when finishing, add the current pause segment.
        let finalPausedTime = totalPausedTime;
        if (isPaused && pauseStartTime) {
            finalPausedTime += getElapsedTime(pauseStartTime);
        }

        try {
            // onFinish is async (App.jsx handleFinish); await its result.
            // It returns true on success, false on failure.
            const ok = await onFinish(finalPausedTime);
            if (!ok) {
                // Save failed — restore the button so the user can retry.
                setIsSubmitting(false);
                // Also restore the pause state key so a page refresh still works.
                localStorage.setItem(pauseStateKey, JSON.stringify({
                    isPaused,
                    pauseStartTime,
                    totalPausedTime
                }));
            }
            // On success the component unmounts — no cleanup needed.
        } catch {
            setIsSubmitting(false);
        }
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
                    <button className="btn btn-primary btn-resume" onClick={handleResume} disabled={isSubmitting}>
                        <Play size={18} /> Resume
                    </button>
                ) : (
                    <button className="btn btn-warning btn-pause" onClick={handlePause} disabled={isSubmitting}>
                        <PauseCircle size={18} /> Pause
                    </button>
                )}
                <button
                    className={`btn btn-success btn-finish${isSubmitting ? ' btn-submitting' : ''}`}
                    onClick={handleFinish}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <><Loader2 size={18} className="spin-icon" /> Saving…</>
                    ) : (
                        <><CheckCircle size={18} /> Finish Recording</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ActiveTimer;
