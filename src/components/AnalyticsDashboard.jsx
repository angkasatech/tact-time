import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getAllRecords } from '../utils/database';
import { exportToExcel, exportVINSummary } from '../utils/excelExport';
import { formatDurationMMSS } from '../utils/timer';
import { BarChart3, RefreshCw, FileSpreadsheet, ClipboardList, RotateCcw } from 'lucide-react';
import './AnalyticsDashboard.css';

ChartJS.register(
    CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend,
    LineElement, PointElement
);

// ─── Date helpers ─────────────────────────────────────────────────────────────
const toDateStr = (d) => d.toISOString().split('T')[0]; // YYYY-MM-DD

function getWeekBounds(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diffToMon = (day === 0 ? -6 : 1 - day);
    const mon = new Date(d);
    mon.setDate(d.getDate() + diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { start: toDateStr(mon), end: toDateStr(sun) };
}

function getMonthBounds(dateStr) {
    const [y, m] = dateStr.split('-').map(Number);
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
    return { start, end };
}

function filterRecords(records, mode, dateStr) {
    const recDate = (r) => toDateStr(new Date(r.dateCreated));
    // Only include valid VINs (17+ characters) — strips test/dummy entries
    const validVin = (r) => r.vin && r.vin.trim().length >= 17;
    if (mode === 'date') return records.filter(r => validVin(r) && recDate(r) === dateStr);
    if (mode === 'weekly') {
        const { start, end } = getWeekBounds(dateStr);
        return records.filter(r => validVin(r) && recDate(r) >= start && recDate(r) <= end);
    }
    if (mode === 'monthly') {
        const { start, end } = getMonthBounds(dateStr);
        return records.filter(r => validVin(r) && recDate(r) >= start && recDate(r) <= end);
    }
    return records.filter(validVin);
}

// Truncate long VINs for chart label
const shortVin = (vin) => vin.length > 10 ? vin.slice(-10) : vin;

// Custom Chart.js plugin: red dashed line at y=10
const targetLinePlugin = {
    id: 'targetLine',
    afterDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea) return;
        const y = scales.y.getPixelForValue(10);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(chartArea.left, y);
        ctx.lineTo(chartArea.right, y);
        ctx.strokeStyle = '#e53935';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#e53935';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('10 min target', chartArea.right - 92, y - 6);
        ctx.restore();
    },
};

// ─── Component ────────────────────────────────────────────────────────────────
const AnalyticsDashboard = ({ onBack }) => {
    const [allRecords, setAllRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [mode, setMode] = useState('date');
    const [dateStr, setDateStr] = useState(toDateStr(new Date()));
    const [sortField, setSortField] = useState('dateCreated');
    const [sortAsc, setSortAsc] = useState(false);
    const [tableTab, setTableTab] = useState('vin'); // 'vin' | 'records'

    // ── Fetch records (memoised so it can be called manually too) ──
    const fetchRecords = useCallback(async () => {
        try {
            const r = await getAllRecords();
            setAllRecords(r);
            setLastRefresh(new Date());
        } catch {
            // keep current data on error
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load + auto-refresh every 60 seconds
    useEffect(() => {
        fetchRecords();
        const interval = setInterval(fetchRecords, 60000);
        return () => clearInterval(interval);
    }, [fetchRecords]);

    // Filtered records
    const filtered = useMemo(
        () => filterRecords(allRecords, mode, dateStr),
        [allRecords, mode, dateStr]
    );

    // Sorted table rows
    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            let va = a[sortField], vb = b[sortField];
            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();
            if (va < vb) return sortAsc ? -1 : 1;
            if (va > vb) return sortAsc ? 1 : -1;
            return 0;
        });
    }, [filtered, sortField, sortAsc]);

    // VIN Summary rows — group by VIN, sum durations, exclude From Final
    const vinSummaryRows = useMemo(() => {
        const map = new Map();
        for (const r of filtered) {
            const key = r.vin.trim().toUpperCase();
            if (!map.has(key)) {
                map.set(key, {
                    vin: r.vin.trim(),
                    latestDate: r.dateCreated,
                    categories: new Set(),
                    totalMin: 0,
                    totalPausedMs: 0,
                });
            }
            const e = map.get(key);
            if (new Date(r.dateCreated) > new Date(e.latestDate)) e.latestDate = r.dateCreated;
            e.categories.add(r.category);
            if (r.category !== 'From Final') {
                e.totalMin += parseFloat(r.durationMinutes) || 0;
                e.totalPausedMs += parseFloat(r.totalPausedTime) || 0;
            }
        }
        return [...map.values()].sort((a, b) =>
            new Date(b.latestDate) - new Date(a.latestDate)
        );
    }, [filtered]);

    // Chart data — switches with the active tab
    const chartData = useMemo(() => {
        if (tableTab === 'vin') {
            // One bar per unique VIN, total duration excl. From Final
            const labels   = vinSummaryRows.map(v => shortVin(v.vin));
            const durations = vinSummaryRows.map(v => v.totalMin);
            const colors   = durations.map(d => d >= 10 ? 'rgba(229,57,53,0.85)' : 'rgba(33,201,151,0.85)');
            const borders  = durations.map(d => d >= 10 ? '#e53935' : '#21C997');
            return {
                labels,
                datasets: [{ label: 'Total Duration (min)', data: durations, backgroundColor: colors, borderColor: borders, borderWidth: 2, borderRadius: 6, borderSkipped: false }],
            };
        }
        // One bar per record
        const labels   = filtered.map(r => shortVin(r.vin));
        const durations = filtered.map(r => parseFloat(r.durationMinutes) || 0);
        const colors   = durations.map(d => d > 10 ? 'rgba(229,57,53,0.85)' : 'rgba(33,201,151,0.85)');
        const borders  = durations.map(d => d > 10 ? '#e53935' : '#21C997');
        return {
            labels,
            datasets: [{ label: 'Duration (min)', data: durations, backgroundColor: colors, borderColor: borders, borderWidth: 2, borderRadius: 6, borderSkipped: false }],
        };
    }, [tableTab, filtered, vinSummaryRows]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: (items) => filtered[items[0].dataIndex]?.vin || '',
                    // Show tooltip in MM:SS format too
                    label: (item) => {
                        const mm = Math.floor(item.raw);
                        const ss = Math.round((item.raw - mm) * 60);
                        return ` ${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
                    },
                },
            },
            targetLine: {},
        },
        scales: {
            x: {
                ticks: { color: '#aaa', font: { size: 11 }, maxRotation: 45 },
                grid: { color: 'rgba(255,255,255,0.05)' },
            },
            y: {
                beginAtZero: true,
                ticks: { color: '#aaa' },
                grid: { color: 'rgba(255,255,255,0.08)' },
                title: { display: true, text: 'Minutes', color: '#888' },
            },
        },
    };

    // Stats
    const stats = useMemo(() => {
        if (!filtered.length) return null;
        const durations = filtered.map(r => parseFloat(r.durationMinutes) || 0);
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

        const uniqueVinSet = new Set(filtered.map(r => r.vin.trim().toUpperCase()));
        const uniqueVins = uniqueVinSet.size;

        // Per-VIN totals EXCLUDING "From Final" category for the OK/NG threshold check
        const vinTotals = new Map();
        for (const key of uniqueVinSet) vinTotals.set(key, 0); // init all VINs at 0
        for (const r of filtered) {
            if (r.category === 'From Final') continue;
            const key = r.vin.trim().toUpperCase();
            vinTotals.set(key, (vinTotals.get(key) || 0) + (parseFloat(r.durationMinutes) || 0));
        }

        const vinOKCount = [...vinTotals.values()].filter(t => t < 10).length;
        const vinNGCount = [...vinTotals.values()].filter(t => t >= 10).length;
        const okRatio = uniqueVins > 0 ? Math.round((vinOKCount / uniqueVins) * 100) : 0;

        return {
            total: filtered.length,
            uniqueVins,
            avgMMSS: formatDurationMMSS(avg),
            vinOKCount,
            vinNGCount,
            okRatio,
        };
    }, [filtered]);

    const handleSort = (field) => {
        if (sortField === field) setSortAsc(!sortAsc);
        else { setSortField(field); setSortAsc(true); }
    };

    const handleExport = () => exportToExcel(filtered);
    const handleExportVINSummary = () => exportVINSummary(filtered);

    const periodLabel = useMemo(() => {
        if (mode === 'date') return dateStr;
        if (mode === 'weekly') {
            const { start, end } = getWeekBounds(dateStr);
            return `${start} – ${end}`;
        }
        const [y] = dateStr.split('-');
        return `${new Date(dateStr).toLocaleString('default', { month: 'long' })} ${y}`;
    }, [mode, dateStr]);

    return (
        <div className="analytics-page">
            {/* Header */}
            <div className="analytics-header">
                <button className="btn btn-secondary analytics-back" onClick={onBack}>
                    ← Back
                </button>
                <div className="analytics-title">
                    <h1><BarChart3 size={24} strokeWidth={2} /> Analytics Dashboard</h1>
                    <span className="analytics-period">{periodLabel}</span>
                </div>
                <div className="analytics-header-right">
                    <button className="btn btn-ghost analytics-refresh" onClick={fetchRecords} title="Refresh now">
                        <RefreshCw size={14} />
                        Refresh
                        {lastRefresh && (
                            <span className="refresh-time">
                                {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        )}
                    </button>
                    <button className="btn btn-secondary analytics-export" onClick={handleExportVINSummary} title="One row per VIN, total duration">
                        <ClipboardList size={15} /> VIN Summary
                    </button>
                    <button className="btn btn-primary analytics-export" onClick={handleExport}>
                        <FileSpreadsheet size={15} /> Export Detail
                    </button>
                </div>
            </div>

            {/* Filter bar */}
            <div className="analytics-filters glass-card">
                <div className="filter-modes">
                    {['date', 'weekly', 'monthly'].map(m => (
                        <button
                            key={m}
                            className={`filter-mode-btn${mode === m ? ' active' : ''}`}
                            onClick={() => setMode(m)}
                        >
                            {m === 'date' ? 'Day' : m === 'weekly' ? 'Week' : 'Month'}
                        </button>
                    ))}
                </div>
                <input
                    type={mode === 'monthly' ? 'month' : 'date'}
                    className="filter-date-input"
                    value={mode === 'monthly' ? dateStr.slice(0, 7) : dateStr}
                    onChange={e => {
                        const v = e.target.value;
                        setDateStr(mode === 'monthly' ? v + '-01' : v);
                    }}
                />
                <span className="auto-refresh-badge"><RotateCcw size={11} /> Auto-refresh: 1 min</span>
            </div>

            {loading ? (
                <div className="analytics-loading">
                    <div className="loader" /><p>Loading records…</p>
                </div>
            ) : (
                <>
                    {/* Stats strip */}
                    {stats && (
                        <div className="analytics-stats">
                            <div className="stat-card glass-card">
                                <div className="stat-value">{stats.total}</div>
                                <div className="stat-label">Total Records</div>
                            </div>
                            <div className="stat-card glass-card stat-teal">
                                <div className="stat-value">{stats.uniqueVins}</div>
                                <div className="stat-label">Unique VINs</div>
                            </div>
                            <div className="stat-card glass-card">
                                <div className="stat-value">{stats.avgMMSS}</div>
                                <div className="stat-label">Avg Duration</div>
                            </div>
                            <div className="stat-card glass-card stat-green">
                                <div className="stat-value">{stats.vinOKCount}</div>
                                <div className="stat-label">VINs OK &lt;10 min</div>
                                <div className="stat-sublabel">(excl. From Final)</div>
                            </div>
                            <div className="stat-card glass-card stat-red">
                                <div className="stat-value">{stats.vinNGCount}</div>
                                <div className="stat-label">VINs NG &ge;10 min</div>
                                <div className="stat-sublabel">(excl. From Final)</div>
                            </div>
                            <div className="stat-card glass-card stat-blue">
                                <div className="stat-value">{stats.okRatio}%</div>
                                <div className="stat-label">DIRECT PASS</div>
                                <div className="stat-sublabel">OK / Total</div>
                            </div>
                        </div>
                    )}

                    {filtered.length === 0 ? (
                        <div className="analytics-empty glass-card">
                            <p>No records found for this period.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chart */}
                            <div className="analytics-chart-card glass-card">
                                <h3>{tableTab === 'vin' ? 'Tact Time per VIN — excl. From Final' : 'Tact Time per Record'}</h3>
                                <div className="analytics-chart-wrap">
                                    <Bar
                                        data={chartData}
                                        options={chartOptions}
                                        plugins={[targetLinePlugin]}
                                    />
                                </div>
                                <div className="chart-legend">
                                    <span className="legend-green">■ ≤ 10 min</span>
                                    <span className="legend-red">■ &gt; 10 min (over target)</span>
                                    <span className="legend-line">— 10 min target</span>
                                </div>
                            </div>

                            {/* Tabbed Records / VIN Summary */}
                            <div className="analytics-table-card glass-card">
                                <div className="table-tab-bar">
                                    <button
                                        className={`table-tab-btn${tableTab === 'vin' ? ' active' : ''}`}
                                        onClick={() => setTableTab('vin')}
                                    >
                                        VIN Summary
                                    </button>
                                    <button
                                        className={`table-tab-btn${tableTab === 'records' ? ' active' : ''}`}
                                        onClick={() => setTableTab('records')}
                                    >
                                        All Records
                                    </button>
                                </div>

                                {tableTab === 'vin' ? (
                                    /* ── Tab 1: VIN Summary (excl. From Final) ── */
                                    <div className="analytics-table-wrap">
                                        <table className="analytics-table">
                                            <thead>
                                                <tr>
                                                    <th>VIN</th>
                                                    <th>Categories</th>
                                                    <th>Duration (excl. From Final)</th>
                                                    <th>Break</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {vinSummaryRows.map(v => {
                                                    const isNG = v.totalMin >= 10;
                                                    return (
                                                        <tr key={v.vin}>
                                                            <td className="vin-cell">{v.vin}</td>
                                                            <td>
                                                                {[...v.categories].map(c => (
                                                                    <span key={c} className="badge" style={{ marginRight: '4px' }}>{c}</span>
                                                                ))}
                                                            </td>
                                                            <td>
                                                                <span className={`duration-badge${isNG ? ' duration-badge--over' : ''}`}>
                                                                    {formatDurationMMSS(v.totalMin)}
                                                                </span>
                                                            </td>
                                                            <td className="time-cell">{formatDurationMMSS(v.totalPausedMs / 60000)}</td>
                                                            <td>
                                                                <span className={`status-badge${isNG ? ' status-badge--ng' : ' status-badge--ok'}`}>
                                                                    {isNG ? 'NG' : 'OK'}
                                                                </span>
                                                            </td>
                                                            <td className="time-cell">
                                                                {new Date(v.latestDate).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    /* ── Tab 2: All Records ── */
                                    <div className="analytics-table-wrap">
                                        <table className="analytics-table">
                                            <thead>
                                                <tr>
                                                    <th onClick={() => handleSort('vin')} className="sortable">
                                                        VIN {sortField === 'vin' ? (sortAsc ? '↑' : '↓') : ''}
                                                    </th>
                                                    <th onClick={() => handleSort('category')} className="sortable">
                                                        Category {sortField === 'category' ? (sortAsc ? '↑' : '↓') : ''}
                                                    </th>
                                                    <th onClick={() => handleSort('durationMinutes')} className="sortable">
                                                        Duration {sortField === 'durationMinutes' ? (sortAsc ? '↑' : '↓') : ''}
                                                    </th>
                                                    <th onClick={() => handleSort('dateCreated')} className="sortable">
                                                        Time {sortField === 'dateCreated' ? (sortAsc ? '↑' : '↓') : ''}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sorted.map(r => (
                                                    <tr key={r.id}>
                                                        <td className="vin-cell">{r.vin}</td>
                                                        <td><span className="badge">{r.category}</span></td>
                                                        <td>
                                                            <span className={`duration-badge${r.durationMinutes > 10 ? ' duration-badge--over' : ''}`}>
                                                                {formatDurationMMSS(r.durationMinutes)}
                                                            </span>
                                                        </td>
                                                        <td className="time-cell">
                                                            {new Date(r.dateCreated).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
