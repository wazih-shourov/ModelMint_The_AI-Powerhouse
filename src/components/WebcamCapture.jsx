import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Camera, CameraOff, Settings, FlipHorizontal, FlipVertical, RotateCw, ZoomIn, ZoomOut, X } from 'lucide-react';

const WebcamCapture = forwardRef(({ onCapture, active = true }, ref) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    // Camera devices
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');

    // Transform controls
    const [flipHorizontal, setFlipHorizontal] = useState(true); // Default mirror mode
    const [flipVertical, setFlipVertical] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1);

    // Resolution settings
    const [resolution, setResolution] = useState('1080p');

    const resolutions = {
        '480p': { width: 640, height: 480 },
        '720p': { width: 1280, height: 720 },
        '1080p': { width: 1920, height: 1080 }
    };

    useImperativeHandle(ref, () => ({
        get video() {
            return videoRef.current;
        },
        capture: () => {
            if (videoRef.current) {
                return videoRef.current;
            }
            return null;
        },
        getTransforms: () => ({
            flipHorizontal,
            flipVertical,
            rotation,
            zoom
        })
    }));

    // Get available cameras
    useEffect(() => {
        async function getCameras() {
            try {
                const deviceList = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
                setDevices(videoDevices);
                if (videoDevices.length > 0 && !selectedDevice) {
                    setSelectedDevice(videoDevices[0].deviceId);
                }
            } catch (err) {
                console.error("Error enumerating devices:", err);
            }
        }
        getCameras();
    }, []);

    useEffect(() => {
        if (!active) {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
            return;
        }

        async function setupCamera() {
            try {
                const res = resolutions[resolution];
                const constraints = {
                    video: {
                        width: { ideal: res.width },
                        height: { ideal: res.height },
                        frameRate: { ideal: 30 }
                    },
                    audio: false
                };

                // Add device ID if selected
                if (selectedDevice) {
                    constraints.video.deviceId = { exact: selectedDevice };
                } else {
                    constraints.video.facingMode = 'user';
                }

                const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
                setError(null);
            } catch (err) {
                console.error("Error accessing webcam:", err);
                setError("Could not access webcam. Please allow permissions.");
            }
        }

        setupCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [active, selectedDevice, resolution]);

    const getTransformStyle = () => {
        const transforms = [];

        if (flipHorizontal) transforms.push('scaleX(-1)');
        if (flipVertical) transforms.push('scaleY(-1)');
        if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
        if (zoom !== 1) transforms.push(`scale(${zoom})`);

        return transforms.join(' ');
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev - 0.25, 1));
    };

    const handleResetTransforms = () => {
        setFlipHorizontal(true);
        setFlipVertical(false);
        setRotation(0);
        setZoom(1);
    };

    return (
        <div className="webcam-container" ref={containerRef} style={{ position: 'relative' }}>
            {error ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', flexDirection: 'column', gap: '0.5rem' }}>
                    <CameraOff size={24} />
                    <span style={{ fontSize: '0.8rem', textAlign: 'center' }}>{error}</span>
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="webcam-video"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: getTransformStyle(),
                            transition: 'transform 0.3s ease'
                        }}
                    />

                    {/* Control Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        right: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        pointerEvents: 'none',
                        zIndex: 10
                    }}>
                        {/* Quick Controls - Left */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            pointerEvents: 'auto'
                        }}>
                            <button
                                onClick={() => setFlipHorizontal(!flipHorizontal)}
                                className="webcam-control-btn"
                                title="Flip Horizontal"
                                style={{
                                    background: flipHorizontal ? '#ef4444' : 'rgba(0, 0, 0, 0.7)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <FlipHorizontal size={18} />
                            </button>

                            <button
                                onClick={() => setFlipVertical(!flipVertical)}
                                className="webcam-control-btn"
                                title="Flip Vertical"
                                style={{
                                    background: flipVertical ? '#ef4444' : 'rgba(0, 0, 0, 0.7)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <FlipVertical size={18} />
                            </button>

                            <button
                                onClick={handleRotate}
                                className="webcam-control-btn"
                                title="Rotate 90°"
                                style={{
                                    background: rotation !== 0 ? '#ef4444' : 'rgba(0, 0, 0, 0.7)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <RotateCw size={18} />
                            </button>
                        </div>

                        {/* Settings Button - Right */}
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="webcam-control-btn"
                            title="Settings"
                            style={{
                                background: showSettings ? '#ef4444' : 'rgba(0, 0, 0, 0.7)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                cursor: 'pointer',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                pointerEvents: 'auto'
                            }}
                        >
                            <Settings size={18} />
                        </button>
                    </div>

                    {/* Zoom Controls - Bottom */}
                    <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        zIndex: 10
                    }}>
                        <button
                            onClick={handleZoomOut}
                            disabled={zoom <= 1}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: zoom <= 1 ? 'rgba(255,255,255,0.3)' : 'white',
                                cursor: zoom <= 1 ? 'not-allowed' : 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <ZoomOut size={16} />
                        </button>

                        <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.25"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            style={{
                                width: '100px',
                                cursor: 'pointer'
                            }}
                        />

                        <button
                            onClick={handleZoomIn}
                            disabled={zoom >= 3}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: zoom >= 3 ? 'rgba(255,255,255,0.3)' : 'white',
                                cursor: zoom >= 3 ? 'not-allowed' : 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <ZoomIn size={16} />
                        </button>

                        <span style={{ color: 'white', fontSize: '12px', marginLeft: '4px', minWidth: '35px' }}>
                            {zoom.toFixed(2)}x
                        </span>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                        <div style={{
                            position: 'absolute',
                            top: '45px',
                            right: '8px',
                            background: 'rgba(17, 24, 39, 0.95)',
                            borderRadius: '12px',
                            padding: '16px',
                            minWidth: '250px',
                            zIndex: 20,
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '14px', fontWeight: '600' }}>Camera Settings</h4>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Camera Selection */}
                            {devices.length > 1 && (
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                                        Camera
                                    </label>
                                    <select
                                        value={selectedDevice}
                                        onChange={(e) => setSelectedDevice(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            color: 'white',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {devices.map((device, index) => (
                                            <option key={device.deviceId} value={device.deviceId} style={{ background: '#1f2937' }}>
                                                {device.label || `Camera ${index + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Resolution Selection */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                                    Resolution
                                </label>
                                <select
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="480p" style={{ background: '#1f2937' }}>480p (640×480)</option>
                                    <option value="720p" style={{ background: '#1f2937' }}>720p HD (1280×720)</option>
                                    <option value="1080p" style={{ background: '#1f2937' }}>1080p Full HD (1920×1080)</option>
                                </select>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={handleResetTransforms}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: '#ef4444',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#dc2626';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#ef4444';
                                }}
                            >
                                Reset Transforms
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

export default WebcamCapture;
