import React, { useState } from 'react';
import { Brain, Sparkles, TrendingUp } from 'lucide-react';
import './TextPreview.css';

const TextPreview = ({ predict, prediction, hasModel, exportModel }) => {
    const [inputText, setInputText] = useState('');
    const [isPredicting, setIsPredicting] = useState(false);

    const handlePredict = async () => {
        if (!inputText.trim()) {
            alert('Please enter some text to classify!');
            return;
        }

        setIsPredicting(true);
        try {
            await predict(inputText);
        } catch (error) {
            console.error('Prediction error:', error);
        } finally {
            setIsPredicting(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handlePredict();
        }
    };

    return (
        <div className="text-preview-card">
            <div className="preview-header">
                <div className="header-icon">
                    <Brain size={24} />
                </div>
                <div className="header-content">
                    <h3>Text Classification</h3>
                    <p>Enter text to classify</p>
                </div>
            </div>

            <div className="preview-body">
                {/* Input Section */}
                <div className="input-section">
                    <label className="input-label">Input Text</label>
                    <textarea
                        className="text-input"
                        placeholder="Type or paste your text here... (Ctrl+Enter to predict)"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        rows={6}
                        disabled={!hasModel}
                    />
                    <button
                        className="predict-btn"
                        onClick={handlePredict}
                        disabled={!hasModel || !inputText.trim() || isPredicting}
                    >
                        {isPredicting ? (
                            <>
                                <div className="spinner" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Classify Text
                            </>
                        )}
                    </button>
                </div>

                {/* Results Section */}
                {prediction && prediction.length > 0 && (
                    <div className="results-section">
                        <div className="results-header">
                            <TrendingUp size={18} />
                            <span>Classification Results</span>
                        </div>
                        <div className="predictions-list">
                            {prediction.map((pred, index) => (
                                <div key={index} className="prediction-item">
                                    <div className="prediction-header">
                                        <span className="class-name">{pred.className}</span>
                                        <span className="probability">
                                            {(pred.probability * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="probability-bar-bg">
                                        <div
                                            className="probability-bar-fill"
                                            style={{
                                                width: `${pred.probability * 100}%`,
                                                opacity: index === 0 ? 1 : 0.7
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Model State */}
                {!hasModel && (
                    <div className="no-model-state">
                        <Brain size={48} strokeWidth={1.5} />
                        <p>Train your model first to start classifying text!</p>
                    </div>
                )}

                {/* Export Section */}
                {hasModel && (
                    <div className="export-section">
                        <button
                            className="export-btn"
                            onClick={exportModel}
                        >
                            <TrendingUp size={18} />
                            Export Model
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextPreview;
