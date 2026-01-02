import React, { useState, useEffect } from 'react';
import { Cpu, Zap, HardDrive, Clock, Activity } from 'lucide-react';
import './SystemMonitoringNode.css';

const SystemMonitoringNode = ({
    metrics,
    isTraining,
    peakMetrics,
    onClose
}) => {
    const [displayMetrics, setDisplayMetrics] = useState({
        cpu: 0,
        memory: 0,
        gpu: { used: false, model: null },
        duration: 0
    });

    const [peaks, setPeaks] = useState({
        cpu: 0,
        memory: 0
    });

    useEffect(() => {
        if (metrics) {
            setDisplayMetrics(metrics);

            // Update peaks if current values are higher
            setPeaks(prev => ({
                cpu: Math.max(prev.cpu, metrics.cpu || 0),
                memory: Math.max(prev.memory, metrics.memory || 0)
            }));
        }
    }, [metrics]);

    // Use peak metrics when training is complete
    useEffect(() => {
        if (!isTraining && peakMetrics) {
            setPeaks(peakMetrics);
        }
    }, [isTraining, peakMetrics]);

    const getUsageColor = (value, type = 'cpu') => {
        if (type === 'cpu') {
            if (value < 50) return '#10b981'; // green
            if (value < 75) return '#f59e0b'; // orange
            return '#ef4444'; // red
        } else {
            // Memory in MB
            if (value < 1000) return '#10b981';
            if (value < 2000) return '#f59e0b';
            return '#ef4444';
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatMemory = (mb) => {
        if (mb >= 1000) {
            return `${(mb / 1024).toFixed(1)} GB`;
        }
        return `${Math.round(mb)} MB`;
    };

    return (
        <div className={`system-monitoring-node ${isTraining ? 'active' : 'completed'}`}>
            {/* Header */}
            <div className="monitoring-node-header card-header">
                <div className="monitoring-title">
                    <Activity size={14} />
                    <span>System Monitor</span>
                </div>
                {isTraining && (
                    <div className="live-indicator">
                        <div className="pulse-dot"></div>
                        <span>LIVE</span>
                    </div>
                )}
            </div>

            {/* Metrics Grid */}
            <div className="monitoring-metrics-grid">
                {/* CPU Usage */}
                <div className="metric-item">
                    <div className="metric-icon" style={{ color: getUsageColor(isTraining ? displayMetrics.cpu : peaks.cpu) }}>
                        <Cpu size={16} />
                    </div>
                    <div className="metric-content">
                        <div className="metric-label">CPU</div>
                        <div className="metric-value" style={{ color: getUsageColor(isTraining ? displayMetrics.cpu : peaks.cpu) }}>
                            {isTraining ? displayMetrics.cpu.toFixed(1) : peaks.cpu.toFixed(1)}%
                        </div>
                        {!isTraining && peaks.cpu > 0 && (
                            <div className="metric-peak">Peak</div>
                        )}
                    </div>
                </div>

                {/* GPU Status */}
                <div className="metric-item">
                    <div className="metric-icon" style={{ color: displayMetrics.gpu.used ? '#10b981' : '#6b7280' }}>
                        <Zap size={16} />
                    </div>
                    <div className="metric-content">
                        <div className="metric-label">GPU</div>
                        <div className="metric-value" style={{ color: displayMetrics.gpu.used ? '#10b981' : '#6b7280' }}>
                            {displayMetrics.gpu.used ? 'Active' : 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Memory Usage */}
                <div className="metric-item">
                    <div className="metric-icon" style={{ color: getUsageColor(isTraining ? displayMetrics.memory : peaks.memory, 'memory') }}>
                        <HardDrive size={16} />
                    </div>
                    <div className="metric-content">
                        <div className="metric-label">Memory</div>
                        <div className="metric-value" style={{ color: getUsageColor(isTraining ? displayMetrics.memory : peaks.memory, 'memory') }}>
                            {formatMemory(isTraining ? displayMetrics.memory : peaks.memory)}
                        </div>
                        {!isTraining && peaks.memory > 0 && (
                            <div className="metric-peak">Peak</div>
                        )}
                    </div>
                </div>

                {/* Duration */}
                <div className="metric-item">
                    <div className="metric-icon" style={{ color: '#8b5cf6' }}>
                        <Clock size={16} />
                    </div>
                    <div className="metric-content">
                        <div className="metric-label">Time</div>
                        <div className="metric-value" style={{ color: '#8b5cf6' }}>
                            {formatDuration(displayMetrics.duration)}
                        </div>
                    </div>
                </div>
            </div>

            {/* GPU Model Info */}
            {displayMetrics.gpu.model && (
                <div className="gpu-model-info">
                    <Zap size={12} />
                    <span>{displayMetrics.gpu.model}</span>
                </div>
            )}

            {/* Status Footer */}
            <div className="monitoring-node-footer">
                {isTraining ? (
                    <div className="status-text training">
                        <div className="spinner"></div>
                        Training in progress...
                    </div>
                ) : peaks.cpu > 0 ? (
                    <div className="status-text completed">
                        Training completed - Peak usage recorded
                    </div>
                ) : (
                    <div className="status-text idle">
                        Waiting for training...
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemMonitoringNode;
