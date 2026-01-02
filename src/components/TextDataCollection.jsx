import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import './TextDataCollection.css';

const TextDataCollection = ({
    classes,
    onAddClass,
    onDeleteClass,
    onAddSample,
    onDeleteSample,
    onUpdateSample
}) => {
    const [newClassName, setNewClassName] = useState('');
    const [showAddClass, setShowAddClass] = useState(false);
    const [activeClass, setActiveClass] = useState(null);
    const [newSampleText, setNewSampleText] = useState('');
    const [editingSample, setEditingSample] = useState(null);
    const [editText, setEditText] = useState('');

    const handleAddClass = () => {
        if (newClassName.trim()) {
            onAddClass(newClassName.trim());
            setNewClassName('');
            setShowAddClass(false);
        }
    };

    const handleAddSample = (classId) => {
        if (newSampleText.trim()) {
            onAddSample(classId, newSampleText.trim());
            setNewSampleText('');
        }
    };

    const handleStartEdit = (sample) => {
        setEditingSample(sample.id);
        setEditText(sample.text);
    };

    const handleSaveEdit = (classId, sampleId) => {
        if (editText.trim()) {
            onUpdateSample(classId, sampleId, editText.trim());
            setEditingSample(null);
            setEditText('');
        }
    };

    const handleCancelEdit = () => {
        setEditingSample(null);
        setEditText('');
    };

    return (
        <div className="text-data-collection">
            <div className="collection-header">
                <h3>Text Samples</h3>
                <p className="collection-subtitle">Add at least 10-20 text samples per class</p>
            </div>

            {/* Add Class Button */}
            {!showAddClass && (
                <button
                    className="add-class-btn"
                    onClick={() => setShowAddClass(true)}
                >
                    <Plus size={18} />
                    Add New Class
                </button>
            )}

            {/* Add Class Form */}
            {showAddClass && (
                <div className="add-class-form">
                    <input
                        type="text"
                        className="class-name-input"
                        placeholder="Enter class name (e.g., Positive, Negative)"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddClass()}
                        autoFocus
                    />
                    <div className="form-actions">
                        <button className="btn-save" onClick={handleAddClass}>
                            <Check size={16} /> Add
                        </button>
                        <button className="btn-cancel" onClick={() => {
                            setShowAddClass(false);
                            setNewClassName('');
                        }}>
                            <X size={16} /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Classes List */}
            <div className="classes-list">
                {classes.map((classItem) => (
                    <div
                        key={classItem.id}
                        className={`class-card ${activeClass === classItem.id ? 'active' : ''}`}
                    >
                        <div className="class-header">
                            <div className="class-info">
                                <h4>{classItem.name}</h4>
                                <span className="sample-count">
                                    {classItem.samples?.length || 0} samples
                                </span>
                            </div>
                            <button
                                className="delete-class-btn"
                                onClick={() => onDeleteClass(classItem.id)}
                                title="Delete class"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {/* Add Sample Input */}
                        <div className="add-sample-section">
                            <textarea
                                className="sample-input"
                                placeholder="Type a text sample here..."
                                value={activeClass === classItem.id ? newSampleText : ''}
                                onChange={(e) => {
                                    setActiveClass(classItem.id);
                                    setNewSampleText(e.target.value);
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddSample(classItem.id);
                                    }
                                }}
                                rows={3}
                            />
                            <button
                                className="add-sample-btn"
                                onClick={() => handleAddSample(classItem.id)}
                                disabled={!newSampleText.trim() || activeClass !== classItem.id}
                            >
                                <Plus size={16} /> Add Sample
                            </button>
                        </div>

                        {/* Samples List */}
                        {classItem.samples && classItem.samples.length > 0 && (
                            <div className="samples-list">
                                {classItem.samples.map((sample) => (
                                    <div key={sample.id} className="sample-item">
                                        {editingSample === sample.id ? (
                                            <div className="edit-sample-form">
                                                <textarea
                                                    className="edit-sample-input"
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    rows={3}
                                                    autoFocus
                                                />
                                                <div className="edit-actions">
                                                    <button
                                                        className="btn-save-edit"
                                                        onClick={() => handleSaveEdit(classItem.id, sample.id)}
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        className="btn-cancel-edit"
                                                        onClick={handleCancelEdit}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="sample-text">{sample.text}</p>
                                                <div className="sample-actions">
                                                    <button
                                                        className="edit-btn"
                                                        onClick={() => handleStartEdit(sample)}
                                                        title="Edit sample"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        className="delete-btn"
                                                        onClick={() => onDeleteSample(classItem.id, sample.id)}
                                                        title="Delete sample"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {classes.length === 0 && !showAddClass && (
                <div className="empty-state">
                    <p>No classes yet. Add your first class to get started!</p>
                </div>
            )}
        </div>
    );
};

export default TextDataCollection;
