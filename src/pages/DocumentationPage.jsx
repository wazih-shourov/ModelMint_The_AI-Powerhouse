import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book, Code, Terminal, Layers, Zap, Shield,
    Menu, X, ChevronRight, Search, ExternalLink,
    Cpu, Database, Globe, AlertTriangle, CheckCircle,
    Copy, Check
} from 'lucide-react';
import headerLogo from '../assets/header_logo.png';
import '../styles/DocumentationPage.css';

const DocumentationPage = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('introduction');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
            setIsSidebarOpen(false);
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const sections = [
        {
            title: 'Getting Started',
            items: [
                { id: 'introduction', label: 'Introduction' },
                { id: 'quickstart', label: 'Quickstart Guide' },
                { id: 'concepts', label: 'Core Concepts' }
            ]
        },
        {
            title: 'Studio',
            items: [
                { id: 'data-collection', label: 'Data Collection' },
                { id: 'training', label: 'Training Models' },
                { id: 'supported-models', label: 'Supported Models' },
                { id: 'exporting', label: 'Exporting' }
            ]
        },
        {
            title: 'API & Integration',
            items: [
                { id: 'api-reference', label: 'API Reference' },
                { id: 'authentication', label: 'Authentication' },
                { id: 'webhooks', label: 'Webhooks' }
            ]
        },
        {
            title: 'Support',
            items: [
                { id: 'troubleshooting', label: 'Troubleshooting' },
                { id: 'community', label: 'Community' }
            ]
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="doc-layout">
            {/* Mobile Menu Toggle */}
            <button
                className="doc-mobile-toggle"
                style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 60, padding: '0.5rem', background: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', display: 'none' }}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside className={`doc-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="doc-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <img src={headerLogo} alt="ModelMint" style={{ height: '28px' }} />
                    <span>Docs</span>
                </div>

                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Search documentation..."
                        style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.25rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb', fontSize: '0.875rem' }}
                    />
                </div>

                {sections.map((section, idx) => (
                    <div key={idx} className="doc-nav-group">
                        <div className="doc-nav-title">{section.title}</div>
                        {section.items.map((item) => (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                className={`doc-nav-link ${activeSection === item.id ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    scrollToSection(item.id);
                                }}
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>
                ))}
            </aside>

            {/* Table of Contents (Right Sidebar) */}
            <aside className="doc-toc">
                <div className="doc-toc-title">On this page</div>
                {sections.flatMap(s => s.items).map(item => (
                    <a
                        key={item.id}
                        className={`doc-toc-link ${activeSection === item.id ? 'active' : ''}`}
                        onClick={() => scrollToSection(item.id)}
                    >
                        {item.label}
                    </a>
                ))}
            </aside>

            {/* Main Content */}
            <main className="doc-main">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="doc-breadcrumb">
                        <span>Docs</span> <ChevronRight size={14} /> <span>Getting Started</span> <ChevronRight size={14} /> <span>Introduction</span>
                    </div>

                    <h1 className="doc-title">ModelMint Documentation</h1>
                    <p className="doc-subtitle">
                        Everything you need to build, train, and deploy machine learning models directly in your browser.
                    </p>

                    {/* Introduction */}
                    <motion.section id="introduction" className="doc-section" variants={itemVariants}>
                        <h2 className="doc-section-title"><Book size={28} color="#ef4444" /> Introduction</h2>
                        <p className="doc-p">
                            ModelMint is an open-source platform designed to democratize machine learning.
                            Unlike traditional tools that require complex Python environments and expensive cloud GPUs,
                            ModelMint runs entirely in your browser using WebGL acceleration.
                        </p>
                        <div className="doc-callout doc-callout-info">
                            <div style={{ display: 'flex', gap: '0.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                <Shield size={20} /> Privacy First
                            </div>
                            ModelMint uses TensorFlow.js under the hood. All training data remains on your local device unless you explicitly choose to share it.
                        </div>
                    </motion.section>

                    {/* Quickstart */}
                    <motion.section id="quickstart" className="doc-section" variants={itemVariants}>
                        <h2 className="doc-section-title"><Zap size={28} color="#f59e0b" /> Quickstart Guide</h2>
                        <p className="doc-p">
                            Follow these steps to build your first image classification model in under 5 minutes.
                        </p>
                        <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
                            {[
                                { title: '1. Create Project', desc: 'Click "New Project" in the dashboard and select "Image Classification".', icon: <Layers size={20} /> },
                                { title: '2. Collect Data', desc: 'Use your webcam to capture 20-30 images for each class (e.g., "Cat" vs "Dog").', icon: <CameraIcon /> },
                                { title: '3. Train', desc: 'Hit the "Train Model" button. You\'ll see the loss curve decrease in real-time.', icon: <Cpu size={20} /> },
                                { title: '4. Test', desc: 'Use the live preview to test your model immediately.', icon: <CheckCircle size={20} /> }
                            ].map((step, i) => (
                                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                                        {step.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{step.title}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>{step.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Core Concepts */}
                    <motion.section id="concepts" className="doc-section" variants={itemVariants}>
                        <h2 className="doc-section-title"><Database size={28} color="#10b981" /> Core Concepts</h2>
                        <p className="doc-p">
                            Understanding these three pillars will help you get the most out of ModelMint.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                            <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: 'white' }}>
                                <Layers size={24} color="#ef4444" style={{ marginBottom: '1rem' }} />
                                <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Transfer Learning</h3>
                                <p style={{ fontSize: '0.9rem', color: '#666' }}>We use pre-trained models (MobileNet, Inception) and retrain only the final layers for your specific task.</p>
                            </div>
                            <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: 'white' }}>
                                <Zap size={24} color="#f59e0b" style={{ marginBottom: '1rem' }} />
                                <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Client-Side Training</h3>
                                <p style={{ fontSize: '0.9rem', color: '#666' }}>Training happens on your device using WebGL. No latency, no server costs.</p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Supported Models */}
                    <motion.section id="supported-models" className="doc-section" variants={itemVariants}>
                        <h2 className="doc-section-title"><Cpu size={28} color="#6366f1" /> Supported Models</h2>
                        <p className="doc-p">
                            ModelMint supports a variety of base models optimized for different tasks.
                        </p>
                        <table className="doc-table">
                            <thead>
                                <tr>
                                    <th>Model</th>
                                    <th>Type</th>
                                    <th>Best For</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>MobileNet v2</strong></td>
                                    <td>Image</td>
                                    <td>General purpose image classification. Fast and lightweight.</td>
                                </tr>
                                <tr>
                                    <td><strong>Inception v3</strong></td>
                                    <td>Image</td>
                                    <td>High-accuracy image classification. Requires more resources.</td>
                                </tr>
                                <tr>
                                    <td><strong>MoveNet</strong></td>
                                    <td>Pose</td>
                                    <td>Real-time human pose estimation and movement tracking.</td>
                                </tr>
                                <tr>
                                    <td><strong>USE</strong></td>
                                    <td>Text</td>
                                    <td>Universal Sentence Encoder for text classification.</td>
                                </tr>
                            </tbody>
                        </table>
                    </motion.section>

                    {/* API Reference */}
                    <motion.section id="api-reference" className="doc-section" variants={itemVariants}>
                        <h2 className="doc-section-title"><Terminal size={28} color="#8b5cf6" /> API Reference</h2>
                        <p className="doc-p">
                            Once your model is trained, you can deploy it as an API endpoint.
                        </p>
                        <CodeBlock
                            code="POST https://api.modelmint.ai/v1/predict"
                            language="http"
                            onCopy={() => copyToClipboard("POST https://api.modelmint.ai/v1/predict", "api-url")}
                            copied={copiedCode === "api-url"}
                        />
                        <table className="doc-table">
                            <thead>
                                <tr>
                                    <th>Parameter</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><span className="doc-inline-code">model_id</span></td>
                                    <td>String</td>
                                    <td>The unique identifier for your deployed model.</td>
                                </tr>
                                <tr>
                                    <td><span className="doc-inline-code">image</span></td>
                                    <td>Base64</td>
                                    <td>The image data to classify.</td>
                                </tr>
                            </tbody>
                        </table>
                    </motion.section>

                    {/* Authentication */}
                    <motion.section id="authentication" className="doc-section" variants={itemVariants}>
                        <h2 className="doc-section-title"><Shield size={28} color="#10b981" /> Authentication</h2>
                        <p className="doc-p">
                            All API requests must be authenticated using a Bearer token. You can generate API keys in your dashboard settings.
                        </p>
                        <CodeBlock
                            code="Authorization: Bearer sk_live_51Mz..."
                            language="http"
                            onCopy={() => copyToClipboard("Authorization: Bearer sk_live_51Mz...", "auth-header")}
                            copied={copiedCode === "auth-header"}
                        />
                        <div className="doc-callout doc-callout-warning">
                            <div style={{ display: 'flex', gap: '0.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                <AlertTriangle size={20} /> Security Warning
                            </div>
                            Never expose your secret API keys in client-side code. Use a proxy server or our client-side SDK.
                        </div>
                    </motion.section>

                    {/* Troubleshooting */}
                    <motion.section id="troubleshooting" className="doc-section" variants={itemVariants}>
                        <h2 className="doc-section-title"><AlertTriangle size={28} color="#ef4444" /> Troubleshooting</h2>
                        <div className="doc-callout doc-callout-tip">
                            <strong>Common Issue:</strong> "WebGL not supported"
                            <br />
                            Ensure hardware acceleration is enabled in your browser settings. Chrome users can check <code>chrome://gpu</code>.
                        </div>
                        <p className="doc-p">
                            If you encounter issues with training speed, try reducing the batch size or closing other tabs to free up GPU memory.
                        </p>
                    </motion.section>

                </motion.div>
            </main>
        </div>
    );
};

const CodeBlock = ({ code, language, onCopy, copied }) => (
    <div className="doc-code-block">
        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <button
                onClick={onCopy}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', color: '#fff' }}
            >
                {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
        </div>
        <code>{code}</code>
    </div>
);

const CameraIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
    </svg>
);

export default DocumentationPage;
