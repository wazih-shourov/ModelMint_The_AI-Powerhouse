import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Cpu, Zap, HardDrive, Clock, TrendingUp, Activity, Download } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './TrainingMonitoringDetail.css';

const PYTHON_SERVER_URL = import.meta.env.VITE_PYTHON_SERVER_URL || 'http://localhost:5000';

const TrainingMonitoringDetail = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const chartRef = useRef(null);

    useEffect(() => {
        checkUser();
    }, []);

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

            fetchSessionDetail();
        }
    };

    const fetchSessionDetail = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${PYTHON_SERVER_URL}/api/training-sessions/${sessionId}`);
            const data = await response.json();

            if (data.success) {
                setSession(data.session);
                // Draw chart after session data is loaded
                setTimeout(() => drawChart(data.session.metrics_timeline), 100);
            }
        } catch (error) {
            console.error('Error fetching session:', error);
        } finally {
            setLoading(false);
        }
    };

    const drawChart = (timeline) => {
        if (!timeline || !chartRef.current) return;

        const canvas = chartRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Parse timeline data
        const dataPoints = timeline.map(point => ({
            time: point.timestamp,
            cpu: point.cpu || 0,
            memory: point.memory || 0
        }));

        if (dataPoints.length === 0) return;

        // Calculate scales
        const maxCpu = Math.max(...dataPoints.map(p => p.cpu), 100);
        const maxMemory = Math.max(...dataPoints.map(p => p.memory));

        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Draw grid
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw CPU line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        dataPoints.forEach((point, index) => {
            const x = padding + (chartWidth / (dataPoints.length - 1)) * index;
            const y = padding + chartHeight - (point.cpu / maxCpu) * chartHeight;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw Memory line
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        dataPoints.forEach((point, index) => {
            const x = padding + (chartWidth / (dataPoints.length - 1)) * index;
            const y = padding + chartHeight - (point.memory / maxMemory) * chartHeight;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw labels
        ctx.fillStyle = '#9ca3af';
        ctx.font = '12px sans-serif';
        ctx.fillText('CPU', padding + 10, padding + 20);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(padding + 40, padding + 12, 20, 3);

        ctx.fillStyle = '#9ca3af';
        ctx.fillText('Memory', padding + 70, padding + 20);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(padding + 120, padding + 12, 20, 3);
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0s';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatMemory = (mb) => {
        if (mb >= 1000) {
            return `${(mb / 1024).toFixed(2)} GB`;
        }
        return `${Math.round(mb)} MB`;
    };

    if (loading) {
        return (
            <div className="dashboard-layout">
                <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <div className="main-content-wrapper" style={{
                    marginLeft: sidebarOpen ? '260px' : '70px',
                    transition: 'margin-left 0.3s ease'
                }}>
                    <TopBar user={user} profile={profile} />
                    <main className="monitoring-detail-main">
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading session details...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="dashboard-layout">
                <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <div className="main-content-wrapper" style={{
                    marginLeft: sidebarOpen ? '260px' : '70px',
                    transition: 'margin-left 0.3s ease'
                }}>
                    <TopBar user={user} profile={profile} />
                    <main className="monitoring-detail-main">
                        <div className="error-state">
                            <h2>Session Not Found</h2>
                            <button className="btn-primary" onClick={() => navigate('/training-history')}>
                                Back to History
                            </button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="main-content-wrapper" style={{
                marginLeft: sidebarOpen ? '260px' : '70px',
                transition: 'margin-left 0.3s ease'
            }}>
                <TopBar user={user} profile={profile} />

                <main className="monitoring-detail-main">
                    {/* Header */}
                    <div className="detail-header">
                        <button className="back-button" onClick={() => navigate('/training-history')}>
                            <ArrowLeft size={20} />
                            Back to History
                        </button>
                        <h1>Training Session Analytics</h1>
                    </div>

                    {/* Session Info Card */}
                    <div className="session-info-card">
                        <div className="info-row">
                            <div className="info-item">
                                <span className="info-label">Model</span>
                                <span className="info-value">{session.model_name}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Project</span>
                                <span className="info-value">{session.project_name || 'Unknown'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Started</span>
                                <span className="info-value">{formatDate(session.started_at)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Duration</span>
                                <span className="info-value">{formatDuration(session.duration_seconds)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="metrics-grid">
                        {/* CPU Usage */}
                        <div className="metric-card">
                            <div className="metric-card-header">
                                <Cpu size={20} style={{ color: '#3b82f6' }} />
                                <h3>CPU Usage</h3>
                            </div>
                            <div className="metric-card-body">
                                <div className="metric-stat">
                                    <span className="stat-label">Average</span>
                                    <span className="stat-value" style={{ color: '#3b82f6' }}>
                                        {session.avg_cpu_usage?.toFixed(1) || '0'}%
                                    </span>
                                </div>
                                <div className="metric-stat">
                                    <span className="stat-label">Peak</span>
                                    <span className="stat-value" style={{ color: '#ef4444' }}>
                                        {session.max_cpu_usage?.toFixed(1) || '0'}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* GPU Usage */}
                        <div className="metric-card">
                            <div className="metric-card-header">
                                <Zap size={20} style={{ color: session.gpu_used ? '#10b981' : '#6b7280' }} />
                                <h3>GPU Status</h3>
                            </div>
                            <div className="metric-card-body">
                                <div className="metric-stat">
                                    <span className="stat-label">Status</span>
                                    <span className="stat-value" style={{ color: session.gpu_used ? '#10b981' : '#6b7280' }}>
                                        {session.gpu_used ? 'Active' : 'Not Used'}
                                    </span>
                                </div>
                                {session.gpu_model && (
                                    <div className="metric-stat">
                                        <span className="stat-label">Model</span>
                                        <span className="stat-value" style={{ color: '#10b981', fontSize: '14px' }}>
                                            {session.gpu_model}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Memory Usage */}
                        <div className="metric-card">
                            <div className="metric-card-header">
                                <HardDrive size={20} style={{ color: '#f59e0b' }} />
                                <h3>Memory Usage</h3>
                            </div>
                            <div className="metric-card-body">
                                <div className="metric-stat">
                                    <span className="stat-label">Average</span>
                                    <span className="stat-value" style={{ color: '#f59e0b' }}>
                                        {formatMemory(session.avg_memory_mb || 0)}
                                    </span>
                                </div>
                                <div className="metric-stat">
                                    <span className="stat-label">Peak</span>
                                    <span className="stat-value" style={{ color: '#ef4444' }}>
                                        {formatMemory(session.max_memory_mb || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Training Performance */}
                        <div className="metric-card">
                            <div className="metric-card-header">
                                <TrendingUp size={20} style={{ color: '#10b981' }} />
                                <h3>Performance</h3>
                            </div>
                            <div className="metric-card-body">
                                <div className="metric-stat">
                                    <span className="stat-label">Final Accuracy</span>
                                    <span className="stat-value" style={{ color: '#10b981' }}>
                                        {session.final_accuracy ? (session.final_accuracy * 100).toFixed(2) : '0'}%
                                    </span>
                                </div>
                                <div className="metric-stat">
                                    <span className="stat-label">Epochs</span>
                                    <span className="stat-value" style={{ color: '#8b5cf6' }}>
                                        {session.total_epochs || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Chart */}
                    {session.metrics_timeline && session.metrics_timeline.length > 0 && (
                        <div className="chart-card">
                            <div className="chart-header">
                                <Activity size={20} style={{ color: '#ef4444' }} />
                                <h3>Performance Timeline</h3>
                            </div>
                            <div className="chart-body">
                                <canvas
                                    ref={chartRef}
                                    width={800}
                                    height={300}
                                    style={{ width: '100%', height: 'auto' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Additional Info */}
                    <div className="additional-info-grid">
                        <div className="info-card">
                            <Clock size={18} style={{ color: '#8b5cf6' }} />
                            <div>
                                <span className="info-card-label">Training Speed</span>
                                <span className="info-card-value">
                                    {session.training_speed?.toFixed(2) || '0'} samples/sec
                                </span>
                            </div>
                        </div>
                        <div className="info-card">
                            <Activity size={18} style={{ color: '#ef4444' }} />
                            <div>
                                <span className="info-card-label">Total Samples</span>
                                <span className="info-card-value">{session.total_samples || 0}</span>
                            </div>
                        </div>
                        <div className="info-card">
                            <TrendingUp size={18} style={{ color: '#10b981' }} />
                            <div>
                                <span className="info-card-label">Final Loss</span>
                                <span className="info-card-value">
                                    {session.final_loss?.toFixed(4) || '0'}
                                </span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TrainingMonitoringDetail;
