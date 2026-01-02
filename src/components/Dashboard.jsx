import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
    Folder, Clock, Trash2, Users, Activity, Key, Star, BarChart2, X, MoreVertical,
    Hand, Radio, TrendingUp, Zap, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Chart from 'chart.js/auto';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import NotificationPanel from './NotificationPanel';
import { getBrandedModelName } from '../lib/modelBranding';
import SystemBootIntro from './SystemBootIntro';
import './Dashboard.css';
import './SkeletonLoaders.css';

const PYTHON_SERVER_URL = import.meta.env.VITE_PYTHON_SERVER_URL || 'http://localhost:5000';

// Global variable removed in favor of sessionStorage
// let bootIntroShown = false;

// export const resetBootIntro = () => {
//     bootIntroShown = false;
// };

const DashboardSkeleton = () => (
    <div className="dashboard-layout" style={{ display: 'block' }}>
        <Sidebar sidebarOpen={true} setSidebarOpen={() => { }} />

        <div className="main-content-wrapper" style={{ marginLeft: '260px', width: 'auto' }}>
            {/* TopBar Skeleton */}
            <div className="skeleton-topbar"></div>

            <main className="dashboard-main">
                {/* Metrics Grid Skeleton */}
                <div className="metrics-grid">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="metric-card skeleton-animate">
                            <div className="metric-header">
                                <div className="skeleton-icon"></div>
                                <div className="skeleton-trend"></div>
                            </div>
                            <div className="skeleton-value"></div>
                            <div className="skeleton-label"></div>
                            <div className="skeleton-footer"></div>
                        </div>
                    ))}
                </div>

                {/* Activity Feed & Quick Stats Row Skeleton */}
                <div className="dashboard-row">
                    {/* Activity Feed Skeleton */}
                    <div className="activity-feed skeleton-animate">
                        <div className="section-header">
                            <div className="skeleton-section-title"></div>
                            <div className="skeleton-button"></div>
                        </div>
                        <div className="activity-list">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="activity-item">
                                    <div className="skeleton-activity-icon"></div>
                                    <div style={{ flex: 1 }}>
                                        <div className="skeleton-activity-title"></div>
                                        <div className="skeleton-activity-meta"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats Skeleton */}
                    <div className="quick-stats skeleton-animate">
                        <div className="section-header">
                            <div className="skeleton-section-title"></div>
                        </div>
                        <div className="stats-list">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="stat-item">
                                    <div className="skeleton-stat-label"></div>
                                    <div className="skeleton-stat-value"></div>
                                    {i <= 2 && <div className="skeleton-stat-bar"></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chart Section Skeleton */}
                <div className="chart-section skeleton-animate">
                    <div className="section-header">
                        <div className="skeleton-section-title"></div>
                        <div className="skeleton-chart-controls">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton-chart-button"></div>
                            ))}
                        </div>
                    </div>
                    <div className="skeleton-chart"></div>
                </div>

                {/* Recent Projects Skeleton */}
                <div className="recent-projects skeleton-animate">
                    <div className="section-header">
                        <div className="skeleton-section-title"></div>
                        <div className="skeleton-button"></div>
                    </div>
                    <div className="projects-table">
                        <div className="table-header">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="skeleton-table-header"></div>
                            ))}
                        </div>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="table-row">
                                <div className="td"><div className="skeleton-project-name"></div></div>
                                <div className="td"><div className="skeleton-badge"></div></div>
                                <div className="td"><div className="skeleton-badge"></div></div>
                                <div className="td"><div className="skeleton-date"></div></div>
                                <div className="td actions">
                                    <div className="skeleton-action-icon"></div>
                                    <div className="skeleton-action-icon"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [bookmarkedProjects, setBookmarkedProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);
    // Initialize showBootIntro from sessionStorage
    const [showBootIntro, setShowBootIntro] = useState(() => {
        return sessionStorage.getItem('showBootIntro') === 'true';
    });
    const [stats, setStats] = useState({
        totalProjects: 0,
        mostUsedModel: 'N/A',
        apiKeysCount: 0
    });
    const [dashboardStats, setDashboardStats] = useState({
        apiCalls: { total: 0, thisWeek: 0, lastWeek: 0, trend: 0 },
        avgAccuracy: { value: 0, trend: 0 },
        avgResponseTime: 0,
        successRate: 0,
        recentActivity: []
    });
    const [chartPeriod, setChartPeriod] = useState('7d');
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        checkUser();
        checkWelcomeMessage();
    }, []);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, chartPeriod]);

    const handleBootComplete = () => {
        setShowBootIntro(false);
        // Clear the flag so it doesn't show again on reload/navigation
        sessionStorage.removeItem('showBootIntro');
    };

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

    const checkWelcomeMessage = () => {
        const lastDismissed = localStorage.getItem('lastWelcomeDismissed');
        const today = new Date().toDateString();

        if (lastDismissed !== today) {
            setShowWelcome(true);
        }
    };

    const dismissWelcome = () => {
        setShowWelcome(false);
        localStorage.setItem('lastWelcomeDismissed', new Date().toDateString());
    };

    const calculateAvgAccuracy = (projects) => {
        const trainedProjects = projects.filter(p =>
            p.model_data?.trainingHistory?.length > 0
        );

        if (trainedProjects.length === 0) {
            return { value: 0, trend: 0 };
        }

        const accuracies = trainedProjects.map(p => {
            const history = p.model_data.trainingHistory;
            const lastEpoch = history[history.length - 1];
            return (lastEpoch.val_accuracy || lastEpoch.accuracy || 0) * 100;
        });

        const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;

        // Calculate trend (compare recent vs older models)
        const midPoint = Math.ceil(trainedProjects.length / 2);
        const recentProjects = trainedProjects.slice(0, midPoint);
        const olderProjects = trainedProjects.slice(midPoint);

        if (olderProjects.length > 0) {
            const recentAvg = recentProjects.reduce((sum, p) => {
                const history = p.model_data.trainingHistory;
                const lastEpoch = history[history.length - 1];
                return sum + ((lastEpoch.val_accuracy || lastEpoch.accuracy || 0) * 100);
            }, 0) / recentProjects.length;

            const olderAvg = olderProjects.reduce((sum, p) => {
                const history = p.model_data.trainingHistory;
                const lastEpoch = history[history.length - 1];
                return sum + ((lastEpoch.val_accuracy || lastEpoch.accuracy || 0) * 100);
            }, 0) / olderProjects.length;

            const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
            return { value: avgAccuracy, trend };
        }

        return { value: avgAccuracy, trend: 0 };
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const seconds = Math.floor((now - time) / 1000);

        if (seconds < 60) return `${seconds} seconds ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    };

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Projects
            const { data: ownedProjects, error: ownedError } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (ownedError) throw ownedError;

            const { data: collaborations, error: collabError } = await supabase
                .from('project_collaborators')
                .select(`project_id, role, projects (*)`)
                .eq('user_id', user.id)
                .neq('role', 'owner');

            if (collabError) throw collabError;

            const collaboratedProjects = collaborations?.map(c => ({
                ...c.projects,
                isCollaborated: true,
                collaboratorRole: c.role
            })) || [];

            const allProjects = [...(ownedProjects || []), ...collaboratedProjects];
            setProjects(allProjects);

            // Filter Bookmarks
            const bookmarks = allProjects.filter(p => p.model_data?.is_bookmarked);
            setBookmarkedProjects(bookmarks);

            // 2. Fetch API Keys Count
            let apiKeysCount = 0;
            try {
                const response = await fetch(`${PYTHON_SERVER_URL}/api/keys/list?userId=${user.id}`);
                const data = await response.json();
                if (data.success) {
                    apiKeysCount = data.keys.length;
                }
            } catch (e) {
                console.error("Error fetching API keys:", e);
            }

            // 3. Calculate Stats
            const modelCounts = {};
            allProjects.forEach(p => {
                const model = p.base_model_name || 'Unknown';
                modelCounts[model] = (modelCounts[model] || 0) + 1;
            });

            let mostUsed = 'N/A';
            let maxCount = 0;
            for (const [model, count] of Object.entries(modelCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    mostUsed = getBrandedModelName(model);
                }
            }

            setStats({
                totalProjects: allProjects.length,
                mostUsedModel: mostUsed,
                apiKeysCount: apiKeysCount
            });

            // 4. Fetch Dashboard Stats from Python Server
            try {
                const response = await fetch(`${PYTHON_SERVER_URL}/api/dashboard/stats?userId=${user.id}&period=${chartPeriod}`);
                const data = await response.json();

                if (data.success) {
                    // Calculate average accuracy from projects
                    const avgAccuracy = calculateAvgAccuracy(allProjects);

                    setDashboardStats({
                        apiCalls: data.apiCalls,
                        avgAccuracy: avgAccuracy,
                        avgResponseTime: data.avgResponseTime,
                        successRate: data.successRate,
                        recentActivity: data.recentActivity,
                        chartData: data.chartData
                    });

                    if (data.chartData) {
                        updateChart(data.chartData);
                    }
                }
            } catch (e) {
                console.error("Error fetching dashboard stats:", e);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateChart = (chartData) => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        if (!chartRef.current) return;

        const ctx = chartRef.current.getContext('2d');

        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'rect', // Sharp squares for legend
                            boxWidth: 8,
                            boxHeight: 8,
                            padding: 20,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12,
                                weight: 600
                            },
                            color: '#64748b'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)', // Darker background
                        titleColor: '#ff0000', // Red title
                        bodyColor: '#f8fafc',
                        padding: 12,
                        cornerRadius: 0, // Sharp tooltip
                        displayColors: true,
                        titleFont: {
                            family: "'Inter', sans-serif",
                            size: 13,
                            weight: 700
                        },
                        bodyFont: {
                            family: "'Inter', sans-serif",
                            size: 12,
                            weight: 500
                        },
                        borderColor: '#ff0000', // Red border
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                return context.dataset.label + ': ' + context.parsed.y + ' projects';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(241, 245, 249, 0.4)', // Subtle grid
                            drawBorder: false,
                            borderDash: [4, 4] // Dashed grid lines
                        },
                        ticks: {
                            stepSize: 1,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 11,
                                weight: 500
                            },
                            color: '#94a3b8',
                            padding: 12
                        },
                        border: {
                            display: false
                        },
                        stacked: true
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: "'Inter', sans-serif",
                                size: 11,
                                weight: 500
                            },
                            color: '#94a3b8',
                            padding: 8
                        },
                        border: {
                            display: false
                        },
                        stacked: true
                    }
                }
            }
        });
    };

    const handleProjectClick = (projectId) => {
        navigate(`/studio/${projectId}`);
    };

    const toggleBookmark = async (e, project) => {
        e.stopPropagation();
        // Optimistic update
        const newStatus = !project.model_data?.is_bookmarked;
        const updatedProjects = projects.map(p =>
            p.id === project.id
                ? { ...p, model_data: { ...p.model_data, is_bookmarked: newStatus } }
                : p
        );
        setProjects(updatedProjects);
        setBookmarkedProjects(updatedProjects.filter(p => p.model_data?.is_bookmarked));

        try {
            await supabase
                .from('projects')
                .update({
                    model_data: {
                        ...project.model_data,
                        is_bookmarked: newStatus
                    }
                })
                .eq('id', project.id);
        } catch (error) {
            console.error('Error updating bookmark:', error);
            fetchData(); // Revert on error
        }
    };

    const handleDeleteProject = async (e, projectId) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            const { error } = await supabase.from('projects').delete().eq('id', projectId);
            if (error) throw error;

            const remaining = projects.filter(p => p.id !== projectId);
            setProjects(remaining);
            setBookmarkedProjects(remaining.filter(p => p.model_data?.is_bookmarked));
        } catch (error) {
            console.error('Error deleting project:', error.message);
        }
    };

    return (
        <div className="dashboard-layout">
            <AnimatePresence mode="wait">
                {showBootIntro && (
                    <SystemBootIntro onComplete={handleBootComplete} />
                )}
            </AnimatePresence>

            {loading ? (
                <DashboardSkeleton />
            ) : (
                <>
                    <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                    <div className="main-content-wrapper" style={{
                        marginLeft: sidebarOpen ? '260px' : '70px',
                        transition: 'margin-left 0.3s ease'
                    }}>
                        <TopBar user={user} profile={profile} />

                        <main className="dashboard-main">
                            {/* Welcome Banner */}
                            <AnimatePresence>
                                {showWelcome && (
                                    <motion.div
                                        className="welcome-banner"
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <div className="welcome-content">
                                            <h2><Hand size={24} className="welcome-icon" style={{ display: 'inline-block', marginRight: '0.5rem', color: 'var(--accent-red)' }} /> Welcome back, {profile?.username || user?.email?.split('@')[0]}!</h2>
                                            <p>Here's what's happening with your AI models today.</p>
                                        </div>
                                        <button className="welcome-close" onClick={dismissWelcome}>
                                            <X size={16} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Overview Metrics */}
                            <div className="metrics-grid">
                                <motion.div
                                    className="metric-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <div className="metric-header">
                                        <div className="tech-decor top-left"></div>
                                        <div className="tech-decor top-right"></div>
                                        <div className="tech-decor bottom-left"></div>
                                        <div className="tech-decor bottom-right"></div>
                                        <div className="metric-icon api">
                                            <Activity size={20} />
                                        </div>
                                        <div className={`metric-trend ${dashboardStats.apiCalls.trend >= 0 ? 'positive' : 'negative'}`}>
                                            <span>
                                                {dashboardStats.apiCalls.trend >= 0 ? '↑' : '↓'} {Math.abs(dashboardStats.apiCalls.trend).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="metric-value">
                                        {dashboardStats.apiCalls.total >= 1000000
                                            ? `${(dashboardStats.apiCalls.total / 1000000).toFixed(1)}M`
                                            : dashboardStats.apiCalls.total >= 1000
                                                ? `${(dashboardStats.apiCalls.total / 1000).toFixed(1)}K`
                                                : dashboardStats.apiCalls.total
                                        }
                                    </div>
                                    <div className="metric-label">API Calls</div>
                                    <div className="metric-footer">vs last week</div>
                                </motion.div>

                                <motion.div
                                    className="metric-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="metric-header">
                                        <div className="tech-decor top-left"></div>
                                        <div className="tech-decor top-right"></div>
                                        <div className="tech-decor bottom-left"></div>
                                        <div className="tech-decor bottom-right"></div>
                                        <div className="metric-icon accuracy">
                                            <BarChart2 size={20} />
                                        </div>
                                        <div className={`metric-trend ${dashboardStats.avgAccuracy.trend >= 0 ? 'positive' : 'negative'}`}>
                                            <span>
                                                {dashboardStats.avgAccuracy.trend >= 0 ? '↑' : '↓'} {Math.abs(dashboardStats.avgAccuracy.trend).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="metric-value">{dashboardStats.avgAccuracy.value.toFixed(1)}%</div>
                                    <div className="metric-label">Avg Accuracy</div>
                                    <div className="metric-footer">{dashboardStats.avgAccuracy.trend >= 0 ? 'improved' : 'decreased'}</div>
                                </motion.div>

                                <motion.div
                                    className="metric-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <div className="metric-header">
                                        <div className="tech-decor top-left"></div>
                                        <div className="tech-decor top-right"></div>
                                        <div className="tech-decor bottom-left"></div>
                                        <div className="tech-decor bottom-right"></div>
                                        <div className="metric-icon projects">
                                            <Folder size={20} />
                                        </div>
                                    </div>
                                    <div className="metric-value">{stats.totalProjects}</div>
                                    <div className="metric-label">Total Projects</div>
                                    <div className="metric-footer">{stats.totalProjects > 0 ? 'active' : 'get started'}</div>
                                </motion.div>

                                <motion.div
                                    className="metric-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className="metric-header">
                                        <div className="tech-decor top-left"></div>
                                        <div className="tech-decor top-right"></div>
                                        <div className="tech-decor bottom-left"></div>
                                        <div className="tech-decor bottom-right"></div>
                                        <div className="metric-icon keys">
                                            <Key size={20} />
                                        </div>
                                    </div>
                                    <div className="metric-value">{stats.apiKeysCount}</div>
                                    <div className="metric-label">API Keys</div>
                                    <div className="metric-footer">generated</div>
                                </motion.div>
                            </div>

                            {/* Activity Feed & Chart Row */}
                            <div className="dashboard-row">
                                {/* Activity Feed */}
                                <motion.div
                                    className="activity-feed"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <div className="tech-decor top-left"></div>
                                    <div className="tech-decor top-right"></div>
                                    <div className="tech-decor bottom-left"></div>
                                    <div className="tech-decor bottom-right"></div>
                                    <div className="section-header">
                                        <h3><Radio size={18} className="section-icon" style={{ display: 'inline-block', marginRight: '0.5rem', color: 'var(--accent-red)' }} /> Live Activity</h3>
                                        <button className="view-all-btn" onClick={() => navigate('/logs')}>View All</button>
                                    </div>
                                    <div className="activity-list">
                                        {dashboardStats.recentActivity.length > 0 ? (
                                            dashboardStats.recentActivity.slice(0, 5).map((activity, index) => (
                                                <div key={index} className="activity-item">
                                                    <div className={`activity-icon ${activity.status >= 200 && activity.status < 300 ? 'success' :
                                                        activity.status >= 400 && activity.status < 500 ? 'warning' : 'error'
                                                        }`}>
                                                        {activity.status >= 200 && activity.status < 300 ? <Zap size={16} /> :
                                                            activity.status >= 400 && activity.status < 500 ? <Activity size={16} /> : <X size={16} />}
                                                    </div>
                                                    <div className="activity-content">
                                                        <div className="activity-title">
                                                            API Call: {activity.endpoint} - {activity.status}
                                                            {activity.status >= 200 && activity.status < 300 ? ' OK' : ' Error'}
                                                        </div>
                                                        <div className="activity-meta">
                                                            {activity.responseTime}ms • {formatTimeAgo(activity.timestamp)}
                                                            {activity.projectName && ` • ${activity.projectName}`}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-activity" style={{
                                                textAlign: 'center',
                                                padding: '2rem',
                                                color: 'var(--text-tertiary)'
                                            }}>
                                                <p>No recent API activity</p>
                                                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                                    Make some API calls to see activity here
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Quick Stats */}
                                <motion.div
                                    className="quick-stats"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <div className="tech-decor top-left"></div>
                                    <div className="tech-decor top-right"></div>
                                    <div className="tech-decor bottom-left"></div>
                                    <div className="tech-decor bottom-right"></div>
                                    <div className="section-header">
                                        <h3><BarChart2 size={18} className="section-icon" style={{ display: 'inline-block', marginRight: '0.5rem', color: 'var(--accent-red)' }} /> Quick Stats</h3>
                                    </div>
                                    <div className="stats-list">
                                        <div className="stat-item">
                                            <div className="stat-label">Avg Response Time</div>
                                            <div className="stat-value">{dashboardStats.avgResponseTime}ms</div>
                                            <div className="stat-bar">
                                                <div className="stat-fill" style={{ width: '65%' }}></div>
                                            </div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-label">Success Rate</div>
                                            <div className="stat-value">{dashboardStats.successRate.toFixed(1)}%</div>
                                            <div className="stat-bar">
                                                <div className="stat-fill success" style={{ width: `${dashboardStats.successRate}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-label">Active Deployments</div>
                                            <div className="stat-value">8</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-label">Most Used Model</div>
                                            <div className="stat-value">{stats.mostUsedModel}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Chart Section */}
                            <motion.div
                                className="chart-section"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <div className="tech-decor top-left"></div>
                                <div className="tech-decor top-right"></div>
                                <div className="tech-decor bottom-left"></div>
                                <div className="tech-decor bottom-right"></div>
                                <div className="section-header">
                                    <h3><TrendingUp size={18} className="section-icon" style={{ display: 'inline-block', marginRight: '0.5rem', color: 'var(--accent-red)' }} /> Model Usage Trends</h3>
                                    <div className="chart-controls">
                                        <button className={`chart-period ${chartPeriod === '7d' ? 'active' : ''}`} onClick={() => setChartPeriod('7d')}>7D</button>
                                        <button className={`chart-period ${chartPeriod === '30d' ? 'active' : ''}`} onClick={() => setChartPeriod('30d')}>30D</button>
                                        <button className={`chart-period ${chartPeriod === '90d' ? 'active' : ''}`} onClick={() => setChartPeriod('90d')}>90D</button>
                                        <button className={`chart-period ${chartPeriod === '1y' ? 'active' : ''}`} onClick={() => setChartPeriod('1y')}>1Y</button>
                                    </div>
                                </div>
                                <div className="chart-container">
                                    <canvas ref={chartRef}></canvas>
                                </div>
                            </motion.div>

                            {/* Recent Projects */}
                            <motion.div
                                className="recent-projects"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                            >
                                <div className="tech-decor top-left"></div>
                                <div className="tech-decor top-right"></div>
                                <div className="tech-decor bottom-left"></div>
                                <div className="tech-decor bottom-right"></div>
                                <div className="section-header">
                                    <h3><Folder size={18} className="section-icon" style={{ display: 'inline-block', marginRight: '0.5rem', color: 'var(--accent-red)' }} /> Recent Projects</h3>
                                    <button className="view-all-btn" onClick={() => navigate('/projects')}>
                                        View All →
                                    </button>
                                </div>

                                {projects.length === 0 ? (
                                    <div className="empty-state">
                                        <Folder size={48} />
                                        <h4>No projects yet</h4>
                                        <p>Create your first AI model to get started</p>
                                        <button className="btn-primary" onClick={() => navigate('/projects')}>
                                            <Plus size={16} />
                                            Create Project
                                        </button>
                                    </div>
                                ) : (
                                    <div className="projects-table">
                                        <div className="table-header">
                                            <div className="th">Project Name</div>
                                            <div className="th">Type</div>
                                            <div className="th">Model</div>
                                            <div className="th">Created</div>
                                            <div className="th actions">Actions</div>
                                        </div>
                                        {projects.slice(0, 5).map((project) => (
                                            <div
                                                key={project.id}
                                                className="table-row"
                                                onClick={() => handleProjectClick(project.id)}
                                            >
                                                <div className="td project-name">
                                                    <div className="project-icon">
                                                        {project.project_type === 'IMAGE' ? <Folder size={16} /> :
                                                            project.project_type === 'POSE' ? <Activity size={16} /> :
                                                                <Folder size={16} />}
                                                    </div>
                                                    <div>
                                                        <div className="name-text">{project.name}</div>
                                                        {project.description && (
                                                            <div className="desc-text">{project.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="td">
                                                    <span className="badge type">{project.project_type}</span>
                                                </div>
                                                <div className="td">
                                                    <span className="badge model">
                                                        {getBrandedModelName(project.base_model_name)}
                                                    </span>
                                                </div>
                                                <div className="td date">
                                                    <Clock size={14} style={{ marginRight: '4px' }} />
                                                    {new Date(project.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="td actions">
                                                    <button
                                                        className={`action-btn ${project.model_data?.is_bookmarked ? 'active' : ''}`}
                                                        onClick={(e) => toggleBookmark(e, project)}
                                                        title="Bookmark"
                                                    >
                                                        <Star size={16} fill={project.model_data?.is_bookmarked ? "currentColor" : "none"} />
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={(e) => handleDeleteProject(e, project.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </main>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
