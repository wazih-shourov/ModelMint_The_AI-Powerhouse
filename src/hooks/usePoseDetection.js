import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { uploadModelFiles, loadModelFiles } from '../lib/modelStorage';
import { supabase } from '../lib/supabaseClient';
import { getBrandedModelName } from '../lib/modelBranding';

/**
 * Custom hook for Pose Detection using MintPoseV1 (MoveNet)
 * This handles pose estimation, keypoint extraction, and custom classifier training
 */
export const usePoseDetection = () => {
    const [status, setStatus] = useState(`Loading ${getBrandedModelName('MoveNet')}...`);
    const [poseDetector, setPoseDetector] = useState(null);
    const [customModel, setCustomModel] = useState(null);
    const [classes, setClasses] = useState([
        { id: 'class-1', name: 'Pose 1', samples: [] },
        { id: 'class-2', name: 'Pose 2', samples: [] }
    ]);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingProgress, setTrainingProgress] = useState({ epoch: 0, loss: 0, accuracy: 0 });
    const [prediction, setPrediction] = useState(null);
    const [isModelImported, setIsModelImported] = useState(false);

    // Number of keypoints in MoveNet (17 keypoints with x, y, score = 51 values)
    const KEYPOINT_FEATURE_SIZE = 51;

    // Load MoveNet Model
    useEffect(() => {
        const loadMoveNet = async () => {
            console.log('Initializing MoveNet...');
            setStatus(`Loading ${getBrandedModelName('MoveNet')}...`);

            try {
                const detectorConfig = {
                    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
                };

                const detector = await poseDetection.createDetector(
                    poseDetection.SupportedModels.MoveNet,
                    detectorConfig
                );

                console.log('MoveNet loaded successfully');
                setPoseDetector(detector);
                setStatus('Ready');
            } catch (error) {
                console.error('Failed to load MoveNet:', error);
                setStatus(`Error loading ${getBrandedModelName('MoveNet')}`);
            }
        };

        loadMoveNet();
    }, []);

    /**
     * Extract keypoints from image and normalize them
     * Returns a flattened array of [x1, y1, score1, x2, y2, score2, ...]
     */
    const extractKeypoints = async (imageElement) => {
        if (!poseDetector) {
            throw new Error('Pose detector not loaded');
        }

        try {
            const poses = await poseDetector.estimatePoses(imageElement);

            if (poses.length === 0) {
                throw new Error('No pose detected in image');
            }

            const pose = poses[0]; // Get first detected pose
            const keypoints = pose.keypoints;

            // Get image dimensions for normalization
            const imgWidth = imageElement.width || imageElement.videoWidth;
            const imgHeight = imageElement.height || imageElement.videoHeight;

            // Flatten and normalize keypoints
            const normalizedKeypoints = [];
            keypoints.forEach(kp => {
                normalizedKeypoints.push(
                    kp.x / imgWidth,      // Normalized x (0-1)
                    kp.y / imgHeight,     // Normalized y (0-1)
                    kp.score || 0         // Confidence score
                );
            });

            return tf.tensor2d([normalizedKeypoints]); // Shape: [1, 51]
        } catch (error) {
            console.error('Error extracting keypoints:', error);
            throw error;
        }
    };

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
        if (!poseDetector) {
            console.error('Pose detector not loaded');
            return;
        }

        try {
            // Extract keypoints from the image
            const keypointTensor = await extractKeypoints(imageElement);

            setClasses(prevClasses => prevClasses.map(c => {
                if (c.id === classId) {
                    return {
                        ...c,
                        samples: [...c.samples, {
                            id: Date.now(),
                            keypoints: keypointTensor,
                            image: imageSrc
                        }]
                    };
                }
                return c;
            }));

            console.log(`Added pose sample to class ${classId}`);
        } catch (error) {
            console.error('Error adding pose sample:', error);
            alert('Failed to add sample: ' + error.message + '\n\nMake sure a clear pose is visible in the image.');
        }
    };

    const deleteClass = (classId) => {
        setClasses(prevClasses => {
            const classToDelete = prevClasses.find(c => c.id === classId);
            if (classToDelete) {
                // Cleanup tensors
                classToDelete.samples.forEach(s => s.keypoints.dispose());
            }
            return prevClasses.filter(c => c.id !== classId);
        });
    };

    const loadImportedModel = async (jsonFile, weightsFile, metadataFile) => {
        try {
            setStatus('Loading model...');
            console.log('Loading imported pose model from files');

            const modelJsonText = await jsonFile.text();
            const modelJson = JSON.parse(modelJsonText);

            if (modelJson.weightsManifest && modelJson.weightsManifest.length > 0) {
                modelJson.weightsManifest[0].paths = [weightsFile.name];
            }

            const updatedJsonFile = new File(
                [JSON.stringify(modelJson)],
                jsonFile.name,
                { type: 'application/json' }
            );

            const loadedModel = await tf.loadLayersModel(
                tf.io.browserFiles([updatedJsonFile, weightsFile])
            );

            console.log('Pose model loaded successfully');
            setCustomModel(loadedModel);
            setIsModelImported(true);

            // Update classes from metadata
            const outputLayer = loadedModel.layers[loadedModel.layers.length - 1];
            const numClasses = outputLayer.units;

            let loadedClassNames = [];
            if (metadataFile) {
                try {
                    const metadataText = await metadataFile.text();
                    const metadata = JSON.parse(metadataText);
                    if (metadata.classes && Array.isArray(metadata.classes)) {
                        loadedClassNames = metadata.classes.map(c => c.name);
                    } else if (metadata.labels && Array.isArray(metadata.labels)) {
                        loadedClassNames = metadata.labels;
                    }
                } catch (e) {
                    console.error("Failed to parse metadata", e);
                }
            }

            const newClasses = Array.from({ length: numClasses }, (_, i) => ({
                id: `class-${Date.now()}-${i}`,
                name: loadedClassNames[i] || `Pose ${i + 1}`,
                samples: []
            }));

            setClasses(newClasses);
            setStatus('Model Loaded');
        } catch (error) {
            console.error('Failed to load pose model:', error);
            setStatus('Error loading model');
            alert('Error loading model: ' + error.message);
        }
    };

    const trainModel = async (params) => {
        if (!poseDetector) return;

        const { epochs, batchSize, learningRate } = params;
        setIsTraining(true);
        setStatus(isModelImported ? 'Retraining...' : 'Preparing pose data...');

        let xs = null;
        let ys = null;
        const numClasses = classes.length;

        tf.tidy(() => {
            const allKeypoints = [];
            const allLabels = [];

            classes.forEach((c, index) => {
                c.samples.forEach(sample => {
                    allKeypoints.push(sample.keypoints);
                    allLabels.push(index);
                });
            });

            if (allKeypoints.length === 0) return;

            const xsTensor = tf.concat(allKeypoints); // [N, 51]
            const ysTensor = tf.oneHot(tf.tensor1d(allLabels, 'int32'), numClasses);

            xs = tf.keep(xsTensor);
            ys = tf.keep(ysTensor);
        });

        if (!xs || !ys) {
            setIsTraining(false);
            setStatus('No pose data to train');
            return;
        }

        let model;

        if (isModelImported && customModel) {
            const oldOutputUnits = customModel.layers[customModel.layers.length - 1].units;

            if (numClasses !== oldOutputUnits) {
                console.log('Class count changed, performing model surgery...');
                const newModel = tf.sequential();

                const hiddenLayer = tf.layers.dense({
                    inputShape: [KEYPOINT_FEATURE_SIZE],
                    units: 100,
                    activation: 'relu'
                });
                newModel.add(hiddenLayer);

                const oldHiddenLayer = customModel.layers[0];
                newModel.layers[0].setWeights(oldHiddenLayer.getWeights());

                newModel.add(tf.layers.dense({
                    units: numClasses,
                    activation: 'softmax'
                }));

                model = newModel;
            } else {
                console.log('Fine-tuning existing pose model...');
                model = customModel;
            }
        } else {
            // Fresh Training
            model = tf.sequential();
            model.add(tf.layers.dense({
                inputShape: [KEYPOINT_FEATURE_SIZE],
                units: 100,
                activation: 'relu'
            }));
            model.add(tf.layers.dense({
                units: numClasses,
                activation: 'softmax'
            }));
        }

        model.compile({
            optimizer: tf.train.adam(learningRate),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        setStatus('Training pose classifier...');

        await model.fit(xs, ys, {
            batchSize: batchSize,
            epochs: epochs,
            shuffle: true,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    setTrainingProgress({
                        epoch: epoch + 1,
                        loss: logs.loss,
                        accuracy: logs.acc
                    });
                    return new Promise(resolve => requestAnimationFrame(resolve));
                }
            }
        });

        setCustomModel(model);
        setIsTraining(false);
        setStatus('Training Complete');

        xs.dispose();
        ys.dispose();
    };

    const predict = async (imageElement) => {
        if (!customModel || !poseDetector) return;

        try {
            const keypointTensor = await extractKeypoints(imageElement);

            const result = tf.tidy(() => {
                const prediction = customModel.predict(keypointTensor);
                return prediction.dataSync();
            });

            keypointTensor.dispose();

            const predictionData = Array.from(result).map((score, index) => ({
                classId: classes[index]?.id || `unknown-${index}`,
                className: classes[index]?.name || `Pose ${index + 1}`,
                score: score
            }));

            setPrediction(predictionData);
        } catch (error) {
            console.error('Pose prediction error:', error);
            setPrediction(null);
        }
    };

    const exportModel = async (filename) => {
        if (!customModel) return;
        try {
            await customModel.save(`downloads://${filename}`);

            const metadata = {
                labels: classes.map(c => c.name),
                packageName: "ModelMint",
                version: "1.0.0",
                modelType: "POSE"
            };

            const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'metadata.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Export failed", e);
        }
    };

    const saveModelToStorage = async (userId, projectId) => {
        if (!customModel) {
            throw new Error('No trained model to save');
        }

        try {
            setStatus('Saving pose model...');

            // Direct save to memory to avoid WebGL context loss issues with IndexedDB
            const modelArtifacts = await customModel.save(tf.io.withSaveHandler(async (artifacts) => {
                return artifacts;
            }));

            const metadata = {
                classes: classes.map(c => ({
                    name: c.name,
                    sampleCount: c.samples.length
                })),
                totalSamples: classes.reduce((sum, c) => sum + c.samples.length, 0),
                trainedAt: new Date().toISOString(),
                modelType: 'POSE',
                modelInfo: {
                    inputShape: customModel.inputs[0].shape,
                    outputShape: customModel.outputs[0].shape
                }
            };

            // Prepare embeddings (keypoints) for saving
            // We need to convert tensors to arrays to save them as JSON
            const embeddingsToSave = classes.map(c => ({
                classId: c.name, // Use name as ID for matching
                samples: c.samples.map(s => ({
                    keypoints: s.keypoints.arraySync(), // Convert tensor to array
                    image: s.image // Save image data URL
                }))
            }));

            console.log('Uploading pose model with embeddings to Supabase Storage...');

            const filePaths = await uploadModelFiles(userId, projectId, {
                model: modelArtifacts,
                metadata: metadata,
                embeddings: embeddingsToSave
            });

            console.log('Pose model files uploaded successfully:', filePaths);

            await supabase
                .from('projects')
                .update({
                    model_files: filePaths,
                    model_data: {
                        ...metadata,
                        lastSaved: new Date().toISOString()
                    }
                })
                .eq('id', projectId);

            // await tf.io.removeModel('indexeddb://temp-model'); // Not used anymore

            setStatus('Pose model saved successfully');
            console.log('✅ Pose model save complete with embeddings!');
            return filePaths;
        } catch (error) {
            console.error('Error saving pose model:', error);
            setStatus(`Error saving: ${error.message}`);
            throw error;
        }
    };

    const loadModelFromStorage = async (userId, projectId) => {
        try {
            setStatus('Checking for saved pose model...');

            const modelData = await loadModelFiles(userId, projectId);

            if (!modelData) {
                setStatus('Ready');
                return false;
            }

            setStatus('Loading saved pose model...');

            console.log('Model files loaded into memory, reconstructing model...');

            // Use fromMemory to load directly without creating File objects
            const loadedModel = await tf.loadLayersModel(
                tf.io.fromMemory(
                    modelData.model.modelTopology,
                    modelData.model.weightSpecs,
                    modelData.model.weightData
                )
            );

            setCustomModel(loadedModel);

            // Restore classes from metadata and embeddings
            if (modelData.metadata && modelData.metadata.classes) {
                let restoredClasses = [];

                if (modelData.embeddings) {
                    console.log('Restoring pose keypoints embeddings...');
                    // Restore from saved embeddings (keypoints)
                    restoredClasses = modelData.metadata.classes.map((c, index) => {
                        // Find saved samples for this class
                        const savedClass = modelData.embeddings.find(e => e.classId === c.name);
                        const samples = savedClass ? savedClass.samples.map(s => ({
                            id: Date.now() + Math.random(),
                            keypoints: tf.tensor(s.keypoints), // Convert array back to tensor
                            image: s.image
                        })) : [];

                        return {
                            id: `class-${index + 1}`,
                            name: c.name,
                            samples: samples
                        };
                    });
                    console.log('Pose classes restored:', restoredClasses.map(c => `${c.name} (${c.samples.length} samples)`));
                } else {
                    // Fallback for old models without embeddings
                    console.log('No embeddings found - loading classes without samples');
                    restoredClasses = modelData.metadata.classes.map((c, index) => ({
                        id: `class-${index + 1}`,
                        name: c.name,
                        samples: []
                    }));
                }

                setClasses(restoredClasses);
            }

            setStatus('Pose model loaded - Ready');
            setIsModelImported(true); // Treat loaded models as imported to allow fine-tuning
            console.log('✅ Pose model loaded successfully with embeddings!');
            return true;
        } catch (error) {
            if (error.message && (error.message.includes('Object not found') || error.message.includes('404'))) {
                console.log('No saved pose model found - this is a new project');
                setStatus('Ready');
                return false;
            }

            console.error('Error loading pose model:', error);
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
        hasModel: !!customModel,
        loadImportedModel,
        isModelImported,
        saveModelToStorage,
        loadModelFromStorage,
        poseDetector,
        extractKeypoints
    };
};
