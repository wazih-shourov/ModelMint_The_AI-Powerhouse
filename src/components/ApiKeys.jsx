import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ApiAnalytics from './ApiAnalytics';
import './ApiKeys.css';
import { Key, Shield, Terminal, Activity, Copy, Trash2, AlertTriangle, Plus, Check, MoreVertical, X } from 'lucide-react';

const PYTHON_SERVER_URL = import.meta.env.VITE_PYTHON_SERVER_URL || 'http://localhost:5000';

import Sidebar from './Sidebar';
import TopBar from './TopBar';
import NotificationPanel from './NotificationPanel';

export default function ApiKeys() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [newApiKey, setNewApiKey] = useState(null);
    const [keyName, setKeyName] = useState('');
    const [expiryDays, setExpiryDays] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(null); // null or apiKey object
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open

    useEffect(() => {
        checkUser();
        fetchProjects();
        fetchApiKeys();
    }, []);

    const openGenerateModal = () => {
        setShowGenerateModal(true);
        setNewApiKey(null);
        setKeyName('');
        setSelectedProject(null);
        setExpiryDays(null);
    };

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
        } else {
            setUser(user);
        }
    };

    const fetchProjects = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const getProjectName = (projectId) => {
        const project = projects.find(p => p.id === projectId);
        return project ? project.name : 'Unknown Project';
    };

    const fetchApiKeys = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Use userId (not user_id) as per Python server logs
            const response = await fetch(`${PYTHON_SERVER_URL}/api/keys/list?userId=${user.id}`);
            const result = await response.json();

            if (result.success) {
                // Map the keys to include project names
                const keysWithProjects = result.keys.map(key => ({
                    ...key,
                    projectName: getProjectName(key.project_id)
                }));
                setApiKeys(keysWithProjects);
            }
        } catch (error) {
            console.error('Error fetching API keys:', error);
        } finally {
            setLoading(false);
        }
    };

    const closeGenerateModal = () => {
        setShowGenerateModal(false);
        setNewApiKey(null);
        setKeyName('');
        setSelectedProject(null);
        setExpiryDays(null);
    };

    const generateApiKey = async () => {
        if (!selectedProject) {
            alert('Please select a project');
            return;
        }

        setGenerating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // selectedProject is the project object, get its ID
            const projectId = selectedProject.id || selectedProject;

            console.log('Generating API key with params:', {
                userId: user.id,
                projectId: projectId,
                name: keyName || 'Unnamed Key',
                expiresInDays: expiryDays
            });

            const response = await fetch(`${PYTHON_SERVER_URL}/api/keys/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    projectId: projectId,
                    name: keyName || 'Unnamed Key',
                    expiresInDays: expiryDays
                })
            });

            const result = await response.json();
            console.log('API key generation response:', result);

            if (response.ok && result.success) {
                setNewApiKey(result.apiKey);
                fetchApiKeys();
            } else {
                alert('Failed to generate API key: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error generating API key:', error);
            alert('Failed to generate API key: ' + error.message);
        } finally {
            setGenerating(false);
        }
    };

    const revokeApiKey = async (keyId) => {
        if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;

        try {
            const response = await fetch(`${PYTHON_SERVER_URL}/api/keys/revoke`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key_id: keyId })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert('API key revoked successfully');
                fetchApiKeys();
            } else {
                alert('Failed to revoke API key: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error revoking API key:', error);
            alert('Failed to revoke API key: ' + error.message);
        }
    };

    const deleteApiKey = async (keyId) => {
        if (!window.confirm('Are you sure you want to delete this API key? This will permanently remove it.')) return;

        try {
            const response = await fetch(`${PYTHON_SERVER_URL}/api/keys/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key_id: keyId })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert('API key deleted successfully');
                fetchApiKeys();
            } else {
                alert('Failed to delete API key: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting API key:', error);
            alert('Failed to delete API key: ' + error.message);
        }
    };

    const copyToClipboard = (text, keyId) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(keyId);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString === 'Never') return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleRevokeKey = async (keyId) => {
        await revokeApiKey(keyId);
    };

    const handleGenerateKey = async () => {
        await generateApiKey();
    };

    return (
        <div className="dashboard-layout">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="main-content-wrapper" style={{
                marginLeft: sidebarOpen ? '260px' : '70px',
                transition: 'margin-left 0.3s ease'
            }}>
                <TopBar user={user} profile={null} />

                <main className="dashboard-main api-keys-page">
                    <div className="api-keys-container">
                        <div className="api-keys-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div className="header-title">
                                <h1 className="tech-title">API ACCESS CONTROL</h1>
                                <div className="system-status-badge">
                                    <div className="status-dot"></div>
                                    <span>SYSTEM ONLINE</span>
                                </div>
                            </div>
                            <button className="btn-primary tech-btn" onClick={openGenerateModal}>
                                <Plus size={18} />
                                GENERATE NEW KEY
                            </button>
                        </div>

                        {/* Rate Limits Info */}
                        <div className="rate-limits-card tech-card">
                            <div className="tech-decor top-left"></div>
                            <div className="tech-decor top-right"></div>
                            <div className="tech-decor bottom-left"></div>
                            <div className="tech-decor bottom-right"></div>

                            <div className="card-header-tech">
                                <Activity size={18} className="tech-icon" />
                                <h3>RATE LIMITS (FREE TIER)</h3>
                            </div>

                            <div className="rate-limits-grid">
                                <div className="rate-limit-item">
                                    <span className="limit-label">PER MINUTE</span>
                                    <span className="limit-value">10 <span className="unit">reqs</span></span>
                                    <div className="limit-bar"><div className="limit-fill" style={{ width: '15%' }}></div></div>
                                </div>
                                <div className="rate-limit-item">
                                    <span className="limit-label">PER HOUR</span>
                                    <span className="limit-value">60 <span className="unit">reqs</span></span>
                                    <div className="limit-bar"><div className="limit-fill" style={{ width: '10%' }}></div></div>
                                </div>
                                <div className="rate-limit-item">
                                    <span className="limit-label">PER DAY</span>
                                    <span className="limit-value">300 <span className="unit">reqs</span></span>
                                    <div className="limit-bar"><div className="limit-fill" style={{ width: '5%' }}></div></div>
                                </div>
                                <div className="rate-limit-item">
                                    <span className="limit-label">CONCURRENT</span>
                                    <span className="limit-value">2 <span className="unit">conn</span></span>
                                    <div className="limit-bar"><div className="limit-fill" style={{ width: '50%' }}></div></div>
                                </div>
                            </div>
                        </div>

                        {/* API Keys List */}
                        <div className="api-keys-list">
                            <h2 className="section-title">ACTIVE CREDENTIALS</h2>
                            {loading ? (
                                <div className="loading-state">
                                    <div className="loader-spinner"></div>
                                    <span>INITIALIZING DATA STREAM...</span>
                                </div>
                            ) : apiKeys.length === 0 ? (
                                <div className="empty-state tech-card">
                                    <div className="empty-icon-tech">
                                        <Shield size={48} />
                                    </div>
                                    <h3>NO ACTIVE KEYS DETECTED</h3>
                                    <p>Initialize a new API key to enable external model access.</p>
                                </div>
                            ) : (
                                <div className="keys-grid">
                                    {apiKeys.map((key) => (
                                        <div key={key.id} className={`key-card tech-card ${!key.isActive ? 'inactive' : ''}`}>
                                            <div className="tech-decor top-left small"></div>
                                            <div className="tech-decor bottom-right small"></div>

                                            <div className="key-header">
                                                <div className="key-info">
                                                    <div className="key-type-badge">
                                                        <Terminal size={12} />
                                                        <span>API KEY</span>
                                                    </div>
                                                    <h3>{key.name || 'UNNAMED_KEY'}</h3>
                                                    <p className="project-name">PROJECT: {key.projectName}</p>
                                                </div>
                                                <div className="key-header-actions">
                                                    <div className={`key-status ${key.isActive ? 'active' : 'inactive'}`}>
                                                        {key.isActive ? 'ACTIVE' : 'REVOKED'}
                                                    </div>
                                                    <div className="dropdown-wrapper">
                                                        <button
                                                            className="btn-more"
                                                            onClick={() => setOpenDropdown(openDropdown === key.id ? null : key.id)}
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                        {openDropdown === key.id && (
                                                            <div className="dropdown-menu tech-dropdown">
                                                                {key.isActive && (
                                                                    <button
                                                                        className="dropdown-item revoke"
                                                                        onClick={() => {
                                                                            setOpenDropdown(null);
                                                                            handleRevokeKey(key.id);
                                                                        }}
                                                                    >
                                                                        <AlertTriangle size={14} />
                                                                        REVOKE ACCESS
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="dropdown-item delete"
                                                                    onClick={() => {
                                                                        setOpenDropdown(null);
                                                                        deleteApiKey(key.id);
                                                                    }}
                                                                >
                                                                    <Trash2 size={14} />
                                                                    DELETE KEY
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="key-value-container">
                                                <div className="key-value">
                                                    <code>{key.keyPrefix}••••••••••••••••</code>
                                                </div>
                                                <button
                                                    className="btn-copy-tech"
                                                    onClick={() => copyToClipboard(key.keyPrefix, key.id)}
                                                    title="Copy prefix"
                                                >
                                                    {copiedKey === key.id ? <Check size={16} /> : <Copy size={16} />}
                                                </button>
                                            </div>

                                            <div className="key-actions">
                                                <button
                                                    className="btn-analytics tech-btn-outline"
                                                    onClick={() => setShowAnalytics(key)}
                                                >
                                                    <Activity size={16} />
                                                    VIEW TELEMETRY
                                                </button>
                                            </div>

                                            <div className="key-meta">
                                                <div className="meta-item">
                                                    <span className="meta-label">CREATED</span>
                                                    <span className="meta-value">{formatDate(key.createdAt)}</span>
                                                </div>
                                                <div className="meta-item">
                                                    <span className="meta-label">EXPIRES</span>
                                                    <span className="meta-value">{formatDate(key.expiresAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Generate Modal */}
                        {showGenerateModal && (
                            <div className="modal-overlay" onClick={closeGenerateModal}>
                                <div className="modal-content tech-modal" onClick={(e) => e.stopPropagation()}>
                                    <div className="tech-decor top-left"></div>
                                    <div className="tech-decor top-right"></div>
                                    <div className="tech-decor bottom-left"></div>
                                    <div className="tech-decor bottom-right"></div>

                                    <div className="modal-header">
                                        <h2>{newApiKey ? 'CREDENTIALS GENERATED' : 'INITIALIZE NEW KEY'}</h2>
                                        <button className="modal-close" onClick={closeGenerateModal}><X size={20} /></button>
                                    </div>

                                    {newApiKey ? (
                                        <div className="api-key-success">
                                            <div className="warning-box tech-warning">
                                                <AlertTriangle size={18} />
                                                <strong>SECURITY ALERT:</strong> Copy this key immediately. It will not be displayed again.
                                            </div>

                                            <div className="generated-key tech-key-display">
                                                <code>{newApiKey}</code>
                                                <button
                                                    className="btn-copy-large tech-btn"
                                                    onClick={() => copyToClipboard(newApiKey, 'new')}
                                                >
                                                    {copiedKey === 'new' ? <Check size={18} /> : <Copy size={18} />}
                                                    {copiedKey === 'new' ? 'COPIED' : 'COPY KEY'}
                                                </button>
                                            </div>

                                            <div className="usage-example">
                                                <h3>INTEGRATION SNIPPET</h3>
                                                <pre>{`curl -X POST ${PYTHON_SERVER_URL}/api/predict \\
  -H "Authorization: Bearer ${newApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"image": "base64_encoded_image"}'`}</pre>
                                            </div>

                                            <button className="btn-primary tech-btn full-width" onClick={closeGenerateModal}>
                                                ACKNOWLEDGE & CLOSE
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="generate-form">
                                            <div className="form-group">
                                                <label>TARGET PROJECT</label>
                                                <select
                                                    className="tech-input"
                                                    value={selectedProject?.id || ''}
                                                    onChange={(e) => {
                                                        const project = projects.find(p => p.id === e.target.value);
                                                        setSelectedProject(project);
                                                    }}
                                                >
                                                    <option value="">SELECT PROJECT...</option>
                                                    {projects.map((project) => (
                                                        <option key={project.id} value={project.id}>
                                                            {project.name} ({project.model_data?.projectType || 'IMAGE'})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label>KEY IDENTIFIER (OPTIONAL)</label>
                                                <input
                                                    className="tech-input"
                                                    type="text"
                                                    placeholder="e.g. PROD_CLUSTER_01"
                                                    value={keyName}
                                                    onChange={(e) => setKeyName(e.target.value)}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>EXPIRATION PROTOCOL</label>
                                                <select
                                                    className="tech-input"
                                                    value={expiryDays || ''}
                                                    onChange={(e) => setExpiryDays(e.target.value ? parseInt(e.target.value) : null)}
                                                >
                                                    <option value="">NO EXPIRATION</option>
                                                    <option value="7">7 DAYS</option>
                                                    <option value="30">30 DAYS</option>
                                                    <option value="90">90 DAYS</option>
                                                    <option value="365">1 YEAR</option>
                                                </select>
                                            </div>

                                            <div className="modal-actions">
                                                <button className="btn-secondary tech-btn-ghost" onClick={closeGenerateModal}>
                                                    ABORT
                                                </button>
                                                <button
                                                    className="btn-primary tech-btn"
                                                    onClick={handleGenerateKey}
                                                    disabled={!selectedProject || generating}
                                                >
                                                    {generating ? 'PROCESSING...' : 'GENERATE KEY'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Analytics Modal */}
                    {showAnalytics && (
                        <ApiAnalytics
                            apiKey={showAnalytics}
                            onClose={() => setShowAnalytics(null)}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}
