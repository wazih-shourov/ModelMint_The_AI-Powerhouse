import { useState, useEffect, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { getBrandedModelName } from '../lib/modelBranding';

export const useTextClassification = () => {
    const [status, setStatus] = useState('Initializing...');
    const [encoder, setEncoder] = useState(null);
    const [model, setModel] = useState(null);
    const [classes, setClasses] = useState([]);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingProgress, setTrainingProgress] = useState(0);
    const [prediction, setPrediction] = useState(null);
    const [hasModel, setHasModel] = useState(false);

    const nextClassId = useRef(1);

    // Load MintLineV1 (Universal Sentence Encoder)
    useEffect(() => {
        const loadEncoder = async () => {
            try {
                setStatus(`Loading ${getBrandedModelName('Universal Sentence Encoder')}...`);
                const loadedEncoder = await use.load();
                setEncoder(loadedEncoder);
                setStatus('Ready');
            } catch (error) {
                console.error('Error loading USE:', error);
                setStatus('Error loading encoder');
            }
        };

        loadEncoder();
    }, []);

    // Add a new class
    const addClass = useCallback((className = `Class ${nextClassId.current}`) => {
        const newClass = {
            id: nextClassId.current,
            name: className,
            samples: []
        };
        nextClassId.current += 1;
        setClasses(prev => [...prev, newClass]);
        return newClass;
    }, []);

    // Delete a class
    const deleteClass = useCallback((classId) => {
        setClasses(prev => prev.filter(c => c.id !== classId));
    }, []);

    // Update class name
    const updateClassName = useCallback((classId, newName) => {
        setClasses(prev => prev.map(c =>
            c.id === classId ? { ...c, name: newName } : c
        ));
    }, []);

    // Add a text sample to a class
    const addSample = useCallback((classId, text) => {
        setClasses(prev => prev.map(c => {
            if (c.id === classId) {
                return {
                    ...c,
                    samples: [...c.samples, { id: Date.now(), text }]
                };
            }
            return c;
        }));
    }, []);

    // Delete a text sample from a class
    const deleteSample = useCallback((classId, sampleId) => {
        setClasses(prev => prev.map(c => {
            if (c.id === classId) {
                return {
                    ...c,
                    samples: c.samples.filter(s => s.id !== sampleId)
                };
            }
            return c;
        }));
    }, []);

    // Update a text sample
    const updateSample = useCallback((classId, sampleId, newText) => {
        setClasses(prev => prev.map(c => {
            if (c.id === classId) {
                return {
                    ...c,
                    samples: c.samples.map(s =>
                        s.id === sampleId ? { ...s, text: newText } : s
                    )
                };
            }
            return c;
        }));
    }, []);

    // Train the model
    const trainModel = useCallback(async ({ epochs = 50, batchSize = 16, learningRate = 0.001 }) => {
        if (!encoder) {
            alert('Encoder not loaded yet!');
            return;
        }

        if (classes.length < 2) {
            alert('Please add at least 2 classes!');
            return;
        }

        const hasEnoughSamples = classes.every(c => c.samples.length >= 5);
        if (!hasEnoughSamples) {
            alert('Each class needs at least 5 text samples!');
            return;
        }

        setIsTraining(true);
        setStatus('Training...');
        setTrainingProgress(0);

        try {
            // Prepare training data
            const texts = [];
            const labels = [];

            classes.forEach((classItem, classIndex) => {
                classItem.samples.forEach(sample => {
                    texts.push(sample.text);
                    labels.push(classIndex);
                });
            });

            // Convert texts to embeddings using USE
            setStatus('Extracting text features...');
            const embeddings = await encoder.embed(texts);

            // Convert labels to one-hot encoding
            const numClasses = classes.length;
            const oneHotLabels = tf.oneHot(tf.tensor1d(labels, 'int32'), numClasses);

            // Create a simple dense neural network
            const inputShape = [512]; // USE produces 512-dimensional embeddings
            const customModel = tf.sequential({
                layers: [
                    tf.layers.dense({
                        inputShape: inputShape,
                        units: 128,
                        activation: 'relu'
                    }),
                    tf.layers.dropout({ rate: 0.2 }),
                    tf.layers.dense({
                        units: 64,
                        activation: 'relu'
                    }),
                    tf.layers.dropout({ rate: 0.2 }),
                    tf.layers.dense({
                        units: numClasses,
                        activation: 'softmax'
                    })
                ]
            });

            // Compile the model
            customModel.compile({
                optimizer: tf.train.adam(learningRate),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
            });

            // Train the model
            setStatus('Training model...');
            await customModel.fit(embeddings, oneHotLabels, {
                epochs: epochs,
                batchSize: batchSize,
                validationSplit: 0.2,
                shuffle: true,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        const progress = ((epoch + 1) / epochs) * 100;
                        setTrainingProgress(progress);
                        setStatus(`Training... Epoch ${epoch + 1}/${epochs} - Accuracy: ${(logs.acc * 100).toFixed(1)}%`);
                    }
                }
            });

            // Clean up tensors
            embeddings.dispose();
            oneHotLabels.dispose();

            // Save the trained model
            setModel(customModel);
            setHasModel(true);
            setStatus('Training complete!');
            setTrainingProgress(100);

        } catch (error) {
            console.error('Training error:', error);
            setStatus('Training failed');
            alert('Training failed: ' + error.message);
        } finally {
            setIsTraining(false);
        }
    }, [encoder, classes]);

    // Predict on new text
    const predict = useCallback(async (text) => {
        if (!encoder || !model) {
            alert('Model not trained yet!');
            return;
        }

        try {
            // Convert text to embedding
            const embedding = await encoder.embed([text]);

            // Get prediction
            const prediction = model.predict(embedding);
            const probabilities = await prediction.data();

            // Format results
            const results = classes.map((classItem, index) => ({
                className: classItem.name,
                probability: probabilities[index]
            }));

            // Sort by probability
            results.sort((a, b) => b.probability - a.probability);

            setPrediction(results);

            // Clean up
            embedding.dispose();
            prediction.dispose();

            return results;
        } catch (error) {
            console.error('Prediction error:', error);
            alert('Prediction failed: ' + error.message);
        }
    }, [encoder, model, classes]);

    // Export model (placeholder - will implement later)
    const exportModel = useCallback((modelName) => {
        console.log('Export not yet implemented for text models');
        alert('Text model export coming soon!');
    }, []);

    // Save model to storage (placeholder)
    const saveModelToStorage = useCallback(async (userId, projectId) => {
        if (!model) {
            throw new Error('No model to save');
        }

        try {
            // Save model to IndexedDB
            await model.save(`indexeddb://text-model-${projectId}`);

            // Save class information
            const classInfo = {
                classes: classes.map(c => ({
                    id: c.id,
                    name: c.name,
                    sampleCount: c.samples.length
                }))
            };

            localStorage.setItem(`text-classes-${projectId}`, JSON.stringify(classInfo));

            return true;
        } catch (error) {
            console.error('Error saving model:', error);
            throw error;
        }
    }, [model, classes]);

    // Load model from storage (placeholder)
    const loadModelFromStorage = useCallback(async (userId, projectId) => {
        try {
            // Load model from IndexedDB
            const loadedModel = await tf.loadLayersModel(`indexeddb://text-model-${projectId}`);
            setModel(loadedModel);
            setHasModel(true);

            // Load class information
            const classInfoStr = localStorage.getItem(`text-classes-${projectId}`);
            if (classInfoStr) {
                const classInfo = JSON.parse(classInfoStr);
                // Restore classes (without samples)
                const restoredClasses = classInfo.classes.map(c => ({
                    ...c,
                    samples: []
                }));
                setClasses(restoredClasses);
                nextClassId.current = Math.max(...restoredClasses.map(c => c.id)) + 1;
            }

            setStatus('Model loaded successfully');
            return true;
        } catch (error) {
            console.log('No saved model found or error loading:', error);
            return false;
        }
    }, []);

    return {
        status,
        classes,
        addClass,
        deleteClass,
        updateClassName,
        addSample,
        deleteSample,
        updateSample,
        trainModel,
        isTraining,
        trainingProgress,
        predict,
        prediction,
        exportModel,
        hasModel,
        saveModelToStorage,
        loadModelFromStorage,
        encoder
    };
};
