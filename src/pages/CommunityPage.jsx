import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Search, User, Box, Cpu, ArrowRight, Play, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { getBrandedModelName } from '../lib/modelBranding';
import '../styles/Community.css';

const CommunityPage = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        checkUser();
        fetchCommunityProjects();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            const { data: profileData } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', user.id)
                .single();
            if (profileData) setProfile(profileData);
        }
    };

    const fetchCommunityProjects = async () => {
        try {
            setLoading(true);
            // 1. Fetch all projects that have model_files (saved models)
            // Note: We're assuming RLS allows public select now
            const { data: projectsData, error } = await supabase
                .from('projects')
                .select('*')
                .not('model_files', 'is', null) // Only projects with saved models
                .order('created_at', { ascending: false });

            if (error) throw error;

            // 2. Fetch profiles for these projects to get usernames
            const userIds = [...new Set(projectsData.map(p => p.user_id))];
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .in('id', userIds);

            if (profilesError) throw profilesError;

            // Map profiles to projects
            const profilesMap = {};
            profilesData.forEach(p => {
                profilesMap[p.id] = p;
            });

            const enrichedProjects = projectsData.map(p => ({
                ...p,
                author: profilesMap[p.user_id] || { username: 'Unknown User' }
            }));

            setProjects(enrichedProjects);
        } catch (error) {
            console.error('Error fetching community projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.author.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.base_model_name && p.base_model_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="dashboard-layout">
            {user && <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}

            <div className="main-content-wrapper" style={{
                marginLeft: user ? (sidebarOpen ? '260px' : '70px') : '0',
                width: user ? 'auto' : '100%',
                transition: 'margin-left 0.3s ease',
                background: '#f8f9fa' // Light background
            }}>{/* Custom TopBar for Community (or reuse existing if user is logged in) */}
                {user ? (
                    <TopBar user={user} profile={profile} />
                ) : (
                    <div style={{
                        height: '64px',
                        background: '#ffffff',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 2rem',
                        justifyContent: 'space-between',
                        position: 'sticky',
                        top: 0,
                        zIndex: 40
                    }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#1f2937' }}>ModelMint Community</div>
                        <button
                            onClick={() => navigate('/auth')}
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                            Sign In
                        </button>
                    </div>
                )}

                <main className="dashboard-main" style={{ padding: '2rem', background: '#f8f9fa' }}>
                    <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                        <h1 style={{
                            fontSize: '3rem',
                            fontWeight: '900',
                            marginBottom: '1rem',
                            color: '#1f2937',
                            textTransform: 'uppercase',
                            letterSpacing: '2px'
                        }}>
                            Explore Community Models
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                            Discover and test AI models trained by the ModelMint community.
                        </p>

                        <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
                            <Search size={20} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="SEARCH MODELS, USERS, OR KEYWORDS..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="futuristic-search-input"
                                style={{
                                    width: '100%',
                                    padding: '1.25rem 1.25rem 1.25rem 4rem',
                                    borderRadius: '0',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    letterSpacing: '1px'
                                }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                            <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-red)' }} />
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '2rem'
                            }}
                        >
                            {filteredProjects.length > 0 ? (
                                filteredProjects.map((project) => (
                                    <motion.div
                                        key={project.id}
                                        variants={itemVariants}
                                        className="community-card-wrapper"
                                        onClick={() => navigate(`/community/test/${project.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="community-card-inner">
                                            {/* Card Header / Banner */}
                                            <div style={{
                                                height: '140px',
                                                background: `linear-gradient(135deg, ${getModelColor(project.base_model_name)} 0%, #f1f5f9 100%)`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                                borderBottom: '1px solid #e2e8f0'
                                            }}>
                                                <div style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background: 'radial-gradient(circle at center, transparent 0%, #ffffff 100%)',
                                                    opacity: 0.4
                                                }} />

                                                <Box size={56} color="white" style={{ opacity: 0.9, zIndex: 1, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />

                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '1rem',
                                                    left: '1rem',
                                                    background: 'rgba(255, 255, 255, 0.9)',
                                                    backdropFilter: 'blur(4px)',
                                                    padding: '0.25rem 0.75rem',
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    color: '#1f2937',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    zIndex: 1,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    <Cpu size={12} style={{ color: '#ff0000' }} />
                                                    {getBrandedModelName(project.base_model_name)}
                                                </div>
                                            </div>

                                            {/* Card Content */}
                                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <h3 style={{
                                                    fontSize: '1.25rem',
                                                    fontWeight: '700',
                                                    marginBottom: '0.5rem',
                                                    color: '#1f2937',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {project.name}
                                                </h3>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#64748b' }}>
                                                    <div style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        background: '#f1f5f9',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 'bold',
                                                        color: '#475569',
                                                        border: '1px solid #e2e8f0'
                                                    }}>
                                                        {project.author.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontSize: '0.875rem' }}>{project.author.username}</span>
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 'auto' }}>
                                                    {project.model_data?.classes?.slice(0, 3).map((cls, i) => (
                                                        <span key={i} className="futuristic-tag" style={{
                                                            padding: '0.25rem 0.5rem',
                                                            fontSize: '0.75rem'
                                                        }}>
                                                            {cls.name}
                                                        </span>
                                                    ))}
                                                    {project.model_data?.classes?.length > 3 && (
                                                        <span className="futuristic-tag" style={{
                                                            padding: '0.25rem 0.5rem',
                                                            fontSize: '0.75rem'
                                                        }}>
                                                            +{project.model_data.classes.length - 3}
                                                        </span>
                                                    )}
                                                </div>

                                                <button
                                                    className="futuristic-btn"
                                                    style={{
                                                        width: '100%',
                                                        padding: '1rem',
                                                        marginTop: '1.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/community/test/${project.id}`);
                                                    }}
                                                >
                                                    <Play size={16} fill="currentColor" /> TEST MODEL
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                                    <Box size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <h3>NO MODELS FOUND</h3>
                                    <p>Try adjusting your search or check back later.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </main>
            </div>
        </div>
    );
};

// Helper to get color based on model type - UPDATED FOR RED THEME
const getModelColor = (modelName) => {
    if (!modelName) return '#334155';
    const name = modelName.toLowerCase();
    // All red variations for futuristic look
    if (name.includes('mobilenet') || name.includes('mini')) return '#b91c1c'; // Dark Red
    if (name.includes('inception') || name.includes('high')) return '#ef4444'; // Bright Red
    if (name.includes('pose') || name.includes('movenet')) return '#991b1b'; // Deep Red
    if (name.includes('text') || name.includes('bert')) return '#7f1d1d'; // Very Dark Red
    return '#ef4444'; // Default Red
};

export default CommunityPage;
