
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, Trash2, Edit2, Plus, Timer, Settings2, Play, Square } from 'lucide-react';
import WebcamCapture from './WebcamCapture';

const ClassNode = ({ classData, onUpdateName, onAddSample, onDelete, projectType = 'IMAGE', isModelLoading = false }) => {
    const [isWebcamOpen, setIsWebcamOpen] = useState(false);
    const webcamRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const recordingInterval = useRef(null);

    // Auto Capture Settings
    const [showAutoSettings, setShowAutoSettings] = useState(false);
    const [autoDelay, setAutoDelay] = useState(3); // Delay in seconds before starting
    const [autoImageCount, setAutoImageCount] = useState(10); // Number of images to capture
    const [isAutoCapturing, setIsAutoCapturing] = useState(false);
    const [autoCountdown, setAutoCountdown] = useState(0);
    const [capturedCount, setCapturedCount] = useState(0);
    const autoCaptureInterval = useRef(null);
    const countdownInterval = useRef(null);

    // TEXT project state
    const [textInput, setTextInput] = useState('');

    // Define functions BEFORE useEffect hooks that use them
    const stopAutoCapture = useCallback(() => {
        setIsAutoCapturing(false);
        setAutoCountdown(0);
        setCapturedCount(0);

        if (autoCaptureInterval.current) {
            clearInterval(autoCaptureInterval.current);
            autoCaptureInterval.current = null;
        }

        if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
            countdownInterval.current = null;
        }
    }, []);

    const capture = useCallback(() => {
        if (webcamRef.current && webcamRef.current.video) {
            const video = webcamRef.current.video;
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            const imageSrc = canvas.toDataURL('image/jpeg');
            onAddSample(classData.id, video, imageSrc);
        }
    }, [onAddSample, classData.id]);

    // Cleanup intervals on unmount or webcam close
    useEffect(() => {
        return () => {
            if (recordingInterval.current) clearInterval(recordingInterval.current);
            if (autoCaptureInterval.current) clearInterval(autoCaptureInterval.current);
            if (countdownInterval.current) clearInterval(countdownInterval.current);
        };
    }, []);

    useEffect(() => {
        if (!isWebcamOpen) {
            stopAutoCapture();
        }
    }, [isWebcamOpen, stopAutoCapture]);

    const handleMouseDown = () => {
        if (!isWebcamOpen) return;
        setIsRecording(true);
        // Capture immediately
        capture();
        // Then interval
        recordingInterval.current = setInterval(capture, 100); // 10 FPS
    };

    const handleMouseUp = () => {
        setIsRecording(false);
        if (recordingInterval.current) {
            clearInterval(recordingInterval.current);
            recordingInterval.current = null;
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                const src = event.target.result; // base64 data URL
                img.src = src;
                img.onload = () => {
                    onAddSample(classData.id, img, src);
                };
            };
            reader.readAsDataURL(file);
        });
        // Reset file input so same file can be selected again
        e.target.value = '';
    };

    // Handle text sample addition
    const handleAddTextSample = () => {
        if (textInput.trim()) {
            onAddSample(classData.id, textInput.trim());
            setTextInput('');
        }
    };

    const handleTextKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddTextSample();
        }
    };


    // Auto Capture Functions
    const startAutoCapture = useCallback(() => {
        if (!isWebcamOpen) return;

        setIsAutoCapturing(true);
        setCapturedCount(0);
        setAutoCountdown(autoDelay);

        // Start countdown
        let countdown = autoDelay;
        countdownInterval.current = setInterval(() => {
            countdown--;
            setAutoCountdown(countdown);

            if (countdown <= 0) {
                clearInterval(countdownInterval.current);
                countdownInterval.current = null;

                // Start capturing
                let captured = 0;
                autoCaptureInterval.current = setInterval(() => {
                    if (captured >= autoImageCount) {
                        stopAutoCapture();
                        return;
                    }

                    capture();
                    captured++;
                    setCapturedCount(captured);
                }, 100); // Capture every 100ms (10 FPS)
            }
        }, 1000);
    }, [isWebcamOpen, autoDelay, autoImageCount, stopAutoCapture, capture]);




    return (
        <div className="card">
            <div className="card-header">
                <input
                    type="text"
                    value={classData.name}
                    onChange={(e) => onUpdateName(classData.id, e.target.value)}
                    className="input-field"
                    style={{ width: 'auto', fontWeight: 'bold', border: 'none', background: 'transparent', padding: 0 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                        {classData.samples.length} Samples
                    </span>
                    <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem', borderRadius: '4px' }}
                        onClick={() => onDelete(classData.id)}
                        title="Delete Class"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
            <div className="card-body">
                {projectType === 'TEXT' ? (
                    /* TEXT Input Mode */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <textarea
                            className="input-field"
                            placeholder="Type a text sample here... (Enter to add)"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyPress={handleTextKeyPress}
                            rows={3}
                            style={{ resize: 'vertical', fontSize: '0.875rem' }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleAddTextSample}
                            disabled={!textInput.trim()}
                            style={{ width: '100%' }}
                        >
                            <Plus size={16} /> Add Sample
                        </button>
                    </div>
                ) : (
                    /* IMAGE/POSE Mode */
                    isWebcamOpen ? (
                        <div className="webcam-wrapper">
                            <WebcamCapture ref={webcamRef} active={true} />

                            {/* Auto Capture Settings Panel */}
                            {showAutoSettings && !isAutoCapturing && (
                                <div style={{
                                    background: 'rgba(17, 24, 39, 0.95)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginTop: '0.5rem',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'white' }}>
                                        Auto Capture Settings
                                    </h4>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div>
                                            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                                                Delay (seconds)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="30"
                                                value={autoDelay}
                                                onChange={(e) => setAutoDelay(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="input-field"
                                                style={{ width: '100%', fontSize: '0.875rem' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                                                Number of Images
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="100"
                                                value={autoImageCount}
                                                onChange={(e) => setAutoImageCount(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="input-field"
                                                style={{ width: '100%', fontSize: '0.875rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Auto Capture Status */}
                            {isAutoCapturing && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    marginTop: '0.5rem',
                                    textAlign: 'center'
                                }}>
                                    {autoCountdown > 0 ? (
                                        <div style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            Starting in {autoCountdown}s...
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                                Auto Capturing...
                                            </div>
                                            <div style={{ color: '#666', fontSize: '0.75rem' }}>
                                                {capturedCount} / {autoImageCount} images
                                            </div>
                                            <div style={{
                                                width: '100%',
                                                height: '4px',
                                                background: 'rgba(0,0,0,0.1)',
                                                borderRadius: '2px',
                                                marginTop: '0.5rem',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${(capturedCount / autoImageCount) * 100}%`,
                                                    height: '100%',
                                                    background: '#ef4444',
                                                    transition: 'width 0.1s ease'
                                                }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Control Buttons */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {/* Auto Capture Toggle Button */}
                                <button
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={() => setShowAutoSettings(!showAutoSettings)}
                                    disabled={isAutoCapturing}
                                >
                                    <Settings2 size={16} /> {showAutoSettings ? 'Hide' : 'Auto'}
                                </button>

                                {/* Auto Capture Start/Stop */}
                                {showAutoSettings && (
                                    <button
                                        className={`btn ${isAutoCapturing ? 'btn-danger' : 'btn-primary'}`}
                                        style={{ flex: 1 }}
                                        onClick={isAutoCapturing ? stopAutoCapture : startAutoCapture}
                                    >
                                        {isAutoCapturing ? (
                                            <><Square size={16} /> Stop</>
                                        ) : (
                                            <><Play size={16} /> Start</>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Manual Hold Button */}
                            <button
                                className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                                onMouseDown={handleMouseDown}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleMouseDown}
                                onTouchEnd={handleMouseUp}
                                disabled={isAutoCapturing}
                            >
                                {isRecording ? 'Recording...' : 'Hold to Record'}
                            </button>

                            <button
                                className="btn btn-secondary"
                                style={{ width: '100%', marginTop: '0.5rem' }}
                                onClick={() => setIsWebcamOpen(false)}
                            >
                                Close Webcam
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setIsWebcamOpen(true)}
                                disabled={isModelLoading}
                                title={isModelLoading ? 'Please wait for model to load...' : 'Open Webcam'}
                                style={{
                                    opacity: isModelLoading ? 0.5 : 1,
                                    cursor: isModelLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <Camera size={16} /> Webcam
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => fileInputRef.current.click()}
                                disabled={isModelLoading}
                                title={isModelLoading ? 'Please wait for model to load...' : 'Upload Images'}
                                style={{
                                    opacity: isModelLoading ? 0.5 : 1,
                                    cursor: isModelLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <Upload size={16} /> Upload
                            </button>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                            />
                        </div>
                    )
                )}

                {classData.samples.length > 0 && (
                    <div className="sample-gallery">
                        {projectType === 'TEXT' ? (
                            /* TEXT Samples Display */
                            <>
                                {classData.samples.slice(0, 5).map((sample, i) => (
                                    <div
                                        key={sample.id || i}
                                        className="sample-thumb"
                                        style={{
                                            width: 'auto',
                                            minWidth: '100px',
                                            maxWidth: '200px',
                                            padding: '0.5rem',
                                            background: '#f3f4f6',
                                            fontSize: '0.75rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                        title={sample.text}
                                    >
                                        {sample.text}
                                    </div>
                                ))}
                                {classData.samples.length > 5 && (
                                    <div className="sample-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontSize: '0.75rem' }}>
                                        +{classData.samples.length - 5}
                                    </div>
                                )}
                            </>
                        ) : (
                            /* IMAGE/POSE Samples Display */
                            <>
                                {classData.samples.slice(0, 10).map((sample, i) => (
                                    <img
                                        key={sample.id || i}
                                        src={sample.image}
                                        className="sample-thumb"
                                        alt="sample"
                                    />
                                ))}
                                {classData.samples.length > 10 && (
                                    <div className="sample-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontSize: '0.75rem' }}>
                                        +{classData.samples.length - 10}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassNode;

