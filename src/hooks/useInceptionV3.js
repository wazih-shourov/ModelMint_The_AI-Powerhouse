import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getBrandedModelName } from '../lib/modelBranding';

/**
 * Custom hook for InceptionV3 Server-Side Training
 * Unlike MobileNet which trains in browser, this sends data to server for training
 */
export const useInceptionV3 = () => {
    const [status, setStatus] = useState(`Loading ${getBrandedModelName('InceptionV3')}...`);
    const [classes, setClasses] = useState([
        { id: 'class-1', name: 'Class 1', samples: [] },
        { id: 'class-2', name: 'Class 2', samples: [] }
    ]);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingProgress, setTrainingProgress] = useState({ epoch: 0, loss: 0, accuracy: 0 });
    const [hasModel, setHasModel] = useState(false);

    const [prediction, setPrediction] = useState(null);

    // Simulate model loading (InceptionV3 is server-side, so just show ready)
    useEffect(() => {
        setTimeout(() => {
            setStatus('Ready');
        }, 500);
    }, []);

    const addClass = () => {
        const newId = `class-${classes.length + 1}`;
        setClasses([...classes, {
            id: newId,
            name: `Class ${classes.length + 1}`,
            samples: []
        }]);
    };

    const updateClassName = (id, newName) => {
        setClasses(classes.map(c => c.id === id ? { ...c, name: newName } : c));
    };

    const addSample = async (classId, imageElement, imageSrc) => {
        // For InceptionV3, we just store the image data
        // No feature extraction needed on client side
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

        console.log(`Added sample to class ${classId} for InceptionV3`);
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
        setStatus('Preparing data for server-side training...');

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

            console.log(`Sending ${totalSamples} samples to server for InceptionV3 training...`);
            setStatus(`Uploading ${totalSamples} samples to server...`);

            // Send to server for training
            const response = await fetch('http://localhost:5000/api/train-inception', {
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

            console.log('Training completed:', result);

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
            setStatus('Training Complete - Model saved to server');

            alert(`Training completed successfully!\nAccuracy: ${(result.metadata.trainingHistory.finalAccuracy * 100).toFixed(2)}%`);

        } catch (error) {
            console.error('Training error:', error);
            setStatus(`Error: ${error.message}`);
            alert(`Training failed: ${error.message}`);
        } finally {
            setIsTraining(false);
        }
    };

    const predict = async (imageElement, userId, projectId) => {
        // For InceptionV3, prediction also happens on server
        if (!userId || !projectId) {
            console.error('Missing userId or projectId for InceptionV3 prediction');
            alert('Please ensure you are logged in and the project is saved.');
            return;
        }
        setStatus('Preparing image for prediction...');

        try {
            // Convert image to base64
            const canvas = document.createElement('canvas');
            canvas.width = imageElement.width || imageElement.videoWidth;
            canvas.height = imageElement.height || imageElement.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imageElement, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            const base64Image = imageData.split(',')[1];

            setStatus('Sending to server for prediction...');

            // Get API key for this project (you'll need to implement this)
            // For now, we'll use a direct endpoint
            const response = await fetch('http://localhost:5000/api/predict-inception', {
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
                throw new Error(errorData.error || 'Prediction failed');
            }

            const result = await response.json();

            setStatus('Ready');
            setPrediction(result.predictions);
            return result.predictions;

        } catch (error) {
            console.error('Prediction error:', error);
            setStatus(`Error: ${error.message}`);
            return null;
        }
    };

    const exportModel = async (filename) => {
        alert('InceptionV3 models are stored on the server. Use the API for predictions.');
    };

    const loadModelFromStorage = async (userId, projectId) => {
        try {
            setStatus('Checking for saved model...');

            // Check if project has a trained model
            const { data: project, error } = await supabase
                .from('projects')
                .select('model_data, model_files')
                .eq('id', projectId)
                .single();

            if (error) throw error;

            if (project && project.model_data && project.model_data.modelType === 'INCEPTION_V3') {
                console.log('Found InceptionV3 model:', project.model_data);

                // Restore classes from metadata
                if (project.model_data.classes) {
                    const restoredClasses = project.model_data.classes.map((c, index) => ({
                        id: `class-${index + 1}`,
                        name: c.name,
                        samples: [] // Samples not stored for InceptionV3
                    }));
                    setClasses(restoredClasses);
                }

                setHasModel(true);
                setStatus('Model loaded - Ready');
                return true;
            }

            setStatus('Ready');
            return false;

        } catch (error) {
            console.error('Error loading model:', error);
            setStatus('Ready');
            return false;
        }
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
        isServerSide: true // Flag to indicate this is server-side training
    };
};
