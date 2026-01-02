import React, { useRef, useState } from 'react';
import { Upload, FileJson, Database, FileCode, Package, Smartphone, Loader2 } from 'lucide-react';

const ImportModelNode = ({ onImport }) => {
    const [selectedFormat, setSelectedFormat] = useState('tfjs'); // 'tfjs', 'h5', 'tflite'
    const [importing, setImporting] = useState(false);

    // TensorFlow.js refs
    const jsonInputRef = useRef(null);
    const weightsInputRef = useRef(null);
    const metadataInputRef = useRef(null);

    // Keras .h5 ref
    const h5InputRef = useRef(null);

    // TFLite refs
    const tfliteInputRef = useRef(null);
    const tfliteMetadataInputRef = useRef(null);

    // State for files
    const [jsonFile, setJsonFile] = useState(null);
    const [weightsFile, setWeightsFile] = useState(null);
    const [metadataFile, setMetadataFile] = useState(null);
    const [h5File, setH5File] = useState(null);
    const [tfliteFile, setTfliteFile] = useState(null);
    const [tfliteMetadataFile, setTfliteMetadataFile] = useState(null);

    const handleImport = async () => {
        if (selectedFormat === 'tfjs' && jsonFile && weightsFile) {
            // Direct TensorFlow.js import (existing functionality)
            onImport(jsonFile, weightsFile, metadataFile);
        } else if (selectedFormat === 'h5' && h5File) {
            // Convert H5 to TensorFlow.js via server
            await convertAndImport('h5', h5File, null);
        } else if (selectedFormat === 'tflite' && tfliteFile) {
            // Convert TFLite to TensorFlow.js via server
            await convertAndImport('tflite', tfliteFile, tfliteMetadataFile);
        }
    };

    const convertAndImport = async (format, modelFile, metadataFile) => {
        try {
            setImporting(true);

            const formData = new FormData();
            formData.append('format', format);
            formData.append('modelFile', modelFile);
            if (metadataFile) {
                formData.append('metadataFile', metadataFile);
            }

            console.log(`Converting ${format} model to TensorFlow.js...`);

            const response = await fetch('http://localhost:5000/import', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Conversion failed');
            }

            const data = await response.json();

            // Convert base64 weights back to Blob
            const weightsBlob = base64ToBlob(data.weightsData, 'application/octet-stream');

            // Create File objects from the converted data
            const modelJsonBlob = new Blob([JSON.stringify(data.modelJson)], { type: 'application/json' });
            const modelJsonFile = new File([modelJsonBlob], 'model.json', { type: 'application/json' });
            const weightsFile = new File([weightsBlob], data.weightsFileName, { type: 'application/octet-stream' });

            let metadataFileObj = null;
            if (data.metadata) {
                const metadataBlob = new Blob([JSON.stringify(data.metadata)], { type: 'application/json' });
                metadataFileObj = new File([metadataBlob], 'metadata.json', { type: 'application/json' });
            }

            console.log('✅ Model converted successfully');

            // Call the original onImport with converted files
            onImport(modelJsonFile, weightsFile, metadataFileObj);

        } catch (error) {
            console.error('Conversion error:', error);
            alert(`Failed to import model: ${error.message} \n\nMake sure the Python conversion server is running.`);
        } finally {
            setImporting(false);
        }
    };

    const base64ToBlob = (base64, contentType) => {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: contentType });
    };

    const isImportDisabled = () => {
        if (selectedFormat === 'tfjs') return !jsonFile || !weightsFile;
        if (selectedFormat === 'h5') return !h5File;
        if (selectedFormat === 'tflite') return !tfliteFile;
        return true;
    };

    return (
        <div className="card" style={{ marginBottom: '2rem', border: '1px dashed var(--accent-primary)' }}>
            <div className="card-header" style={{ background: 'var(--accent-light)' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Upload size={18} /> Import Model
                </h3>
            </div>
            <div className="card-body">
                {/* Format Toggle */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    background: 'var(--bg-tertiary)',
                    padding: '0.25rem',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <button
                        onClick={() => setSelectedFormat('tfjs')}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            background: selectedFormat === 'tfjs' ? 'white' : 'transparent',
                            color: selectedFormat === 'tfjs' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: selectedFormat === 'tfjs' ? '600' : '400',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: selectedFormat === 'tfjs' ? 'var(--shadow-sm)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <FileCode size={16} />
                        TensorFlow.js
                    </button>
                    <button
                        onClick={() => setSelectedFormat('h5')}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            background: selectedFormat === 'h5' ? 'white' : 'transparent',
                            color: selectedFormat === 'h5' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: selectedFormat === 'h5' ? '600' : '400',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: selectedFormat === 'h5' ? 'var(--shadow-sm)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Package size={16} />
                        Keras (.h5)
                    </button>
                    <button
                        onClick={() => setSelectedFormat('tflite')}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            background: selectedFormat === 'tflite' ? 'white' : 'transparent',
                            color: selectedFormat === 'tflite' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: selectedFormat === 'tflite' ? '600' : '400',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: selectedFormat === 'tflite' ? 'var(--shadow-sm)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Smartphone size={16} />
                        TFLite
                    </button>
                </div>

                {/* File Upload Section with Slide Animation */}
                <div style={{
                    overflow: 'hidden',
                    position: 'relative',
                    minHeight: '200px'
                }}>
                    {/* TensorFlow.js Format */}
                    <div style={{
                        opacity: selectedFormat === 'tfjs' ? 1 : 0,
                        transform: selectedFormat === 'tfjs' ? 'translateX(0)' : 'translateX(-20px)',
                        transition: 'all 0.3s ease',
                        pointerEvents: selectedFormat === 'tfjs' ? 'auto' : 'none',
                        position: selectedFormat === 'tfjs' ? 'relative' : 'absolute',
                        width: '100%'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div
                                className="btn btn-secondary"
                                onClick={() => jsonInputRef.current.click()}
                                style={{ justifyContent: 'space-between' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileJson size={16} /> {jsonFile ? jsonFile.name : 'model.json'}
                                </span>
                                <input
                                    type="file"
                                    accept=".json"
                                    ref={jsonInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => setJsonFile(e.target.files[0])}
                                />
                            </div>

                            <div
                                className="btn btn-secondary"
                                onClick={() => weightsInputRef.current.click()}
                                style={{ justifyContent: 'space-between' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Database size={16} /> {weightsFile ? weightsFile.name : 'model.weights.bin'}
                                </span>
                                <input
                                    type="file"
                                    accept=".bin"
                                    ref={weightsInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => setWeightsFile(e.target.files[0])}
                                />
                            </div>

                            <div
                                className="btn btn-secondary"
                                onClick={() => metadataInputRef.current.click()}
                                style={{ justifyContent: 'space-between', gridColumn: '1 / -1' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileJson size={16} /> {metadataFile ? metadataFile.name : 'metadata.json (Optional)'}
                                </span>
                                <input
                                    type="file"
                                    accept=".json"
                                    ref={metadataInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => setMetadataFile(e.target.files[0])}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Keras .h5 Format */}
                    <div style={{
                        opacity: selectedFormat === 'h5' ? 1 : 0,
                        transform: selectedFormat === 'h5' ? 'translateX(0)' : 'translateX(-20px)',
                        transition: 'all 0.3s ease',
                        pointerEvents: selectedFormat === 'h5' ? 'auto' : 'none',
                        position: selectedFormat === 'h5' ? 'relative' : 'absolute',
                        width: '100%',
                        top: selectedFormat === 'h5' ? 0 : 0
                    }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <div
                                className="btn btn-secondary"
                                onClick={() => h5InputRef.current.click()}
                                style={{ justifyContent: 'space-between', width: '100%' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Package size={16} /> {h5File ? h5File.name : 'model.h5'}
                                </span>
                                <input
                                    type="file"
                                    accept=".h5"
                                    ref={h5InputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => setH5File(e.target.files[0])}
                                />
                            </div>
                            <p style={{
                                margin: '0.5rem 0 0 0',
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                textAlign: 'center'
                            }}>
                                Upload your Keras .h5 model file
                            </p>
                        </div>
                    </div>

                    {/* TFLite Format */}
                    <div style={{
                        opacity: selectedFormat === 'tflite' ? 1 : 0,
                        transform: selectedFormat === 'tflite' ? 'translateX(0)' : 'translateX(-20px)',
                        transition: 'all 0.3s ease',
                        pointerEvents: selectedFormat === 'tflite' ? 'auto' : 'none',
                        position: selectedFormat === 'tflite' ? 'relative' : 'absolute',
                        width: '100%',
                        top: selectedFormat === 'tflite' ? 0 : 0
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div
                                className="btn btn-secondary"
                                onClick={() => tfliteInputRef.current.click()}
                                style={{ justifyContent: 'space-between' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Smartphone size={16} /> {tfliteFile ? tfliteFile.name : 'model.tflite'}
                                </span>
                                <input
                                    type="file"
                                    accept=".tflite"
                                    ref={tfliteInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => setTfliteFile(e.target.files[0])}
                                />
                            </div>

                            <div
                                className="btn btn-secondary"
                                onClick={() => tfliteMetadataInputRef.current.click()}
                                style={{ justifyContent: 'space-between' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileJson size={16} /> {tfliteMetadataFile ? tfliteMetadataFile.name : 'metadata.json'}
                                </span>
                                <input
                                    type="file"
                                    accept=".json"
                                    ref={tfliteMetadataInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => setTfliteMetadataFile(e.target.files[0])}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleImport}
                    disabled={isImportDisabled() || importing}
                >
                    {importing ? (
                        <>
                            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                            Converting...
                        </>
                    ) : (
                        'Load Imported Model'
                    )}
                </button>
            </div>
        </div>
    );
};

export default ImportModelNode;
