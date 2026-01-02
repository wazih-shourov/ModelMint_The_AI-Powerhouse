import React, { createContext, useContext, useState, useEffect } from 'react';

const SoundContext = createContext();

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};

export const SoundProvider = ({ children }) => {
    // Initialize state from localStorage or defaults
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('soundSettings');
        return saved ? JSON.parse(saved) : {
            masterEnabled: true,
            clickSoundEnabled: true,
            typingSoundEnabled: true,
            bootSoundEnabled: true,
            volume: 0.5
        };
    });

    // Save to localStorage whenever settings change
    useEffect(() => {
        localStorage.setItem('soundSettings', JSON.stringify(settings));
    }, [settings]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const playSound = (audioAsset, options = {}) => {
        if (!settings.masterEnabled) return;

        // Check specific sound types if provided
        if (options.type === 'click' && !settings.clickSoundEnabled) return;
        if (options.type === 'boot' && !settings.bootSoundEnabled) return;

        try {
            const sound = new Audio(audioAsset);
            sound.volume = settings.volume;
            sound.play().catch(e => console.debug('Sound play failed', e));
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    };

    const value = {
        settings,
        updateSetting,
        playSound
    };

    return (
        <SoundContext.Provider value={value}>
            {children}
        </SoundContext.Provider>
    );
};
