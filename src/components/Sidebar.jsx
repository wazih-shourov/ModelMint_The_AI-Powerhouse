import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Home, FolderKanban, Rocket, BarChart3, Key, Webhook, Terminal, FileCode,
    Activity, TrendingUp, Bell, DollarSign, Users, Settings, ChevronDown,
    ChevronRight, Plus, Cpu, HardDrive, Zap, Menu, X, Flame
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import faviconLogo from '../assets/favicon.png';
import './Sidebar.css';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [expandedSections, setExpandedSections] = useState({
        workspace: true,
        development: false,
        monitoring: false
    });
    const [resourceStats, setResourceStats] = useState({
        apiCalls: 0,
        apiLimit: 300,
        projects: 0,
        deployments: 0
    });

    useEffect(() => {
        fetchResourceStats();
        const interval = setInterval(fetchResourceStats, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchResourceStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch projects count
            const { data: projects } = await supabase
                .from('projects')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id);

            // Fetch today's API calls from dashboard stats
            const PYTHON_SERVER_URL = import.meta.env.VITE_PYTHON_SERVER_URL || 'http://localhost:5000';
            const response = await fetch(`${PYTHON_SERVER_URL}/api/dashboard/stats?userId=${user.id}`);
            const dashboardData = await response.json();

            setResourceStats(prev => ({
                ...prev,
                projects: projects?.length || 0,
                apiCalls: dashboardData.success ? dashboardData.apiCalls.today : 0,
                deployments: 0 // Will be implemented later
            }));
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const isActive = (path) => location.pathname === path;

    const navigationSections = [
        {
            id: 'workspace',
            title: 'WORKSPACE',
            items: [
                { path: '/dashboard', icon: Home, label: 'Dashboard' },
                { path: '/projects', icon: FolderKanban, label: 'Projects' },
                { path: '/community', icon: Users, label: 'Community' },
                { path: '/deployments', icon: Rocket, label: 'Deployments', badge: resourceStats.deployments },
                { path: '/analytics', icon: BarChart3, label: 'Analytics' }
            ]
        },
        {
            id: 'development',
            title: 'DEVELOPMENT',
            items: [
                { path: '/api-keys', icon: Key, label: 'API Keys' },
                { path: '/webhooks', icon: Webhook, label: 'Webhooks' },
                { path: '/cli', icon: Terminal, label: 'CLI Tools' },
                { path: '/docs', icon: FileCode, label: 'Documentation' }
            ]
        },
        {
            id: 'monitoring',
            title: 'MONITORING',
            items: [
                { path: '/logs', icon: Activity, label: 'Logs' },
                { path: '/training-history', icon: Flame, label: 'Training History' },
                { path: '/metrics', icon: TrendingUp, label: 'Metrics' },
                { path: '/alerts', icon: Bell, label: 'Alerts' },
                { path: '/usage', icon: DollarSign, label: 'Usage' }
            ]
        }
    ];

    const quickActions = [
        { icon: Rocket, label: 'Deploy Model', action: () => navigate('/deployments') },
        { icon: Plus, label: 'New Project', action: () => navigate('/projects') },
        { icon: Key, label: 'Generate Key', action: () => navigate('/api-keys') }
    ];

    const calculatePercentage = (value, max) => Math.min((value / max) * 100, 100);

    return (
        <aside className={`dev-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            {/* Header */}
            <div className="sidebar-header">
                <div className="logo-section">
                    <div className="logo-icon">
                        <img src={faviconLogo} alt="ModelMint" />
                    </div>
                    {sidebarOpen && <h2>ModelMint</h2>}
                </div>
                <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navigationSections.map(section => (
                    <div key={section.id} className="nav-section">
                        {sidebarOpen && (
                            <button
                                className="section-header"
                                onClick={() => toggleSection(section.id)}
                            >
                                <span>{section.title}</span>
                                {expandedSections[section.id] ?
                                    <ChevronDown size={14} /> :
                                    <ChevronRight size={14} />
                                }
                            </button>
                        )}

                        {(expandedSections[section.id] || !sidebarOpen) && (
                            <div className="nav-items">
                                {section.items.map(item => (
                                    <button
                                        key={item.path}
                                        className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                                        onClick={() => navigate(item.path)}
                                        title={!sidebarOpen ? item.label : ''}
                                    >
                                        <item.icon size={18} />
                                        {sidebarOpen && (
                                            <>
                                                <span>{item.label}</span>
                                                {item.badge !== undefined && item.badge > 0 && (
                                                    <span className="badge">{item.badge}</span>
                                                )}
                                            </>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Settings at bottom of nav */}
                <div className="nav-section">
                    <button
                        className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
                        onClick={() => navigate('/settings')}
                        title={!sidebarOpen ? 'Settings' : ''}
                    >
                        <Settings size={18} />
                        {sidebarOpen && <span>Settings</span>}
                    </button>
                </div>
            </nav>

            {/* Quick Actions */}
            {sidebarOpen && (
                <div className="quick-actions">
                    <div className="section-title">QUICK ACTIONS</div>
                    {quickActions.map((action, index) => (
                        <button key={index} className="quick-action-btn" onClick={action.action}>
                            <action.icon size={16} />
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Resource Monitor */}
            {sidebarOpen && (
                <div className="resource-monitor">
                    <div className="section-title">RESOURCES</div>

                    <div className="resource-item">
                        <div className="resource-header">
                            <Zap size={14} />
                            <span>API Calls Today</span>
                        </div>
                        <div className="resource-bar">
                            <div
                                className="resource-fill"
                                style={{ width: `${calculatePercentage(resourceStats.apiCalls, resourceStats.apiLimit)}%` }}
                            />
                        </div>
                        <div className="resource-text">
                            {resourceStats.apiCalls.toLocaleString()} / {resourceStats.apiLimit.toLocaleString()}
                        </div>
                    </div>

                    <div className="resource-item">
                        <div className="resource-header">
                            <FolderKanban size={14} />
                            <span>Active Projects</span>
                        </div>
                        <div className="resource-value">{resourceStats.projects}</div>
                    </div>

                    <div className="resource-item">
                        <div className="resource-header">
                            <Rocket size={14} />
                            <span>Deployments</span>
                        </div>
                        <div className="resource-value">{resourceStats.deployments}</div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
