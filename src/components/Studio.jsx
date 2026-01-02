import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Brain, ZoomIn, ZoomOut, ArrowLeft, HelpCircle, X, Save, Users } from 'lucide-react';
import { useTeachableMachine } from '../hooks/useTeachableMachine';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { useTextClassification } from '../hooks/useTextClassification';
import { useInceptionV3 } from '../hooks/useInceptionV3';
import { useServerMobileNet } from '../hooks/useServerMobileNet';
import { useServerMoveNet } from '../hooks/useServerMoveNet';
import { supabase } from '../lib/supabaseClient';
import ClassNode from './ClassNode';
import TrainingNode from './TrainingNode';
import PreviewNode from './PreviewNode';
import FlowLines from './FlowLines';
import ImportModelNode from './ImportModelNode';
import DraggableItem from './DraggableItem';
import Dock from './Dock';
import headerLogo from '../assets/header_logo.png';
import InviteCollaboratorModal from './InviteCollaboratorModal';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import PerformanceMonitor from '../utils/PerformanceMonitor';
import PerformanceMonitorDisplay from './PerformanceMonitorDisplay';
import SystemMonitoringNode from './SystemMonitoringNode';

import './Studio.css';

const PYTHON_SERVER_URL = import.meta.env.VITE_PYTHON_SERVER_URL || 'http://localhost:5000';

function Studio() {
    const navigate = useNavigate();
    const { projectId } = useParams();
    const [projectType, setProjectType] = useState(null);
    const [baseModel, setBaseModel] = useState(null);
    const [projectOwnerId, setProjectOwnerId] = useState(null);
    const [user, setUser] = useState(null);
    const [projectName, setProjectName] = useState('');
    // Fetch project type and owner from database
    useEffect(() => {
        const fetchProjectDetails = async () => {
            if (!projectId) return;

            try {
                const { data, error } = await supabase
                    .from('projects')
                    .select('project_type, base_model_name, user_id, name')
                    .eq('id', projectId)
                    .single();

                if (error) throw error;

                console.log('📊 Project Details:', data);
                console.log('🎯 Base Model:', data?.base_model_name);

                setProjectType(data?.project_type || 'IMAGE');
                setBaseModel(data?.base_model_name || 'MobileNet');
                setProjectOwnerId(data?.user_id);
                setProjectName(data?.name);
            } catch (error) {
                console.error('Error fetching project details:', error);
                setProjectType('IMAGE'); // Default to IMAGE
                setBaseModel('MobileNet'); // Default to MobileNet
            }
        };

        fetchProjectDetails();
    }, [projectId]);

    // Conditionally use the appropriate hook (all hooks must be called unconditionally)
    // Use server-side hooks for all models now
    const shouldLoadClientMobileNet = false; // Never load client-side MobileNet anymore
    const shouldLoadClientMoveNet = false; // Never load client-side MoveNet anymore

    // Client-side hooks (kept for backward compatibility, but not loaded)
    const imageHook = useTeachableMachine(shouldLoadClientMobileNet);
    const poseHook = usePoseDetection();

    // Server-side hooks
    const inceptionHook = useInceptionV3();
    const serverMobileNetHook = useServerMobileNet();
    const serverMoveNetHook = useServerMoveNet();
    const textHook = useTextClassification();

    // Select the active hook based on project type and base model
    const hookResult = projectType === 'TEXT'
        ? textHook
        : (projectType === 'POSE'
            ? poseHook  // Use client-side MoveNet for live skeleton & prediction
            : (baseModel === 'InceptionV3'
                ? inceptionHook
                : serverMobileNetHook));  // Use server-side MobileNet

    console.log('🔧 Hook Selection:', {
        projectType,
        baseModel,
        selectedHook: projectType === 'TEXT'
            ? 'textHook'
            : (projectType === 'POSE'
                ? 'poseHook (CLIENT-SIDE)'
                : (baseModel === 'InceptionV3'
                    ? 'inceptionHook (SERVER-SIDE)'
                    : 'serverMobileNetHook (SERVER-SIDE)'))
    });

    const {
        status,
        classes,
        addClass,
        deleteClass,
        updateClassName,
        addSample,
        trainModel,
        isTraining,
        trainingProgress,
        predict,
        prediction,
        exportModel,
        hasModel,
        loadImportedModel,
        saveModelToStorage,
        loadModelFromStorage,
        poseDetector,
        extractKeypoints
    } = hookResult || {};

    // TEXT-specific functions (may not exist in IMAGE/POSE hooks)
    const deleteSample = hookResult?.deleteSample || (() => { });
    const updateSample = hookResult?.updateSample || (() => { });

    const classNodesRef = useRef({});
    const trainingNodeRef = useRef(null);
    const previewNodeRef = useRef(null);

    const [saving, setSaving] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [username, setUsername] = useState('');
    const [dragVersion, setDragVersion] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isPanning, setIsPanning] = useState(false);

    // Real-time sync
    const {
        broadcastNodeMove,
        broadcastClassAdd,
        broadcastClassDelete,
        broadcastClassUpdate,
        broadcastSampleAdd,
        broadcastTrainingStart,
        broadcastTrainingComplete
    } = useRealtimeSync(projectId, user?.id);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Performance Monitoring
    const [performanceMetrics, setPerformanceMetrics] = useState(null);
    const performanceMonitorRef = useRef(new PerformanceMonitor());
    const trainingSessionIdRef = useRef(null);
    const monitoringNodeRef = useRef(null);
    const [peakMetrics, setPeakMetrics] = useState({ cpu: 0, memory: 0 });

    // Model Loading Countdown Timer
    const [loadingCountdown, setLoadingCountdown] = useState(15);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const countdownIntervalRef = useRef(null);

    // Start countdown when component mounts
    useEffect(() => {
        console.log('🕐 Starting model loading countdown from 15s...');
        setIsModelLoading(true);
        setLoadingCountdown(15);

        countdownIntervalRef.current = setInterval(() => {
            setLoadingCountdown(prev => {
                console.log(`⏱️ Countdown: ${prev}s`);
                if (prev <= 1) {
                    clearInterval(countdownIntervalRef.current);
                    setIsModelLoading(false);
                    console.log('✅ Model loading countdown complete! Users can now upload images.');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                console.log('🧹 Countdown timer cleaned up');
            }
        };
    }, []);

    // Note: Removed early completion check - timer always runs for full 15 seconds
    // This ensures consistent UX and prevents premature image uploads



    // Get user on mount
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);

                // Fetch username for real-time sync
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', user.id)
                    .single();

                if (profile) setUsername(profile.username);
            }
        };
        getUser();
    }, []);

    // Auto-load model when project opens (only once)
    useEffect(() => {
        if (modelLoaded || !user || !projectId || !loadModelFromStorage) {
            return; // Already loaded or not ready
        }

        const loadProjectModel = async () => {
            try {
                // Fetch project details including owner ID
                const { data: project, error } = await supabase
                    .from('projects')
                    .select('model_files, user_id')
                    .eq('id', projectId)
                    .single();

                if (project) {
                    // Load saved model weights/topology ONLY if model_files exist
                    if (project.model_files) {
                        console.log('Found saved model, loading...');
                        // Use project owner's ID to load the model (important for collaborators!)
                        await loadModelFromStorage(project.user_id, projectId);
                    } else {
                        console.log('New project (no saved model), skipping storage check.');
                    }
                }

                setModelLoaded(true); // Mark as attempted, don't try again
            } catch (error) {
                console.log('Error loading model:', error);
                setModelLoaded(true); // Mark as attempted even on error
            }
        };


        loadProjectModel();
    }, [user, projectId, loadModelFromStorage, modelLoaded]);

    // Listen for remote class changes
    useEffect(() => {
        const handleRemoteClassAdd = (event) => {
            const { classData } = event.detail;
            addClass(classData.name);
        };

        const handleRemoteClassDelete = (event) => {
            const { classId } = event.detail;
            deleteClass(classId);
        };

        const handleRemoteTrainingStart = () => {
            // Show training indicator
            console.log('Remote user started training');
        };

        const handleRemoteTrainingComplete = () => {
            // Refresh to get updated model
            console.log('Remote user completed training');
        };

        window.addEventListener('realtime-class-add', handleRemoteClassAdd);
        window.addEventListener('realtime-class-delete', handleRemoteClassDelete);
        window.addEventListener('realtime-training-start', handleRemoteTrainingStart);
        window.addEventListener('realtime-training-complete', handleRemoteTrainingComplete);

        return () => {
            window.removeEventListener('realtime-class-add', handleRemoteClassAdd);
            window.removeEventListener('realtime-class-delete', handleRemoteClassDelete);
            window.removeEventListener('realtime-training-start', handleRemoteTrainingStart);
            window.removeEventListener('realtime-training-complete', handleRemoteTrainingComplete);
        };
    }, [addClass, deleteClass]);
    // Keep refs for latest state to avoid stale closures in useEffect
    const trainingProgressRef = useRef(trainingProgress);
    const classesRef = useRef(classes);

    useEffect(() => {
        trainingProgressRef.current = trainingProgress;
        classesRef.current = classes;
    }, [trainingProgress, classes]);

    // Monitor training state and manage performance tracking
    const isMonitoringRef = useRef(false);

    useEffect(() => {
        if (isTraining && !isMonitoringRef.current) {
            // Training just started
            console.log('🔥 Training started - starting performance monitor');
            isMonitoringRef.current = true;

            // Start performance monitoring
            performanceMonitorRef.current.startMonitoring((metrics) => {
                setPerformanceMetrics(metrics);
            });

            // Don't create session here - wait for completion!
            console.log('⏳ Waiting for training to complete before saving session...');

        } else if (!isTraining && isMonitoringRef.current) {
            // Training just completed
            console.log('✅ Training completed - stopping performance monitor');
            isMonitoringRef.current = false;

            // Stop monitoring and get summary
            let summary = performanceMonitorRef.current.stopMonitoring();
            if (!summary) {
                console.log('⚠️ Monitoring already stopped, retrieving last summary...');
                summary = performanceMonitorRef.current.getLastSummary();
            }

            // Create AND update training session with results (only on completion!)
            const saveCompletedSession = async () => {
                if (!summary) return;

                // Use refs to get latest state
                const currentProgress = trainingProgressRef.current;
                const currentClasses = classesRef.current || [];

                try {
                    console.log('💾 Saving completed training session...');
                    console.log('📊 Training Summary:', JSON.stringify(summary, null, 2));

                    // Calculate duration - ensure at least 1 second if 0
                    const duration = summary.duration || 1;

                    // Create session with all data at once (only completed sessions!)
                    const response = await fetch(`${PYTHON_SERVER_URL}/api/training-sessions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: user?.id,
                            projectId: projectId,
                            modelName: baseModel || 'MobileNet',
                            modelType: projectType || 'IMAGE',
                            startedAt: new Date(Date.now() - duration * 1000).toISOString(),
                            completedAt: new Date().toISOString(),
                            durationSeconds: duration,
                            avgCpuUsage: summary.cpu.avg,
                            maxCpuUsage: summary.cpu.max,
                            gpuUsed: summary.gpu.used,
                            gpuModel: summary.gpu.model,
                            avgMemoryMb: summary.memory.avg,
                            maxMemoryMb: summary.memory.max,
                            totalEpochs: currentProgress?.epoch || 0,
                            finalAccuracy: currentProgress?.accuracy || 0,
                            finalLoss: currentProgress?.loss || 0,
                            trainingSpeed: summary.timeline.length > 0 ?
                                currentClasses.reduce((sum, c) => sum + c.samples.length, 0) / duration : 0,
                            totalSamples: currentClasses.reduce((sum, c) => sum + c.samples.length, 0),
                            metricsTimeline: summary.timeline,
                            status: 'completed'
                        })
                    });

                    const data = await response.json();
                    if (data.success) {
                        console.log('✅ Completed training session saved:', data.sessionId);

                        // Broadcast completion
                        if (broadcastTrainingComplete) {
                            broadcastTrainingComplete({
                                projectId,
                                sessionId: data.sessionId,
                                accuracy: currentProgress?.accuracy || 0
                            });
                        }
                    }
                } catch (error) {
                    console.error('❌ Error saving training session:', error);
                }
            };

            // Small delay to ensure state updates have propagated
            setTimeout(saveCompletedSession, 100);

            // Save peak metrics before clearing
            setPeakMetrics({
                cpu: summary.cpu.max,
                memory: summary.memory.max
            });

            // Clear metrics after a delay to show final state
            setTimeout(() => {
                setPerformanceMetrics(null);
                trainingSessionIdRef.current = null;
            }, 2000);
        }
    }, [isTraining, performanceMetrics, user, projectId, baseModel, projectType, classes, trainingProgress, broadcastTrainingComplete]);


    // Wrapper functions to broadcast class operations (defined before use)
    const handleAddClass = React.useCallback(() => {
        const newClass = addClass();
        if (newClass && broadcastClassAdd) {
            broadcastClassAdd({
                id: newClass.id,
                name: newClass.name,
                samples: []
            });
        }
        return newClass;
    }, [addClass, broadcastClassAdd]);

    const handleDeleteClass = React.useCallback((classId) => {
        deleteClass(classId);
        if (broadcastClassDelete) {
            broadcastClassDelete(classId);
        }
    }, [deleteClass, broadcastClassDelete]);

    const handleTrainModel = React.useCallback(async (params) => {
        if (broadcastTrainingStart) {
            broadcastTrainingStart();
        }

        // Check if using server-side model
        const isServerSide = baseModel === 'InceptionV3' ||
            projectType === 'IMAGE' ||
            projectType === 'POSE';

        if (isServerSide) {
            // For all server-side models, pass userId and projectId
            console.log(`🚀 Training ${baseModel || 'MobileNet'} on server...`);
            await trainModel(params, user?.id, projectId);
        } else {
            // For client-side models (if any remain)
            await trainModel(params);
        }

        if (broadcastTrainingComplete) {
            broadcastTrainingComplete();
        }
    }, [trainModel, broadcastTrainingStart, broadcastTrainingComplete, baseModel, projectType, user, projectId]);

    // Keyboard Shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Add New Class: Ctrl + Shift + N
            if (e.ctrlKey && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
                e.preventDefault();
                handleAddClass();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleAddClass]);

    const handleDrag = () => setDragVersion(v => v + 1);

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));

    const handleExportClick = () => {
        if (hasModel) {
            // Navigate to export page instead of showing modal
            navigate(`/export/${projectId}`);
        } else {
            alert("Please train a model first!");
        }
    };

    const handleDownload = () => {
        exportModel('my-model');
    };

    const handleSaveProject = async () => {
        if (!user || !projectId) {
            alert('Unable to save: User or project not found');
            return;
        }

        if (!hasModel) {
            alert('Please train a model first before saving!');
            return;
        }

        // Use project owner's ID if available, otherwise fallback to current user
        const targetUserId = projectOwnerId || user.id;

        setSaving(true);
        try {
            await saveModelToStorage(targetUserId, projectId);
            alert('✅ Project saved successfully!');
        } catch (error) {
            console.error('Save error:', error);
            alert('❌ Error saving project: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Space key listener for panning mode
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't capture Space if user is typing in an input/textarea
            const activeElement = document.activeElement;
            const isTyping = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable
            );

            if (e.code === 'Space' && !e.repeat && !isTyping) {
                e.preventDefault(); // Prevent scrolling
                setIsSpacePressed(true);
            } else if (e.code === 'Space' && !isTyping) {
                e.preventDefault(); // Prevent scrolling on repeat
            }
        };
        const handleKeyUp = (e) => {
            // Don't capture Space if user is typing in an input/textarea
            const activeElement = document.activeElement;
            const isTyping = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable
            );

            if (e.code === 'Space' && !isTyping) {
                e.preventDefault();
                setIsSpacePressed(false);
                setIsPanning(false);
            }
        };

        // Zoom with Ctrl + Scroll
        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const zoomSensitivity = 0.001;
                const delta = -e.deltaY * zoomSensitivity;

                setZoom(prevZoom => {
                    const newZoom = prevZoom + delta;
                    return Math.min(Math.max(newZoom, 0.5), 2); // Clamp between 0.5 and 2
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('wheel', handleWheel, { passive: false }); // passive: false is required to preventDefault

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('wheel', handleWheel);
        };
    }, []);

    const handlePanStart = (e) => {
        if (!isSpacePressed) return;
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePanMove = (e) => {
        if (!isPanning) return;
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;

        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePanEnd = () => {
        setIsPanning(false);
    };

    return (
        <div className="app-container studio-container" style={{ overflow: 'hidden' }}>
            <header className="header">
                <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ padding: '0.25rem' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <img src={headerLogo} alt="ModelMint Logo" style={{ height: '32px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="status-pill">
                        <div className={`status-dot ${status === 'Ready' ? 'ready' : status.includes('Training') ? 'training' : ''}`} />
                        <span>{status}</span>
                    </div>

                    {/* Loading Countdown Timer */}
                    {isModelLoading && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.4rem 0.75rem',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            border: '2px solid #f59e0b',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            fontFamily: '"Courier New", monospace',
                            color: '#92400e',
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#f59e0b',
                                animation: 'spin 1s linear infinite'
                            }} />
                            <span style={{ letterSpacing: '0.5px' }}>
                                Loading... {loadingCountdown}s
                            </span>
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={handleSaveProject}
                        disabled={saving || !hasModel}
                        title="Save Project to Cloud"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Save size={18} />
                        <span>{saving ? 'Saving...' : 'Save Project'}</span>
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowInviteModal(true)}
                        title="Invite Collaborator"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Users size={18} />
                        <span>Invite</span>
                    </button>
                    <button
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem', borderRadius: '50%' }}
                        onClick={() => setShowShortcuts(true)}
                        title="Keyboard Shortcuts"
                    >
                        <HelpCircle size={20} />
                    </button>
                </div>
            </header>

            {/* Shortcuts Modal */}
            {showShortcuts && (
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
                }} onClick={() => setShowShortcuts(false)}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '2rem',
                        width: '400px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        position: 'relative'
                    }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowShortcuts(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#6b7280'
                            }}
                        >
                            <X size={20} />
                        </button>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>Keyboard Shortcuts</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#4b5563' }}>Add New Class</span>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <kbd style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>Ctrl</kbd>
                                    <span style={{ color: '#9ca3af' }}>+</span>
                                    <kbd style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>Shift</kbd>
                                    <span style={{ color: '#9ca3af' }}>+</span>
                                    <kbd style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>N</kbd>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#4b5563' }}>Pan Canvas</span>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <kbd style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>Space</kbd>
                                    <span style={{ color: '#9ca3af' }}>+</span>
                                    <span style={{ fontSize: '0.875rem', color: '#374151', padding: '0.25rem 0' }}>Drag</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#4b5563' }}>Zoom In/Out</span>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <kbd style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '600', color: '#374151', border: '1px solid #e5e7eb' }}>Ctrl</kbd>
                                    <span style={{ color: '#9ca3af' }}>+</span>
                                    <span style={{ fontSize: '0.875rem', color: '#374151', padding: '0.25rem 0' }}>Scroll</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Panning Overlay */}
            {isSpacePressed && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: 9998, // Below Dock (9999) but above everything else
                        cursor: isPanning ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={handlePanStart}
                    onMouseMove={handlePanMove}
                    onMouseUp={handlePanEnd}
                    onMouseLeave={handlePanEnd}
                />
            )}

            <main
                className="main-grid"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'top left',
                    width: `${100 / zoom}%`,
                    height: `${100 / zoom}%`,
                    cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default'
                }}
            >
                {projectType === 'TEXT' ? (
                    /* TEXT Project UI - Same Canvas as IMAGE/POSE */
                    <>
                        <FlowLines
                            classNodesRef={classNodesRef}
                            trainingNodeRef={trainingNodeRef}
                            previewNodeRef={previewNodeRef}
                            monitoringNodeRef={monitoringNodeRef}
                            classes={classes}
                            dragVersion={dragVersion}
                            zoom={zoom}
                        />

                        {/* Column 1: Data Input */}
                        <div className="column">
                            <div className="column-title">Data Input</div>

                            {classes.map((c) => (
                                <DraggableItem
                                    key={c.id}
                                    id={`class-${c.id}`}
                                    onDrag={handleDrag}
                                    style={{ marginBottom: '1rem', zIndex: 100 }}
                                    setRef={(el) => classNodesRef.current[c.id] = el}
                                    scale={zoom}
                                    onPositionChange={(nodeId, position) => {
                                        if (broadcastNodeMove && username) {
                                            broadcastNodeMove(nodeId, position, username);
                                        }
                                    }}
                                >
                                    <ClassNode
                                        classData={c}
                                        onUpdateName={updateClassName}
                                        onAddSample={addSample}
                                        onDelete={handleDeleteClass}
                                        projectType="TEXT"
                                        isModelLoading={isModelLoading}
                                    />
                                </DraggableItem>
                            ))}
                        </div>

                        {/* Column 2: Training */}
                        <div className="column" style={{ justifyContent: 'center', position: 'relative' }}>
                            <div className="column-title" style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>Training</div>
                            <DraggableItem
                                id="training-node"
                                onDrag={handleDrag}
                                style={{ width: '100%', zIndex: 100, marginBottom: '1rem' }}
                                setRef={(el) => trainingNodeRef.current = el}
                                scale={zoom}
                                onPositionChange={(nodeId, position) => {
                                    if (broadcastNodeMove && username) {
                                        broadcastNodeMove(nodeId, position, username);
                                    }
                                }}
                            >
                                <TrainingNode
                                    trainModel={handleTrainModel}
                                    isTraining={isTraining}
                                    progress={trainingProgress}
                                    status={status}
                                    hasData={classes.every(c => c.samples.length > 0)}
                                />
                            </DraggableItem>

                            {/* System Monitoring Node */}
                            <DraggableItem
                                id="monitoring-node"
                                onDrag={handleDrag}
                                style={{ width: '100%', zIndex: 100 }}
                                setRef={(el) => monitoringNodeRef.current = el}
                                scale={zoom}
                                onPositionChange={(nodeId, position) => {
                                    if (broadcastNodeMove && username) {
                                        broadcastNodeMove(nodeId, position, username);
                                    }
                                }}
                            >
                                <SystemMonitoringNode
                                    metrics={performanceMetrics}
                                    isTraining={isTraining}
                                    peakMetrics={peakMetrics}
                                />
                            </DraggableItem>
                        </div>

                        {/* Column 3: Preview */}
                        <div className="column">
                            <div className="column-title">Preview</div>
                            <DraggableItem
                                id="preview-node"
                                onDrag={handleDrag}
                                setRef={(el) => previewNodeRef.current = el}
                                scale={zoom}
                                style={{ zIndex: 100 }}
                                onPositionChange={(nodeId, position) => {
                                    if (broadcastNodeMove && username) {
                                        broadcastNodeMove(nodeId, position, username);
                                    }
                                }}
                            >
                                <PreviewNode
                                    predict={predict}
                                    prediction={prediction}
                                    exportModel={handleExportClick}
                                    hasModel={hasModel}
                                    projectType={projectType}
                                    poseDetector={poseDetector}
                                    extractKeypoints={extractKeypoints}
                                />
                            </DraggableItem>
                        </div>
                    </>
                ) : (
                    /* IMAGE/POSE Project UI */
                    <>
                        <FlowLines
                            classNodesRef={classNodesRef}
                            trainingNodeRef={trainingNodeRef}
                            previewNodeRef={previewNodeRef}
                            monitoringNodeRef={monitoringNodeRef}
                            classes={classes}
                            dragVersion={dragVersion}
                            zoom={zoom}
                        />

                        {/* Column 1: Data Input */}
                        <div className="column">
                            <div className="column-title">Data Input</div>

                            <DraggableItem
                                id="import-node"
                                onDrag={handleDrag}
                                style={{ marginBottom: '1rem', zIndex: 100 }}
                                scale={zoom}
                                onPositionChange={(nodeId, position) => {
                                    if (broadcastNodeMove && username) {
                                        broadcastNodeMove(nodeId, position, username);
                                    }
                                }}
                            >
                                <ImportModelNode onImport={loadImportedModel} />
                            </DraggableItem>

                            {classes.map((c) => (
                                <DraggableItem
                                    key={c.id}
                                    id={`class-${c.id}`}
                                    onDrag={handleDrag}
                                    style={{ marginBottom: '1rem', zIndex: 100 }}
                                    setRef={(el) => classNodesRef.current[c.id] = el}
                                    scale={zoom}
                                    onPositionChange={(nodeId, position) => {
                                        if (broadcastNodeMove && username) {
                                            broadcastNodeMove(nodeId, position, username);
                                        }
                                    }}
                                >
                                    <ClassNode
                                        classData={c}
                                        onUpdateName={updateClassName}
                                        onAddSample={addSample}
                                        onDelete={handleDeleteClass}
                                        isModelLoading={isModelLoading}
                                    />
                                </DraggableItem>
                            ))}
                        </div>

                        {/* Column 2: Training */}
                        <div className="column" style={{ justifyContent: 'center', position: 'relative' }}>
                            <div className="column-title" style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>Training</div>
                            <DraggableItem
                                id="training-node"
                                onDrag={handleDrag}
                                style={{ width: '100%', zIndex: 100, marginBottom: '1rem' }}
                                setRef={(el) => trainingNodeRef.current = el}
                                scale={zoom}
                                onPositionChange={(nodeId, position) => {
                                    if (broadcastNodeMove && username) {
                                        broadcastNodeMove(nodeId, position, username);
                                    }
                                }}
                            >
                                <TrainingNode
                                    trainModel={handleTrainModel}
                                    isTraining={isTraining}
                                    progress={trainingProgress}
                                    status={status}
                                    hasData={classes.every(c => c.samples.length > 0)}
                                />
                            </DraggableItem>

                            {/* System Monitoring Node */}
                            <DraggableItem
                                id="monitoring-node"
                                onDrag={handleDrag}
                                style={{ width: '100%', zIndex: 100 }}
                                setRef={(el) => monitoringNodeRef.current = el}
                                scale={zoom}
                                onPositionChange={(nodeId, position) => {
                                    if (broadcastNodeMove && username) {
                                        broadcastNodeMove(nodeId, position, username);
                                    }
                                }}
                            >
                                <SystemMonitoringNode
                                    metrics={performanceMetrics}
                                    isTraining={isTraining}
                                    peakMetrics={peakMetrics}
                                />
                            </DraggableItem>
                        </div>

                        {/* Column 3: Preview */}
                        <div className="column">
                            <div className="column-title">Preview</div>
                            <DraggableItem
                                id="preview-node"
                                onDrag={handleDrag}
                                setRef={(el) => previewNodeRef.current = el}
                                scale={zoom}
                                style={{ zIndex: 100 }}
                                onPositionChange={(nodeId, position) => {
                                    if (broadcastNodeMove && username) {
                                        broadcastNodeMove(nodeId, position, username);
                                    }
                                }}
                            >
                                <PreviewNode
                                    predict={predict}
                                    prediction={prediction}
                                    exportModel={handleExportClick}
                                    hasModel={hasModel}
                                    projectType={projectType}
                                    poseDetector={poseDetector}
                                    extractKeypoints={extractKeypoints}
                                    userId={user?.id}
                                    projectId={projectId}
                                />
                            </DraggableItem>
                        </div>
                    </>
                )}
            </main>

            <Dock
                onAddClass={handleAddClass}
                onTrain={() => handleTrainModel({ epochs: 50, batchSize: 16, learningRate: 0.001 })}
                onExport={handleExportClick}
                onReset={() => window.location.reload()}
                isTraining={isTraining}
            />

            {/* Bottom Left Zoom Controls */}
            <div className="bottom-left-controls">
                <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">
                    <ZoomOut size={18} />
                </button>
                <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">
                    <ZoomIn size={18} />
                </button>
            </div>

            {/* Modals */}
            <InviteCollaboratorModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                projectId={projectId}
                projectName={projectName}
            />
        </div>
    );
}

export default Studio;
