import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Moon, Sun, LogOut, User, Bell, Lock, Trash2,
    Code, Webhook, Download, Upload, Settings as SettingsIcon,
    Terminal, Database, Zap, Shield, Globe, Clock, BarChart3,
    Key, Copy, Check, RefreshCw, FileCode, Package, Volume2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSound } from '../contexts/SoundContext';
import { supabase } from '../lib/supabaseClient';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

import './Settings.css';

const PYTHON_SERVER_URL = import.meta.env.VITE_PYTHON_SERVER_URL || 'http://localhost:5000';

const Settings = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { settings: soundSettings, updateSetting: updateSoundSetting } = useSound();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('general'); // general, developer, advanced
    const [copied, setCopied] = useState(null);
    const [webhookUrl, setWebhookUrl] = useState('');
    const [apiEndpoint, setApiEndpoint] = useState(PYTHON_SERVER_URL);
    const [autoSave, setAutoSave] = useState(true);
    const [debugMode, setDebugMode] = useState(false);

    useEffect(() => {
        checkUser();
        loadSettings();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
        } else {
            setUser(user);
            const { data: profileData } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', user.id)
                .single();
            if (profileData) setProfile(profileData);
        }
    };

    const loadSettings = () => {
        const savedWebhook = localStorage.getItem('webhookUrl');
        const savedAutoSave = localStorage.getItem('autoSave');
        const savedDebugMode = localStorage.getItem('debugMode');

        if (savedWebhook) setWebhookUrl(savedWebhook);
        if (savedAutoSave) setAutoSave(savedAutoSave === 'true');
        if (savedDebugMode) setDebugMode(savedDebugMode === 'true');
    };

    const saveSettings = () => {
        localStorage.setItem('webhookUrl', webhookUrl);
        localStorage.setItem('autoSave', autoSave.toString());
        localStorage.setItem('debugMode', debugMode.toString());
        alert('Settings saved successfully!');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const exportData = async () => {
        try {
            const { data: projects } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id);

            const exportData = {
                user: user.email,
                exportDate: new Date().toISOString(),
                projects: projects,
                settings: {
                    theme,
                    webhookUrl,
                    autoSave,
                    debugMode
                }
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `modelmint-export-${new Date().toISOString()}.json`;
            a.click();
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data');
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="main-content-wrapper" style={{
                marginLeft: sidebarOpen ? '260px' : '70px',
                transition: 'margin-left 0.3s ease'
            }}>
                <TopBar user={user} profile={profile} />

                <main className="settings-main">
                    <div className="settings-header">
                        <div>
                            <h1><SettingsIcon size={28} style={{ display: 'inline-block', marginRight: '0.5rem', color: 'var(--accent-red)', verticalAlign: 'middle' }} /> Settings</h1>
                            <p>Manage your account and application preferences</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="settings-tabs">
                        <button
                            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            <User size={18} />
                            <span>General</span>
                        </button>
                        <button
                            className={`settings-tab ${activeTab === 'developer' ? 'active' : ''}`}
                            onClick={() => setActiveTab('developer')}
                        >
                            <Code size={18} />
                            <span>Developer</span>
                        </button>
                        <button
                            className={`settings-tab ${activeTab === 'advanced' ? 'active' : ''}`}
                            onClick={() => setActiveTab('advanced')}
                        >
                            <Terminal size={18} />
                            <span>Advanced</span>
                        </button>
                    </div>

                    <div className="settings-content">
                        {/* General Tab */}
                        {activeTab === 'general' && (
                            <>
                                {/* Appearance */}
                                <div className="settings-section">
                                    <h2><Sun size={20} /> Appearance</h2>
                                    <div className="settings-card">
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                                                </div>
                                                <div>
                                                    <h3>Theme</h3>
                                                    <p>Choose your preferred color scheme</p>
                                                </div>
                                            </div>
                                            <button className="theme-switch" onClick={toggleTheme}>
                                                <div className={`switch ${theme === 'dark' ? 'active' : ''}`}>
                                                    <div className="switch-handle"></div>
                                                </div>
                                                <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Sound Settings */}
                                <div className="settings-section">
                                    <h2><Volume2 size={20} /> Sound Settings</h2>
                                    <div className="settings-card">
                                        {/* Master Toggle */}
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    <Volume2 size={20} />
                                                </div>
                                                <div>
                                                    <h3>System Sound</h3>
                                                    <p>Enable or disable all application sounds</p>
                                                </div>
                                            </div>
                                            <button className="theme-switch" onClick={() => updateSoundSetting('masterEnabled', !soundSettings.masterEnabled)}>
                                                <div className={`switch ${soundSettings.masterEnabled ? 'active' : ''}`}>
                                                    <div className="switch-handle"></div>
                                                </div>
                                                <span>{soundSettings.masterEnabled ? 'On' : 'Off'}</span>
                                            </button>
                                        </div>

                                        {/* Volume Slider */}
                                        {soundSettings.masterEnabled && (
                                            <div className="setting-item-vertical" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                                                <div className="setting-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <div>
                                                        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>Master Volume</h3>
                                                        <p style={{ fontSize: '0.8rem' }}>Adjust the global volume level</p>
                                                    </div>
                                                    <span className="volume-value" style={{ fontFamily: 'Roboto Mono', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                                        {Math.round(soundSettings.volume * 100)}%
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.1"
                                                    value={soundSettings.volume}
                                                    onChange={(e) => updateSoundSetting('volume', parseFloat(e.target.value))}
                                                    className="volume-slider"
                                                    style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                                                />
                                            </div>
                                        )}

                                        {/* Click Sound Toggle */}
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div style={{ marginLeft: '3rem' }}>
                                                    <h3>Click Sound</h3>
                                                    <p>Play sound on interactions</p>
                                                </div>
                                            </div>
                                            <button
                                                className="theme-switch"
                                                onClick={() => updateSoundSetting('clickSoundEnabled', !soundSettings.clickSoundEnabled)}
                                                disabled={!soundSettings.masterEnabled}
                                                style={{ opacity: !soundSettings.masterEnabled ? 0.5 : 1 }}
                                            >
                                                <div className={`switch ${soundSettings.clickSoundEnabled ? 'active' : ''}`}>
                                                    <div className="switch-handle"></div>
                                                </div>
                                                <span>{soundSettings.clickSoundEnabled ? 'On' : 'Off'}</span>
                                            </button>
                                        </div>

                                        {/* Typing Sound Toggle */}
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div style={{ marginLeft: '3rem' }}>
                                                    <h3>Typing Sound</h3>
                                                    <p>Play sound while typing</p>
                                                </div>
                                            </div>
                                            <button
                                                className="theme-switch"
                                                onClick={() => updateSoundSetting('typingSoundEnabled', !soundSettings.typingSoundEnabled)}
                                                disabled={!soundSettings.masterEnabled}
                                                style={{ opacity: !soundSettings.masterEnabled ? 0.5 : 1 }}
                                            >
                                                <div className={`switch ${soundSettings.typingSoundEnabled ? 'active' : ''}`}>
                                                    <div className="switch-handle"></div>
                                                </div>
                                                <span>{soundSettings.typingSoundEnabled ? 'On' : 'Off'}</span>
                                            </button>
                                        </div>

                                        {/* Boot Sound Toggle */}
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div style={{ marginLeft: '3rem' }}>
                                                    <h3>Boot Sound</h3>
                                                    <p>Play sound on system startup</p>
                                                </div>
                                            </div>
                                            <button
                                                className="theme-switch"
                                                onClick={() => updateSoundSetting('bootSoundEnabled', !soundSettings.bootSoundEnabled)}
                                                disabled={!soundSettings.masterEnabled}
                                                style={{ opacity: !soundSettings.masterEnabled ? 0.5 : 1 }}
                                            >
                                                <div className={`switch ${soundSettings.bootSoundEnabled ? 'active' : ''}`}>
                                                    <div className="switch-handle"></div>
                                                </div>
                                                <span>{soundSettings.bootSoundEnabled ? 'On' : 'Off'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Account */}
                                <div className="settings-section">
                                    <h2><User size={20} /> Account</h2>
                                    <div className="settings-card">
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <h3>Email</h3>
                                                    <p>{user?.email}</p>
                                                </div>
                                            </div>
                                            <button className="btn-copy-small" onClick={() => copyToClipboard(user?.email, 'email')}>
                                                {copied === 'email' ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    <Bell size={20} />
                                                </div>
                                                <div>
                                                    <h3>Notifications</h3>
                                                    <p>Email notifications for important events</p>
                                                </div>
                                            </div>
                                            <button className="btn-secondary-small">Configure</button>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    <Lock size={20} />
                                                </div>
                                                <div>
                                                    <h3>Password</h3>
                                                    <p>Change your account password</p>
                                                </div>
                                            </div>
                                            <button className="btn-secondary-small">Change</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="settings-section">
                                    <h2><Shield size={20} /> Danger Zone</h2>
                                    <div className="settings-card danger">
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon danger-icon">
                                                    <LogOut size={20} />
                                                </div>
                                                <div>
                                                    <h3>Logout</h3>
                                                    <p>Sign out from your account</p>
                                                </div>
                                            </div>
                                            <button className="btn-danger" onClick={handleLogout}>
                                                Logout
                                            </button>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon danger-icon">
                                                    <Trash2 size={20} />
                                                </div>
                                                <div>
                                                    <h3>Delete Account</h3>
                                                    <p>Permanently delete your account and all data</p>
                                                </div>
                                            </div>
                                            <button className="btn-danger-outline">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Developer Tab */}
                        {activeTab === 'developer' && (
                            <>
                                {/* API Configuration */}
                                <div className="settings-section">
                                    <h2><Key size={20} /> API Configuration</h2>
                                    <div className="settings-card">
                                        <div className="setting-item-vertical">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    <Globe size={20} />
                                                </div>
                                                <div>
                                                    <h3>API Endpoint</h3>
                                                    <p>Base URL for API requests</p>
                                                </div>
                                            </div>
                                            <div className="input-with-copy">
                                                <input
                                                    type="text"
                                                    value={apiEndpoint}
                                                    onChange={(e) => setApiEndpoint(e.target.value)}
                                                    className="settings-input"
                                                />
                                                <button className="btn-copy-input" onClick={() => copyToClipboard(apiEndpoint, 'endpoint')}>
                                                    {copied === 'endpoint' ? <Check size={16} /> : <Copy size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    <FileCode size={20} />
                                                </div>
                                                <div>
                                                    <h3>API Documentation</h3>
                                                    <p>View complete API reference</p>
                                                </div>
                                            </div>
                                            <button className="btn-secondary-small">View Docs</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Webhooks */}
                                <div className="settings-section">
                                    <h2><Webhook size={20} /> Webhooks</h2>
                                    <div className="settings-card">
                                        <div className="setting-item-vertical">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    <Zap size={20} />
                                                </div>
                                                <div>
                                                    <h3>Webhook URL</h3>
                                                    <p>Receive real-time notifications for events</p>
                                                </div>
                                            </div>
                                            <input
                                                type="url"
                                                placeholder="https://your-domain.com/webhook"
                                                value={webhookUrl}
                                                onChange={(e) => setWebhookUrl(e.target.value)}
                                                className="settings-input"
                                            />
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    <Terminal size={20} />
                                                </div>
                                                <div>
                                                    <h3>Test Webhook</h3>
                                                    <p>Send a test event to your webhook</p>
                                                </div>
                                            </div>
                                            <button className="btn-secondary-small">Send Test</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Data Export/Import */}
                                <div className="settings-section">
                                    <h2><Database size={20} /> Data Management</h2>
                                    <div className="settings-card">
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    <Download size={20} />
                                                </div>
                                                <div>
                                                    <h3>Export Data</h3>
                                                    <p>Download all your projects and settings</p>
                                                </div>
                                            </div>
                                            <button className="btn-secondary-small" onClick={exportData}>
                                                <Download size={16} />
                                                Export JSON
                                            </button>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    <Upload size={20} />
                                                </div>
                                                <div>
                                                    <h3>Import Data</h3>
                                                    <p>Restore projects from backup</p>
                                                </div>
                                            </div>
                                            <button className="btn-secondary-small">
                                                <Upload size={16} />
                                                Import
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Usage Statistics */}
                                <div className="settings-section">
                                    <h2><BarChart3 size={20} /> Usage Statistics</h2>
                                    <div className="settings-card">
                                        <div className="stats-grid">
                                            <div className="stat-box">
                                                <Package size={24} />
                                                <div className="stat-value">0</div>
                                                <div className="stat-label">Total Projects</div>
                                            </div>
                                            <div className="stat-box">
                                                <Key size={24} />
                                                <div className="stat-value">0</div>
                                                <div className="stat-label">API Keys</div>
                                            </div>
                                            <div className="stat-box">
                                                <Zap size={24} />
                                                <div className="stat-value">0</div>
                                                <div className="stat-label">API Calls</div>
                                            </div>
                                            <div className="stat-box">
                                                <Database size={24} />
                                                <div className="stat-value">0 MB</div>
                                                <div className="stat-label">Storage Used</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Advanced Tab */}
                        {activeTab === 'advanced' && (
                            <>
                                {/* Developer Tools */}
                                <div className="settings-section">
                                    <h2><Terminal size={20} /> Developer Tools</h2>
                                    <div className="settings-card">
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    <Code size={20} />
                                                </div>
                                                <div>
                                                    <h3>Debug Mode</h3>
                                                    <p>Enable detailed console logging</p>
                                                </div>
                                            </div>
                                            <button className="theme-switch" onClick={() => setDebugMode(!debugMode)}>
                                                <div className={`switch ${debugMode ? 'active' : ''}`}>
                                                    <div className="switch-handle"></div>
                                                </div>
                                                <span>{debugMode ? 'On' : 'Off'}</span>
                                            </button>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    <Clock size={20} />
                                                </div>
                                                <div>
                                                    <h3>Auto-Save</h3>
                                                    <p>Automatically save changes</p>
                                                </div>
                                            </div>
                                            <button className="theme-switch" onClick={() => setAutoSave(!autoSave)}>
                                                <div className={`switch ${autoSave ? 'active' : ''}`}>
                                                    <div className="switch-handle"></div>
                                                </div>
                                                <span>{autoSave ? 'On' : 'Off'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Cache & Performance */}
                                <div className="settings-section">
                                    <h2><RefreshCw size={20} /> Cache & Performance</h2>
                                    <div className="settings-card">
                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    <Database size={20} />
                                                </div>
                                                <div>
                                                    <h3>Clear Cache</h3>
                                                    <p>Remove cached data and temporary files</p>
                                                </div>
                                            </div>
                                            <button className="btn-secondary-small">Clear Cache</button>
                                        </div>

                                        <div className="setting-item">
                                            <div className="setting-info">
                                                <div className="setting-icon">
                                                    <RefreshCw size={20} />
                                                </div>
                                                <div>
                                                    <h3>Reset Settings</h3>
                                                    <p>Restore all settings to default</p>
                                                </div>
                                            </div>
                                            <button className="btn-danger-outline">Reset</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="settings-actions">
                                    <button className="btn-primary-large" onClick={saveSettings}>
                                        <Check size={18} />
                                        Save All Settings
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;
