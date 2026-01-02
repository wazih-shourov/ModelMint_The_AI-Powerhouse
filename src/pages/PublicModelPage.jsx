import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import * as tf from '@tensorflow/tfjs';
import { Upload, Image as ImageIcon, Check, AlertCircle, Loader, Zap } from 'lucide-react';
import faviconLogo from '../assets/favicon.png';
import '../styles/PublicModelPage.css';

const PYTHON_SERVER_URL = import.meta.env.VITE_PYTHON_SERVER_URL || 'http://localhost:5000';

// --- Sub-Component: Chat Interface ---
const ChatInterface = ({ deployment, onImageUpload, messages, isAnalyzing, messagesEndRef }) => {
    return (
        <div className="chat-interface-wrapper" style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
            <div className="messages-area" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`message-row ${msg.type}`}>
                        {msg.type === 'ai' && (
                            <div className="avatar ai-avatar">
                                <img src={faviconLogo} alt="AI" />
                            </div>
                        )}

                        <div className={`message-bubble ${msg.type}`}>
                            {msg.type === 'user' ? (
                                <img src={msg.content} alt="User Upload" className="message-image" />
                            ) : (
                                <p>{msg.content}</p>
                            )}
                        </div>
                    </div>
                ))}

                {isAnalyzing && (
                    <div className="message-row ai">
                        <div className="avatar ai-avatar">
                            <img src={faviconLogo} alt="AI" />
                        </div>
                        <div className="message-bubble ai typing">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-area" style={{ position: 'relative', background: 'white', borderTop: '1px solid #f3f4f6' }}>
                <div className="input-wrapper">
                    <label className="image-upload-btn">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={onImageUpload}
                            disabled={isAnalyzing}
                            hidden
                        />
                        <ImageIcon size={24} />
                        <span>Upload Image</span>
                    </label>
                    <div className="text-input-placeholder">
                        Reply with an image...
                    </div>
                </div>
            </div>
        </div>
    );
};

const DEVICE_WIDTHS = {
    mobile: 375,
    tablet: 768,
    desktop: 1200
};

const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return windowSize;
};

const PublicModelPage = () => {
    const { username, slug } = useParams();
    const [deployment, setDeployment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { width } = useWindowSize();

    const device = width < 768 ? 'mobile' : width < 1200 ? 'tablet' : 'desktop';

    // Chat State
    const [messages, setMessages] = useState([
        { id: 'welcome', type: 'ai', content: 'Hello! Upload an image and I will tell you what it is.' }
    ]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isAnalyzing]);

    useEffect(() => {
        fetchDeployment();
    }, [username, slug]);

    const fetchDeployment = async () => {
        try {
            setLoading(true);
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .single();

            if (profileError || !profiles) throw new Error('User not found');

            const { data: deployData, error: deployError } = await supabase
                .from('deployments')
                .select(`*, projects (id, name, project_type, base_model_name)`)
                .eq('user_id', profiles.id)
                .eq('slug', slug)
                .single();

            if (deployError || !deployData) throw new Error('Deployment not found');

            setDeployment(deployData);
            await supabase.rpc('increment_view_count', { row_id: deployData.id });

        } catch (err) {
            console.error('Error loading deployment:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const userMsg = { id: Date.now(), type: 'user', content: URL.createObjectURL(file), file: file };
        setMessages(prev => [...prev, userMsg]);
        await analyzeImage(file);
    };

    const analyzeImage = async (file) => {
        if (!deployment) return;
        setIsAnalyzing(true);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onloadend = async () => {
                const base64Image = reader.result.split(',')[1];
                let endpoint = '/api/predict-mobilenet';
                const { project_type, base_model_name } = deployment.projects;

                if (project_type === 'POSE') endpoint = '/api/predict-movenet';
                else if (project_type === 'IMAGE' && base_model_name === 'InceptionV3') endpoint = '/api/predict-inception';

                const response = await fetch(`${PYTHON_SERVER_URL}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: deployment.user_id,
                        projectId: deployment.project_id,
                        image: base64Image
                    })
                });

                if (!response.ok) throw new Error('Prediction failed');

                const result = await response.json();
                let replyText = "I'm not sure what that is.";

                if (result.predictions && result.predictions.length > 0) {
                    const topPred = result.predictions[0];
                    const label = topPred.className || topPred.label || topPred.class;
                    replyText = `It's a ${label}`;
                } else if (result.keypoints) {
                    replyText = "It's a Pose Detected";
                }

                setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', content: replyText }]);
                setIsAnalyzing(false);
            };

        } catch (err) {
            console.error('Prediction error:', err);
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', content: "Sorry, I encountered an error analyzing that image." }]);
            setIsAnalyzing(false);
        }
    };

    if (loading) return <div className="public-loading"><Loader className="animate-spin" size={48} color="#ff3b30" /><p>Loading...</p></div>;
    if (error) return <div className="public-error"><AlertCircle size={48} color="#ef4444" /><h1>Page Not Found</h1><p>{error}</p><Link to="/" className="btn-primary">Go Home</Link></div>;

    // --- Render Logic ---

    // 1. HTML Mode
    if (deployment.builder_mode === 'html' && deployment.custom_html) {
        return (
            <div dangerouslySetInnerHTML={{ __html: deployment.custom_html }} />
        );
    }

    // 2. Visual Builder Mode (Default)
    const sections = deployment.page_config?.sections || [
        // Fallback Default Layout if no config
        { id: 'def-1', type: 'header', content: deployment.title, style: { fontSize: '2.5rem', textAlign: 'center', padding: '2rem' } },
        { id: 'def-2', type: 'chatbot', style: {} }
    ];

    return (
        <div className="public-page">
            {/* Fixed Header */}
            <header className="public-header">
                <div className="header-left">
                    <img src={faviconLogo} alt="ModelMint" className="header-logo" />
                    <div className="header-info">
                        <span className="header-brand">{deployment.title}</span>
                        <span className="header-subtitle">Powered by ModelMint AI</span>
                    </div>
                </div>
                <div className="header-right">
                    <Link to="/auth" className="btn-signup">Sign Up Free</Link>
                </div>
            </header>

            {/* Dynamic Content Wrapper */}
            <div
                className="public-content-wrapper"
                style={{
                    position: 'relative',
                    // minHeight handled below
                    minHeight: (() => {
                        if (!sections.some(s => s.layout)) return 'calc(100vh - 140px)'; // Fallback for flow layout
                        const maxBottom = sections.reduce((max, section) => {
                            const layout = section.layouts?.[device] || section.layout;
                            if (!layout) return max;
                            const y = parseFloat(layout.y) || 0;
                            const h = parseFloat(layout.h) || 0;
                            return Math.max(max, y + h);
                        }, 0);
                        return Math.max(maxBottom + 300, 800) + 'px'; // Increased padding to 300px
                    })(),
                    boxSizing: 'border-box'
                }}
            >
                {/* Render Sections */}
                {sections.map(section => {
                    const style = section.style || {};
                    const layout = section.layouts?.[device] || section.layout;

                    // If layout exists, use absolute positioning
                    const positionStyle = layout ? {
                        position: 'absolute',
                        left: layout.x,
                        top: layout.y,
                        width: layout.w,
                        height: layout.h,
                        zIndex: 10
                    } : {};

                    const combinedStyle = { ...style, ...positionStyle };

                    switch (section.type) {
                        case 'header':
                            return <h2 key={section.id} style={{ ...combinedStyle, display: 'flex', alignItems: 'center', justifyContent: style.textAlign || 'center' }}>{section.content}</h2>;
                        case 'text':
                            return <p key={section.id} style={combinedStyle}>{section.content}</p>;
                        case 'button':
                            return (
                                <button key={section.id} style={{ ...combinedStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <a href={section.config?.link || '#'} style={{ color: 'inherit', textDecoration: 'none', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{section.content}</a>
                                </button>
                            );
                        case 'image':
                            return <img key={section.id} src={section.content} alt="Content" style={{ ...combinedStyle, objectFit: 'cover' }} />;
                        case 'video':
                            return <iframe key={section.id} src={section.content} title="Video" style={{ ...combinedStyle, border: 'none' }} allowFullScreen />;
                        case 'shape':
                            return <div key={section.id} style={combinedStyle}>{section.content}</div>;
                        case 'chatbot':
                            return (
                                <div key={section.id} style={{ ...combinedStyle, padding: '1rem' }}>
                                    <ChatInterface
                                        deployment={deployment}
                                        onImageUpload={handleImageUpload}
                                        messages={messages}
                                        isAnalyzing={isAnalyzing}
                                        messagesEndRef={messagesEndRef}
                                    />
                                </div>
                            );
                        default:
                            return null;
                    }
                })}
            </div>

            <footer className="public-footer">
                <p>&copy; {new Date().getFullYear()} ModelMint. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default PublicModelPage;
