import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, Rocket, Activity, Image as ImageIcon, AlertCircle, FileText } from 'lucide-react';
import imageProjectIllustration from '../assets/image_project_card.png';
import poseProjectIllustration from '../assets/pose_project_card.png';
import textProjectIllustration from '../assets/text_project_card.png';
import { getBrandedModelName } from '../lib/modelBranding';
import { useSound } from '../contexts/SoundContext';
import clickSoundAsset from '../assets/sounds/click.mp3';
import './CreateProjectFlow.css';

const CreateProjectFlow = ({ isOpen, onClose, onCreate }) => {
    const [step, setStep] = useState(1); // 1: Type, 2: Model, 3: Details
    const [projectType, setProjectType] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [projectDetails, setProjectDetails] = useState({ name: '', description: '' });
    const [showComingSoon, setShowComingSoon] = useState(false);
    const { playSound } = useSound();

    const handleNext = () => {
        if (step === 1 && projectType) {
            // Auto-select model for POSE and TEXT
            if (projectType === 'POSE') {
                setSelectedModel('MoveNet');
            } else if (projectType === 'TEXT') {
                setSelectedModel('USE');
            }
            setStep(2);
        } else if (step === 2 && selectedModel) {
            setStep(3);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            if (step === 2) {
                setSelectedModel(null);
            }
        }
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (projectDetails.name.trim()) {
            onCreate({
                name: projectDetails.name,
                description: projectDetails.description,
                projectType,
                baseModel: selectedModel
            });
            handleClose();
        }
    };

    const handleClose = () => {
        setStep(1);
        setProjectType(null);
        setSelectedModel(null);
        setProjectDetails({ name: '', description: '' });
        onClose();
    };

    const handleInceptionClick = () => {
        setSelectedModel('InceptionV3');
    };

    const handleMobileNetClick = () => {
        setSelectedModel('MobileNet');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="create-flow-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                >
                    <motion.div
                        className="create-flow-container"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            playSound(clickSoundAsset, { type: 'click' });
                        }}
                    >
                        {/* Tech Decor Elements */}
                        <div className="tech-decor top-left"></div>
                        <div className="tech-decor top-right"></div>
                        <div className="tech-decor bottom-left"></div>
                        <div className="tech-decor bottom-right"></div>

                        {/* Close Button */}
                        <button className="flow-close-btn" onClick={handleClose}>
                            <X size={20} />
                        </button>

                        {/* Progress Indicator */}
                        <div className="flow-progress">
                            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                                <div className="step-number">1</div>
                                <span>Type</span>
                            </div>
                            <div className="progress-line"></div>
                            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                                <div className="step-number">2</div>
                                <span>Model</span>
                            </div>
                            <div className="progress-line"></div>
                            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                                <div className="step-number">3</div>
                                <span>Details</span>
                            </div>
                        </div>

                        {/* Step 1: Project Type Selection */}
                        {step === 1 && (
                            <motion.div
                                className="flow-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h2 className="flow-title">Choose Project Type</h2>
                                <p className="flow-subtitle">Select what you want to teach your AI</p>

                                <div className="project-type-grid">
                                    <motion.div
                                        className={`type-card ${projectType === 'IMAGE' ? 'selected' : ''}`}
                                        onClick={() => setProjectType('IMAGE')}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {/* Tech Decor Elements */}
                                        <div className="tech-decor top-left" style={{ width: '10px', height: '10px' }}></div>
                                        <div className="tech-decor top-right" style={{ width: '10px', height: '10px' }}></div>
                                        <div className="tech-decor bottom-left" style={{ width: '10px', height: '10px' }}></div>
                                        <div className="tech-decor bottom-right" style={{ width: '10px', height: '10px' }}></div>

                                        <div className="type-illustration">
                                            <img src={imageProjectIllustration} alt="Image Project" />
                                        </div>
                                        <div className="type-info">
                                            <h3>Image Project</h3>
                                            <p>Teach based on images, from files or your webcam.</p>
                                        </div>
                                        {projectType === 'IMAGE' && (
                                            <div className="selected-indicator">
                                                <div className="checkmark">✓</div>
                                            </div>
                                        )}
                                    </motion.div>

                                    <motion.div
                                        className={`type-card ${projectType === 'POSE' ? 'selected' : ''}`}
                                        onClick={() => setProjectType('POSE')}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {/* Tech Decor Elements */}
                                        <div className="tech-decor top-left" style={{ width: '10px', height: '10px' }}></div>
                                        <div className="tech-decor top-right" style={{ width: '10px', height: '10px' }}></div>
                                        <div className="tech-decor bottom-left" style={{ width: '10px', height: '10px' }}></div>
                                        <div className="tech-decor bottom-right" style={{ width: '10px', height: '10px' }}></div>

                                        <div className="type-illustration">
                                            <img src={poseProjectIllustration} alt="Pose Project" />
                                        </div>
                                        <div className="type-info">
                                            <h3>Pose Project</h3>
                                            <p>Teach based on body poses, from files or your webcam.</p>
                                        </div>
                                        {projectType === 'POSE' && (
                                            <div className="selected-indicator">
                                                <div className="checkmark">✓</div>
                                            </div>
                                        )}
                                    </motion.div>

                                    <motion.div
                                        className={`type-card ${projectType === 'TEXT' ? 'selected' : ''}`}
                                        onClick={() => setProjectType('TEXT')}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {/* Tech Decor Elements */}
                                        <div className="tech-decor top-left" style={{ width: '10px', height: '10px' }}></div>
                                        <div className="tech-decor top-right" style={{ width: '10px', height: '10px' }}></div>
                                        <div className="tech-decor bottom-left" style={{ width: '10px', height: '10px' }}></div>
                                        <div className="tech-decor bottom-right" style={{ width: '10px', height: '10px' }}></div>

                                        <div className="type-illustration">
                                            <img src={textProjectIllustration} alt="Text Project" />
                                        </div>
                                        <div className="type-info">
                                            <h3>Text Project</h3>
                                            <p>Classify text, sentences, or paragraphs into categories.</p>
                                        </div>
                                        {projectType === 'TEXT' && (
                                            <div className="selected-indicator">
                                                <div className="checkmark">✓</div>
                                            </div>
                                        )}
                                    </motion.div>
                                </div>

                                <div className="flow-actions">
                                    <button className="btn-secondary" onClick={handleClose}>
                                        Cancel
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={handleNext}
                                        disabled={!projectType}
                                    >
                                        Next <ArrowRight size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Model Selection */}
                        {step === 2 && (
                            <motion.div
                                className="flow-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h2 className="flow-title">Select Base Model</h2>
                                <p className="flow-subtitle">
                                    {projectType === 'IMAGE'
                                        ? 'Choose the AI model for image classification'
                                        : projectType === 'POSE'
                                            ? 'MintPoseV1 is optimized for pose detection'
                                            : 'MintLineV1 for advanced text understanding'}
                                </p>

                                {projectType === 'IMAGE' ? (
                                    <div className="model-selection-grid">
                                        <motion.div
                                            className={`model-card ${selectedModel === 'MobileNet' ? 'selected' : ''}`}
                                            onClick={handleMobileNetClick}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {/* Tech Decor Elements */}
                                            <div className="tech-decor top-left" style={{ width: '10px', height: '10px' }}></div>
                                            <div className="tech-decor top-right" style={{ width: '10px', height: '10px' }}></div>
                                            <div className="tech-decor bottom-left" style={{ width: '10px', height: '10px' }}></div>
                                            <div className="tech-decor bottom-right" style={{ width: '10px', height: '10px' }}></div>

                                            <div className="model-icon-large">
                                                <Rocket size={48} strokeWidth={1.5} />
                                            </div>
                                            <h3>{getBrandedModelName('MobileNet')}</h3>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '-0.5rem', marginBottom: '0.5rem' }}>(Powered by MobileNet)</p>
                                            <p className="model-description">Fast & Lightweight</p>
                                            <div className="model-features">
                                                <span className="feature-badge">✓ Real-time</span>
                                                <span className="feature-badge">✓ Mobile-friendly</span>
                                            </div>
                                            {selectedModel === 'MobileNet' && (
                                                <div className="selected-indicator">
                                                    <div className="checkmark">✓</div>
                                                </div>
                                            )}
                                        </motion.div>

                                        <motion.div
                                            className={`model-card ${selectedModel === 'InceptionV3' ? 'selected' : ''}`}
                                            onClick={handleInceptionClick}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {/* Tech Decor Elements */}
                                            <div className="tech-decor top-left" style={{ width: '10px', height: '10px' }}></div>
                                            <div className="tech-decor top-right" style={{ width: '10px', height: '10px' }}></div>
                                            <div className="tech-decor bottom-left" style={{ width: '10px', height: '10px' }}></div>
                                            <div className="tech-decor bottom-right" style={{ width: '10px', height: '10px' }}></div>

                                            <div className="server-badge">Server-Side Training</div>
                                            <div className="model-icon-large">
                                                <Sparkles size={48} strokeWidth={1.5} />
                                            </div>
                                            <h3>{getBrandedModelName('InceptionV3')}</h3>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '-0.5rem', marginBottom: '0.5rem' }}>(Powered by InceptionV3)</p>
                                            <p className="model-description">High Accuracy</p>
                                            <div className="model-features">
                                                <span className="feature-badge">✓ Advanced</span>
                                                <span className="feature-badge">✓ Powerful</span>
                                            </div>
                                            {selectedModel === 'InceptionV3' && (
                                                <div className="selected-indicator">
                                                    <div className="checkmark">✓</div>
                                                </div>
                                            )}
                                        </motion.div>
                                    </div>
                                ) : projectType === 'POSE' ? (
                                    <div className="model-selection-grid single">
                                        <div className="model-card selected">
                                            {/* Tech Decor Elements */}
                                            <div className="tech-decor top-left" style={{ width: '10px', height: '10px' }}></div>
                                            <div className="tech-decor top-right" style={{ width: '10px', height: '10px' }}></div>
                                            <div className="tech-decor bottom-left" style={{ width: '10px', height: '10px' }}></div>
                                            <div className="tech-decor bottom-right" style={{ width: '10px', height: '10px' }}></div>

                                            <div className="model-icon-large">
                                                <Activity size={48} strokeWidth={1.5} />
                                            </div>
                                            <h3>{getBrandedModelName('MoveNet')}</h3>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '-0.5rem', marginBottom: '0.5rem' }}>(Powered by MoveNet)</p>
                                            <p className="model-description">Lightning Fast Pose Detection</p>
                                            <div className="model-features">
                                                <span className="feature-badge">✓ Real-time</span>
                                                <span className="feature-badge">✓ Accurate</span>
                                            </div>
                                            <div className="selected-indicator">
                                                <div className="checkmark">✓</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="model-selection-grid single">
                                        <div className="model-card selected">
                                            {/* Tech Decor Elements */}
                                            <div className="tech-decor top-left" style={{ width: '10px', height: '10px' }}></div>
                                            <div className="tech-decor top-right" style={{ width: '10px', height: '10px' }}></div>
                                            <div className="tech-decor bottom-left" style={{ width: '10px', height: '10px' }}></div>
                                            <div className="tech-decor bottom-right" style={{ width: '10px', height: '10px' }}></div>

                                            <div className="model-icon-large">
                                                <FileText size={48} strokeWidth={1.5} />
                                            </div>
                                            <h3>{getBrandedModelName('Universal Sentence Encoder')}</h3>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '-0.5rem', marginBottom: '0.5rem' }}>(Powered by Universal Sentence Encoder)</p>
                                            <p className="model-description">Deep Text Understanding</p>
                                            <div className="model-features">
                                                <span className="feature-badge">✓ Semantic Analysis</span>
                                                <span className="feature-badge">✓ 512-dim Embeddings</span>
                                            </div>
                                            <div className="selected-indicator">
                                                <div className="checkmark">✓</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flow-actions">
                                    <button className="btn-secondary" onClick={handleBack}>
                                        <ArrowLeft size={18} /> Back
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={handleNext}
                                        disabled={!selectedModel}
                                    >
                                        Next <ArrowRight size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Project Details */}
                        {step === 3 && (
                            <motion.div
                                className="flow-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h2 className="flow-title">Project Details</h2>
                                <p className="flow-subtitle">Give your project a name and description</p>

                                <form className="project-details-form" onSubmit={handleCreate}>
                                    <div className="form-group">
                                        <label>Project Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="My Awesome AI Model"
                                            value={projectDetails.name}
                                            onChange={(e) => setProjectDetails({ ...projectDetails, name: e.target.value })}
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Description (Optional)</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="Describe what this model will do..."
                                            value={projectDetails.description}
                                            onChange={(e) => setProjectDetails({ ...projectDetails, description: e.target.value })}
                                            rows={4}
                                        />
                                    </div>

                                    <div className="project-summary">
                                        <h4>Summary</h4>
                                        <div className="summary-item">
                                            <span className="summary-label">Type:</span>
                                            <span className="summary-value">
                                                {projectType === 'IMAGE' ? (
                                                    <><ImageIcon size={16} /> Image Project</>
                                                ) : projectType === 'POSE' ? (
                                                    <><Activity size={16} /> Pose Project</>
                                                ) : (
                                                    <><FileText size={16} /> Text Project</>
                                                )}
                                            </span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Model:</span>
                                            <span className="summary-value">
                                                {selectedModel === 'MobileNet' && <><Rocket size={16} /> {getBrandedModelName('MobileNet')}</>}
                                                {selectedModel === 'InceptionV3' && <><Sparkles size={16} /> {getBrandedModelName('InceptionV3')}</>}
                                                {selectedModel === 'MoveNet' && <><Activity size={16} /> {getBrandedModelName('MoveNet')}</>}
                                                {selectedModel === 'USE' && <><FileText size={16} /> {getBrandedModelName('Universal Sentence Encoder')}</>}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flow-actions">
                                        <button type="button" className="btn-secondary" onClick={handleBack}>
                                            <ArrowLeft size={18} /> Back
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={!projectDetails.name.trim()}
                                        >
                                            Create Project
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Coming Soon Modal */}
                    <AnimatePresence>
                        {showComingSoon && (
                            <motion.div
                                className="coming-soon-overlay"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowComingSoon(false)}
                            >
                                <motion.div
                                    className="coming-soon-modal"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playSound(clickSoundAsset, { type: 'click' });
                                    }}
                                >
                                    {/* Tech Decor Elements */}
                                    <div className="tech-decor top-left"></div>
                                    <div className="tech-decor top-right"></div>
                                    <div className="tech-decor bottom-left"></div>
                                    <div className="tech-decor bottom-right"></div>

                                    <div className="coming-soon-icon">
                                        <AlertCircle size={60} />
                                    </div>
                                    <h3>{getBrandedModelName('InceptionV3')} Coming Soon! 🚀</h3>
                                    <p>This powerful model will be available in a future update. Stay tuned for high-accuracy image classification!</p>
                                    <button className="btn-primary" onClick={() => setShowComingSoon(false)}>
                                        Got it!
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CreateProjectFlow;
