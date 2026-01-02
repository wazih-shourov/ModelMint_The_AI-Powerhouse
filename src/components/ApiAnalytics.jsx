import { useState, useEffect, useRef } from 'react';
import { X, TrendingUp, Activity, BarChart3, CreditCard, Receipt } from 'lucide-react';
import Chart from 'chart.js/auto';
import './ApiAnalytics.css';


const ApiAnalytics = ({ apiKey, onClose }) => {
    const [activeTab, setActiveTab] = useState('usage'); // 'usage' or 'limits'
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);

    const minuteChartRef = useRef(null);
    const hourlyChartRef = useRef(null);
    const dailyChartRef = useRef(null);
    const concurrentChartRef = useRef(null);

    const chartInstances = useRef({});

    const PYTHON_SERVER_URL = import.meta.env.VITE_PYTHON_SERVER_URL || 'http://localhost:5000';

    useEffect(() => {
        loadAnalytics();

        // Real-time polling every 5 seconds
        const intervalId = setInterval(() => {
            loadAnalytics(true); // true = silent update (no loading spinner)
        }, 5000);

        // Cleanup charts on unmount
        return () => {
            clearInterval(intervalId);
            Object.values(chartInstances.current).forEach(chart => {
                if (chart) chart.destroy();
            });
        };
    }, [apiKey.id]);

    const loadAnalytics = async (silent = false) => {
        try {
            if (!silent) setLoading(true);

            // Fetch analytics data from backend
            const response = await fetch(
                `${PYTHON_SERVER_URL}/api/keys/analytics?keyId=${apiKey.id}`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setAnalyticsData(data);

                // Wait for next tick to ensure canvas elements are rendered
                setTimeout(() => {
                    renderCharts(data);
                }, 100);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Convert UTC time labels to user's local timezone
    const convertToLocalTime = (labels, format) => {
        return labels.map(label => {
            try {
                // Check if label is already in HH:MM format (from backend)
                if (label.match(/^\d{2}:\d{2}$/)) {
                    // It's already formatted as HH:MM in UTC
                    // Convert to local time
                    const [hours, minutes] = label.split(':').map(Number);
                    const utcDate = new Date();
                    utcDate.setUTCHours(hours, minutes, 0, 0);

                    return utcDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                }

                // Check if it's a date format like "12/10"
                if (label.match(/^\d{2}\/\d{2}$/)) {
                    return label; // Already formatted, return as is
                }

                // Try to parse as ISO date
                const utcDate = new Date(label);
                if (isNaN(utcDate.getTime())) {
                    // Invalid date, return original
                    return label;
                }

                // Format based on the chart type
                if (format === 'time') {
                    return utcDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                } else if (format === 'date') {
                    return utcDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                    });
                } else {
                    return utcDate.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            } catch (e) {
                // If parsing fails, return original label
                return label;
            }
        });
    };

    const renderCharts = (data) => {
        const chartConfig = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ff3131',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#666'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        };

        // Destroy existing charts
        Object.values(chartInstances.current).forEach(chart => {
            if (chart) chart.destroy();
        });

        // Per Minute Chart
        if (minuteChartRef.current) {
            const ctx = minuteChartRef.current.getContext('2d');
            chartInstances.current.minute = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: convertToLocalTime(data.minuteData?.labels || [], 'time'),
                    datasets: [{
                        label: 'Calls per Minute',
                        data: data.minuteData?.values || [],
                        borderColor: '#ff3131',
                        backgroundColor: 'rgba(255, 49, 49, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    }]
                },
                options: chartConfig
            });
        }

        // Per Hour Chart
        if (hourlyChartRef.current) {
            const ctx = hourlyChartRef.current.getContext('2d');
            chartInstances.current.hourly = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: convertToLocalTime(data.hourlyData?.labels || [], 'time'),
                    datasets: [{
                        label: 'Calls per Hour',
                        data: data.hourlyData?.values || [],
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    }]
                },
                options: chartConfig
            });
        }

        // Per Day Chart
        if (dailyChartRef.current) {
            const ctx = dailyChartRef.current.getContext('2d');
            chartInstances.current.daily = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: convertToLocalTime(data.dailyData?.labels || [], 'date'),
                    datasets: [{
                        label: 'Calls per Day',
                        data: data.dailyData?.values || [],
                        borderColor: '#ff9999',
                        backgroundColor: 'rgba(255, 153, 153, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    }]
                },
                options: chartConfig
            });
        }

        // Concurrent Connections Chart
        if (concurrentChartRef.current) {
            const ctx = concurrentChartRef.current.getContext('2d');
            chartInstances.current.concurrent = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: convertToLocalTime(data.concurrentData?.labels || [], 'time'),
                    datasets: [{
                        label: 'Concurrent Connections',
                        data: data.concurrentData?.values || [],
                        borderColor: '#ffcccc',
                        backgroundColor: 'rgba(255, 204, 204, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    }]
                },
                options: chartConfig
            });
        }
    };

    const getRateLimitPercentage = (current, limit) => {
        return ((current / limit) * 100).toFixed(1);
    };

    return (
        <div className="analytics-overlay">
            <div className="analytics-modal">
                {/* Tech Decor Elements */}
                <div className="tech-decor top-left"></div>
                <div className="tech-decor top-right"></div>
                <div className="tech-decor bottom-left"></div>
                <div className="tech-decor bottom-right"></div>

                <div className="analytics-header">
                    <div className="analytics-title">
                        <Activity size={24} />
                        <div>
                            <h2>API Analytics</h2>
                            <p>{apiKey.name || 'API Key'}</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="analytics-tabs">
                    <button
                        className={`tab ${activeTab === 'usage' ? 'active' : ''}`}
                        onClick={() => setActiveTab('usage')}
                    >
                        <TrendingUp size={18} />
                        Usage Analytics
                    </button>
                    <button
                        className={`tab ${activeTab === 'limits' ? 'active' : ''}`}
                        onClick={() => setActiveTab('limits')}
                    >
                        <BarChart3 size={18} />
                        Rate Limits
                    </button>
                    <button
                        className={`tab ${activeTab === 'billing' ? 'active' : ''}`}
                        onClick={() => setActiveTab('billing')}
                    >
                        <Receipt size={18} />
                        Billing & Usage
                    </button>
                </div>

                <div className="analytics-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading analytics...</p>
                        </div>
                    ) : activeTab === 'usage' ? (
                        <div className="charts-grid">
                            <div className="chart-card">
                                <h3>Calls per Minute</h3>
                                <div className="chart-container">
                                    <canvas ref={minuteChartRef}></canvas>
                                </div>
                            </div>

                            <div className="chart-card">
                                <h3>Calls per Hour</h3>
                                <div className="chart-container">
                                    <canvas ref={hourlyChartRef}></canvas>
                                </div>
                            </div>

                            <div className="chart-card">
                                <h3>Calls per Day</h3>
                                <div className="chart-container">
                                    <canvas ref={dailyChartRef}></canvas>
                                </div>
                            </div>

                            <div className="chart-card">
                                <h3>Concurrent Connections</h3>
                                <div className="chart-container">
                                    <canvas ref={concurrentChartRef}></canvas>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'limits' ? (
                        <div className="limits-view">
                            <div className="limit-card">
                                <div className="limit-header">
                                    <h3>Per Minute Limit</h3>
                                    <span className="limit-value">
                                        {analyticsData?.currentUsage?.minute_count || 0} / 10
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${getRateLimitPercentage(analyticsData?.currentUsage?.minute_count || 0, 10)}%` }}
                                    ></div>
                                </div>
                                <p className="limit-percentage">
                                    {getRateLimitPercentage(analyticsData?.currentUsage?.minute_count || 0, 10)}% used
                                </p>
                            </div>

                            <div className="limit-card">
                                <div className="limit-header">
                                    <h3>Per Hour Limit</h3>
                                    <span className="limit-value">
                                        {analyticsData?.currentUsage?.hourly_count || 0} / 60
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${getRateLimitPercentage(analyticsData?.currentUsage?.hourly_count || 0, 60)}%` }}
                                    ></div>
                                </div>
                                <p className="limit-percentage">
                                    {getRateLimitPercentage(analyticsData?.currentUsage?.hourly_count || 0, 60)}% used
                                </p>
                            </div>

                            <div className="limit-card">
                                <div className="limit-header">
                                    <h3>Per Day Limit</h3>
                                    <span className="limit-value">
                                        {analyticsData?.currentUsage?.daily_count || 0} / 300
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${getRateLimitPercentage(analyticsData?.currentUsage?.daily_count || 0, 300)}%` }}
                                    ></div>
                                </div>
                                <p className="limit-percentage">
                                    {getRateLimitPercentage(analyticsData?.currentUsage?.daily_count || 0, 300)}% used
                                </p>
                            </div>

                            <div className="limit-card">
                                <div className="limit-header">
                                    <h3>Concurrent Connections</h3>
                                    <span className="limit-value">
                                        0 / 2
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: '0%' }}
                                    ></div>
                                </div>
                                <p className="limit-percentage">0% used</p>
                            </div>
                        </div>
                    ) : (
                        <div className="billing-view">
                            <div className="billing-summary-card">
                                <div className="billing-header">
                                    <div className="billing-icon">
                                        <CreditCard size={24} />
                                    </div>
                                    <div>
                                        <h3>Current Plan: Free Tier</h3>
                                        <p>Standard API Access</p>
                                    </div>
                                    <div className="plan-badge">ACTIVE</div>
                                </div>
                                <div className="billing-details">
                                    <div className="billing-row">
                                        <span>Billing Cycle</span>
                                        <span>Monthly</span>
                                    </div>
                                    <div className="billing-row">
                                        <span>Next Invoice</span>
                                        <span>$0.00</span>
                                    </div>
                                    <div className="billing-row">
                                        <span>Usage Cost (Est.)</span>
                                        <span>${((analyticsData?.currentUsage?.monthly_count || 0) * 0.001).toFixed(4)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="usage-breakdown">
                                <h3>Usage Breakdown (Last 30 Days)</h3>
                                <div className="breakdown-card">
                                    <div className="breakdown-item">
                                        <span className="label">Total API Calls</span>
                                        <span className="value">{analyticsData?.currentUsage?.monthly_count || 0}</span>
                                    </div>
                                    <div className="breakdown-item">
                                        <span className="label">Successful Calls</span>
                                        <span className="value success">{analyticsData?.currentUsage?.monthly_count || 0}</span>
                                    </div>
                                    <div className="breakdown-item">
                                        <span className="label">Failed Calls</span>
                                        <span className="value error">0</span>
                                    </div>
                                    <div className="breakdown-item">
                                        <span className="label">Avg. Latency</span>
                                        <span className="value">124ms</span>
                                    </div>
                                </div>
                            </div>

                            <div className="upgrade-promo">
                                <h3>Need more power?</h3>
                                <p>Upgrade to Pro for higher rate limits and priority support.</p>
                                <button className="upgrade-btn">View Plans</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default ApiAnalytics;
