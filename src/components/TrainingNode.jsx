import React, { useState } from 'react';
import { Play, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const TrainingNode = ({ trainModel, isTraining, progress, status, hasData }) => {
    const [params, setParams] = useState({
        epochs: 50,
        batchSize: 16,
        learningRate: 0.001
    });
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setParams(prev => ({ ...prev, [name]: parseFloat(value) }));
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Training</h3>
                {status && <span style={{ fontSize: '0.75rem', color: '#666' }}>{status}</span>}
            </div>
            <div className="card-body">
                <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                    onClick={() => trainModel(params)}
                    disabled={isTraining || !hasData}
                >
                    {isTraining ? 'Training Model...' : 'Train Model'}
                    {!isTraining && <Play size={18} />}
                </button>

                {/* Progress */}
                {(isTraining || progress.epoch > 0) && (
                    <div className="progress-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 0' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '1rem' }}>
                            {/* Background Circle */}
                            <svg width="120" height="120" viewBox="0 0 120 120">
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth="8"
                                />
                                {/* Progress Circle */}
                                <motion.circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    fill="none"
                                    stroke="#ff3131"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: progress.epoch / params.epochs }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    style={{ rotate: -90, transformOrigin: "center" }}
                                />
                            </svg>

                            {/* Center Text */}
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                                    {Math.round((progress.epoch / params.epochs) * 100)}%
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    Epoch {progress.epoch}
                                </span>
                            </div>

                            {/* Pulsing Ring Effect when training */}
                            {isTraining && (
                                <motion.div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        border: '2px solid #ff3131',
                                        zIndex: -1
                                    }}
                                    animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', textAlign: 'center' }}>
                            <div style={{ background: '#f9fafb', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Loss</div>
                                <div style={{ fontWeight: '600', color: '#ef4444' }}>{progress.loss?.toFixed(4) || '0.0000'}</div>
                            </div>
                            <div style={{ background: '#f9fafb', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Accuracy</div>
                                <div style={{ fontWeight: '600', color: '#10b981' }}>{(progress.accuracy * 100).toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="advanced-settings">
                    <div className="settings-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
                        {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        Advanced Settings
                    </div>

                    {showAdvanced && (
                        <div className="settings-content">
                            <div className="input-group">
                                <label className="input-label">Epochs</label>
                                <input
                                    type="number"
                                    name="epochs"
                                    value={params.epochs}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Batch Size</label>
                                <input
                                    type="number"
                                    name="batchSize"
                                    value={params.batchSize}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Learning Rate</label>
                                <input
                                    type="number"
                                    name="learningRate"
                                    step="0.0001"
                                    value={params.learningRate}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrainingNode;
