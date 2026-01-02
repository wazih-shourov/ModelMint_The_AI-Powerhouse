import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import {
    Rocket, Plus, ExternalLink, Trash2, Copy, Check,
    Globe, Lock, Search, AlertCircle, Loader, Edit
} from 'lucide-react';
import '../styles/Deployments.css';

const DeploymentsPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [deployments, setDeployments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        projectId: '',
        slug: '',
        title: '',
        description: '',
        isPublic: true
    });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
        } else {
            setUser(user);
            fetchProfile(user.id);
            fetchData(user.id);
        }
    };

    const fetchProfile = async (userId) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        setProfile(data);
    };

    const fetchData = async (userId) => {
        try {
            setLoading(true);
            // Fetch Deployments
            const { data: deploymentsData, error: deployError } = await supabase
                .from('deployments')
                .select(`
                    *,
                    projects (name, project_type)
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (deployError) throw deployError;
            setDeployments(deploymentsData || []);

            // Fetch Projects (for the dropdown)
            const { data: projectsData, error: projError } = await supabase
                .from('projects')
                .select('id, name, project_type')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (projError) {
                console.error('Error fetching projects:', projError);
                throw projError;
            }

            console.log('Fetched projects:', projectsData); // Debug log
            setProjects(projectsData || []);

        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError(null);
        setCreating(true);

        try {
            // Basic validation
            if (!formData.projectId || !formData.slug) {
                throw new Error('Project and Link Name are required');
            }

            // Slug validation (simple regex)
            const slugRegex = /^[a-z0-9-]+$/;
            if (!slugRegex.test(formData.slug)) {
                throw new Error('Link Name can only contain lowercase letters, numbers, and hyphens');
            }

            // Check if slug already exists for this user
            const { data: existing } = await supabase
                .from('deployments')
                .select('id')
                .eq('user_id', user.id)
                .eq('slug', formData.slug)
                .single();

            if (existing) {
                throw new Error('This Link Name is already taken by one of your deployments');
            }

            // Create Deployment
            const { data, error } = await supabase
                .from('deployments')
                .insert([{
                    user_id: user.id,
                    project_id: formData.projectId,
                    slug: formData.slug,
                    title: formData.title || formData.slug,
                    description: formData.description,
                    is_public: formData.isPublic
                }])
                .select()
                .single();

            if (error) throw error;

            // Update local state
            setDeployments([
                { ...data, projects: projects.find(p => p.id === formData.projectId) },
                ...deployments
            ]);
            setShowCreateModal(false);
            setFormData({ projectId: '', slug: '', title: '', description: '', isPublic: true });

        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this deployment? The public link will stop working.')) return;

        try {
            const { error } = await supabase
                .from('deployments')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setDeployments(deployments.filter(d => d.id !== id));
        } catch (err) {
            console.error('Error deleting:', err);
            alert('Failed to delete deployment');
        }
    };

    const copyLink = (username, slug) => {
        const url = `${window.location.origin}/share/${username}/${slug}`;
        navigator.clipboard.writeText(url);
        setCopiedId(slug);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="main-content-wrapper" style={{
                marginLeft: sidebarOpen ? '260px' : '70px',
                transition: 'margin-left 0.3s ease'
            }}>
                <TopBar user={user} profile={profile} />

                <div className="deployments-container">
                    <div className="deployments-header">
                        <div>
                            <h1>Deployments</h1>
                            <p>Manage and share your AI models with the world</p>
                        </div>
                        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                            <Plus size={18} />
                            New Deployment
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <Loader className="animate-spin" />
                            <span>Loading deployments...</span>
                        </div>
                    ) : deployments.length === 0 ? (
                        <div className="empty-state">
                            <Rocket size={48} />
                            <h3>No Deployments Yet</h3>
                            <p>Deploy your first model to share it with others.</p>
                            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                                Start Deployment
                            </button>
                        </div>
                    ) : (
                        <div className="deployments-grid">
                            {deployments.map(deploy => (
                                <div key={deploy.id} className="deployment-card">
                                    <div className="deploy-card-header">
                                        <div className="deploy-status">
                                            {deploy.is_public ? (
                                                <span className="status-badge success"><Globe size={12} /> Public</span>
                                            ) : (
                                                <span className="status-badge warning"><Lock size={12} /> Private</span>
                                            )}
                                        </div>
                                        <div className="deploy-actions">
                                            <button
                                                className="icon-btn"
                                                onClick={() => copyLink(profile?.username || 'user', deploy.slug)}
                                                title="Copy Link"
                                            >
                                                {copiedId === deploy.slug ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => navigate(`/deployments/builder/${deploy.id}`)}
                                                title="Customize Design"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                onClick={() => handleDelete(deploy.id)}
                                                title="Delete Deployment"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="deploy-info">
                                        <h3>{deploy.title}</h3>
                                        <p className="deploy-slug">/{deploy.slug}</p>
                                        <p className="deploy-desc">{deploy.description || 'No description provided'}</p>
                                    </div>

                                    <div className="deploy-meta">
                                        <div className="meta-item">
                                            <span className="label">Project</span>
                                            <span className="value">{deploy.projects?.name}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="label">Views</span>
                                            <span className="value">{deploy.view_count}</span>
                                        </div>
                                    </div>

                                    <a
                                        href={`/share/${profile?.username || 'user'}/${deploy.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-view-live"
                                    >
                                        View Live Page <ExternalLink size={14} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Deploy New Model</h2>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Select Project</label>
                                <select
                                    value={formData.projectId}
                                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                    required
                                >
                                    <option value="">Select a project...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.project_type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Link Name (Slug)</label>
                                <div className="slug-input-wrapper">
                                    <span className="slug-prefix">{window.location.host}/share/{profile?.username}/</span>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                        placeholder="my-awesome-model"
                                        required
                                    />
                                </div>
                                <small>Only lowercase letters, numbers, and hyphens.</small>
                            </div>

                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Cat vs Dog Classifier"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Briefly describe what this model does..."
                                    rows={3}
                                />
                            </div>

                            {error && <div className="error-message"><AlertCircle size={14} /> {error}</div>}

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={creating}>
                                    {creating ? 'Deploying...' : 'Deploy Model'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeploymentsPage;
