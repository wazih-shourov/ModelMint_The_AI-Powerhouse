import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../contexts/SoundContext';
import glitchAudio from '../assets/sounds/glitch.mp3';
import terminalAudio from '../assets/sounds/termianl.mp3';
import './SystemBootIntro.css';

const SystemBootIntro = ({ onComplete }) => {
    const { settings } = useSound();
    const [lines, setLines] = useState([]);
    const [progress, setProgress] = useState(0);
    const [accessGranted, setAccessGranted] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const playSound = (type) => {
        if (!settings.masterEnabled || !settings.bootSoundEnabled) return;

        try {
            if (type === 'typing') {
                const audio = new Audio(terminalAudio);
                audio.volume = Math.min(settings.volume * 0.8, 1); // Slightly quieter
                audio.currentTime = 0;
                audio.play().catch(e => console.error("Audio play failed", e));
            } else if (type === 'glitch') {
                const audio = new Audio(glitchAudio);
                audio.volume = settings.volume;
                audio.currentTime = 0;
                audio.play().catch(e => console.error("Audio play failed", e));
            }
        } catch (error) {
            console.error("Audio error:", error);
        }
    };

    useEffect(() => {
        const bootSequence = async () => {
            const addLine = (text, delay = 100) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        setLines(prev => [...prev, text]);
                        playSound('typing');
                        resolve();
                    }, delay);
                });
            };

            // Initial Delay
            await new Promise(r => setTimeout(r, 500));

            // Boot Sequence
            await addLine('INITIALIZING SYSTEM KERNEL...');
            await addLine('LOADING CORE MODULES...');

            // Progress Bar Simulation
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + Math.random() * 15;
                });
            }, 150);

            await new Promise(r => setTimeout(r, 1500));

            await addLine('ESTABLISHING SECURE CONNECTION...');
            await addLine('VERIFYING USER CREDENTIALS...');
            await addLine('LOADING USER INTERFACE...');
            await addLine('SYSTEM ONLINE.');

            await new Promise(r => setTimeout(r, 500));
            setAccessGranted(true);
            playSound('glitch');

            // Hide the terminal container when access is granted
            const container = document.querySelector('.boot-container');
            if (container) container.style.opacity = '0';

            // Wait for viewing time
            await new Promise(r => setTimeout(r, 2500));

            // Trigger exit glitch
            setIsExiting(true);
            playSound('glitch');

            // Wait for exit animation to finish
            await new Promise(r => setTimeout(r, 600));

            onComplete();
        };

        bootSequence();
    }, []);

    return (
        <motion.div
            className="boot-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="boot-container">
                <div className="boot-header">
                    <div className="boot-logo">MODELMINT_OS v2.0</div>
                    <div className="boot-time">{new Date().toISOString()}</div>
                </div>

                <div className="boot-terminal">
                    {lines.map((line, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="terminal-line"
                        >
                            <span className="prompt">{'>'}</span> {line}
                        </motion.div>
                    ))}
                    <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="cursor"
                    >_</motion.div>
                </div>

                <div className="boot-status">
                    <div className="status-label">SYSTEM INTEGRITY CHECK</div>
                    <div className="progress-bar-container">
                        <motion.div
                            className="progress-bar-fill"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                    <div className="status-details">
                        <span>CPU: OK</span>
                        <span>MEM: OK</span>
                        <span>NET: OK</span>
                    </div>
                </div>
            </div>

            {/* Decorative Grid Background */}
            <div className="boot-grid"></div>

            <AnimatePresence>
                {accessGranted && (
                    <div className={`access-granted ${isExiting ? 'exiting' : ''}`}>
                        WELCOME TO MODELMINT
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SystemBootIntro;
