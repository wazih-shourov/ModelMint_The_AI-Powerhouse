import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Copy, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getModelFileUrls } from '../lib/modelStorage';
import { getBrandedModelName } from '../lib/modelBranding';
import headerLogo from '../assets/header_logo.png';

const ExportPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState(false);
    const [convertingFormat, setConvertingFormat] = useState(null);
    const [copiedSnippet, setCopiedSnippet] = useState(null);
    const [expandedDocs, setExpandedDocs] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            const { data: projectData } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            setProject(projectData);
            setLoading(false);
        };

        fetchData();
    }, [projectId]);

    const handleConvertAndDownload = async (format) => {
        try {
            setConverting(true);
            setConvertingFormat(format);

            const urls = getModelFileUrls(user.id, projectId);

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
                    userId: user.id,
                    projectId: projectId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Conversion failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = format === 'h5' ? `${projectId}_model.h5` : `${projectId}_model.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Conversion error:', error);
            alert(`Failed to convert model: ${error.message}\n\nMake sure the Python conversion server is running.`);
        } finally {
            setConverting(false);
            setConvertingFormat(null);
        }
    };

    const copyToClipboard = (text, snippetId) => {
        navigator.clipboard.writeText(text);
        setCopiedSnippet(snippetId);
        setTimeout(() => setCopiedSnippet(null), 2000);
    };

    const toggleDocs = (docId) => {
        setExpandedDocs(prev => ({ ...prev, [docId]: !prev[docId] }));
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    const tfjsSnippet = `// 1. Include TensorFlow.js and ${getBrandedModelName('MobileNet')}
// <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
// <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet"></script>

async function run() {
    // 2. Load the Feature Extractor (${getBrandedModelName('MobileNet')})
    const mobilenetModel = await mobilenet.load();

    // 3. Load your Custom Model
    const customModel = await tf.loadLayersModel('./model.json');
    
    // Load metadata to get class labels
    const metadata = await fetch('./metadata.json').then(r => r.json());
    console.log('Classes:', metadata.labels);

    // 4. Make a Prediction
    const img = document.getElementById('img');
    
    // Get the embedding from ${getBrandedModelName('MobileNet')}
    const activation = mobilenetModel.infer(img, true);
    
    // Pass to your custom model
    const result = customModel.predict(activation);
    
    // Display results
    result.data().then(predictions => {
        predictions.forEach((p, i) => {
            console.log(metadata.labels[i] + ': ' + (p * 100).toFixed(2) + '%');
        });
    });
}

run();`;

    const kerasSnippet = `import tensorflow as tf
import h5py
import json
import numpy as np

# 1. Load the model with embedded metadata
model = tf.keras.models.load_model('${projectId}_model.h5')

# 2. Extract class names (embedded in the file)
with h5py.File('${projectId}_model.h5', 'r') as f:
    class_names = json.loads(f.attrs['class_names'])

print(f"Classes: {class_names}")

# 3. Make predictions
image = tf.keras.preprocessing.image.load_img('test.jpg', target_size=(224, 224))
image_array = tf.keras.preprocessing.image.img_to_array(image)
image_array = np.expand_dims(image_array, axis=0) / 255.0

predictions = model.predict(image_array)
predicted_class = class_names[predictions.argmax()]

print(f"Prediction: {predicted_class} ({predictions.max()*100:.2f}%)")`;

    const tfliteSnippet = `import tensorflow as tf
import json
import numpy as np

# 1. Extract the zip file first
# You'll have: model.tflite and metadata.json

# 2. Load metadata
with open('metadata.json', 'r') as f:
    metadata = json.load(f)
    class_names = [c['name'] for c in metadata['classes']]

# 3. Load TFLite model
interpreter = tf.lite.Interpreter(model_path='model.tflite')
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# 4. Make predictions
image = tf.keras.preprocessing.image.load_img('test.jpg', target_size=(224, 224))
image_array = tf.keras.preprocessing.image.img_to_array(image)
image_array = np.expand_dims(image_array, axis=0) / 255.0
image_array = image_array.astype(np.float32)

interpreter.set_tensor(input_details[0]['index'], image_array)
interpreter.invoke()

predictions = interpreter.get_tensor(output_details[0]['index'])[0]
predicted_class = class_names[predictions.argmax()]

print(f"Prediction: {predicted_class} ({predictions.max()*100:.2f}%)")`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            {/* Fixed Header */}
            <header className="header" style={{ flexShrink: 0 }}>
                <div className="logo">
                    <button
                        onClick={() => navigate(`/studio/${projectId}`)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <img src={headerLogo} alt="ModelMint Logo" style={{ height: '32px' }} />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Export Model</h1>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{project?.name}</p>
                </div>
            </header>

            {/* Two Column Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '400px 1fr',
                gap: '2rem',
                padding: '2rem',
                overflow: 'hidden',
                flex: 1
            }}>

                {/* Left Column - Fixed Download Cards */}
                <div style={{ overflowY: 'auto' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                        Download Your Model
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* TensorFlow.js */}
                        <div className="card">
                            <div className="card-body">
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                                    TensorFlow.js
                                </h3>
                                <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    For web browsers and Node.js
                                </p>

                                <div style={{
                                    background: 'var(--bg-tertiary)',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    marginBottom: '1rem',
                                    fontSize: '0.875rem'
                                }}>
                                    <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Includes:</div>
                                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                                        <li>model.json</li>
                                        <li>model.weights.bin</li>
                                        <li>metadata.json</li>
                                    </ul>
                                </div>

                                <button
                                    onClick={() => handleConvertAndDownload('tfjs')}
                                    disabled={converting}
                                    className="btn btn-primary"
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
                                        opacity: converting && convertingFormat !== 'tfjs' ? 0.5 : 1
                                    }}
                                >
                                    {converting && convertingFormat === 'tfjs' ? (
                                        <>
                                            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                            Packaging...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={18} />
                                            Download TensorFlow.js (.zip)
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Keras .h5 */}
                        <div className="card">
                            <div className="card-body">
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                                    Keras (.h5)
                                </h3>
                                <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    For Python and TensorFlow
                                </p>

                                <div style={{
                                    background: 'var(--accent-light)',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    marginBottom: '1rem',
                                    fontSize: '0.875rem',
                                    color: 'var(--accent-primary)',
                                    fontWeight: '500'
                                }}>
                                    Single file with embedded class names
                                </div>

                                <button
                                    onClick={() => handleConvertAndDownload('h5')}
                                    disabled={converting}
                                    className="btn btn-primary"
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
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
                                            Download Keras (.h5)
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* TFLite */}
                        <div className="card">
                            <div className="card-body">
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                                    TensorFlow Lite
                                </h3>
                                <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    For mobile and embedded devices
                                </p>

                                <div style={{
                                    background: 'var(--bg-tertiary)',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    marginBottom: '1rem',
                                    fontSize: '0.875rem'
                                }}>
                                    <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Zip contains:</div>
                                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                                        <li>model.tflite</li>
                                        <li>metadata.json</li>
                                    </ul>
                                </div>

                                <button
                                    onClick={() => handleConvertAndDownload('tflite')}
                                    disabled={converting}
                                    className="btn btn-primary"
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
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
                                            Download TFLite (.zip)
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Scrollable Code Snippets */}
                <div style={{ overflowY: 'auto', paddingRight: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                        How to Use Your Model
                    </h2>

                    {/* TensorFlow.js Snippet */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="card-title">TensorFlow.js Usage</h3>
                            <button
                                onClick={() => copyToClipboard(tfjsSnippet, 'tfjs')}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.875rem' }}
                            >
                                {copiedSnippet === 'tfjs' ? <Check size={16} /> : <Copy size={16} />}
                                {copiedSnippet === 'tfjs' ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>
                        <div style={{ background: '#1f2937', padding: '1.5rem', overflowX: 'auto' }}>
                            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.875rem', color: '#e5e7eb' }}>
                                <code>{tfjsSnippet}</code>
                            </pre>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)' }}>
                            <button
                                onClick={() => toggleDocs('tfjs')}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: 'none',
                                    border: 'none',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                <span>Documentation</span>
                                {expandedDocs['tfjs'] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {expandedDocs['tfjs'] && (
                                <div style={{ padding: '0 1rem 1rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        Setup
                                    </h4>
                                    <p style={{ margin: '0 0 1rem 0' }}>
                                        Include TensorFlow.js and MobileNet libraries in your HTML file before using the model.
                                    </p>

                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        File Structure
                                    </h4>
                                    <p style={{ margin: '0 0 1rem 0' }}>
                                        Ensure all three files (model.json, model.weights.bin, metadata.json) are in the same directory.
                                    </p>

                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        Image Input
                                    </h4>
                                    <p style={{ margin: 0 }}>
                                        The image element should be an HTML img, canvas, or video element with the image you want to classify.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Keras Snippet */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="card-title">Keras (.h5) Usage - Python</h3>
                            <button
                                onClick={() => copyToClipboard(kerasSnippet, 'keras')}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.875rem' }}
                            >
                                {copiedSnippet === 'keras' ? <Check size={16} /> : <Copy size={16} />}
                                {copiedSnippet === 'keras' ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>
                        <div style={{ background: '#1f2937', padding: '1.5rem', overflowX: 'auto' }}>
                            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.875rem', color: '#e5e7eb' }}>
                                <code>{kerasSnippet}</code>
                            </pre>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)' }}>
                            <button
                                onClick={() => toggleDocs('keras')}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: 'none',
                                    border: 'none',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                <span>Documentation</span>
                                {expandedDocs['keras'] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {expandedDocs['keras'] && (
                                <div style={{ padding: '0 1rem 1rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        Requirements
                                    </h4>
                                    <p style={{ margin: '0 0 1rem 0' }}>
                                        Install required packages: pip install tensorflow h5py
                                    </p>

                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        Embedded Metadata
                                    </h4>
                                    <p style={{ margin: '0 0 1rem 0' }}>
                                        Class names are embedded in the .h5 file. No need for separate metadata.json file.
                                    </p>

                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        Image Preprocessing
                                    </h4>
                                    <p style={{ margin: 0 }}>
                                        Images should be resized to 224x224 pixels and normalized to 0-1 range before prediction.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TFLite Snippet */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="card-title">TensorFlow Lite Usage - Python</h3>
                            <button
                                onClick={() => copyToClipboard(tfliteSnippet, 'tflite')}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.875rem' }}
                            >
                                {copiedSnippet === 'tflite' ? <Check size={16} /> : <Copy size={16} />}
                                {copiedSnippet === 'tflite' ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>
                        <div style={{ background: '#1f2937', padding: '1.5rem', overflowX: 'auto' }}>
                            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.875rem', color: '#e5e7eb' }}>
                                <code>{tfliteSnippet}</code>
                            </pre>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)' }}>
                            <button
                                onClick={() => toggleDocs('tflite')}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: 'none',
                                    border: 'none',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                <span>Documentation</span>
                                {expandedDocs['tflite'] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {expandedDocs['tflite'] && (
                                <div style={{ padding: '0 1rem 1rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        Extract Zip File
                                    </h4>
                                    <p style={{ margin: '0 0 1rem 0' }}>
                                        First extract the downloaded zip file to get model.tflite and metadata.json files.
                                    </p>

                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        Mobile Deployment
                                    </h4>
                                    <p style={{ margin: '0 0 1rem 0' }}>
                                        For Android/iOS apps, use the TFLite SDK for your platform. The model.tflite file is optimized for mobile devices.
                                    </p>

                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        Input Format
                                    </h4>
                                    <p style={{ margin: 0 }}>
                                        TFLite requires float32 input. Make sure to convert your image array to float32 before inference.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportPage;
