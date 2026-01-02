import React, { useState } from 'react';
import { Brain, Zap, Settings } from 'lucide-react';
import './TextTrainingNode.css';

const TextTrainingNode = ({ trainModel, isTraining, progress, status, hasData }) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [epochs, setEpochs] = useState(50);
    const [batchSize, setBatchSize] = useState(16);
    const [learningRate, setLearningRate] = useState(0.001);

    const handleTrain = () => {
        trainModel({ epochs, batchSize, learningRate });
    };

    return (
        <div className="text-training-card">
            <div className="training-header">
                <div className="header-icon">
                    <Brain size={24} />
                </div>
                <div className="header-content">
                    <h3>Train Model</h3>
                    <p>Build your text classifier</p>
                </div>
            </div>

            <div className="training-body">
                {/* Training Button */}
                <button
                    className="train-btn"
                    onClick={handleTrain}
                    disabled={!hasData || isTraining}
                >
                    {isTraining ? (
                        <>
                            <div className="spinner" />
                            Training...
                        </>
                    ) : (
                        <>
                            <Zap size={18} />
                            Start Training
                        </>
                    )}
                </button>

                {/* Progress Bar */}
                {isTraining && (
                    <div className="progress-section">
                        <div className="progress-bar-bg">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="progress-text">
                            {progress.toFixed(0)}% Complete
                        </div>
                    </div>
                )}

                {/* Status */}
                <div className="status-text">
                    {status}
                </div>

                {/* Advanced Settings */}
                <div className="advanced-section">
                    <button
                        className="advanced-toggle"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        <Settings size={16} />
                        Advanced Settings
                    </button>

                    {showAdvanced && (
                        <div className="advanced-content">
                            <div className="setting-group">
                                <label>Epochs</label>
                                <input
                                    type="number"
                                    value={epochs}
                                    onChange={(e) => setEpochs(parseInt(e.target.value))}
                                    min="10"
                                    max="200"
                                    disabled={isTraining}
                                />
                            </div>

                            <div className="setting-group">
                                <label>Batch Size</label>
                                <input
                                    type="number"
                                    value={batchSize}
                                    onChange={(e) => setBatchSize(parseInt(e.target.value))}
                                    min="4"
                                    max="64"
                                    disabled={isTraining}
                                />
                            </div>

                            <div className="setting-group">
                                <label>Learning Rate</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={learningRate}
                                    onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                                    min="0.0001"
                                    max="0.1"
                                    disabled={isTraining}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Info */}
                {!hasData && (
                    <div className="info-message">
                        Add at least 5 text samples to each class to start training
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextTrainingNode;
