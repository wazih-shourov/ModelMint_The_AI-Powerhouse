import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Clock, Cpu, Zap, HardDrive, TrendingUp, Filter, Download } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './TrainingHistory.css';

const PYTHON_SERVER_URL = import.meta.env.VITE_PYTHON_SERVER_URL || 'http://localhost:5000';

const TrainingHistory = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
        } else {
            setUser(user);

            // Get profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', user.id)
                .single();
            if (profileData) setProfile(profileData);

            fetchSessions(user.id);
        }
    };

    const fetchSessions = async (userId) => {
        try {
            setLoading(true);
            const response = await fetch(
                `${PYTHON_SERVER_URL}/api/training-sessions?userId=${userId}&limit=50`
            );
            const data = await response.json();

            if (data.success) {
                setSessions(data.sessions);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0s';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return '#10b981';
            case 'failed': return '#ef4444';
            case 'training': return '#f59e0b';
            default: return '#9ca3af';
        }
    };

    const filteredSessions = filter === 'all'
        ? sessions
        : sessions.filter(s => s.model_name === filter);

    return (
        <div className="dashboard-layout">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="main-content-wrapper" style={{
                marginLeft: sidebarOpen ? '260px' : '70px',
                transition: 'margin-left 0.3s ease'
            }}>
                <TopBar user={user} profile={profile} />

                <main className="training-history-main">
                    <div className="history-header">
                        <div>
                            <h1>
                                <Flame size={28} style={{ display: 'inline-block', marginRight: '0.5rem', color: 'var(--accent-red)', verticalAlign: 'middle' }} />
                                Training History
                            </h1>
                            <p>View all your model training sessions and performance metrics</p>
                        </div>

                        <div className="history-actions">
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Models</option>
                                <option value="MobileNet">MobileNet</option>
                                <option value="MoveNet">MoveNet</option>
                                <option value="InceptionV3">InceptionV3</option>
                            </select>
                        </div>
                    </div>

                    <div className="sessions-container">
                        {loading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Loading training sessions...</p>
                            </div>
                        ) : filteredSessions.length === 0 ? (
                            <div className="empty-state">
                                <Flame size={64} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
                                <h3>No Training Sessions Yet</h3>
                                <p>Train a model to see performance metrics here</p>
                                <button className="btn-primary" onClick={() => navigate('/projects')}>
                                    Start Training
                                </button>
                            </div>
                        ) : (
                            <div className="sessions-grid">
                                {filteredSessions.map(session => (
                                    <div
                                        key={session.id}
                                        className="session-card"
                                        onClick={() => navigate(`/training-history/${session.id}`)}
                                    >
                                        <div className="session-header">
                                            <div className="session-title">
                                                <h3>{session.model_name}</h3>
                                                <span className="session-project">{session.project_name || 'Unknown Project'}</span>
                                            </div>
                                            <div
                                                className="session-status"
                                                style={{ background: getStatusColor(session.status) }}
                                            >
                                                {session.status || 'completed'}
                                            </div>
                                        </div>

                                        <div className="session-date">
                                            <Clock size={14} />
                                            <span>{formatDate(session.started_at)}</span>
                                            <span className="duration">{formatDuration(session.duration_seconds)}</span>
                                        </div>

                                        <div className="session-metrics">
                                            <div className="metric-row">
                                                <div className="metric-item">
                                                    <Cpu size={16} style={{ color: '#3b82f6' }} />
                                                    <div>
                                                        <span className="metric-label">CPU (Avg / Peak)</span>
                                                        <span className="metric-value">
                                                            {session.avg_cpu_usage?.toFixed(1) || '0'}% / {session.max_cpu_usage?.toFixed(1) || '0'}%
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="metric-item">
                                                    <Zap size={16} style={{ color: session.gpu_used ? '#10b981' : '#9ca3af' }} />
                                                    <div>
                                                        <span className="metric-label">GPU</span>
                                                        <span className="metric-value">
                                                            {session.gpu_used ? 'Active' : 'Not Used'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="metric-row">
                                                <div className="metric-item">
                                                    <HardDrive size={16} style={{ color: '#f59e0b' }} />
                                                    <div>
                                                        <span className="metric-label">Memory (Avg / Peak)</span>
                                                        <span className="metric-value">
                                                            {session.avg_memory_mb?.toFixed(0) || '0'} / {session.max_memory_mb?.toFixed(0) || '0'} MB
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="metric-item">
                                                    <TrendingUp size={16} style={{ color: '#10b981' }} />
                                                    <div>
                                                        <span className="metric-label">Accuracy</span>
                                                        <span className="metric-value">
                                                            {session.final_accuracy ? (session.final_accuracy * 100).toFixed(1) : '0'}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {session.gpu_used && session.gpu_model && (
                                            <div className="session-gpu-info">
                                                <Zap size={12} />
                                                <span>{session.gpu_model}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TrainingHistory;
