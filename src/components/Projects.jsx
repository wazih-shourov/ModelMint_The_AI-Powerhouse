import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Folder, Clock, Search, Grid, List, LayoutGrid, Star, Trash2, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CreateProjectFlow from './CreateProjectFlow';
import NotificationPanel from './NotificationPanel';
import { getBrandedModelName } from '../lib/modelBranding';
import { ProjectsSkeleton } from './SkeletonLoaders';
import './Projects.css';

const Projects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loadingProject, setLoadingProject] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'icon'
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        checkUser();
        fetchProjects();
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

    const fetchProjects = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: ownedProjects, error: ownedError } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (ownedError) throw ownedError;

            const { data: collaborations, error: collabError } = await supabase
                .from('project_collaborators')
                .select(`project_id, role, projects (*)`)
                .eq('user_id', user.id)
                .neq('role', 'owner');

            if (collabError) throw collabError;

            const collaboratedProjects = collaborations?.map(c => ({
                ...c.projects,
                isCollaborated: true,
                collaboratorRole: c.role
            })) || [];

            setProjects([...(ownedProjects || []), ...collaboratedProjects]);
        } catch (error) {
            console.error('Error fetching projects:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (projectData) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('projects')
                .insert([{
                    name: projectData.name,
                    project_type: projectData.projectType,
                    base_model_name: projectData.baseModel,
                    user_id: user.id,
                    model_data: {
                        description: projectData.description,
                        created_at: new Date().toISOString(),
                        last_modified: new Date().toISOString(),
                        labels: [],
                        is_bookmarked: false
                    }
                }])
                .select()
                .single();

            if (error) throw error;
            navigate(`/studio/${data.id}`);
        } catch (error) {
            console.error('Error creating project:', error);
            alert(`Failed to create project: ${error.message}`);
        }
    };

    const handleDeleteProject = async (projectId) => {
        try {
            const { error } = await supabase.from('projects').delete().eq('id', projectId);
            if (error) throw error;
            setProjects(projects.filter(p => p.id !== projectId));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting project:', error.message);
        }
    };

    const toggleBookmark = async (e, project) => {
        e.stopPropagation();
        const newStatus = !project.model_data?.is_bookmarked;

        // Optimistic update
        const updatedProjects = projects.map(p =>
            p.id === project.id
                ? { ...p, model_data: { ...p.model_data, is_bookmarked: newStatus } }
                : p
        );
        setProjects(updatedProjects);

        try {
            const { error } = await supabase
                .from('projects')
                .update({
                    model_data: {
                        ...project.model_data,
                        is_bookmarked: newStatus
                    }
                })
                .eq('id', project.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating bookmark:', error);
            // Revert on error
            fetchProjects();
        }
    };

    const handleProjectClick = (projectId) => {
        setLoadingProject(projectId);
        setTimeout(() => navigate(`/studio/${projectId}`), 1500);
    };

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <ProjectsSkeleton />;

    return (
        <div className="projects-layout">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="main-content-wrapper" style={{
                marginLeft: sidebarOpen ? '260px' : '70px',
                transition: 'margin-left 0.3s ease'
            }}>
                <TopBar user={user} profile={profile} />

                <main className="projects-main">
                    <div className="projects-controls">
                        <div className="search-bar">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="view-controls">
                            <button
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                            >
                                <List size={20} />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'icon' ? 'active' : ''}`}
                                onClick={() => setViewMode('icon')}
                            >
                                <Grid size={20} />
                            </button>
                        </div>

                        <button className="btn-primary create-btn" onClick={() => setShowCreateModal(true)}>
                            <Plus size={20} />
                            <span>New Project</span>
                        </button>
                    </div>

                    {/* Projects Display */}
                    {viewMode === 'grid' && (
                        <div className="projects-grid">
                            {filteredProjects.map((project) => (
                                <motion.div
                                    key={project.id}
                                    className="project-card"
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => handleProjectClick(project.id)}
                                >
                                    {/* Tech Decor Elements */}
                                    <div className="tech-decor top-left"></div>
                                    <div className="tech-decor top-right"></div>
                                    <div className="tech-decor bottom-left"></div>
                                    <div className="tech-decor bottom-right"></div>

                                    <div className="project-card-header">
                                        <div className="project-icon-wrapper">
                                            <Folder size={20} />
                                        </div>
                                        <div className="card-actions">
                                            <button
                                                className={`action-btn bookmark ${project.model_data?.is_bookmarked ? 'active' : ''}`}
                                                onClick={(e) => toggleBookmark(e, project)}
                                                title="Bookmark"
                                            >
                                                <Star size={16} fill={project.model_data?.is_bookmarked ? "currentColor" : "none"} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirm(project.id);
                                                }}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="project-title">{project.name}</h3>
                                    <p className="project-desc">{project.model_data?.description || 'No description'}</p>

                                    <div className="project-footer">
                                        <span className="model-tag">
                                            {getBrandedModelName(project.base_model_name)}
                                        </span>
                                        <div className="project-date">
                                            <Clock size={12} />
                                            <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {viewMode === 'list' && (
                        <div className="projects-list">
                            {filteredProjects.map((project) => (
                                <motion.div
                                    key={project.id}
                                    className="project-list-item"
                                    whileHover={{ scale: 1.005 }}
                                    onClick={() => handleProjectClick(project.id)}
                                >
                                    <div className="project-list-icon">
                                        <Folder size={24} />
                                    </div>
                                    <div className="project-list-details">
                                        <div className="project-list-info">
                                            <h3>{project.name}</h3>
                                            <p>{project.model_data?.description || 'No description'}</p>
                                        </div>
                                        <div className="project-list-meta">
                                            <span className="model-badge">
                                                {getBrandedModelName(project.base_model_name)}
                                            </span>
                                            <span>{new Date(project.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <button
                                            className={`bookmark-btn ${project.model_data?.is_bookmarked ? 'active' : ''}`}
                                            onClick={(e) => toggleBookmark(e, project)}
                                        >
                                            <Star size={18} fill={project.model_data?.is_bookmarked ? "currentColor" : "none"} />
                                        </button>
                                        <button
                                            className="delete-project-btn"
                                            style={{ position: 'static', opacity: 1 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirm(project.id);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {viewMode === 'icon' && (
                        <div className="projects-icons">
                            {filteredProjects.map((project) => (
                                <motion.div
                                    key={project.id}
                                    className="project-icon-item"
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => handleProjectClick(project.id)}
                                >
                                    <div className="project-icon-large">
                                        <Folder size={32} />
                                        <button
                                            className={`bookmark-btn ${project.model_data?.is_bookmarked ? 'active' : ''}`}
                                            onClick={(e) => toggleBookmark(e, project)}
                                        >
                                            <Star size={14} fill={project.model_data?.is_bookmarked ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                    <h3>{project.name}</h3>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </main>

                <CreateProjectFlow
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateProject}
                />

                <AnimatePresence>
                    {deleteConfirm && (
                        <motion.div
                            className="modal-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirm(null)}
                        >
                            <motion.div
                                className="modal-content"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Tech Decor Elements */}
                                <div className="tech-decor top-left"></div>
                                <div className="tech-decor top-right"></div>
                                <div className="tech-decor bottom-left"></div>
                                <div className="tech-decor bottom-right"></div>

                                <div className="modal-header">
                                    <h2>Delete Project</h2>
                                    <p>Are you sure you want to delete this project? This action cannot be undone.</p>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                                    <button className="btn-danger" onClick={() => handleDeleteProject(deleteConfirm)}>Delete Project</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {loadingProject && (
                        <motion.div
                            className="loading-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="loading-spinner"></div>
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Opening Studio...
                            </motion.h2>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Projects;
