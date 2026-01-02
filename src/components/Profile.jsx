import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, Folder } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = React.useState(null);
    const [profile, setProfile] = React.useState(null);
    const [projects, setProjects] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/auth');
                return;
            }
            setUser(user);

            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profileData);

            // Fetch projects count
            const { data: projectsData } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id);
            setProjects(projectsData || []);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-container">
                <div className="loading-state">Loading...</div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={20} />
                    <span>Back to Dashboard</span>
                </button>
                <h1>Profile</h1>
            </div>

            <div className="profile-content">
                {/* Profile Card */}
                <div className="profile-card">
                    <div className="profile-avatar-large">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <h2>{profile?.full_name || 'User'}</h2>
                    <p className="profile-username">@{profile?.username || 'username'}</p>
                </div>

                {/* Stats */}
                <div className="profile-stats">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <Folder size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{projects.length}</h3>
                            <p>Projects</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <Calendar size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{new Date(user?.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</h3>
                            <p>Joined</p>
                        </div>
                    </div>
                </div>

                {/* Information */}
                <div className="profile-section">
                    <h3>Account Information</h3>
                    <div className="info-card">
                        <div className="info-item">
                            <div className="info-icon">
                                <User size={18} />
                            </div>
                            <div>
                                <label>Full Name</label>
                                <p>{profile?.full_name || 'Not set'}</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">
                                <Mail size={18} />
                            </div>
                            <div>
                                <label>Email</label>
                                <p>{user?.email}</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="info-icon">
                                <User size={18} />
                            </div>
                            <div>
                                <label>Username</label>
                                <p>{profile?.username || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
