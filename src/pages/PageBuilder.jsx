import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Draggable from 'react-draggable';
import {
    Type, Image as ImageIcon, MessageSquare, Box, Layout,
    ArrowUp, ArrowDown, Trash2, Save, Eye, Code,
    Monitor, Smartphone, Tablet, MousePointer, Youtube,
    Grid, Minus, Plus, ChevronDown, ChevronRight, Layers
} from 'lucide-react';
import faviconLogo from '../assets/favicon.png'; // Import Logo
import '../styles/PageBuilder.css';

// --- Components ---

const DEVICE_WIDTHS = {
    mobile: 375,
    tablet: 768,
    desktop: 1200
};

const getResponsiveLayout = (baseLayout, device) => {
    const widthLimit = DEVICE_WIDTHS[device];
    if (!widthLimit || device === 'desktop') return baseLayout;

    let w = Math.min(baseLayout.w, widthLimit - 40);
    let x = Math.min(baseLayout.x, widthLimit - w - 20);
    x = Math.max(20, x); // Keep at least 20px from left

    return { ...baseLayout, x, w, h: baseLayout.h };
};

const DraggableSection = ({ section, isSelected, setSelectedId, updateSection, deleteSection, zoom, device }) => {
    const nodeRef = useRef(null);
    // Use the layout for the current device
    const currentLayout = section.layouts?.[device] || section.layout || { x: 0, y: 0, w: 200, h: 100 };

    const [layout, setLayout] = useState(currentLayout);
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef({ startX: 0, startY: 0, startW: 0, startH: 0 });

    // Update local state when device or section changes
    useEffect(() => {
        setLayout(section.layouts?.[device] || section.layout || { x: 0, y: 0, w: 200, h: 100 });
    }, [section.layouts, device, section.layout]);

    const latestLayout = useRef(layout);
    useEffect(() => { latestLayout.current = layout; }, [layout]);

    useEffect(() => {
        if (!isResizing) return;
        const widthLimit = DEVICE_WIDTHS[device] || 1200; // Default to 1200 for desktop if undefined

        const handleMouseMove = (e) => {
            const dx = (e.clientX - resizeRef.current.startX) / zoom;
            const dy = (e.clientY - resizeRef.current.startY) / zoom;

            // Calculate new dimensions
            let newW = Math.max(50, resizeRef.current.startW + dx);
            const newH = Math.max(20, resizeRef.current.startH + dy);

            // Constrain width to prevent overflow
            // The element's right edge (x + w) cannot exceed the container width
            const maxAllowedWidth = widthLimit - layout.x;
            newW = Math.min(newW, maxAllowedWidth);

            setLayout(prev => ({ ...prev, w: newW, h: newH }));
        };
        const handleMouseUp = () => {
            setIsResizing(false);
            // Update ONLY the current device's layout
            updateSection(section.id, {
                layouts: {
                    ...section.layouts,
                    [device]: latestLayout.current
                }
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, section.id, updateSection, zoom, device, section.layouts, layout.x]);

    const commonProps = {
        style: { ...section.style, width: '100%', height: '100%' },
        className: `canvas-element ${section.type}`
    };

    let content = null;
    switch (section.type) {
        case 'header':
            content = <h2 {...commonProps} style={{ ...commonProps.style, display: 'flex', alignItems: 'center', justifyContent: section.style.textAlign || 'center' }}>{section.content}</h2>;
            break;
        case 'text':
            content = <p {...commonProps} style={{ ...commonProps.style, whiteSpace: 'pre-wrap' }}>{section.content}</p>;
            break;
        case 'button':
            content = <button {...commonProps}>{section.content}</button>;
            break;
        case 'image':
            content = <img src={section.content} alt="Content" {...commonProps} draggable={false} />;
            break;
        case 'shape':
            content = <div {...commonProps}>{section.content}</div>;
            break;
        case 'video':
            content = <iframe src={section.content} title="Video" {...commonProps} style={{ ...commonProps.style, pointerEvents: 'none' }} />;
            break;
        case 'chatbot':
            content = (
                <div {...commonProps} style={{ ...commonProps.style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', color: '#6b7280' }}>
                    <div style={{ textAlign: 'center' }}>
                        <MessageSquare size={48} style={{ marginBottom: '1rem' }} />
                        <h3>AI Chat Interface</h3>
                        <p>(Interactive on public page)</p>
                    </div>
                </div>
            );
            break;
        default:
            content = <div {...commonProps}>Unknown Element</div>;
    }

    return (
        <Draggable
            nodeRef={nodeRef}
            position={{ x: layout.x, y: layout.y }}
            scale={zoom}
            onStart={(e) => { e.stopPropagation(); setSelectedId(section.id); }}
            onDrag={(e, data) => setLayout(prev => ({ ...prev, x: data.x, y: data.y }))}
            onStop={(e, data) => {
                updateSection(section.id, {
                    layouts: {
                        ...section.layouts,
                        [device]: { ...layout, x: data.x, y: data.y }
                    }
                });
            }}
            bounds="parent"
            cancel=".resize-handle, .control-btn"
        >
            <div
                ref={nodeRef}
                className={`canvas-section ${isSelected ? 'selected' : ''}`}
                style={{ width: layout.w, height: layout.h, position: 'absolute' }}
                onMouseDown={(e) => { e.stopPropagation(); setSelectedId(section.id); }}
                onClick={(e) => { e.stopPropagation(); setSelectedId(section.id); }}
            >
                <div className="section-label">{section.type}</div>

                {isSelected && (
                    <>
                        <div className="resize-handle rh-se" onMouseDown={(e) => {
                            e.stopPropagation();
                            resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: layout.w, startH: layout.h };
                            setIsResizing(true);
                        }} />
                        <button
                            className="control-btn"
                            onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                            style={{ position: 'absolute', top: -10, right: -10, background: '#ef4444', borderRadius: '50%', padding: 4, border: 'none', cursor: 'pointer', color: 'white', zIndex: 50 }}
                        >
                            <Trash2 size={12} />
                        </button>
                    </>
                )}
                {content}
            </div>
        </Draggable>
    );
};

const PropertySection = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="prop-section">
            <div className="prop-section-header" onClick={() => setIsOpen(!isOpen)}>
                <span>{title}</span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            {isOpen && <div className="prop-section-body">{children}</div>}
        </div>
    );
};

const PageBuilder = () => {
    const { deploymentId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deployment, setDeployment] = useState(null);

    // Builder State
    const [sections, setSections] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [device, setDevice] = useState('desktop'); // desktop, tablet, mobile
    const [zoom, setZoom] = useState(1);
    const [activeTab, setActiveTab] = useState('add'); // add, layers

    // Load Deployment Data
    useEffect(() => {
        fetchDeployment();
    }, [deploymentId]);

    const fetchDeployment = async () => {
        try {
            const { data, error } = await supabase
                .from('deployments')
                .select('*')
                .eq('id', deploymentId)
                .single();

            if (error) throw error;
            setDeployment(data);

            let loadedSections = [];
            if (data.page_config && data.page_config.sections) {
                loadedSections = data.page_config.sections;
            } else {
                // Default sections
                loadedSections = [
                    { id: 'head-1', type: 'header', content: data.title || 'Welcome', style: { fontSize: '2.5rem', textAlign: 'center', color: '#111827' }, layout: { x: 50, y: 50, w: 700, h: 100 } },
                    { id: 'chat-1', type: 'chatbot', config: { title: 'AI Assistant' }, style: {}, layout: { x: 50, y: 200, w: 700, h: 500 } }
                ];
            }

            // Process sections to ensure they have responsive layouts
            const processedSections = loadedSections.map(s => {
                const baseLayout = s.layout || { x: 0, y: 0, w: 200, h: 100 };
                // If layouts doesn't exist, create it based on the base layout
                const layouts = s.layouts || {
                    desktop: baseLayout,
                    tablet: getResponsiveLayout(baseLayout, 'tablet'),
                    mobile: getResponsiveLayout(baseLayout, 'mobile')
                };
                return { ...s, layouts }; // Ensure layouts is present
            });

            setSections(processedSections);

        } catch (err) {
            console.error('Error loading deployment:', err);
        } finally {
            setLoading(false);
        }
    };

    const addSection = (type) => {
        const baseLayout = { x: 50, y: 100, w: 300, h: 150 };
        let newSection = {
            id: `sec-${Date.now()}`,
            type,
            content: type === 'header' ? 'New Headline' : type === 'text' ? 'Add text...' : '',
            style: { padding: '1rem', margin: '0px', backgroundColor: 'transparent' },
            layout: baseLayout, // Keep for backward compatibility
            config: {}
        };

        if (type === 'header') {
            newSection.style = { ...newSection.style, fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', color: '#111827' };
            newSection.layout = { x: 50, y: 50, w: 600, h: 100 };
        } else if (type === 'button') {
            newSection.content = 'Button';
            newSection.style = { ...newSection.style, backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' };
            newSection.layout = { x: 50, y: 50, w: 120, h: 40 };
        } else if (type === 'image') {
            newSection.content = 'https://via.placeholder.com/400x300';
            newSection.style = { ...newSection.style, objectFit: 'cover', borderRadius: '8px' };
            newSection.layout = { x: 50, y: 50, w: 400, h: 300 };
        } else if (type === 'shape') {
            newSection.style = { ...newSection.style, backgroundColor: '#e5e7eb' };
            newSection.content = '';
            newSection.layout = { x: 50, y: 50, w: 200, h: 200 };
        } else if (type === 'chatbot') {
            newSection.style = { ...newSection.style, border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white' };
            newSection.layout = { x: 50, y: 50, w: 400, h: 500 };
        }

        // Generate responsive layouts for the new section
        newSection.layouts = {
            desktop: newSection.layout,
            tablet: getResponsiveLayout(newSection.layout, 'tablet'),
            mobile: getResponsiveLayout(newSection.layout, 'mobile')
        };

        setSections([...sections, newSection]);
        setSelectedId(newSection.id);
    };

    const updateSection = (id, updates) => {
        setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const updateStyle = (id, key, value) => {
        setSections(sections.map(s => s.id === id ? { ...s, style: { ...s.style, [key]: value } } : s));
    };

    const deleteSection = (id) => {
        setSections(sections.filter(s => s.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const updateLayout = (id, key, value) => {
        const val = parseInt(value, 10) || 0;
        setSections(sections.map(s => {
            if (s.id !== id) return s;

            const currentLayouts = s.layouts || {};
            const currentDeviceLayout = currentLayouts[device] || s.layout || { x: 0, y: 0, w: 100, h: 100 };

            const newDeviceLayout = { ...currentDeviceLayout, [key]: val };

            return {
                ...s,
                layouts: {
                    ...currentLayouts,
                    [device]: newDeviceLayout
                }
            };
        }));
    };

    const handleBlur = (id, key, value) => {
        if (!value) return;
        // If it's a number, append px
        if (/^\d+$/.test(value)) {
            updateStyle(id, key, `${value}px`);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('deployments')
                .update({ page_config: { sections } })
                .eq('id', deploymentId);
            if (error) throw error;
            alert('✅ Saved successfully!');
        } catch (err) {
            alert('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const canvasWidth = device === 'mobile' ? '375px' : device === 'tablet' ? '768px' : '100%';
    const canvasHeight = useMemo(() => {
        const maxY = sections.reduce((max, s) => {
            const currentLayout = s.layouts?.[device] || s.layout;
            return Math.max(max, (currentLayout?.y || 0) + (currentLayout?.h || 0));
        }, 0);
        return Math.max(maxY + 300, 800);
    }, [sections, device]); // Recalculate height when device changes

    const selectedSection = sections.find(s => s.id === selectedId);
    // Get current layout for properties panel
    const selectedLayout = selectedSection ? (selectedSection.layouts?.[device] || selectedSection.layout) : null;

    if (loading) return <div className="builder-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

    return (
        <div className="builder-container">
            {/* Header */}
            <header className="builder-header">
                <div className="header-left">
                    <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Layers size={20} /></button>
                    <span style={{ fontWeight: 600 }}>{deployment?.title}</span>
                </div>
                <div className="header-center">
                    <div className="device-toggles">
                        <button className={`device-btn ${device === 'desktop' ? 'active' : ''}`} onClick={() => setDevice('desktop')}><Monitor size={16} /></button>
                        <button className={`device-btn ${device === 'tablet' ? 'active' : ''}`} onClick={() => setDevice('tablet')}><Tablet size={16} /></button>
                        <button className={`device-btn ${device === 'mobile' ? 'active' : ''}`} onClick={() => setDevice('mobile')}><Smartphone size={16} /></button>
                    </div>
                    <div style={{ width: '1px', height: '20px', background: '#e5e7eb', margin: '0 1rem' }} />
                    <div className="device-toggles">
                        <button className="device-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><Minus size={14} /></button>
                        <span style={{ fontSize: '0.75rem', padding: '0 8px', minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
                        <button className="device-btn" onClick={() => setZoom(z => Math.min(2, z + 0.1))}><Plus size={14} /></button>
                    </div>
                </div>
                <div className="header-right">
                    <button className="btn-publish" onClick={handleSave}>{saving ? 'Saving...' : 'Publish'}</button>
                </div>
            </header>

            <div className="builder-body">
                {/* Left Sidebar */}
                <div className="builder-sidebar-left">
                    <div className="sidebar-tabs">
                        <div className={`sidebar-tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>Add</div>
                        <div className={`sidebar-tab ${activeTab === 'layers' ? 'active' : ''}`} onClick={() => setActiveTab('layers')}>Layers</div>
                    </div>

                    {activeTab === 'add' ? (
                        <div className="tools-grid">
                            <div className="tool-category">Layout</div>
                            <div className="tool-card" onClick={() => addSection('shape')}>
                                <Box size={20} /> <span>Container</span>
                            </div>

                            <div className="tool-category">Basic</div>
                            <div className="tool-card" onClick={() => addSection('header')}>
                                <Type size={20} /> <span>Heading</span>
                            </div>
                            <div className="tool-card" onClick={() => addSection('text')}>
                                <Type size={16} /> <span>Text</span>
                            </div>
                            <div className="tool-card" onClick={() => addSection('button')}>
                                <MousePointer size={20} /> <span>Button</span>
                            </div>

                            <div className="tool-category">Media</div>
                            <div className="tool-card" onClick={() => addSection('image')}>
                                <ImageIcon size={20} /> <span>Image</span>
                            </div>
                            <div className="tool-card" onClick={() => addSection('video')}>
                                <Youtube size={20} /> <span>Video</span>
                            </div>

                            <div className="tool-category">AI</div>
                            <div className="tool-card" onClick={() => addSection('chatbot')}>
                                <MessageSquare size={20} /> <span>Chatbot</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '1rem' }}>
                            {sections.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => setSelectedId(s.id)}
                                    style={{
                                        padding: '0.5rem',
                                        marginBottom: '0.5rem',
                                        background: selectedId === s.id ? '#eff6ff' : 'white',
                                        border: `1px solid ${selectedId === s.id ? '#3b82f6' : '#e5e7eb'}`,
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {s.type} - {s.id}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Canvas */}
                <div className="builder-canvas-area">
                    <div
                        className="canvas-frame"
                        style={{
                            width: canvasWidth,
                            height: canvasHeight,
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top center'
                        }}
                        onClick={() => setSelectedId(null)}
                    >
                        {/* Fixed Header Preview */}
                        <div style={{ height: '70px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', opacity: 0.6, pointerEvents: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <img src={faviconLogo} alt="Logo" style={{ height: '32px' }} />
                                <span style={{ fontWeight: 'bold', color: '#111827' }}>{deployment?.title}</span>
                            </div>
                            <button style={{ background: '#ff3b30', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600' }}>Sign Up Free</button>
                        </div>

                        {sections.map(section => (
                            <DraggableSection
                                key={section.id}
                                section={section}
                                isSelected={selectedId === section.id}
                                setSelectedId={setSelectedId}
                                updateSection={updateSection}
                                deleteSection={deleteSection}
                                zoom={zoom}
                                device={device}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="builder-sidebar-right">
                    <div className="properties-header">Properties</div>
                    <div className="properties-content">
                        {selectedSection ? (
                            <>
                                <PropertySection title="Content">
                                    {(selectedSection.type === 'header' || selectedSection.type === 'text' || selectedSection.type === 'button') && (
                                        <div className="prop-col">
                                            <label className="prop-label">Text</label>
                                            <textarea
                                                className="prop-input"
                                                rows={3}
                                                value={selectedSection.content}
                                                onChange={(e) => updateSection(selectedSection.id, { content: e.target.value })}
                                            />
                                        </div>
                                    )}
                                    {(selectedSection.type === 'image' || selectedSection.type === 'video') && (
                                        <div className="prop-col">
                                            <label className="prop-label">URL</label>
                                            <input
                                                className="prop-input"
                                                value={selectedSection.content}
                                                onChange={(e) => updateSection(selectedSection.id, { content: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </PropertySection>

                                <PropertySection title="Layout">
                                    <div className="prop-row">
                                        <div className="prop-col">
                                            <label className="prop-label">X</label>
                                            <input className="prop-input" type="number" value={Math.round(selectedLayout?.x || 0)} onChange={(e) => updateLayout(selectedSection.id, 'x', e.target.value)} />
                                        </div>
                                        <div className="prop-col">
                                            <label className="prop-label">Y</label>
                                            <input className="prop-input" type="number" value={Math.round(selectedLayout?.y || 0)} onChange={(e) => updateLayout(selectedSection.id, 'y', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="prop-row">
                                        <div className="prop-col">
                                            <label className="prop-label">W</label>
                                            <input className="prop-input" type="number" value={Math.round(selectedLayout?.w || 0)} onChange={(e) => updateLayout(selectedSection.id, 'w', e.target.value)} />
                                        </div>
                                        <div className="prop-col">
                                            <label className="prop-label">H</label>
                                            <input className="prop-input" type="number" value={Math.round(selectedLayout?.h || 0)} onChange={(e) => updateLayout(selectedSection.id, 'h', e.target.value)} />
                                        </div>
                                    </div>
                                </PropertySection>

                                <PropertySection title="Typography">
                                    <div className="prop-row">
                                        <div className="prop-col">
                                            <label className="prop-label">Size</label>
                                            <input
                                                className="prop-input"
                                                placeholder="e.g. 16px"
                                                value={selectedSection.style.fontSize || ''}
                                                onChange={(e) => updateStyle(selectedSection.id, 'fontSize', e.target.value)}
                                                onBlur={(e) => handleBlur(selectedSection.id, 'fontSize', e.target.value)}
                                            />
                                        </div>
                                        <div className="prop-col">
                                            <label className="prop-label">Weight</label>
                                            <select
                                                className="prop-select"
                                                value={selectedSection.style.fontWeight || 'normal'}
                                                onChange={(e) => updateStyle(selectedSection.id, 'fontWeight', e.target.value)}
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="500">Medium</option>
                                                <option value="bold">Bold</option>
                                                <option value="900">Black</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="prop-row">
                                        <div className="prop-col">
                                            <label className="prop-label">Align</label>
                                            <select className="prop-select" value={selectedSection.style.textAlign || 'left'} onChange={(e) => updateStyle(selectedSection.id, 'textAlign', e.target.value)}>
                                                <option value="left">Left</option>
                                                <option value="center">Center</option>
                                                <option value="right">Right</option>
                                                <option value="justify">Justify</option>
                                            </select>
                                        </div>
                                        <div className="prop-col">
                                            <label className="prop-label">Color</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input type="color" value={selectedSection.style.color || '#000000'} onChange={(e) => updateStyle(selectedSection.id, 'color', e.target.value)} style={{ width: '30px', height: '30px', border: '1px solid #ddd', padding: 0 }} />
                                                <input className="prop-input" value={selectedSection.style.color || '#000000'} onChange={(e) => updateStyle(selectedSection.id, 'color', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </PropertySection>

                                <PropertySection title="Appearance">
                                    <div className="prop-col">
                                        <label className="prop-label">Background</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input type="color" value={selectedSection.style.backgroundColor || '#ffffff'} onChange={(e) => updateStyle(selectedSection.id, 'backgroundColor', e.target.value)} style={{ width: '30px', height: '30px', border: '1px solid #ddd', padding: 0 }} />
                                            <input className="prop-input" value={selectedSection.style.backgroundColor || '#ffffff'} onChange={(e) => updateStyle(selectedSection.id, 'backgroundColor', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="prop-row">
                                        <div className="prop-col">
                                            <label className="prop-label">Radius</label>
                                            <input className="prop-input" value={selectedSection.style.borderRadius || ''} onChange={(e) => updateStyle(selectedSection.id, 'borderRadius', e.target.value)} />
                                        </div>
                                    </div>
                                </PropertySection>
                            </>
                        ) : (
                            <div className="empty-state">Select an element to edit properties</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageBuilder;
