import React from 'react';
import { Cpu, Zap, HardDrive, Clock } from 'lucide-react';
import './PerformanceMonitorDisplay.css';

const PerformanceMonitorDisplay = ({ metrics, isTraining }) => {
    if (!isTraining || !metrics) {
        return null;
    }

    const { cpu, memory, gpu, elapsedTime } = metrics;

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getCPUColor = (usage) => {
        if (usage < 50) return '#10b981'; // Green
        if (usage < 75) return '#f59e0b'; // Orange
        return '#ef4444'; // Red
    };

    const getMemoryColor = (used, limit) => {
        const percentage = (used / limit) * 100;
        if (percentage < 50) return '#10b981';
        if (percentage < 75) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="performance-monitor-display">
            <div className="performance-header">
                <span className="performance-title">Training Performance</span>
                <div className="performance-pulse"></div>
            </div>

            <div className="performance-metrics">
                {/* CPU Usage */}
                <div className="metric-item">
                    <div className="metric-icon" style={{ color: getCPUColor(cpu) }}>
                        <Cpu size={16} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">CPU</span>
                        <span className="metric-value" style={{ color: getCPUColor(cpu) }}>
                            {cpu.toFixed(1)}%
                        </span>
                    </div>
                </div>

                {/* GPU Status */}
                <div className="metric-item">
                    <div className="metric-icon" style={{ color: gpu?.active ? '#10b981' : '#9ca3af' }}>
                        <Zap size={16} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">GPU</span>
                        <span className="metric-value" style={{ color: gpu?.active ? '#10b981' : '#9ca3af' }}>
                            {gpu?.active ? 'Active' : 'Idle'}
                        </span>
                    </div>
                </div>

                {/* Memory Usage */}
                <div className="metric-item">
                    <div className="metric-icon" style={{ color: getMemoryColor(memory?.used || 0, memory?.limit || 1) }}>
                        <HardDrive size={16} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">Memory</span>
                        <span className="metric-value">
                            {memory?.used || 0} MB
                        </span>
                    </div>
                </div>

                {/* Training Time */}
                <div className="metric-item">
                    <div className="metric-icon" style={{ color: '#3b82f6' }}>
                        <Clock size={16} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">Time</span>
                        <span className="metric-value">
                            {formatTime(elapsedTime || 0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* GPU Model Info */}
            {gpu?.active && gpu?.model && (
                <div className="gpu-info">
                    <Zap size={12} />
                    <span>{gpu.model}</span>
                </div>
            )}
        </div>
    );
};

export default PerformanceMonitorDisplay;
