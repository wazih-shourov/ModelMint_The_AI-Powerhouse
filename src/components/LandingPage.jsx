import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, useSpring, AnimatePresence } from 'framer-motion';
import {
    Brain, Upload, Play, Download, Layers, Camera, FileJson, ArrowRight,
    CheckCircle, Zap, Globe, Users, Code, BarChart, Shield, Smartphone,
    Cpu, Share2, MessageSquare, Terminal, ChevronDown, ChevronUp, Lock,
    Database, Server, Cloud, Activity, GitBranch, Command
} from 'lucide-react';
import headerLogo from '../assets/header_logo.png';
import '../styles/LandingPageRedesign.css';

const demoModels = [
    { title: "Face Detector v2", author: "alex_dev", desc: "Real-time face detection optimized for mobile browsers.", type: "Vision" },
    { title: "Yoga Pose Corrector", author: "yoga_ai", desc: "Detects warrior poses and suggests corrections.", type: "Pose" },
    { title: "Spam Filter", author: "security_guru", desc: "Classifies emails as spam or ham with 99% accuracy.", type: "Text" },
    { title: "Gesture Control", author: "ui_wizard", desc: "Control your website with hand gestures.", type: "Pose" },
    { title: "Plant Disease ID", author: "botany_lab", desc: "Identify 50+ plant diseases from leaf photos.", type: "Vision" },
];

const demoModels2 = [
    { title: "Voice Command", author: "audio_pro", desc: "Simple voice commands for web apps.", type: "Audio" },
    { title: "Sentiment Analysis", author: "data_nerd", desc: "Analyze customer reviews in real-time.", type: "Text" },
    { title: "Workout Tracker", author: "fit_tech", desc: "Count reps for squats and pushups.", type: "Pose" },
    { title: "Bird Classifier", author: "nature_lover", desc: "Recognize 200 bird species.", type: "Vision" },
    { title: "Music Genre ID", author: "dj_algo", desc: "Classify songs by genre from audio snippets.", type: "Audio" },
];

// Reusable Scroll Reveal Component
const ScrollReveal = ({ children, delay = 0, width = "100%" }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <motion.div
            ref={ref}
            variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
            }}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            transition={{ duration: 0.6, delay: delay, ease: "easeOut" }}
            style={{ width }}
        >
            {children}
        </motion.div>
    );
};

const LandingPage = () => {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();

    // Parallax effects
    const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="landing-page-wrapper">
            {/* 1. Navigation */}
            <nav className="lp-nav" style={{
                position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--lp-border)'
            }}>
                <div className="lp-container lp-nav-container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
                        <img src={headerLogo} alt="ModelMint" style={{ height: '32px' }} />
                    </div>
                    <div className="lp-nav-links">
                        <a href="#features" className="lp-nav-link">Features</a>
                        <a href="#enterprise" className="lp-nav-link">Enterprise</a>
                        <a href="#api" className="lp-nav-link">API</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/community'); }} className="lp-nav-link">Community</a>
                        <button onClick={() => navigate('/auth')} className="lp-btn lp-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                            Open Studio
                        </button>
                    </div>
                </div>
            </nav>

            {/* 2. Hero Section */}
            <section className="lp-hero">
                <div className="lp-container">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="lp-hero-badge">
                            <Zap size={16} /> <span style={{ marginRight: '0.5rem' }}>v2.0 Released:</span> Export to TensorFlow.js
                        </div>
                        <h1 className="lp-hero-title">
                            Build AI Models <br />
                            <span className="lp-hero-highlight">In Your Browser</span>
                        </h1>
                        <p className="lp-hero-desc">
                            The open-source platform to train, test, and deploy machine learning models without writing a single line of code.
                            Trusted by researchers, developers, and students worldwide.
                        </p>
                        <div className="lp-hero-btns">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/auth')}
                                className="lp-btn lp-btn-primary"
                            >
                                Start Building Free <ArrowRight size={18} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/docs')}
                                className="lp-btn lp-btn-secondary"
                            >
                                View Documentation
                            </motion.button>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--lp-text-secondary)', marginTop: '-2rem', marginBottom: '3rem' }}>
                            No credit card required. Open source.
                        </div>
                    </motion.div>

                    {/* 3. Dashboard Preview (Hero Visual) */}
                    <motion.div
                        style={{ opacity: heroOpacity, scale, y: heroY, marginTop: '2rem' }}
                        className="lp-hero-visual"
                    >
                        <div className="lp-hero-visual-wrapper">
                            {/* Detailed Mockup UI */}
                            <div style={{ display: 'flex', height: '100%', gap: '1rem' }}>
                                {/* Sidebar Mockup */}
                                <div style={{ width: '220px', background: '#262626', borderRadius: '0.5rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ height: '30px', width: '100%', background: '#404040', borderRadius: '4px', opacity: 0.5 }}></div>
                                    <div style={{ height: '1px', background: '#404040', margin: '0.5rem 0' }}></div>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} style={{ height: '20px', width: '80%', background: '#404040', borderRadius: '4px', opacity: 0.3 }}></div>
                                    ))}
                                    <div style={{ marginTop: 'auto', height: '40px', background: '#ef4444', borderRadius: '4px', opacity: 0.8 }}></div>
                                </div>
                                {/* Main Content Mockup */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {/* Header */}
                                    <div style={{ height: '50px', background: '#262626', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', padding: '0 1rem', justifyContent: 'space-between' }}>
                                        <div style={{ width: '100px', height: '10px', background: '#404040', borderRadius: '4px' }}></div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#404040' }}></div>
                                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#404040' }}></div>
                                        </div>
                                    </div>
                                    {/* Canvas Area */}
                                    <div style={{ flex: 1, background: '#262626', borderRadius: '0.5rem', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {/* Node Graph Visualization */}
                                        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#404040 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.2 }}></div>

                                        {/* Nodes */}
                                        <motion.div
                                            animate={{ y: [0, -10, 0] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                            style={{ position: 'absolute', left: '20%', top: '40%', width: '120px', height: '80px', background: '#333', border: '1px solid #555', borderRadius: '8px', padding: '10px' }}
                                        >
                                            <div style={{ width: '20px', height: '20px', background: '#ef4444', borderRadius: '4px', marginBottom: '10px' }}></div>
                                            <div style={{ width: '60%', height: '8px', background: '#666', borderRadius: '2px' }}></div>
                                        </motion.div>

                                        <motion.div
                                            animate={{ y: [0, 10, 0] }}
                                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                            style={{ position: 'absolute', left: '50%', top: '40%', width: '120px', height: '80px', background: '#333', border: '1px solid #555', borderRadius: '8px', padding: '10px', boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)', borderColor: '#ef4444' }}
                                        >
                                            <div style={{ width: '20px', height: '20px', background: '#f59e0b', borderRadius: '4px', marginBottom: '10px' }}></div>
                                            <div style={{ width: '60%', height: '8px', background: '#666', borderRadius: '2px' }}></div>
                                        </motion.div>

                                        <motion.div
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                                            style={{ position: 'absolute', left: '80%', top: '40%', width: '120px', height: '80px', background: '#333', border: '1px solid #555', borderRadius: '8px', padding: '10px' }}
                                        >
                                            <div style={{ width: '20px', height: '20px', background: '#10b981', borderRadius: '4px', marginBottom: '10px' }}></div>
                                            <div style={{ width: '60%', height: '8px', background: '#666', borderRadius: '2px' }}></div>
                                        </motion.div>

                                        {/* Connecting Lines */}
                                        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                                            <motion.path
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                d="M 280 250 L 480 250" stroke="#ef4444" strokeWidth="2" strokeDasharray="4"
                                            />
                                            <path d="M 600 250 L 780 250" stroke="#666" strokeWidth="2" strokeDasharray="4" />
                                        </svg>

                                        <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: '#ef4444', color: 'white', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Activity size={14} /> Training: 98%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 4. Social Proof / Logos */}
            <section style={{ padding: '4rem 0', borderBottom: '1px solid var(--lp-border)' }}>
                <ScrollReveal>
                    <div className="lp-container" style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--lp-text-secondary)', fontSize: '0.875rem', marginBottom: '2rem', fontWeight: 600, letterSpacing: '0.05em' }}>TRUSTED BY INNOVATIVE TEAMS AT</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', opacity: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Placeholder Logos */}
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Globe size={24} /> GlobalTech</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Cpu size={24} /> NeuralSystems</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Database size={24} /> DataFlow</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Cloud size={24} /> CloudScale</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={24} /> SecureAI</div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>

            {/* 5. Introduction / Problem */}
            <section style={{ padding: '8rem 0' }}>
                <div className="lp-container">
                    <ScrollReveal>
                        <div className="lp-section-header">
                            <span className="lp-section-tag">The Problem</span>
                            <h2 className="lp-section-title">Machine Learning is too hard.</h2>
                            <p className="lp-section-subtitle">
                                Setting up environments, managing dependencies, and writing complex Python code blocks creativity.
                                Traditional workflows are slow, expensive, and require deep technical expertise.
                            </p>
                        </div>
                    </ScrollReveal>

                    {/* Comparison Table */}
                    <ScrollReveal delay={0.2}>
                        <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '1rem', border: '1px solid var(--lp-border)', overflow: 'hidden' }}>
                            <table className="lp-comparison-table">
                                <thead>
                                    <tr style={{ background: '#f9fafb' }}>
                                        <th style={{ width: '40%' }}>Feature</th>
                                        <th style={{ width: '30%', color: '#ef4444' }}>ModelMint</th>
                                        <th style={{ width: '30%' }}>Traditional ML</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Setup Time</td>
                                        <td style={{ color: '#10b981', fontWeight: 'bold' }}>Instant (Browser)</td>
                                        <td>Hours (Python/Conda)</td>
                                    </tr>
                                    <tr>
                                        <td>Hardware Req.</td>
                                        <td style={{ color: '#10b981', fontWeight: 'bold' }}>Any GPU (WebGL)</td>
                                        <td>Expensive Cloud GPUs</td>
                                    </tr>
                                    <tr>
                                        <td>Privacy</td>
                                        <td style={{ color: '#10b981', fontWeight: 'bold' }}>100% Local</td>
                                        <td>Data sent to Cloud</td>
                                    </tr>
                                    <tr>
                                        <td>Cost</td>
                                        <td style={{ color: '#10b981', fontWeight: 'bold' }}>Free</td>
                                        <td>$$$ / hour</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* 6. Bento Grid (Core Features) */}
            <section id="features" style={{ paddingBottom: '8rem' }}>
                <div className="lp-container">
                    <ScrollReveal>
                        <div className="lp-section-header">
                            <span className="lp-section-tag">Features</span>
                            <h2 className="lp-section-title">Everything you need to build.</h2>
                            <p className="lp-section-subtitle">A complete suite of tools for the modern AI developer.</p>
                        </div>
                    </ScrollReveal>

                    <div className="lp-bento-grid">
                        {/* 7. Studio Feature */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="lp-bento-item lp-bento-large"
                        >
                            <div className="lp-bento-title">Visual Studio</div>
                            <div className="lp-bento-desc">Drag-and-drop interface to build complex model architectures. Visualize data flow and layer connections in real-time.</div>
                            <div className="lp-bento-visual" style={{ background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                                <Layers size={48} color="#ef4444" />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ padding: '0.25rem 0.5rem', background: 'white', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #e5e7eb' }}>Dense Layer</span>
                                    <span style={{ padding: '0.25rem 0.5rem', background: 'white', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #e5e7eb' }}>Conv2D</span>
                                    <span style={{ padding: '0.25rem 0.5rem', background: 'white', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #e5e7eb' }}>Dropout</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* 8. Multi-modal Feature */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="lp-bento-item lp-bento-wide"
                        >
                            <div className="lp-bento-title">Multi-Modal Support</div>
                            <div className="lp-bento-desc">Support for Image, Pose, Audio, and Text projects out of the box. Switch modalities instantly.</div>
                            <div className="lp-bento-visual" style={{ display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ padding: '1rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: '80px' }}>
                                    <Camera size={20} color="#ef4444" />
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Vision</span>
                                </div>
                                <div style={{ padding: '1rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: '80px' }}>
                                    <Activity size={20} color="#ef4444" />
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Pose</span>
                                </div>
                                <div style={{ padding: '1rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: '80px' }}>
                                    <MessageSquare size={20} color="#ef4444" />
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Text</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* 9. Privacy Feature */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="lp-bento-item"
                        >
                            <Shield size={32} color="#ef4444" style={{ marginBottom: '1rem' }} />
                            <div className="lp-bento-title">Privacy First</div>
                            <div className="lp-bento-desc">Training happens locally. Your data never leaves your device. GDPR compliant by design.</div>
                        </motion.div>

                        {/* 10. Export Feature */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="lp-bento-item"
                        >
                            <Download size={32} color="#ef4444" style={{ marginBottom: '1rem' }} />
                            <div className="lp-bento-title">Universal Export</div>
                            <div className="lp-bento-desc">Download as Keras .h5, TFLite, or TensorFlow.js JSON. Deploy anywhere.</div>
                        </motion.div>

                        {/* New Bento Item: Version Control */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="lp-bento-item"
                        >
                            <GitBranch size={32} color="#ef4444" style={{ marginBottom: '1rem' }} />
                            <div className="lp-bento-title">Version Control</div>
                            <div className="lp-bento-desc">Track model iterations. Rollback to previous versions with one click.</div>
                        </motion.div>

                        {/* New Bento Item: CLI */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="lp-bento-item"
                        >
                            <Command size={32} color="#ef4444" style={{ marginBottom: '1rem' }} />
                            <div className="lp-bento-title">CLI Tools</div>
                            <div className="lp-bento-desc">Automate your workflow with our powerful command-line interface.</div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 11. Data Collection Deep Dive */}
            <section style={{ padding: '6rem 0' }}>
                <div className="lp-container">
                    <div className="lp-feature-row wide">
                        <ScrollReveal width="100%">
                            <div className="lp-feature-content">
                                <span className="lp-section-tag">Data Collection</span>
                                <h3>Gather data in seconds.</h3>
                                <p>
                                    Use your webcam to capture thousands of samples instantly. Or upload existing datasets.
                                    Our tools make labeling and organizing data effortless.
                                </p>
                                <ul className="lp-feature-list">
                                    <li className="lp-feature-item"><CheckCircle size={20} color="#ef4444" /> Webcam Capture (30fps)</li>
                                    <li className="lp-feature-item"><CheckCircle size={20} color="#ef4444" /> Drag & Drop Upload (JPG, PNG)</li>
                                    <li className="lp-feature-item"><CheckCircle size={20} color="#ef4444" /> Auto-Labeling with CLIP</li>
                                    <li className="lp-feature-item"><CheckCircle size={20} color="#ef4444" /> CSV / JSON Import</li>
                                </ul>
                            </div>
                        </ScrollReveal>
                        <ScrollReveal width="100%" delay={0.2}>
                            <div className="lp-feature-visual">
                                <div className="lp-feature-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 'bold' }}>Dataset: Cats vs Dogs</div>
                                        <div style={{ fontSize: '0.875rem', color: '#666' }}>2,450 Samples</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                                            <div key={i} style={{ aspectRatio: '1', background: '#f3f4f6', borderRadius: '0.5rem', position: 'relative', overflow: 'hidden' }}>
                                                <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '4px', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', textAlign: 'center' }}>
                                                    {i % 2 === 0 ? 'Cat' : 'Dog'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '2rem', width: '100%', height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: '65%', height: '100%', background: '#ef4444' }}></div>
                                    </div>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#666', textAlign: 'right' }}>Uploading... 65%</div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* 12. Training Deep Dive */}
            <section style={{ padding: '6rem 0' }}>
                <div className="lp-container">
                    <div className="lp-feature-row wide">
                        <ScrollReveal width="100%">
                            <div className="lp-feature-content">
                                <span className="lp-section-tag">Browser Training</span>
                                <h3>Harness your GPU.</h3>
                                <p>
                                    ModelMint uses WebGL to tap into your device's GPU for accelerated training.
                                    Watch loss curves and accuracy metrics update in real-time.
                                </p>
                                <ul className="lp-feature-list">
                                    <li className="lp-feature-item"><CheckCircle size={20} color="#ef4444" /> Real-time Loss/Accuracy Curves</li>
                                    <li className="lp-feature-item"><CheckCircle size={20} color="#ef4444" /> Hardware Acceleration (WebGL 2.0)</li>
                                    <li className="lp-feature-item"><CheckCircle size={20} color="#ef4444" /> Adjustable Hyperparameters (Epochs, Batch Size)</li>
                                    <li className="lp-feature-item"><CheckCircle size={20} color="#ef4444" /> Transfer Learning Support</li>
                                </ul>
                            </div>
                        </ScrollReveal>
                        <ScrollReveal width="100%" delay={0.2}>
                            <div className="lp-feature-visual">
                                <div className="lp-feature-card dark">
                                    <div style={{ marginBottom: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Training Progress</span>
                                        <span style={{ color: '#ef4444' }}>Epoch 45/50</span>
                                    </div>
                                    <div style={{ height: '300px', borderLeft: '2px solid #333', borderBottom: '2px solid #333', position: 'relative', marginBottom: '1rem' }}>
                                        <svg style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                                            <motion.path
                                                initial={{ pathLength: 0 }}
                                                whileInView={{ pathLength: 1 }}
                                                transition={{ duration: 2 }}
                                                d="M 0 280 C 100 250, 200 100, 600 20" fill="none" stroke="#ef4444" strokeWidth="3"
                                            />
                                            <motion.path
                                                initial={{ pathLength: 0 }}
                                                whileInView={{ pathLength: 1 }}
                                                transition={{ duration: 2, delay: 0.5 }}
                                                d="M 0 100 C 100 120, 200 140, 600 270" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4"
                                            />
                                        </svg>
                                        <div style={{ position: 'absolute', top: '20px', right: '0', color: '#ef4444', fontSize: '0.75rem' }}>Accuracy: 98.5%</div>
                                        <div style={{ position: 'absolute', bottom: '20px', right: '0', color: '#3b82f6', fontSize: '0.75rem' }}>Loss: 0.02</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.875rem', color: '#a3a3a3' }}>
                                        <div>Time: 02:14</div>
                                        <div>Speed: 45ms/step</div>
                                        <div>GPU: 85%</div>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* 13. API Section */}
            <section id="api" style={{ padding: '6rem 0' }}>
                <div className="lp-container">
                    <ScrollReveal>
                        <div className="lp-section-header">
                            <span className="lp-section-tag" style={{ color: '#ef4444' }}>Developers</span>
                            <h2 className="lp-section-title">Instant API Deployment</h2>
                            <p className="lp-section-subtitle">
                                Get a REST API endpoint for your model with one click. Integrate into any application.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="lp-feature-row wide">
                        <ScrollReveal width="100%">
                            <div className="lp-feature-content">
                                <h3>Simple Integration</h3>
                                <p className="lp-section-subtitle" style={{ margin: '0 0 2rem 0', textAlign: 'center' }}>
                                    Use your API key to make predictions from any client. We handle the scaling and inference infrastructure.
                                </p>
                                <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', justifyContent: 'center' }}>
                                    <div className="lp-stat-card">
                                        <div className="lp-stat-value">99.9%</div>
                                        <div className="lp-stat-label">Uptime</div>
                                    </div>
                                    <div className="lp-stat-card">
                                        <div className="lp-stat-value">&lt;50ms</div>
                                        <div className="lp-stat-label">Latency</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <div style={{ padding: '0.5rem 1rem', background: '#f3f4f6', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: '600' }}>Python</div>
                                    <div style={{ padding: '0.5rem 1rem', background: '#f3f4f6', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: '600' }}>JavaScript</div>
                                    <div style={{ padding: '0.5rem 1rem', background: '#f3f4f6', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: '600' }}>cURL</div>
                                </div>
                            </div>
                        </ScrollReveal>
                        <ScrollReveal width="100%" delay={0.2}>
                            <div className="lp-code-block">
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></div>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                                </div>
                                <span className="lp-code-line"><span className="lp-code-keyword">const</span> response = <span className="lp-code-keyword">await</span> fetch(<span className="lp-code-string">'https://api.modelmint.ai/predict'</span>, {'{'}</span>
                                <span className="lp-code-line">  method: <span className="lp-code-string">'POST'</span>,</span>
                                <span className="lp-code-line">  headers: {'{'} <span className="lp-code-string">'Authorization'</span>: <span className="lp-code-string">'Bearer YOUR_KEY'</span> {'}'},</span>
                                <span className="lp-code-line">  body: JSON.stringify({'{'}<span className="lp-code-string">image</span>: base64Image{'}'})</span>
                                <span className="lp-code-line">{'}'});</span>
                                <span className="lp-code-line"></span>
                                <span className="lp-code-line"><span className="lp-code-keyword">const</span> result = <span className="lp-code-keyword">await</span> response.json();</span>
                                <span className="lp-code-line"><span className="lp-code-function">console</span>.log(result.prediction);</span>
                                <span className="lp-code-line"><span style={{ color: '#666' }}>// Output: {`{ label: "Cat", confidence: 0.98 }`}</span></span>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* 14. API Analytics */}
            <section style={{ padding: '6rem 0' }}>
                <div className="lp-container">
                    <div className="lp-feature-row wide">
                        <ScrollReveal width="100%">
                            <div className="lp-feature-content">
                                <span className="lp-section-tag">Analytics</span>
                                <h3>Monitor Usage & Costs.</h3>
                                <p>
                                    Track API calls, error rates, and billing in real-time with our comprehensive dashboard.
                                </p>
                                <ul className="lp-feature-list">
                                    <li className="lp-feature-item"><CheckCircle size={20} color="#ef4444" /> Request Volume Tracking</li>
                                    <li className="lp-feature-item"><CheckCircle size={20} color="#ef4444" /> Error Rate Monitoring</li>
                                    <li className="lp-feature-item"><CheckCircle size={20} color="#ef4444" /> Cost Estimation & Alerts</li>
                                </ul>
                            </div>
                        </ScrollReveal>
                        <ScrollReveal width="100%" delay={0.2}>
                            <div className="lp-feature-visual">
                                <div className="lp-feature-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ fontWeight: 'bold' }}>API Requests (Last 24h)</div>
                                        <div style={{ color: '#ef4444', fontWeight: 'bold' }}>+12.5%</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: '300px' }}>
                                        {[40, 60, 45, 80, 55, 70, 90, 65, 85, 95, 75, 60, 40, 60, 45, 80, 55, 70, 90, 65, 85, 95, 75, 60].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                whileInView={{ height: `${h}%` }}
                                                transition={{ duration: 0.5, delay: i * 0.02 }}
                                                style={{ flex: 1, background: '#ef4444', borderRadius: '4px 4px 0 0', opacity: 0.8 }}
                                            ></motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* 15. Page Builder */}
            <section style={{ padding: '6rem 0' }}>
                <div className="lp-container">
                    <ScrollReveal>
                        <div className="lp-section-header">
                            <span className="lp-section-tag">Showcase</span>
                            <h2 className="lp-section-title">Build Public Pages</h2>
                            <p className="lp-section-subtitle">
                                Create beautiful landing pages for your models to share with the world. Drag, drop, and publish.
                            </p>
                        </div>
                    </ScrollReveal>
                    <ScrollReveal delay={0.2}>
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', maxWidth: '800px', margin: '0 auto' }}>
                            <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
                            </div>
                            <div style={{ height: '300px', background: '#f3f4f6', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ width: '80%', height: '20px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                                <div style={{ width: '60%', height: '20px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                                <div style={{ width: '100px', height: '40px', background: '#ef4444', borderRadius: '20px', marginTop: '1rem', opacity: 0.5 }}></div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* 16. Enterprise Security (New Section) */}
            <section id="enterprise" style={{ padding: '6rem 0', background: '#f9fafb' }}>
                <div className="lp-container">
                    <ScrollReveal>
                        <div className="lp-section-header">
                            <span className="lp-section-tag">Enterprise</span>
                            <h2 className="lp-section-title">Security at Scale</h2>
                            <p className="lp-section-subtitle">
                                Enterprise-grade security features to keep your data and models safe.
                            </p>
                        </div>
                    </ScrollReveal>
                    <div className="lp-grid-3">
                        {[
                            { icon: <Lock size={32} color="#ef4444" />, title: "SSO Integration", desc: "Integrate with Okta, Auth0, and Google Workspace for seamless login." },
                            { icon: <Shield size={32} color="#ef4444" />, title: "Role-Based Access", desc: "Granular permissions for team members. Control who can train, view, or deploy." },
                            { icon: <Database size={32} color="#ef4444" />, title: "Data Encryption", desc: "All data is encrypted at rest and in transit. Your intellectual property is safe." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="lp-security-card"
                            >
                                <div style={{ marginBottom: '1rem' }}>{item.icon}</div>
                                <h3>{item.title}</h3>
                                <p style={{ color: '#666', fontSize: '0.875rem' }}>{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 17. Collaboration */}
            <section style={{ padding: '6rem 0' }}>
                <div className="lp-container" style={{ textAlign: 'center' }}>
                    <ScrollReveal>
                        <Users size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                        <h2 className="lp-section-title">Built for Teams</h2>
                        <p className="lp-section-subtitle" style={{ marginBottom: '3rem' }}>
                            Invite collaborators, manage permissions, and build together.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '-1rem' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.1 }}
                                    style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e5e7eb', border: '4px solid white', marginLeft: '-1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: '#666' }}
                                >
                                    U{i}
                                </motion.div>
                            ))}
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.6 }}
                                style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ef4444', border: '4px solid white', marginLeft: '-1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}
                            >
                                +
                            </motion.div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* 18. Community (Animated Marquee) */}
            <section id="community" style={{ padding: '6rem 0', overflow: 'hidden' }}>
                <div className="lp-container">
                    <ScrollReveal>
                        <div className="lp-section-header">
                            <span className="lp-section-tag" style={{ color: '#ef4444' }}>Community</span>
                            <h2 className="lp-section-title">Join the Revolution</h2>
                            <p className="lp-section-subtitle">
                                Discover thousands of open-source models created by the ModelMint community.
                            </p>
                            <div style={{ marginTop: '2rem' }}>
                                <a href="#" style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                    background: '#5865F2', color: 'white', padding: '0.75rem 1.5rem',
                                    borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold'
                                }}>
                                    <MessageSquare size={20} /> Join us on Discord
                                </a>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

                {/* Marquee Row 1 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="lp-marquee-wrapper"
                >
                    <div className="lp-marquee-track">
                        {[...demoModels, ...demoModels].map((model, i) => (
                            <div key={`r1-${i}`} className="lp-marquee-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>
                                        {model.author[0]}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>@{model.author}</div>
                                </div>
                                <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>{model.title}</h4>
                                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem', lineHeight: 1.5 }}>{model.desc}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Layers size={14} /> {model.type}
                                    </span>
                                    <button style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        Try Model <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Marquee Row 2 (Reverse) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="lp-marquee-wrapper"
                    style={{ marginTop: '-1rem' }}
                >
                    <div className="lp-marquee-track reverse">
                        {[...demoModels2, ...demoModels2].map((model, i) => (
                            <div key={`r2-${i}`} className="lp-marquee-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>
                                        {model.author[0]}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>@{model.author}</div>
                                </div>
                                <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>{model.title}</h4>
                                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem', lineHeight: 1.5 }}>{model.desc}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Layers size={14} /> {model.type}
                                    </span>
                                    <button style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        Try Model <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* 19. Use Cases */}
            <section style={{ padding: '6rem 0' }}>
                <div className="lp-container">
                    <ScrollReveal>
                        <div className="lp-section-header">
                            <h2 className="lp-section-title">What can you build?</h2>
                        </div>
                    </ScrollReveal>
                    <div className="lp-grid-3">
                        {[
                            { icon: <Smartphone size={32} color="#ef4444" />, title: "Mobile Apps", desc: "Export TFLite models for iOS and Android." },
                            { icon: <Cpu size={32} color="#ef4444" />, title: "IoT Devices", desc: "Run efficient models on Raspberry Pi and edge devices." },
                            { icon: <Globe size={32} color="#ef4444" />, title: "Web Apps", desc: "Integrate directly into React/Vue/Angular apps with TF.js." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="lp-bento-item"
                            >
                                {item.icon}
                                <h3>{item.title}</h3>
                                <p className="lp-bento-desc">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 20. FAQ (New Section) */}
            <section style={{ padding: '6rem 0', background: '#f9fafb' }}>
                <div className="lp-container">
                    <ScrollReveal>
                        <div className="lp-section-header">
                            <h2 className="lp-section-title">Frequently Asked Questions</h2>
                        </div>
                    </ScrollReveal>
                    <ScrollReveal delay={0.2}>
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <FAQItem question="Is ModelMint free to use?" answer="Yes! ModelMint is open-source and free for personal use. We also offer enterprise plans for teams." />
                            <FAQItem question="Do I need a GPU?" answer="While a GPU accelerates training, ModelMint works on CPU as well. We use WebGL to optimize performance on all devices." />
                            <FAQItem question="Can I export my models?" answer="Absolutely. You can export your trained models in Keras (.h5), TensorFlow.js, or TFLite formats." />
                            <FAQItem question="Is my data private?" answer="Yes. All training happens client-side in your browser. Your data never leaves your device unless you explicitly choose to upload it." />
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* 21. Testimonials */}
            <section style={{ padding: '6rem 0' }}>
                <div className="lp-container">
                    <ScrollReveal>
                        <div className="lp-section-header">
                            <h2 className="lp-section-title">Loved by Developers</h2>
                        </div>
                    </ScrollReveal>
                    <div className="lp-grid-2">
                        <ScrollReveal width="100%">
                            <div className="lp-testimonial-card">
                                <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>"ModelMint saved me weeks of work. I built a gesture recognition model for my game in a single afternoon."</p>
                                <div style={{ fontWeight: 'bold' }}>Sarah J.</div>
                                <div style={{ fontSize: '0.875rem', color: '#666' }}>Indie Game Developer</div>
                            </div>
                        </ScrollReveal>
                        <ScrollReveal width="100%" delay={0.2}>
                            <div className="lp-testimonial-card">
                                <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>"The API integration is flawless. We use it for real-time content moderation on our platform."</p>
                                <div style={{ fontWeight: 'bold' }}>Mike T.</div>
                                <div style={{ fontSize: '0.875rem', color: '#666' }}>CTO, SocialStream</div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* 22. Final CTA */}
            <section style={{ padding: '8rem 0', textAlign: 'center' }}>
                <div className="lp-container">
                    <ScrollReveal>
                        <h2 className="lp-section-title" style={{ fontSize: '3.5rem' }}>Start building today.</h2>
                        <p className="lp-section-subtitle" style={{ marginBottom: '3rem' }}>
                            No credit card required. Free for personal use.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/auth')}
                            className="lp-btn lp-btn-primary"
                            style={{ padding: '1rem 2.5rem', fontSize: '1.25rem' }}
                        >
                            Launch Studio
                        </motion.button>
                    </ScrollReveal>
                </div>
            </section>

            {/* Footer */}
            <footer className="lp-footer">
                <div className="lp-container">
                    <div className="lp-footer-grid">
                        <div className="lp-footer-col">
                            <img src={headerLogo} alt="ModelMint" style={{ height: '32px', marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--lp-text-secondary)', lineHeight: 1.6 }}>
                                Empowering the next generation of AI creators. <br />
                                Built with ❤️ by Airbox Tech.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Share2 size={20} color="#666" />
                                <Globe size={20} color="#666" />
                                <MessageSquare size={20} color="#666" />
                            </div>
                        </div>
                        <div className="lp-footer-col">
                            <h4>Product</h4>
                            <a href="#" className="lp-footer-link">Studio</a>
                            <a href="#" className="lp-footer-link">API</a>
                            <a href="#" className="lp-footer-link">Pricing</a>
                            <a href="#" className="lp-footer-link">Showcase</a>
                            <a href="#" className="lp-footer-link">Enterprise</a>
                        </div>
                        <div className="lp-footer-col">
                            <h4>Resources</h4>
                            <a href="#" className="lp-footer-link">Documentation</a>
                            <a href="#" className="lp-footer-link">Tutorials</a>
                            <a href="#" className="lp-footer-link">Blog</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/community'); }} className="lp-footer-link">Community</a>
                            <a href="#" className="lp-footer-link">Help Center</a>
                        </div>
                        <div className="lp-footer-col">
                            <h4>Legal</h4>
                            <a href="#" className="lp-footer-link">Privacy Policy</a>
                            <a href="#" className="lp-footer-link">Terms of Service</a>
                            <a href="#" className="lp-footer-link">Security</a>
                            <a href="#" className="lp-footer-link">Cookie Policy</a>
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--lp-border)', marginTop: '4rem', paddingTop: '2rem', textAlign: 'center', color: 'var(--lp-text-secondary)' }}>
                        &copy; 2025 ModelMint. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="lp-accordion">
            <div className="lp-accordion-header" onClick={() => setIsOpen(!isOpen)}>
                {question}
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="lp-accordion-content"
                    >
                        {answer}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingPage;
