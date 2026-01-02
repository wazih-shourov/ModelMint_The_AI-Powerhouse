import React, { useState } from 'react';
import { X, Download, Copy, Check, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getModelFileUrls } from '../lib/modelStorage';

const ExportModal = ({ isOpen, onClose, onDownload, projectType, projectId, userId }) => {
    const [copied, setCopied] = useState(false);
    const [converting, setConverting] = useState(false);
    const [convertingFormat, setConvertingFormat] = useState(null);

    if (!isOpen) return null;

    const handleConvertAndDownload = async (format) => {
        try {
            setConverting(true);
            setConvertingFormat(format);

            // Get public URLs for model files
            const urls = getModelFileUrls(userId, projectId);

            console.log('Requesting conversion:', { format, urls });

            // Call Python conversion server
            const response = await fetch('http://localhost:5000/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    format: format,
                    modelUrl: urls.modelUrl,
                    weightsUrl: urls.weightsUrl,
                    metadataUrl: urls.metadataUrl,
                    userId: userId,
                    projectId: projectId,
                    projectType: projectType  // Send project type to server
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Conversion failed');
            }

            // Download the converted file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${projectId}_model.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            console.log(`✅ Model downloaded as .${format}`);
        } catch (error) {
            console.error('Conversion error:', error);
            alert(`Failed to convert model: ${error.message}\n\nMake sure the Python conversion server is running on http://localhost:5000`);
        } finally {
            setConverting(false);
            setConvertingFormat(null);
        }
    };

    const imageCodeSnippet = `
// 1. Include TensorFlow.js and MobileNet
// <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
// <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet"></script>

async function run() {
    // 2. Load the Feature Extractor (MobileNet)
    const mobilenetModel = await mobilenet.load();

    // 3. Load your Custom Model
    // Ensure model.json, metadata.json, and weights.bin are in the same directory
    const customModel = await tf.loadLayersModel('./model.json');
    
    // Load metadata to get class labels
    const metadata = await fetch('./metadata.json').then(r => r.json());
    console.log('Classes:', metadata.labels);

    // 4. Make a Prediction
    const img = document.getElementById('img'); // Your image element
    
    // Get the embedding (activation) from MobileNet
    const activation = mobilenetModel.infer(img, true);
    
    // Pass the embedding to your custom model
    const result = customModel.predict(activation);
    
    // Display results
    result.data().then(predictions => {
        predictions.forEach((p, i) => {
            console.log(metadata.labels[i] + ': ' + (p * 100).toFixed(2) + '%');
        });
    });
}

run();
`;

    const poseCodeSnippet = `
// 1. Import Libraries
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

async function run() {
    // 2. Load Base Model (MoveNet)
    const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    );

    // 3. Load your Custom Model
    const myPoseModel = await tf.loadLayersModel('path/to/model.json');
    
    // 4. Load Metadata
    const metadata = await fetch('path/to/metadata.json').then(r => r.json());

    // 5. Pose Detection & Processing
    const img = document.getElementById('myPoseImage');
    const poses = await detector.estimatePoses(img);
    
    if (poses.length > 0) {
        // Extract and normalize keypoints (exactly as done during training)
        const keypoints = poses[0].keypoints;
        const normalizedKeypoints = [];
        
        keypoints.forEach(kp => {
            normalizedKeypoints.push(
                kp.x / img.width,  // x normalization
                kp.y / img.height, // y normalization
                kp.score || 0
            );
        });

        // Create Tensor (Shape: [1, 51])
        const inputTensor = tf.tensor2d([normalizedKeypoints]);

        // Predict with your custom model
        const prediction = myPoseModel.predict(inputTensor);
        
        // Result
        const values = prediction.dataSync();
        const topClassIndex = values.indexOf(Math.max(...values));
        console.log("Pose:", metadata.labels[topClassIndex]);
    }
}
`;

    const codeSnippet = projectType === 'POSE' ? poseCodeSnippet : imageCodeSnippet;

    const handleCopy = () => {
        navigator.clipboard.writeText(codeSnippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '800px',
                maxWidth: '90%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>Export your model</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', overflowY: 'auto' }}>

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>Export your model</h3>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            background: '#f3f4f6',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '500', color: '#1f2937' }}>Download Model Files</div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Includes model.json, metadata.json, and weights.bin</div>
                            </div>
                            <button
                                onClick={onDownload}
                                className="btn btn-primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: '#3b82f6',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                <Download size={18} />
                                Download my model
                            </button>
                        </div>
                    </div>

                    {/* Python Formats Section */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                            Download for Python
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {/* Keras .h5 Format */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                background: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500', color: '#1f2937' }}>Keras Format (.h5)</div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        Single file with embedded class names - Ready to use!
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleConvertAndDownload('h5')}
                                    disabled={converting}
                                    className="btn btn-secondary"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        background: converting && convertingFormat === 'h5' ? '#9ca3af' : '#6b7280',
                                        color: 'white',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        fontWeight: '500',
                                        cursor: converting ? 'not-allowed' : 'pointer',
                                        opacity: converting && convertingFormat !== 'h5' ? 0.5 : 1
                                    }}
                                >
                                    {converting && convertingFormat === 'h5' ? (
                                        <>
                                            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                            Converting...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={18} />
                                            Download .h5
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* TFLite Format */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                background: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500', color: '#1f2937' }}>TensorFlow Lite (.zip)</div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        Zip file with model.tflite + metadata.json
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleConvertAndDownload('tflite')}
                                    disabled={converting}
                                    className="btn btn-secondary"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        background: converting && convertingFormat === 'tflite' ? '#9ca3af' : '#6b7280',
                                        color: 'white',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        fontWeight: '500',
                                        cursor: converting ? 'not-allowed' : 'pointer',
                                        opacity: converting && convertingFormat !== 'tflite' ? 0.5 : 1
                                    }}
                                >
                                    {converting && convertingFormat === 'tflite' ? (
                                        <>
                                            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                            Converting...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={18} />
                                            Download .tflite
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                            Note: Conversion happens on the server. Make sure the Python conversion server is running.
                        </p>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>Code snippets to use your model</h3>
                            <button
                                onClick={handleCopy}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    background: 'none',
                                    border: 'none',
                                    color: copied ? '#10b981' : '#6b7280',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>

                        <div style={{
                            background: '#1f2937',
                            borderRadius: '8px',
                            padding: '1rem',
                            overflowX: 'auto',
                            position: 'relative'
                        }}>
                            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.875rem', color: '#e5e7eb' }}>
                                <code>{codeSnippet}</code>
                            </pre>
                        </div>
                        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                            Note: This model requires the MobileNet feature extractor. Make sure to load both as shown above.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ExportModal;
