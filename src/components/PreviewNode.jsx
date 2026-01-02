import React, { useState, useEffect, useRef } from 'react';
import { Download, Camera, Upload } from 'lucide-react';
import WebcamCapture from './WebcamCapture';

const PreviewNode = ({
    predict,
    prediction,
    exportModel,
    hasModel,
    projectType,
    poseDetector,
    extractKeypoints,
    userId,
    projectId
}) => {
    const [isWebcamActive, setIsWebcamActive] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const predictionInterval = useRef(null);

    // TEXT project state
    const [textInput, setTextInput] = useState('');

    // MoveNet keypoint connections for drawing skeleton
    const POSE_CONNECTIONS = [
        [0, 1], [0, 2], [1, 3], [2, 4],  // Head
        [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],  // Arms
        [5, 11], [6, 12], [11, 12],  // Torso
        [11, 13], [13, 15], [12, 14], [14, 16]  // Legs
    ];

    useEffect(() => {
        if (isWebcamActive && hasModel) {
            predictionInterval.current = setInterval(async () => {
                if (webcamRef.current && webcamRef.current.video) {
                    const video = webcamRef.current.video;

                    // For pose projects, draw skeleton
                    if (projectType === 'POSE' && poseDetector && canvasRef.current) {
                        await drawPoseSkeleton(video);
                    }

                    predict(video, userId, projectId);
                }
            }, 200); // Predict every 200ms
        } else {
            if (predictionInterval.current) {
                clearInterval(predictionInterval.current);
                predictionInterval.current = null;
            }
        }
        return () => {
            if (predictionInterval.current) clearInterval(predictionInterval.current);
        };
    }, [isWebcamActive, hasModel, predict, projectType, poseDetector, userId, projectId]);

    const drawPoseSkeleton = async (videoElement) => {
        if (!poseDetector || !canvasRef.current) return;

        try {
            const poses = await poseDetector.estimatePoses(videoElement);
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            // Set canvas size to match video
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (poses.length > 0) {
                const pose = poses[0];
                const keypoints = pose.keypoints;

                // Save context state
                ctx.save();

                // Apply horizontal flip to match video mirror
                // This ensures skeleton matches your actual movements
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);

                // Enable anti-aliasing for smooth lines
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Draw connections (skeleton) - WHITE COLOR with THICK lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'; // Brighter white
                ctx.lineWidth = 6; // Much thicker for minimalistic look
                ctx.lineCap = 'round'; // Rounded line caps
                ctx.lineJoin = 'round'; // Rounded line joins

                POSE_CONNECTIONS.forEach(([i, j]) => {
                    const kp1 = keypoints[i];
                    const kp2 = keypoints[j];
                    // Higher confidence threshold for cleaner skeleton
                    if (kp1.score > 0.4 && kp2.score > 0.4) {
                        // Add subtle shadow for depth
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                        ctx.shadowBlur = 3;
                        ctx.shadowOffsetX = 2;
                        ctx.shadowOffsetY = 2;

                        ctx.beginPath();
                        ctx.moveTo(kp1.x, kp1.y);
                        ctx.lineTo(kp2.x, kp2.y);
                        ctx.stroke();
                    }
                });

                // Reset shadow for keypoints
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                // Draw keypoints (joints) - RED COLOR with larger glow
                keypoints.forEach(kp => {
                    if (kp.score > 0.4) {
                        // Outer glow - larger and more visible
                        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                        ctx.beginPath();
                        ctx.arc(kp.x, kp.y, 10, 0, 2 * Math.PI);
                        ctx.fill();

                        // Main joint - larger
                        ctx.fillStyle = '#ff0000';
                        ctx.beginPath();
                        ctx.arc(kp.x, kp.y, 7, 0, 2 * Math.PI);
                        ctx.fill();

                        // Inner highlight for 3D effect
                        ctx.fillStyle = 'rgba(255, 120, 120, 0.9)';
                        ctx.beginPath();
                        ctx.arc(kp.x - 1.5, kp.y - 1.5, 3, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                });

                // Restore context state
                ctx.restore();
            }
        } catch (error) {
            console.error('Error drawing pose skeleton:', error);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const img = document.createElement('img');
            const src = URL.createObjectURL(file);
            img.src = src;
            img.onload = async () => {
                predict(img, userId, projectId);
                setPreviewImage(src);
                setIsWebcamActive(false);

                // For pose projects, draw skeleton on uploaded image
                if (projectType === 'POSE' && poseDetector && canvasRef.current) {
                    await drawPoseSkeleton(img);
                }
            };
        }
    };

    // Handle text prediction
    const handleTextPredict = async () => {
        if (textInput.trim()) {
            await predict(textInput.trim());
        }
    };

    const handleTextKeyPress = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleTextPredict();
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Preview</h3>
            </div>
            <div className="card-body">
                {!hasModel ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                        Train the model to start previewing.
                    </div>
                ) : (
                    <>
                        {projectType === 'TEXT' ? (
                            /* TEXT Input Mode */
                            <div style={{ marginBottom: '1rem' }}>
                                <textarea
                                    className="input-field"
                                    placeholder="Enter text to classify... (Ctrl+Enter to predict)"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyPress={handleTextKeyPress}
                                    rows={4}
                                    style={{ resize: 'vertical', fontSize: '0.875rem', width: '100%' }}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={handleTextPredict}
                                    disabled={!textInput.trim()}
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                >
                                    Classify Text
                                </button>
                            </div>
                        ) : (
                            /* IMAGE/POSE Mode */
                            <>
                                <div
                                    className="webcam-container"
                                    style={{
                                        height: 'auto',
                                        minHeight: '224px',
                                        background: '#eee',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}
                                >
                                    {isWebcamActive ? (
                                        <>
                                            <WebcamCapture ref={webcamRef} active={true} />
                                            {projectType === 'POSE' && (
                                                <canvas
                                                    ref={canvasRef}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        pointerEvents: 'none'
                                                    }}
                                                />
                                            )}
                                        </>
                                    ) : previewImage ? (
                                        <>
                                            <img
                                                src={previewImage}
                                                alt="Preview"
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '300px',
                                                    objectFit: 'contain'
                                                }}
                                            />
                                            {projectType === 'POSE' && (
                                                <canvas
                                                    ref={canvasRef}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        maxWidth: '100%',
                                                        maxHeight: '300px',
                                                        pointerEvents: 'none'
                                                    }}
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <div style={{ color: '#666' }}>
                                            {projectType === 'POSE' ? 'Camera Off - Ready for Pose Detection' : 'Camera Off'}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
                                    <button
                                        className={`btn ${isWebcamActive ? 'btn-danger' : 'btn-primary'} `}
                                        onClick={() => setIsWebcamActive(!isWebcamActive)}
                                        style={{ flex: 1 }}
                                    >
                                        <Camera size={16} /> {isWebcamActive ? 'Stop' : 'Webcam'}
                                    </button>
                                    <label className="btn btn-secondary" style={{ flex: 1, cursor: 'pointer' }}>
                                        <Upload size={16} /> File
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                                    </label>
                                </div>
                            </>
                        )}

                        <div className="predictions">
                            {prediction && prediction.map((p) => {
                                const score = p.score || p.probability || 0;
                                const percentage = isNaN(score) ? 0 : Math.max(0, Math.min(100, score * 100));

                                return (
                                    <div key={p.classId || p.className} className="prediction-row">
                                        <div className="prediction-label">
                                            <span>{p.className}</span>
                                            <span>{percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="prediction-bar-bg">
                                            <div
                                                className="prediction-bar-fill"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            className="btn btn-secondary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            onClick={() => exportModel('my-model')}
                        >
                            <Download size={16} /> Export Model
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PreviewNode;
