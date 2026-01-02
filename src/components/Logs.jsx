import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
    Activity, AlertCircle, CheckCircle, XCircle, Clock, Filter,
    Search, Download, RefreshCw, Calendar, TrendingUp, Zap, BarChart2
} from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './Logs.css';

const PYTHON_SERVER_URL = import.meta.env.VITE_PYTHON_SERVER_URL || 'http://localhost:5000';

const LogsSkeleton = () => (
    <div className="logs-layout">
        <Sidebar sidebarOpen={true} setSidebarOpen={() => { }} />

        <div className="main-content-wrapper" style={{ marginLeft: '260px' }}>
            <div className="skeleton-topbar"></div>

            <main className="logs-main">
                {/* Header Skeleton */}
                <div className="logs-header">
                    <div>
                        <div className="skeleton-page-title"></div>
                        <div className="skeleton-page-subtitle"></div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div className="skeleton-button"></div>
                        <div className="skeleton-button"></div>
                    </div>
                </div>

                {/* Stats Cards Skeleton */}
                <div className="logs-stats-grid">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="stat-card skeleton-animate">
                            <div className="skeleton-stat-icon"></div>
                            <div className="skeleton-stat-value"></div>
                            <div className="skeleton-stat-label"></div>
                        </div>
                    ))}
                </div>

                {/* Filters Skeleton */}
                <div className="logs-filters">
                    <div className="skeleton-search-bar"></div>
                    <div className="skeleton-filter-button"></div>
                    <div className="skeleton-filter-button"></div>
                </div>

                {/* Logs List Skeleton */}
                <div className="logs-list">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="log-item skeleton-animate">
                            <div className="skeleton-log-icon"></div>
                            <div style={{ flex: 1 }}>
                                <div className="skeleton-log-title"></div>
                                <div className="skeleton-log-meta"></div>
                            </div>
                            <div className="skeleton-log-badge"></div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    </div>
);

const Logs = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        avgResponseTime: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        status: 'all', // all, success, error
        timeRange: '24h' // 1h, 24h, 7d, 30d, all
    });

    useEffect(() => {
        checkUser();
        fetchLogs();
    }, [filters]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
        } else {
            setUser(user);
            const { data: profileData } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', user.id)
                .single();
            if (profileData) setProfile(profileData);
        }
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch all logs from Python server
            const response = await fetch(
                `${PYTHON_SERVER_URL}/api/logs?userId=${user.id}&limit=100&timeRange=${filters.timeRange}`
            );
            const data = await response.json();

            if (data.success) {
                let filteredLogs = data.logs;

                // Apply status filter
                if (filters.status !== 'all') {
                    filteredLogs = filteredLogs.filter(log => {
                        if (filters.status === 'success') {
                            return log.status >= 200 && log.status < 300;
                        } else if (filters.status === 'error') {
                            return log.status >= 400;
                        }
                        return true;
                    });
                }

                // Apply search filter
                if (filters.search) {
                    filteredLogs = filteredLogs.filter(log =>
                        log.endpoint.toLowerCase().includes(filters.search.toLowerCase()) ||
                        log.projectName?.toLowerCase().includes(filters.search.toLowerCase())
                    );
                }

                setLogs(filteredLogs);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        if (status >= 200 && status < 300) return <CheckCircle size={20} className="status-success" />;
        if (status >= 400 && status < 500) return <AlertCircle size={20} className="status-warning" />;
        return <XCircle size={20} className="status-error" />;
    };

    const getStatusClass = (status) => {
        if (status >= 200 && status < 300) return 'success';
        if (status >= 400 && status < 500) return 'warning';
        return 'error';
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const seconds = Math.floor((now - time) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const exportLogs = () => {
        const csv = [
            ['Timestamp', 'Endpoint', 'Status', 'Response Time', 'Project'].join(','),
            ...logs.map(log => [
                log.timestamp,
                log.endpoint,
                log.status,
                `${log.responseTime}ms`,
                log.projectName || 'N/A'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `api-logs-${new Date().toISOString()}.csv`;
        a.click();
    };

    if (loading) return <LogsSkeleton />;

    return (
        <div className="logs-layout">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="main-content-wrapper" style={{
                marginLeft: sidebarOpen ? '260px' : '70px',
                transition: 'margin-left 0.3s ease'
            }}>
                <TopBar user={user} profile={profile} />

                <main className="logs-main">
                    {/* Header */}
                    <div className="logs-header">
                        <div>
                            <h1><BarChart2 size={28} style={{ display: 'inline-block', marginRight: '0.5rem', color: 'var(--accent-red)', verticalAlign: 'middle' }} /> API Activity Logs</h1>
                            <p>Monitor all API requests and responses</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-secondary" onClick={fetchLogs}>
                                <RefreshCw size={18} />
                                <span>Refresh</span>
                            </button>
                            <button className="btn-primary" onClick={exportLogs}>
                                <Download size={18} />
                                <span>Export CSV</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="logs-stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon total">
                                <Activity size={24} />
                            </div>
                            <div className="stat-value">{stats.totalCalls}</div>
                            <div className="stat-label">Total Calls</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon success">
                                <CheckCircle size={24} />
                            </div>
                            <div className="stat-value">{stats.successfulCalls}</div>
                            <div className="stat-label">Successful</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon error">
                                <XCircle size={24} />
                            </div>
                            <div className="stat-value">{stats.failedCalls}</div>
                            <div className="stat-label">Failed</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon time">
                                <Zap size={24} />
                            </div>
                            <div className="stat-value">{stats.avgResponseTime}ms</div>
                            <div className="stat-label">Avg Response</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="logs-filters">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search by endpoint or project..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>

                        <select
                            className="filter-select"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="all">All Status</option>
                            <option value="success">Success Only</option>
                            <option value="error">Errors Only</option>
                        </select>

                        <select
                            className="filter-select"
                            value={filters.timeRange}
                            onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
                        >
                            <option value="1h">Last Hour</option>
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>

                    {/* Logs List */}
                    <div className="logs-container">
                        {logs.length > 0 ? (
                            <div className="logs-list">
                                {logs.map((log, index) => (
                                    <div key={index} className={`log-item ${getStatusClass(log.status)}`}>
                                        <div className="log-icon">
                                            {getStatusIcon(log.status)}
                                        </div>
                                        <div className="log-content">
                                            <div className="log-title">
                                                <span className="endpoint">{log.endpoint}</span>
                                                <span className="status-code">{log.status}</span>
                                            </div>
                                            <div className="log-meta">
                                                <span><Clock size={14} /> {formatTimeAgo(log.timestamp)}</span>
                                                <span>•</span>
                                                <span><Zap size={14} /> {log.responseTime}ms</span>
                                                {log.projectName && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{log.projectName}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="log-time">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Activity size={48} />
                                <h3>No logs found</h3>
                                <p>No API activity matches your filters</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Logs;
