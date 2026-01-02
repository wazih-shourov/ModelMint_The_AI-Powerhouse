import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { uploadModelFiles, loadModelFiles } from '../lib/modelStorage';
import { supabase } from '../lib/supabaseClient';
import { getBrandedModelName } from '../lib/modelBranding';

export const useTeachableMachine = (shouldLoad = true) => {
    const [status, setStatus] = useState(shouldLoad ? `Loading ${getBrandedModelName('MobileNet')}...` : 'Ready');
    const [baseModel, setBaseModel] = useState(null);
    const [customModel, setCustomModel] = useState(null);
    const [classes, setClasses] = useState([
        { id: 'class-1', name: 'Class 1', samples: [] },
        { id: 'class-2', name: 'Class 2', samples: [] }
    ]);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingProgress, setTrainingProgress] = useState({ epoch: 0, loss: 0, accuracy: 0 });
    const [prediction, setPrediction] = useState(null);

    // Load MobileNet Model (only if shouldLoad is true)
    useEffect(() => {
        // Skip loading if shouldLoad is false (e.g., when using InceptionV3)
        if (!shouldLoad) {
            console.log('Skipping MobileNet load (using different model)');
            setStatus('Ready');
            return;
        }

        const loadMobileNet = async () => {
            console.log('Initializing TensorFlow.js backend...');
            setStatus(`Loading ${getBrandedModelName('MobileNet')}...`);

            try {
                // Initialize TensorFlow.js backend first
                await tf.ready();
                console.log('TensorFlow.js backend ready');
                console.log('TensorFlow.js version:', tf.version.tfjs);
                console.log('Backend:', tf.getBackend());

                // Set WebGL flags for better stability
                if (tf.getBackend() === 'webgl') {
                    tf.env().set('WEBGL_VERSION', 2);
                    tf.env().set('WEBGL_CPU_FORWARD', false);
                    tf.env().set('WEBGL_PACK', true);
                    console.log('WebGL flags configured');
                }

                // Clear any cached models that might be corrupted
                try {
                    const modelPath = 'indexeddb://mobilenet-v2';
                    const models = await tf.io.listModels();
                    console.log('Cached models:', Object.keys(models));

                    if (models[modelPath]) {
                        console.log('Removing cached MobileNet model...');
                        await tf.io.removeModel(modelPath);
                    }
                } catch (cacheError) {
                    console.log('Cache clearing skipped:', cacheError.message);
                }

                // Try loading MobileNet with retry logic
                let model = null;
                let lastError = null;

                // Attempt 1: Try version 2, alpha 1.0 (highest quality)
                try {
                    console.log('Attempting to load MobileNet v2 (alpha 1.0)...');
                    model = await mobilenet.load({
                        version: 2,
                        alpha: 1.0,
                        modelUrl: undefined // Force fresh download
                    });
                    console.log('MobileNet v2 (alpha 1.0) loaded successfully');
                } catch (error) {
                    console.warn('Failed to load MobileNet v2 (alpha 1.0):', error.message);
                    lastError = error;

                    // Attempt 2: Try version 2, alpha 0.5 (smaller, more stable)
                    try {
                        console.log('Attempting to load MobileNet v2 (alpha 0.5)...');
                        model = await mobilenet.load({
                            version: 2,
                            alpha: 0.5
                        });
                        console.log('MobileNet v2 (alpha 0.5) loaded successfully');
                    } catch (error2) {
                        console.warn('Failed to load MobileNet v2 (alpha 0.5):', error2.message);
                        lastError = error2;

                        // Attempt 3: Try version 1 (fallback)
                        try {
                            console.log('Attempting to load MobileNet v1 (fallback)...');
                            model = await mobilenet.load({
                                version: 1,
                                alpha: 1.0
                            });
                            console.log('MobileNet v1 loaded successfully');
                        } catch (error3) {
                            console.error('All MobileNet loading attempts failed');
                            lastError = error3;
                        }
                    }
                }

                if (model) {
                    setBaseModel(model);
                    setStatus('Ready');
                    console.log('✅ MobileNet initialized successfully');
                } else {
                    throw lastError || new Error('Failed to load MobileNet');
                }

            } catch (error) {
                console.error('❌ Failed to load MobileNet:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack
                });

                setStatus(`Error loading ${getBrandedModelName('MobileNet')}`);

                // Show user-friendly error message
                const errorMsg = `Failed to load ${getBrandedModelName('MobileNet')}.\n\n` +
                    `Error: ${error.message}\n\n` +
                    `Please try:\n` +
                    `1. Refreshing the page (Ctrl+Shift+R)\n` +
                    `2. Clearing browser cache\n` +
                    `3. Checking your internet connection`;

                console.error(errorMsg);
            }
        };

        loadMobileNet();

        // Cleanup function to dispose resources
        return () => {
            console.log('Cleaning up MobileNet resources...');
            if (baseModel) {
                try {
                    baseModel.dispose();
                    console.log('Base model disposed');
                } catch (e) {
                    console.log('Base model cleanup skipped:', e.message);
                }
            }
        };
    }, [shouldLoad]);

    const addClass = () => {
        const newId = `class-${classes.length + 1}`;
        setClasses([...classes, { id: newId, name: `Class ${classes.length + 1}`, samples: [] }]);
    };

    const updateClassName = (id, newName) => {
        setClasses(classes.map(c => c.id === id ? { ...c, name: newName } : c));
    };

    // ✅ Memory Management Helper
    const logMemoryUsage = (context = '') => {
        const memory = tf.memory();
        console.log(`🧠 GPU Memory ${context}:`, {
            numTensors: memory.numTensors,
            numBytes: `${(memory.numBytes / 1024 / 1024).toFixed(2)} MB`,
            numDataBuffers: memory.numDataBuffers
        });

        // Warn if high usage
        if (memory.numTensors > 100) {
            console.warn(`⚠️ High tensor count: ${memory.numTensors}`);
        }

        return memory;
    };

    const addSample = async (classId, imageElement, imageSrc) => {
        if (!baseModel) {
            console.error('Base model not loaded');
            alert('Please wait for the model to load before adding samples.');
            return;
        }

        try {
            // Check WebGL context before proceeding
            const gl = document.createElement('canvas').getContext('webgl2') ||
                document.createElement('canvas').getContext('webgl');

            if (!gl) {
                throw new Error('WebGL not supported. Please use a modern browser.');
            }

            // Get embedding from MobileNet with proper error handling
            let embedding;
            try {
                embedding = tf.tidy(() => {
                    return baseModel.infer(imageElement, true);
                });
            } catch (inferError) {
                console.error('Inference error:', inferError);

                // Check if it's a WebGL shader error
                if (inferError.message && (
                    inferError.message.includes('shader') ||
                    inferError.message.includes('WebGL') ||
                    inferError.message.includes('fragment') ||
                    inferError.message.includes('vertex')
                )) {
                    throw new Error(
                        'GPU processing error. This can happen due to:\n' +
                        '1. Too many images loaded\n' +
                        '2. Browser GPU memory limit reached\n\n' +
                        'Try:\n' +
                        '• Refreshing the page (Ctrl+Shift+R)\n' +
                        '• Using smaller images\n' +
                        '• Closing other browser tabs'
                    );
                }
                throw inferError;
            }

            // Verify embedding is valid
            if (!embedding || embedding.isDisposed) {
                throw new Error('Failed to process image. Please try again.');
            }

            setClasses(prevClasses => prevClasses.map(c => {
                if (c.id === classId) {
                    return {
                        ...c,
                        samples: [...c.samples, {
                            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            embedding: embedding,
                            image: imageSrc
                        }]
                    };
                }
                return c;
            }));

            console.log(`✅ Sample added successfully to ${classId}`);

        } catch (error) {
            console.error('Error adding sample:', error);
            alert('Failed to add sample: ' + error.message);

            // Log WebGL state for debugging
            console.log('WebGL State:', {
                numTensors: tf.memory().numTensors,
                numBytes: tf.memory().numBytes,
                numDataBuffers: tf.memory().numDataBuffers
            });
        }
    };

    const deleteClass = (classId) => {
        setClasses(prevClasses => {
            const classToDelete = prevClasses.find(c => c.id === classId);
            if (classToDelete) {
                // Cleanup tensors
                classToDelete.samples.forEach(s => s.embedding.dispose());
            }
            return prevClasses.filter(c => c.id !== classId);
        });
    };

    const [isModelImported, setIsModelImported] = useState(false);

    const loadImportedModel = async (jsonFile, weightsFile, metadataFile) => {
        try {
            setStatus('Loading model...');
            console.log('Loading imported model from files:', {
                jsonFile: jsonFile?.name,
                weightsFile: weightsFile?.name,
                metadataFile: metadataFile?.name
            });

            // Read and parse model.json to handle filename mismatches
            const modelJsonText = await jsonFile.text();
            const modelJson = JSON.parse(modelJsonText);

            // Update weights manifest to match the actual uploaded weights filename
            if (modelJson.weightsManifest && modelJson.weightsManifest.length > 0) {
                console.log('Updating weights manifest to match file:', weightsFile.name);
                modelJson.weightsManifest[0].paths = [weightsFile.name];
            }

            // Create a new JSON file object with updated content
            const updatedJsonFile = new File(
                [JSON.stringify(modelJson)],
                jsonFile.name,
                { type: 'application/json' }
            );

            const loadedModel = await tf.loadLayersModel(tf.io.browserFiles([updatedJsonFile, weightsFile]));

            // Validate model topology (expecting at least 2 layers: Dense(100) -> Dense(numClasses))
            if (loadedModel.layers.length < 2) {
                throw new Error('Invalid model topology');
            }

            console.log('Model loaded successfully:', {
                layers: loadedModel.layers.length,
                inputs: loadedModel.inputs.map(i => i.shape),
                outputs: loadedModel.outputs.map(o => o.shape)
            });

            setCustomModel(loadedModel);
            setIsModelImported(true);

            // Update classes based on output shape
            const outputLayer = loadedModel.layers[loadedModel.layers.length - 1];
            const numClasses = outputLayer.units;

            let loadedClassNames = [];
            if (metadataFile) {
                try {
                    const metadataText = await metadataFile.text();
                    const metadata = JSON.parse(metadataText);

                    console.log('Metadata loaded:', metadata);

                    // Support both old format (labels) and new format (classes)
                    if (metadata.classes && Array.isArray(metadata.classes)) {
                        loadedClassNames = metadata.classes.map(c => c.name);
                    } else if (metadata.labels && Array.isArray(metadata.labels)) {
                        loadedClassNames = metadata.labels;
                    }
                } catch (e) {
                    console.error("Failed to parse metadata", e);
                }
            }

            // Create classes
            const newClasses = Array.from({ length: numClasses }, (_, i) => ({
                id: `class-${Date.now()}-${i}`,
                name: loadedClassNames[i] || `Class ${i + 1}`,
                samples: []
            }));

            console.log('Classes created:', newClasses.map(c => c.name));
            setClasses(newClasses);

            setStatus('Model Loaded');
        } catch (error) {
            console.error('Failed to load model:', error);
            setStatus('Error loading model');
            alert('Error loading model: ' + error.message);
        }
    };

    const trainModel = async (params) => {
        if (!baseModel) {
            console.error('❌ Base model not loaded');
            alert('Base model not loaded. Please refresh the page.');
            return;
        }

        const { epochs, batchSize, learningRate } = params;

        console.log('🚀 Starting training with params:', { epochs, batchSize, learningRate });
        console.log('📊 Classes:', classes.map(c => ({ name: c.name, samples: c.samples.length })));

        setIsTraining(true);
        setStatus(isModelImported ? 'Retraining...' : 'Preparing data...');

        // Collect all data
        let xs = null;
        let ys = null;

        // We need to stack all embeddings and create one-hot labels
        const numClasses = classes.length;

        // Check if we have data BEFORE tidy
        const totalSamples = classes.reduce((sum, c) => sum + c.samples.length, 0);
        console.log(`📈 Total samples: ${totalSamples}`);

        if (totalSamples === 0) {
            console.error('❌ No training data available');
            setIsTraining(false);
            setStatus('No data to train');
            alert('Please add some samples before training!');
            return;
        }

        try {
            console.log('🔄 Preparing training data...');

            tf.tidy(() => {
                const allEmbeddings = [];
                const allLabels = [];

                classes.forEach((c, index) => {
                    console.log(`Processing class ${index}: ${c.name} (${c.samples.length} samples)`);
                    c.samples.forEach((sample, sampleIndex) => {
                        // ✅ CRITICAL: Ensure embedding is a valid tensor
                        let embedding = sample.embedding;

                        // Check if it's already a tensor
                        const isTensor = embedding && typeof embedding === 'object' && 'shape' in embedding;

                        if (!isTensor) {
                            // Convert array to tensor
                            if (Array.isArray(embedding)) {
                                console.log(`  Converting array to tensor for sample ${sampleIndex}`);
                                embedding = tf.tensor(embedding);
                            } else {
                                console.error(`  ❌ Invalid embedding for sample ${sampleIndex}:`, typeof embedding);
                                throw new Error(`Invalid embedding type: ${typeof embedding}`);
                            }
                        }

                        allEmbeddings.push(embedding);
                        allLabels.push(index);
                    });
                });

                console.log(`✅ Collected ${allEmbeddings.length} embeddings`);

                // Validate all are tensors
                const allAreTensors = allEmbeddings.every(e => e && 'shape' in e);
                if (!allAreTensors) {
                    throw new Error('Not all embeddings are tensors!');
                }

                const xsTensor = tf.concat(allEmbeddings); // [N, 1024]
                const ysTensor = tf.oneHot(tf.tensor1d(allLabels, 'int32'), numClasses);

                console.log('✅ Tensors created:', {
                    xs: xsTensor.shape,
                    ys: ysTensor.shape
                });

                xs = tf.keep(xsTensor);
                ys = tf.keep(ysTensor);
            });

            if (!xs || !ys) {
                console.error('❌ Failed to create training tensors');
                setIsTraining(false);
                setStatus('Failed to prepare data');
                alert('Failed to prepare training data. Please try again.');
                return;
            }

            console.log('✅ Training data prepared successfully');
        } catch (error) {
            console.error('❌ Error during data preparation:', error);
            setIsTraining(false);
            setStatus('Error preparing data');
            alert('Error preparing training data: ' + error.message);
            return;
        }


        let model;

        if (isModelImported && customModel) {
            // Retraining Logic
            const oldOutputUnits = customModel.layers[customModel.layers.length - 1].units;

            if (numClasses !== oldOutputUnits) {
                // Class count changed: Surgery required
                console.log('Class count changed, performing model surgery...');

                const newModel = tf.sequential();

                // 1. Re-create hidden layer and copy weights
                // Assuming layer 0 is the hidden layer (Dense 100)
                const hiddenLayer = tf.layers.dense({
                    inputShape: [xs.shape[1]], // 1280
                    units: 100,
                    activation: 'relu'
                });
                newModel.add(hiddenLayer);

                // Copy weights from old model's first layer
                const oldHiddenLayer = customModel.layers[0];
                newModel.layers[0].setWeights(oldHiddenLayer.getWeights());

                // 2. Add NEW output layer
                newModel.add(tf.layers.dense({
                    units: numClasses,
                    activation: 'softmax'
                }));

                model = newModel;
            } else {
                // Same class count: Fine-tune existing model
                console.log('Fine-tuning existing model...');
                model = customModel;
            }
        } else {
            // Fresh Training
            model = tf.sequential();
            model.add(tf.layers.dense({
                inputShape: [xs.shape[1]],
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

        setStatus('Training...');

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
                    // Allow UI update
                    return new Promise(resolve => requestAnimationFrame(resolve));
                }
            }
        });

        setCustomModel(model);
        setIsTraining(false);
        setStatus('Training Complete');

        // Cleanup training data tensors
        xs.dispose();
        ys.dispose();

        // ✅ Log memory after training
        logMemoryUsage('after training');
    };

    const predict = async (imageElement) => {
        console.log('🔮 Predict called with:', imageElement);

        if (!customModel) {
            console.error('❌ No custom model available for prediction');
            alert('Please train the model first before making predictions.');
            return;
        }

        if (!baseModel) {
            console.error('❌ Base model not loaded');
            alert('Base model not loaded. Please refresh the page.');
            return;
        }

        try {
            console.log('📊 Running prediction...');
            console.log('🔍 Model info:', {
                inputShape: customModel.inputs[0].shape,
                outputShape: customModel.outputs[0].shape,
                numClasses: classes.length
            });

            const result = tf.tidy(() => {
                // Get embedding from MobileNet
                const embedding = baseModel.infer(imageElement, true);
                console.log('✅ Embedding shape:', embedding.shape);
                console.log('✅ Embedding stats:', {
                    min: embedding.min().dataSync()[0],
                    max: embedding.max().dataSync()[0],
                    mean: embedding.mean().dataSync()[0]
                });

                const prediction = customModel.predict(embedding);
                console.log('✅ Prediction shape:', prediction.shape);

                return prediction.dataSync();
            });

            console.log('📈 Raw prediction result:', result);
            console.log('📈 Raw prediction array:', Array.from(result));

            // Check for NaN values
            const hasNaN = Array.from(result).some(v => isNaN(v));
            if (hasNaN) {
                console.error('❌ Prediction contains NaN values!');
                console.error('Raw values:', Array.from(result));
                alert('Prediction failed: Model produced invalid values. Please retrain the model.');
                return;
            }

            // Check for all zeros
            const allZeros = Array.from(result).every(v => v === 0);
            if (allZeros) {
                console.warn('⚠️ All predictions are zero!');
            }

            // Normalize if needed (in case softmax didn't work properly)
            const sum = Array.from(result).reduce((a, b) => a + b, 0);
            console.log('📊 Prediction sum:', sum);

            let normalizedResult = result;

            // Check if sum is too small (model not trained properly)
            if (sum < 0.0001) {
                console.error('❌ Prediction sum is nearly zero! Model may not be trained properly.');
                console.error('Raw predictions:', Array.from(result));
                alert('Model predictions are invalid. Please retrain the model with more samples.');
                return;
            }

            if (Math.abs(sum - 1.0) > 0.01) {
                console.warn('⚠️ Predictions do not sum to 1, normalizing...');
                console.warn(`Sum is ${sum}, normalizing to 1.0`);
                normalizedResult = Array.from(result).map(v => v / sum);
                console.log('✅ Normalized predictions:', normalizedResult);
            }

            // Map result to classes
            const predictionData = Array.from(normalizedResult).map((score, index) => ({
                classId: classes[index]?.id || `unknown-${index}`,
                className: classes[index]?.name || `Class ${index + 1}`,
                score: isNaN(score) ? 0 : Math.max(0, Math.min(1, score)) // Clamp between 0 and 1
            }));

            // Sort by score descending
            predictionData.sort((a, b) => b.score - a.score);

            console.log('🎯 Prediction data:', predictionData);
            setPrediction(predictionData);

            console.log('✅ Prediction set successfully!');

            // ✅ Log memory after prediction
            logMemoryUsage('after prediction');
        } catch (error) {
            console.error('❌ Prediction error:', error);
            console.error('Error stack:', error.stack);
            alert('Prediction failed: ' + error.message);
        }
    };
    const exportModel = async (filename) => {
        if (!customModel) return;
        try {
            await customModel.save(`localstorage://${filename}`);
            await customModel.save(`downloads://${filename}`);

            // Save metadata (class labels)
            const metadata = {
                labels: classes.map(c => c.name),
                packageName: "ModelMint",
                version: "1.0.0"
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

    // Save model to Supabase Storage
    const saveModelToStorage = async (userId, projectId) => {
        if (!customModel) {
            throw new Error('No trained model to save');
        }

        try {
            setStatus('Saving model...');

            console.log('Starting model save process...');
            console.log('GPU Memory before save:', tf.memory());

            // Clean up any existing temp models first
            try {
                const models = await tf.io.listModels();
                if (models['indexeddb://temp-model']) {
                    console.log('Removing old temp model...');
                    await tf.io.removeModel('indexeddb://temp-model');
                }
            } catch (cleanupError) {
                console.log('Temp model cleanup skipped:', cleanupError.message);
            }

            // Save model to IndexedDB first to get the data
            try {
                console.log('Saving to IndexedDB...');
                await customModel.save('indexeddb://temp-model');
                console.log('✅ Saved to IndexedDB');
            } catch (saveError) {
                console.error('IndexedDB save error:', saveError);

                // Check if it's a WebGL error
                if (saveError.message && (
                    saveError.message.includes('shader') ||
                    saveError.message.includes('WebGL') ||
                    saveError.message.includes('fragment') ||
                    saveError.message.includes('vertex')
                )) {
                    throw new Error(
                        'GPU memory error while saving.\n\n' +
                        'This can happen when:\n' +
                        '1. Too many images are loaded\n' +
                        '2. Browser GPU memory is full\n\n' +
                        'Try:\n' +
                        '• Refreshing the page (Ctrl+Shift+R)\n' +
                        '• Closing other browser tabs\n' +
                        '• Using fewer training samples'
                    );
                }
                throw saveError;
            }

            // Load from IndexedDB to get model topology and weights
            let savedModel;
            try {
                console.log('Loading from IndexedDB...');
                savedModel = await tf.loadLayersModel('indexeddb://temp-model');
                console.log('✅ Loaded from IndexedDB');
            } catch (loadError) {
                console.error('IndexedDB load error:', loadError);
                throw new Error('Failed to load saved model: ' + loadError.message);
            }

            // Get model artifacts
            const modelArtifacts = await savedModel.save(tf.io.withSaveHandler(async (artifacts) => {
                console.log('Model artifacts:', {
                    hasModelTopology: !!artifacts.modelTopology,
                    hasWeightSpecs: !!artifacts.weightSpecs,
                    hasWeightData: !!artifacts.weightData,
                    weightSpecsCount: artifacts.weightSpecs?.length || 0
                });
                return artifacts;
            }));

            // Prepare metadata
            const metadata = {
                classes: classes.map(c => ({
                    name: c.name,
                    sampleCount: c.samples.length
                })),
                totalSamples: classes.reduce((sum, c) => sum + c.samples.length, 0),
                trainedAt: new Date().toISOString(),
                modelInfo: {
                    inputShape: customModel.inputs[0].shape,
                    outputShape: customModel.outputs[0].shape
                }
            };

            // Prepare embeddings for saving
            // We need to convert tensors to arrays to save them as JSON
            const embeddingsToSave = classes.map(c => ({
                classId: c.name, // Use name as ID for matching
                samples: c.samples.map(s => ({
                    embedding: s.embedding.arraySync(), // Convert tensor to array
                    image: s.image // Save image data URL (might be large, but needed for UI)
                }))
            }));

            console.log('Uploading to Supabase Storage...');

            // Upload to Supabase Storage
            const filePaths = await uploadModelFiles(userId, projectId, {
                model: modelArtifacts,
                metadata: metadata,
                embeddings: embeddingsToSave
            });

            console.log('Files uploaded successfully:', filePaths);

            // Get public URLs for the files
            const { data: modelUrlData } = supabase.storage
                .from('model-files')
                .getPublicUrl(`${userId}/${projectId}/model.json`);

            const { data: weightsUrlData } = supabase.storage
                .from('model-files')
                .getPublicUrl(`${userId}/${projectId}/model.weights.bin`);

            const { data: metadataUrlData } = supabase.storage
                .from('model-files')
                .getPublicUrl(`${userId}/${projectId}/metadata.json`);

            const publicUrls = {
                model_json_url: modelUrlData.publicUrl,
                weights_url: weightsUrlData.publicUrl,
                metadata_url: metadataUrlData.publicUrl
            };

            console.log('Public URLs generated:', publicUrls);

            // Update project in database with both paths and URLs
            await supabase
                .from('projects')
                .update({
                    model_files: {
                        ...filePaths,
                        ...publicUrls
                    },
                    model_data: {
                        ...metadata,
                        lastSaved: new Date().toISOString(),
                        isSaved: true
                    }
                })
                .eq('id', projectId);

            // Clean up temp model and dispose savedModel
            try {
                console.log('Cleaning up temp model...');
                if (savedModel) {
                    savedModel.dispose();
                    console.log('✅ Saved model disposed');
                }
                await tf.io.removeModel('indexeddb://temp-model');
                console.log('✅ Temp model removed');
            } catch (cleanupError) {
                console.warn('Cleanup warning:', cleanupError.message);
            }

            console.log('GPU Memory after save:', tf.memory());
            setStatus('Model saved successfully');
            console.log('✅ Model save complete!');
            return filePaths;
        } catch (error) {
            console.error('❌ Error saving model:', error);
            console.error('Error stack:', error.stack);
            console.log('GPU Memory on error:', tf.memory());

            // Try to clean up on error
            try {
                await tf.io.removeModel('indexeddb://temp-model');
            } catch (e) {
                // Ignore cleanup errors
            }

            setStatus(`Error saving: ${error.message}`);
            throw error;
        }
    };
    // Load model from Supabase Storage
    const loadModelFromStorage = async (userId, projectId) => {
        try {
            setStatus('Checking for saved model...');
            console.log('🔍 Loading model from storage...');

            const modelData = await loadModelFiles(userId, projectId);

            if (!modelData) {
                console.log('ℹ️ No saved model found');
                setStatus('Ready');
                return false;
            }

            setStatus('Loading saved model...');

            console.log('📦 Model data received:', {
                hasTopology: !!modelData.model.modelTopology,
                hasWeightSpecs: !!modelData.model.weightSpecs,
                hasWeightData: !!modelData.model.weightData,
                hasMetadata: !!modelData.metadata,
                hasEmbeddings: !!modelData.embeddings,
                embeddingsCount: modelData.embeddings?.length || 0
            });

            // Create File objects for TensorFlow to load
            const modelJsonFile = new File(
                [JSON.stringify(modelData.model.modelTopology)],
                'model.json',
                { type: 'application/json' }
            );

            const weightsFile = new File(
                [modelData.model.weightData],
                'model.weights.bin',
                { type: 'application/octet-stream' }
            );

            console.log('📄 Created files:', {
                modelJsonSize: modelJsonFile.size,
                weightsSize: weightsFile.size
            });

            // Load model from files
            console.log('⏳ Loading TensorFlow model...');
            const loadedModel = await tf.loadLayersModel(
                tf.io.browserFiles([modelJsonFile, weightsFile])
            );

            console.log('✅ Model loaded successfully:', {
                inputs: loadedModel.inputs.map(i => i.shape),
                outputs: loadedModel.outputs.map(o => o.shape),
                layers: loadedModel.layers.length
            });

            setCustomModel(loadedModel);

            // Restore classes from metadata and embeddings
            if (modelData.metadata && modelData.metadata.classes) {
                console.log('🔄 Restoring classes from metadata...');
                console.log('Metadata classes:', modelData.metadata.classes);

                let restoredClasses = [];

                if (modelData.embeddings && modelData.embeddings.length > 0) {
                    console.log('✅ Embeddings found, restoring with samples...');
                    console.log('Embeddings data:', modelData.embeddings.map(e => ({
                        classId: e.classId,
                        sampleCount: e.samples?.length || 0
                    })));

                    // Restore from saved embeddings
                    restoredClasses = modelData.metadata.classes.map((c, index) => {
                        // Find saved samples for this class
                        const savedClass = modelData.embeddings.find(e => e.classId === c.name);

                        console.log(`Processing class "${c.name}":`, {
                            found: !!savedClass,
                            savedSamples: savedClass?.samples?.length || 0
                        });

                        const samples = savedClass ? savedClass.samples.map((s, sIndex) => {
                            try {
                                // ✅ REVERTED: Store as tensor (original way)
                                // This ensures consistency with fresh training
                                const embedding = tf.tensor(s.embedding);
                                console.log(`  Sample ${sIndex}: embedding shape ${embedding.shape}`);

                                return {
                                    id: `${Date.now()}-${index}-${sIndex}-${Math.random().toString(36).substr(2, 9)}`,
                                    embedding: embedding,  // ✅ Tensor (consistent with training)
                                    image: s.image
                                };
                            } catch (error) {
                                console.error(`  ❌ Error restoring sample ${sIndex}:`, error);
                                return null;
                            }
                        }).filter(s => s !== null) : [];

                        console.log(`  ✅ Restored ${samples.length} samples for "${c.name}"`);

                        return {
                            id: `class-${index + 1}`,
                            name: c.name,
                            samples: samples
                        };
                    });
                } else {
                    console.warn('⚠️ No embeddings found - classes will have no samples!');
                    // Fallback for old models without embeddings
                    restoredClasses = modelData.metadata.classes.map((c, index) => ({
                        id: `class-${index + 1}`,
                        name: c.name,
                        samples: []
                    }));
                }

                console.log('✅ Classes restored:', restoredClasses.map(c => ({
                    name: c.name,
                    samples: c.samples.length,
                    firstSampleShape: c.samples[0]?.embedding?.shape
                })));

                setClasses(restoredClasses);

                // Verify total samples
                const totalSamples = restoredClasses.reduce((sum, c) => sum + c.samples.length, 0);
                console.log(`📊 Total samples restored: ${totalSamples}`);

                if (totalSamples === 0) {
                    console.warn('⚠️ WARNING: No samples were restored! Predictions will not work.');
                }
            } else {
                console.warn('⚠️ No metadata found in saved model');
            }

            setStatus('Model loaded - Ready');
            setIsModelImported(true); // Treat loaded models as imported to allow fine-tuning
            console.log('🎉 Model loading complete!');
            return true;
        } catch (error) {
            if (error.message && (error.message.includes('Object not found') || error.message.includes('404'))) {
                console.log('ℹ️ No saved model found - this is a new project');
                setStatus('Ready');
                return false;
            }

            console.error('❌ Error loading model:', error);
            console.error('Error stack:', error.stack);
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
        loadModelFromStorage
    };
};
