import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { loadModelFiles } from '../lib/modelStorage';
import { getBrandedModelName } from '../lib/modelBranding';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import * as tf from '@tensorflow/tfjs';
import { ArrowLeft, Camera, Upload, Play, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const CommunityTestPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [model, setModel] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'webcam'
    const [imagePreview, setImagePreview] = useState(null);
    const [predictions, setPredictions] = useState([]);
    const [isPredicting, setIsPredicting] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const [baseModel, setBaseModel] = useState(null);

    useEffect(() => {
        checkUser();
        fetchProjectAndLoadModel();
        return () => {
            // Cleanup model tensors
            if (model) {
                try {
                    model.dispose();
                } catch (e) { console.error("Error disposing model", e); }
            }
            if (baseModel) {
                try {
                    baseModel.dispose();
                } catch (e) { console.error("Error disposing base model", e); }
            }
        };
    }, [projectId]);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            const { data: profileData } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', user.id)
                .single();
            if (profileData) setProfile(profileData);
        }
    };

    const fetchProjectAndLoadModel = async () => {
        try {
            setLoading(true);
            setError(null);

            // --- BACKEND INITIALIZATION FIX ---
            await tf.ready();
            const currentBackend = tf.getBackend();
            if (currentBackend !== 'webgl') {
                try {
                    await tf.setBackend('webgl');
                } catch (e) {
                    await tf.setBackend('cpu');
                }
            }

            // 1. Fetch Project Details
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (projectError) throw projectError;

            // 2. Fetch Author Profile
            let authorName = 'Unknown User';
            if (projectData.user_id) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', projectData.user_id)
                    .single();
                if (profileData) authorName = profileData.username;
            }

            setProject({ ...projectData, authorName });

            if (!projectData.model_files) {
                throw new Error("This project does not have a saved model.");
            }

            // 3. Load Base Model (Feature Extractor)
            // Most saved models are "Heads" trained on embeddings, so we need the base model to generate those embeddings.
            // Using tfhub.dev URLs which are stable for TFJS
            let baseModelUrl = 'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/feature_vector/3/default/1';
            let inputShape = [null, 1280]; // MobileNetV2 output

            if (projectData.base_model_name) {
                const name = projectData.base_model_name.toLowerCase();
                if (name.includes('inception') || name.includes('high')) {
                    baseModelUrl = 'https://tfhub.dev/google/tfjs-model/imagenet/inception_v3/feature_vector/3/default/1';
                    inputShape = [null, 2048];
                } else if (name.includes('pose') || name.includes('movenet')) {
                    // MoveNet logic...
                }
            }

            console.log(`Loading base model from ${baseModelUrl}...`);
            try {
                // Load as GraphModel with fromTFHub: true
                const loadedBaseModel = await tf.loadGraphModel(baseModelUrl, { fromTFHub: true });
                setBaseModel(loadedBaseModel);
                console.log("Base model loaded successfully.");
            } catch (baseErr) {
                console.error("Failed to load base model:", baseErr);
                // We don't throw here, but handlePredict will fail if it needs this model.
            }

            // 4. Load Community Model Files
            console.log(`Loading model for project ${projectId} by user ${projectData.user_id}`);
            const { model: modelData, metadata: meta } = await loadModelFiles(projectData.user_id, projectId);

            setMetadata(meta);

            // 5. Reconstruct TensorFlow.js Model
            let topology = modelData.modelTopology.modelTopology || modelData.modelTopology;

            // --- FIX FOR INPUT SHAPE ---
            // We inject the shape expected by the HEAD (e.g., 1280 for MobileNet), NOT the image shape.
            console.log("Applying fix with expected input shape:", inputShape);

            const fixConfig = (obj) => {
                if (!obj || typeof obj !== 'object') return;

                if (obj.batch_input_shape) obj.batchInputShape = obj.batch_input_shape;
                if (obj.batchShape) obj.batchInputShape = obj.batchShape;

                const className = obj.class_name || obj.className;

                if (className === 'InputLayer' && obj.config) {
                    const config = obj.config;
                    let shape = config.batchInputShape || config.batch_input_shape || config.batchShape;

                    // If shape is missing OR if it looks like an image shape [null, 224, 224, 3] but we expect embeddings [null, 1280]
                    // we overwrite it. This fixes the "Shape mismatch" if we previously saved it wrong.
                    if (!shape || (shape.length === 4 && inputShape.length === 2)) {
                        console.log(`Fixing InputLayer shape: ${JSON.stringify(shape)} -> ${JSON.stringify(inputShape)}`);
                        shape = inputShape;
                    }
                    config.batchInputShape = shape;
                    if (!config.dtype) config.dtype = 'float32';
                }

                // Handle First Layer of Sequential
                if (obj.config && (obj.config.batch_input_shape || obj.config.batchShape)) {
                    // Similar logic for implicit inputs
                    if (!obj.config.batchInputShape) {
                        obj.config.batchInputShape = obj.config.batch_input_shape || obj.config.batchShape;
                    }
                }

                Object.keys(obj).forEach(key => {
                    if (obj[key] && typeof obj[key] === 'object') {
                        fixConfig(obj[key]);
                    }
                });
            };

            fixConfig(topology);

            // Explicit root check
            let layers = null;
            if (topology.config && Array.isArray(topology.config.layers)) {
                layers = topology.config.layers;
            } else if (topology.modelConfig && topology.modelConfig.config && Array.isArray(topology.modelConfig.config.layers)) {
                layers = topology.modelConfig.config.layers;
            }

            if (layers && layers.length > 0) {
                const firstLayer = layers[0];
                if (firstLayer.config) {
                    if (!firstLayer.config.batchInputShape) {
                        firstLayer.config.batchInputShape = inputShape;
                        if (!firstLayer.config.dtype) firstLayer.config.dtype = 'float32';
                    }
                }
            }

            // --- FIX FOR WEIGHT NAME MISMATCH ---
            const adjustedWeightSpecs = modelData.weightSpecs.map(spec => {
                const newSpec = { ...spec };
                if (newSpec.name && newSpec.name.startsWith('sequential/')) {
                    newSpec.name = newSpec.name.replace('sequential/', '');
                }
                return newSpec;
            });

            const modelArtifacts = {
                modelTopology: topology,
                weightSpecs: adjustedWeightSpecs,
                weightData: modelData.weightData
            };

            const loadedModel = await tf.loadLayersModel(tf.io.fromMemory(modelArtifacts));
            setModel(loadedModel);
            console.log("Model loaded successfully:", loadedModel.summary());

        } catch (err) {
            console.error("Error loading community model:", err);
            setError(err.message || "Failed to load model.");
        } finally {
            setLoading(false);
        }
    };

    // Webcam Logic
    const startWebcam = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            } catch (err) {
                console.error("Error accessing webcam:", err);
                alert("Could not access webcam.");
            }
        }
    };

    const stopWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    useEffect(() => {
        if (activeTab === 'webcam') {
            startWebcam();
        } else {
            stopWebcam();
        }
        return () => stopWebcam();
    }, [activeTab]);

    // Prediction Logic
    const handlePredict = async () => {
        if (!model || !metadata) return;
        setIsPredicting(true);

        try {
            let imageElement;

            if (activeTab === 'webcam') {
                imageElement = videoRef.current;
            } else {
                imageElement = new Image();
                imageElement.src = imagePreview;
                await new Promise(resolve => imageElement.onload = resolve);
            }

            if (!imageElement) return;

            // Preprocess Image
            const inputSize = project?.base_model_name?.includes('Inception') ? 299 : 224;

            const tensor = tf.tidy(() => {
                let img = tf.browser.fromPixels(imageElement);
                img = tf.image.resizeBilinear(img, [inputSize, inputSize]);

                // Normalize based on model type
                if (project?.base_model_name?.includes('Inception')) {
                    // InceptionV3: [-1, 1]
                    img = img.toFloat().div(127.5).sub(1);
                } else {
                    // MobileNetV2: [-1, 1]
                    img = img.toFloat().div(127.5).sub(1);
                }

                return img.expandDims(0);
            });

            // --- PREDICTION PIPELINE ---
            let predictionTensor;

            if (baseModel) {
                // Transfer Learning: Image -> Base Model -> Embeddings -> Head Model
                console.log("Running prediction via Base Model + Head Model");
                const embeddings = baseModel.predict(tensor);
                predictionTensor = model.predict(embeddings);
                embeddings.dispose(); // Clean up intermediate tensor
            } else {
                // FALLBACK: If baseModel is missing but model expects embeddings (2D input)
                // We try to load baseModel on the fly or throw a clear error
                const inputShape = model.inputs[0].shape;
                if (inputShape && inputShape.length === 2) {
                    console.warn("Base model missing but required! Attempting to load...");
                    // Re-determine URL
                    let baseModelUrl = 'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/feature_vector/3/default/1';
                    if (project?.base_model_name?.toLowerCase().includes('inception')) {
                        baseModelUrl = 'https://tfhub.dev/google/tfjs-model/imagenet/inception_v3/feature_vector/3/default/1';
                    }

                    try {
                        const loadedBase = await tf.loadGraphModel(baseModelUrl, { fromTFHub: true });
                        setBaseModel(loadedBase); // Save for next time

                        console.log("Base model loaded on-the-fly. Running prediction...");
                        const embeddings = loadedBase.predict(tensor);
                        predictionTensor = model.predict(embeddings);
                        embeddings.dispose();
                    } catch (e) {
                        throw new Error("Failed to load the required base model (MobileNet/Inception). Please check your internet connection.");
                    }
                } else {
                    // Direct Prediction (Full Model)
                    console.log("Running prediction via Full Model");
                    predictionTensor = model.predict(tensor);
                }
            }
            // ---------------------------

            const probabilities = await predictionTensor.data();

            tensor.dispose();
            predictionTensor.dispose();

            // Map to classes
            const classes = metadata.labels || metadata.classes || [];
            const results = Array.from(probabilities).map((prob, i) => {
                let className = classes[i] || `Class ${i + 1}`;
                if (typeof className === 'object' && className.name) {
                    className = className.name;
                }
                return {
                    className: className,
                    probability: prob
                };
            });

            // Sort by probability
            results.sort((a, b) => b.probability - a.probability);
            setPredictions(results);

        } catch (err) {
            console.error("Prediction error:", err);
            alert("Error running prediction: " + err.message);
        } finally {
            setIsPredicting(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
                setPredictions([]); // Clear previous
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={48} className="animate-spin" style={{ color: 'var(--accent-red)', marginBottom: '1rem' }} />
                    <h2 style={{ color: '#1f2937' }}>Loading Model...</h2>
                    <p style={{ color: '#6b7280' }}>Fetching model files from the community.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2>Error Loading Project</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/community')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Back to Community
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            {user && <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}

            <div className="main-content-wrapper" style={{
                marginLeft: user ? (sidebarOpen ? '260px' : '70px') : '0',
                width: user ? 'auto' : '100%',
                transition: 'margin-left 0.3s ease'
            }}>
                {user ? (
                    <TopBar user={user} profile={profile} />
                ) : (
                    <div style={{ height: '64px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 2rem' }}>
                        <button onClick={() => navigate('/community')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#4b5563' }}>
                            <ArrowLeft size={20} /> Back to Community
                        </button>
                    </div>
                )}

                <main className="dashboard-main" style={{ padding: '2rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                                {project.name}
                            </h1>
                            <span style={{
                                background: '#f3f4f6',
                                color: '#4b5563',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '1rem',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                            }}>
                                {getBrandedModelName(project.base_model_name)}
                            </span>
                        </div>
                        <p style={{ color: '#6b7280' }}>Created by <span style={{ fontWeight: '600', color: '#1f2937' }}>{project.authorName}</span></p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                        {/* Left Column: Test Interface */}
                        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                                <button
                                    onClick={() => setActiveTab('upload')}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        border: 'none',
                                        background: activeTab === 'upload' ? 'var(--accent-red)' : 'transparent',
                                        color: activeTab === 'upload' ? 'white' : '#6b7280',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Upload size={18} /> Upload Image
                                </button>
                                <button
                                    onClick={() => setActiveTab('webcam')}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        border: 'none',
                                        background: activeTab === 'webcam' ? 'var(--accent-red)' : 'transparent',
                                        color: activeTab === 'webcam' ? 'white' : '#6b7280',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Camera size={18} /> Webcam
                                </button>
                            </div>

                            <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '0.75rem', border: '2px dashed #e2e8f0', marginBottom: '1.5rem', overflow: 'hidden', position: 'relative' }}>
                                {activeTab === 'upload' ? (
                                    imagePreview ? (
                                        <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                                            <Upload size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                            <p>Click to upload an image to test</p>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                accept="image/*"
                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                            />
                                        </div>
                                    )
                                ) : (
                                    <video ref={videoRef} style={{ width: '100%', maxWidth: '500px', borderRadius: '0.5rem' }} muted playsInline />
                                )}
                            </div>

                            <button
                                onClick={handlePredict}
                                disabled={isPredicting || (activeTab === 'upload' && !imagePreview)}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1rem', fontSize: '1.125rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                {isPredicting ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />}
                                {isPredicting ? 'Analyzing...' : 'Run Prediction'}
                            </button>
                        </div>

                        {/* Right Column: Metadata & Results */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Results Card */}
                            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>Prediction Results</h3>

                                {predictions.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {predictions.map((pred, i) => (
                                            <div key={i} style={{ marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                                    <span style={{ fontWeight: '600', color: i === 0 ? '#1f2937' : '#6b7280' }}>{pred.className}</span>
                                                    <span style={{ fontWeight: 'bold', color: i === 0 ? 'var(--accent-red)' : '#6b7280' }}>{(pred.probability * 100).toFixed(1)}%</span>
                                                </div>
                                                <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${pred.probability * 100}%`,
                                                        background: i === 0 ? 'var(--accent-red)' : '#cbd5e1',
                                                        borderRadius: '4px'
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>
                                        <p>Run a prediction to see results</p>
                                    </div>
                                )}
                            </div>

                            {/* Metadata Card */}
                            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>Model Info</h3>

                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Classes</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {(metadata?.labels || metadata?.classes || []).map((cls, i) => (
                                            <span key={i} style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', color: '#4b5563' }}>
                                                {typeof cls === 'object' ? cls.name : cls}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Model Architecture</div>
                                    <div style={{ fontSize: '0.875rem', color: '#1f2937', fontWeight: '500' }}>
                                        {getBrandedModelName(project.base_model_name)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CommunityTestPage;
