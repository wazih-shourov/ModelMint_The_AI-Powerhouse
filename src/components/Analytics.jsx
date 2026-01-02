import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
    Activity, BarChart2, Zap, Clock, Server, Cpu, Database, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import Chart from 'chart.js/auto';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import '../styles/Analytics.css';

const PYTHON_SERVER_URL = import.meta.env.VITE_PYTHON_SERVER_URL || 'http://localhost:5000';

const Analytics = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);

    // Data States
    const [stats, setStats] = useState({
        apiCalls: { total: 0, trend: 0 },
        avgResponseTime: 0,
        successRate: 0,
        systemLoad: { cpu: 0, memory: 0 }
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [trainingSessions, setTrainingSessions] = useState([]);

    // Chart Refs
    const resourceChartRef = useRef(null);
    const accuracyChartRef = useRef(null);
    const trafficChartRef = useRef(null);
    const errorChartRef = useRef(null);

    // Chart Instances
    const chartInstances = useRef({});

    useEffect(() => {
        checkUser();
    }, []);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

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

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Dashboard Stats (API Usage)
            const statsResponse = await fetch(`${PYTHON_SERVER_URL}/api/dashboard/stats?userId=${user.id}`);
            const statsData = await statsResponse.json();

            // 2. Fetch Training Sessions
            const sessionsResponse = await fetch(`${PYTHON_SERVER_URL}/api/training-sessions?userId=${user.id}&limit=50`);
            const sessionsData = await sessionsResponse.json();

            if (statsData.success) {
                setStats(prev => ({
                    ...prev,
                    apiCalls: statsData.apiCalls,
                    avgResponseTime: statsData.avgResponseTime,
                    successRate: statsData.successRate,
                    // Mock system load for now as we don't have a real-time system monitor endpoint yet
                    systemLoad: { cpu: Math.floor(Math.random() * 30) + 10, memory: Math.floor(Math.random() * 40) + 20 }
                }));
                setRecentActivity(statsData.recentActivity || []);
            }

            if (sessionsData.success) {
                setTrainingSessions(sessionsData.sessions || []);
            }

            // Initialize Charts after data is loaded
            setTimeout(() => {
                initCharts(statsData, sessionsData.sessions || []);
            }, 100);

        } catch (error) {
            console.error('Error fetching analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const initCharts = (statsData, sessions) => {
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        font: { family: "'Inter', sans-serif" },
                        usePointStyle: true,
                        pointStyle: 'rect'
                    }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: '#f0f0f0' }, beginAtZero: true }
            }
        };

        // Destroy existing charts
        Object.values(chartInstances.current).forEach(chart => chart && chart.destroy());

        // 1. Resource Utilization Chart (Real Session Data if available)
        if (resourceChartRef.current) {
            // Find latest session with metrics timeline
            const latestSessionWithMetrics = sessions.find(s => s.metrics_timeline && s.metrics_timeline.length > 0);

            let labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
            let cpuData = [12, 19, 45, 32, 25, 15];
            let memoryData = [200, 300, 500, 400, 350, 250];

            if (latestSessionWithMetrics) {
                const timeline = latestSessionWithMetrics.metrics_timeline;
                // Downsample if too many points (max 20)
                const step = Math.ceil(timeline.length / 20);
                const sampled = timeline.filter((_, i) => i % step === 0);

                labels = sampled.map(m => `${m.time}s`);
                cpuData = sampled.map(m => m.cpu);
                memoryData = sampled.map(m => m.memory); // MB
            }

            const ctx = resourceChartRef.current.getContext('2d');
            chartInstances.current.resource = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'CPU Usage (%)',
                            data: cpuData,
                            borderColor: '#ff3b30',
                            backgroundColor: 'rgba(255, 59, 48, 0.1)',
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Memory Usage (MB)',
                            data: memoryData,
                            borderColor: '#007aff',
                            backgroundColor: 'rgba(0, 122, 255, 0.1)',
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    ...commonOptions,
                    scales: {
                        x: { grid: { display: false } },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: { display: true, text: 'CPU %' },
                            grid: { color: '#f0f0f0' }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: { display: true, text: 'Memory (MB)' },
                            grid: { drawOnChartArea: false }
                        }
                    }
                }
            });
        }

        // 2. Training Duration vs Accuracy (Scatter Plot)
        if (accuracyChartRef.current) {
            const scatterData = sessions
                .filter(s => s.final_accuracy && s.duration_seconds)
                .map(s => ({
                    x: s.duration_seconds,
                    y: s.final_accuracy * 100
                }));

            const ctx = accuracyChartRef.current.getContext('2d');
            chartInstances.current.accuracy = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Training Sessions',
                        data: scatterData.length > 0 ? scatterData : [],
                        backgroundColor: '#ff3b30'
                    }]
                },
                options: {
                    ...commonOptions,
                    scales: {
                        x: {
                            title: { display: true, text: 'Duration (seconds)' },
                            grid: { display: false }
                        },
                        y: {
                            title: { display: true, text: 'Accuracy (%)' },
                            grid: { color: '#f0f0f0' }
                        }
                    }
                }
            });
        }

        // 3. Traffic Volume (Line Chart)
        if (trafficChartRef.current) {
            let labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            let data = [0, 0, 0, 0, 0, 0, 0];

            if (statsData.dailyUsage && statsData.dailyUsage.length > 0) {
                labels = statsData.dailyUsage.map(d => {
                    const date = new Date(d.date);
                    return date.toLocaleDateString('en-US', { weekday: 'short' });
                });
                data = statsData.dailyUsage.map(d => d.count);
            }

            const ctx = trafficChartRef.current.getContext('2d');
            chartInstances.current.traffic = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'API Requests',
                        data: data,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: commonOptions
            });
        }

        // 4. Error Rate Analysis (Doughnut)
        if (errorChartRef.current) {
            const ctx = errorChartRef.current.getContext('2d');
            chartInstances.current.error = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Success (200)', 'Client Error (4xx)', 'Server Error (5xx)'],
                    datasets: [{
                        data: [statsData.successRate || 95, 3, 2], // Mock distribution based on success rate
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' }
                    },
                    cutout: '70%'
                }
            });
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="main-content-wrapper" style={{
                marginLeft: sidebarOpen ? '260px' : '70px',
                transition: 'margin-left 0.3s ease'
            }}>
                <TopBar user={user} profile={profile} />

                <div className="analytics-container">
                    <div className="analytics-header">
                        <div>
                            <h1>System Analytics</h1>
                            <p>Advanced metrics for robotics and development monitoring</p>
                        </div>
                        <div className="header-actions">
                            {/* Add date range picker or export button here if needed */}
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <Activity className="animate-spin" size={48} />
                            <span style={{ marginLeft: '1rem' }}>Loading System Metrics...</span>
                        </div>
                    ) : (
                        <>
                            {/* Overview Cards */}
                            <div className="analytics-grid-overview">
                                <div className="tech-card">
                                    <div className="tech-corner corner-tl"></div>
                                    <div className="tech-corner corner-tr"></div>
                                    <div className="tech-corner corner-bl"></div>
                                    <div className="tech-corner corner-br"></div>

                                    <div className="card-header">
                                        <span className="card-title">Total API Calls</span>
                                        <Zap size={20} color="#ff3b30" />
                                    </div>
                                    <div className="card-value">{stats.apiCalls.total.toLocaleString()}</div>
                                    <div className="card-trend">
                                        <span className={stats.apiCalls.trend >= 0 ? 'trend-up' : 'trend-down'}>
                                            {stats.apiCalls.trend >= 0 ? '↑' : '↓'} {Math.abs(stats.apiCalls.trend).toFixed(1)}%
                                        </span>
                                        <span className="trend-neutral">vs last week</span>
                                    </div>
                                </div>

                                <div className="tech-card">
                                    <div className="tech-corner corner-tl"></div>
                                    <div className="tech-corner corner-tr"></div>
                                    <div className="tech-corner corner-bl"></div>
                                    <div className="tech-corner corner-br"></div>

                                    <div className="card-header">
                                        <span className="card-title">Avg. Response Time</span>
                                        <Clock size={20} color="#007aff" />
                                    </div>
                                    <div className="card-value">{stats.avgResponseTime} ms</div>
                                    <div className="card-trend">
                                        <span className="trend-neutral">Global Average</span>
                                    </div>
                                </div>

                                <div className="tech-card">
                                    <div className="tech-corner corner-tl"></div>
                                    <div className="tech-corner corner-tr"></div>
                                    <div className="tech-corner corner-bl"></div>
                                    <div className="tech-corner corner-br"></div>

                                    <div className="card-header">
                                        <span className="card-title">Success Rate</span>
                                        <CheckCircle size={20} color="#10b981" />
                                    </div>
                                    <div className="card-value">{stats.successRate}%</div>
                                    <div className="card-trend">
                                        <span className="trend-up">Optimal</span>
                                    </div>
                                </div>

                                <div className="tech-card">
                                    <div className="tech-corner corner-tl"></div>
                                    <div className="tech-corner corner-tr"></div>
                                    <div className="tech-corner corner-bl"></div>
                                    <div className="tech-corner corner-br"></div>

                                    <div className="card-header">
                                        <span className="card-title">System Load</span>
                                        <Cpu size={20} color="#f59e0b" />
                                    </div>
                                    <div className="card-value">{stats.systemLoad.cpu}%</div>
                                    <div className="card-trend">
                                        <span className="trend-neutral">CPU Usage</span>
                                    </div>
                                </div>
                            </div>

                            {/* Performance & Resource Analytics */}
                            <div className="analytics-grid-charts">
                                <div className="tech-card">
                                    <div className="chart-header">
                                        <div className="chart-title">
                                            <Server size={18} />
                                            Resource Utilization
                                        </div>
                                    </div>
                                    <div className="chart-container">
                                        <canvas ref={resourceChartRef}></canvas>
                                    </div>
                                </div>

                                <div className="tech-card">
                                    <div className="chart-header">
                                        <div className="chart-title">
                                            <Activity size={18} />
                                            Training Duration vs Accuracy
                                        </div>
                                    </div>
                                    <div className="chart-container">
                                        <canvas ref={accuracyChartRef}></canvas>
                                    </div>
                                </div>
                            </div>

                            {/* API Usage & Health */}
                            <div className="analytics-grid-charts">
                                <div className="tech-card">
                                    <div className="chart-header">
                                        <div className="chart-title">
                                            <BarChart2 size={18} />
                                            Traffic Volume
                                        </div>
                                    </div>
                                    <div className="chart-container">
                                        <canvas ref={trafficChartRef}></canvas>
                                    </div>
                                </div>

                                <div className="tech-card">
                                    <div className="chart-header">
                                        <div className="chart-title">
                                            <AlertCircle size={18} />
                                            Error Rate Analysis
                                        </div>
                                    </div>
                                    <div className="chart-container">
                                        <canvas ref={errorChartRef}></canvas>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity Log */}
                            <div className="tech-card analytics-full-width">
                                <div className="chart-header">
                                    <div className="chart-title">
                                        <Database size={18} />
                                        Recent System Activity
                                    </div>
                                </div>
                                <div className="activity-table-container">
                                    <table className="tech-table">
                                        <thead>
                                            <tr>
                                                <th>Status</th>
                                                <th>Endpoint / Action</th>
                                                <th>Response Time</th>
                                                <th>Timestamp</th>
                                                <th>Project</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentActivity.length > 0 ? (
                                                recentActivity.map((log, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <span className={`status-badge ${log.status >= 200 && log.status < 300 ? 'status-success' :
                                                                log.status >= 400 ? 'status-error' : 'status-warning'
                                                                }`}>
                                                                {log.status}
                                                            </span>
                                                        </td>
                                                        <td>{log.endpoint}</td>
                                                        <td>{log.responseTime}ms</td>
                                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                                        <td>{log.projectName || '-'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No recent activity found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
