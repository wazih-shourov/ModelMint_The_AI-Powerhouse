import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getBrandedModelName } from '../lib/modelBranding';

/**
 * Custom hook for MoveNet Server-Side Training
 * Sends data to server for pose detection and training instead of training in browser
 */
export const useServerMoveNet = () => {
    const [status, setStatus] = useState(`Loading ${getBrandedModelName('MoveNet')}...`);
    const [classes, setClasses] = useState([
        { id: 'class-1', name: 'Pose 1', samples: [] },
        { id: 'class-2', name: 'Pose 2', samples: [] }
    ]);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingProgress, setTrainingProgress] = useState({ epoch: 0, loss: 0, accuracy: 0 });
    const [hasModel, setHasModel] = useState(false);
    const [prediction, setPrediction] = useState(null);

    // Simulate model loading (MoveNet is server-side, so just show ready)
    useEffect(() => {
        setTimeout(() => {
            setStatus('Ready');
        }, 500);
    }, []);

    const addClass = () => {
        const newId = `class-${classes.length + 1}`;
        setClasses([...classes, {
            id: newId,
            name: `Pose ${classes.length + 1}`,
            samples: []
        }]);
    };

    const updateClassName = (id, newName) => {
        setClasses(classes.map(c => c.id === id ? { ...c, name: newName } : c));
    };

    const addSample = async (classId, imageElement, imageSrc) => {
        // For server-side MoveNet, we just store the image data
        // Keypoint extraction will happen on server
        setClasses(prevClasses => prevClasses.map(c => {
            if (c.id === classId) {
                return {
                    ...c,
                    samples: [...c.samples, {
                        id: Date.now(),
                        image: imageSrc // Store full image data URL
                    }]
                };
            }
            return c;
        }));

        console.log(`✅ Added pose sample to class ${classId} for server-side MoveNet`);
    };

    const deleteClass = (classId) => {
        setClasses(prevClasses => prevClasses.filter(c => c.id !== classId));
    };

    const trainModel = async (params, userId, projectId) => {
        if (!userId || !projectId) {
            alert('User ID and Project ID are required for server-side training');
            return;
        }

        const { epochs, batchSize, learningRate } = params;
        setIsTraining(true);
        setStatus('Preparing pose data for server-side training...');

        try {
            // Prepare data to send to server
            const classesData = classes.map(c => ({
                name: c.name,
                samples: c.samples.map(s => ({
                    image: s.image // Send full base64 image
                }))
            }));

            const totalSamples = classes.reduce((sum, c) => sum + c.samples.length, 0);

            if (totalSamples === 0) {
                setIsTraining(false);
                setStatus('No samples to train');
                alert('Please add samples to at least one class before training');
                return;
            }

            console.log(`🚀 Sending ${totalSamples} pose samples to server for MoveNet training...`);
            setStatus(`Uploading ${totalSamples} pose samples to server...`);

            // Get server URL from environment or use default
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

            // Send to server for training
            const response = await fetch(`${serverUrl}/api/train-movenet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    projectId,
                    classes: classesData,
                    trainingParams: {
                        epochs,
                        batchSize,
                        learningRate
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Training failed');
            }

            const result = await response.json();

            console.log('✅ Pose training completed:', result);

            // Update training progress with final results
            if (result.metadata && result.metadata.trainingHistory) {
                const history = result.metadata.trainingHistory;
                setTrainingProgress({
                    epoch: params.epochs,
                    loss: history.finalLoss,
                    accuracy: history.finalAccuracy
                });
            }

            setHasModel(true);
            setStatus('Training Complete - Pose model saved to server');

            alert(`Pose training completed successfully!\nAccuracy: ${(result.metadata.trainingHistory.finalAccuracy * 100).toFixed(2)}%`);

        } catch (error) {
            console.error('❌ Pose training error:', error);
            setStatus(`Error: ${error.message}`);
            alert(`Pose training failed: ${error.message}`);
        } finally {
            setIsTraining(false);
        }
    };

    const predict = async (imageElement, userId, projectId) => {
        // For server-side MoveNet, prediction also happens on server
        if (!userId || !projectId) {
            console.error('Missing userId or projectId for MoveNet prediction');
            alert('Please ensure you are logged in and the project is saved.');
            return;
        }
        setStatus('Preparing image for pose prediction...');

        try {
            // Convert image to base64
            const canvas = document.createElement('canvas');
            canvas.width = imageElement.width || imageElement.videoWidth;
            canvas.height = imageElement.height || imageElement.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imageElement, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            const base64Image = imageData.split(',')[1];

            setStatus('Detecting pose on server...');

            // Get server URL from environment or use default
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

            const response = await fetch(`${serverUrl}/api/predict-movenet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    projectId,
                    image: base64Image
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Pose prediction failed');
            }

            const result = await response.json();

            setStatus('Ready');
            setPrediction(result.predictions);

            // Store keypoints for visualization if needed
            if (result.keypoints) {
                console.log('✅ Pose keypoints detected:', result.keypoints);
            }

            return result.predictions;

        } catch (error) {
            console.error('❌ Pose prediction error:', error);
            setStatus(`Error: ${error.message}`);
            return null;
        }
    };

    const exportModel = async (filename) => {
        alert('MoveNet pose models are stored on the server. Use the API for predictions.');
    };

    const loadModelFromStorage = async (userId, projectId) => {
        try {
            setStatus('Checking for saved pose model...');

            // Check if project has a trained model
            const { data: project, error } = await supabase
                .from('projects')
                .select('model_data, model_files')
                .eq('id', projectId)
                .single();

            if (error) throw error;

            if (project && project.model_data && project.model_data.modelType === 'MOVENET') {
                console.log('✅ Found MoveNet pose model:', project.model_data);

                // Restore classes from metadata
                if (project.model_data.classes) {
                    const restoredClasses = await Promise.all(
                        project.model_data.classes.map(async (c, index) => {
                            const classData = {
                                id: `class-${index + 1}`,
                                name: c.name,
                                samples: []
                            };

                            // Restore sample images if available
                            if (c.sampleUrls && c.sampleUrls.length > 0) {
                                console.log(`📸 Loading ${c.sampleUrls.length} pose samples for class '${c.name}'...`);

                                // Download sample images
                                const samples = await Promise.all(
                                    c.sampleUrls.map(async (url, idx) => {
                                        try {
                                            // Fetch image from URL
                                            const response = await fetch(url);
                                            const blob = await response.blob();

                                            // Convert to data URL
                                            return new Promise((resolve) => {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    resolve({
                                                        id: Date.now() + idx,
                                                        image: reader.result
                                                    });
                                                };
                                                reader.readAsDataURL(blob);
                                            });
                                        } catch (err) {
                                            console.error(`Failed to load pose sample ${idx}:`, err);
                                            return null;
                                        }
                                    })
                                );

                                // Filter out failed downloads
                                classData.samples = samples.filter(s => s !== null);
                                console.log(`✅ Loaded ${classData.samples.length} pose samples for class '${c.name}'`);
                            }

                            return classData;
                        })
                    );

                    setClasses(restoredClasses);
                }

                setHasModel(true);
                setStatus('Pose model loaded - Ready');
                return true;
            }

            setStatus('Ready');
            return false;

        } catch (error) {
            console.error('❌ Error loading pose model:', error);
            setStatus('Ready');
            return false;
        }
    };

    const saveModelToStorage = async (userId, projectId) => {
        // For server-side models, the model is already saved during training
        // This function is just for compatibility with the Studio component
        console.log('✅ Pose model already saved to server during training');
        return true;
    };

    return {
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
        loadModelFromStorage,
        saveModelToStorage,
        isServerSide: true, // Flag to indicate this is server-side training
        poseDetector: null, // Not needed for server-side
        extractKeypoints: null // Not needed for server-side
    };
};
