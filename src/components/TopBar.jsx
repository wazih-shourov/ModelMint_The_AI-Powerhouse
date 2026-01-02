import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Rocket, Bell, Settings, ChevronRight, Command } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import './TopBar.css';

const TopBar = ({ user, profile }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [breadcrumbs, setBreadcrumbs] = useState([]);

    useEffect(() => {
        // Generate breadcrumbs from current path
        const path = location.pathname;
        const parts = path.split('/').filter(Boolean);

        const crumbs = parts.map((part, index) => ({
            label: part.charAt(0).toUpperCase() + part.slice(1),
            path: '/' + parts.slice(0, index + 1).join('/')
        }));

        setBreadcrumbs([{ label: 'Home', path: '/dashboard' }, ...crumbs]);
    }, [location]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Implement global search
            console.log('Searching for:', searchQuery);
            // Navigate to search results or filter current view
        }
    };

    const handleQuickDeploy = () => {
        navigate('/deployments');
    };

    return (
        <header className="top-bar">
            {/* Left: Breadcrumbs */}
            <div className="breadcrumbs">
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.path}>
                        <button
                            className="breadcrumb-item"
                            onClick={() => navigate(crumb.path)}
                        >
                            {crumb.label}
                        </button>
                        {index < breadcrumbs.length - 1 && (
                            <ChevronRight size={14} className="breadcrumb-separator" />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Center: Global Search */}
            <div className={`global-search ${searchFocused ? 'focused' : ''}`}>
                <Search size={16} />
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search projects, logs, docs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                    />
                </form>
                <kbd className="search-kbd">
                    <Command size={12} />K
                </kbd>
            </div>

            {/* Right: Actions */}
            <div className="top-bar-actions">
                <button className="quick-deploy-btn" onClick={handleQuickDeploy}>
                    <Rocket size={16} />
                    <span>Deploy</span>
                </button>

                <NotificationPanel />

                <button className="icon-btn" onClick={() => navigate('/settings')}>
                    <Settings size={18} />
                </button>

                <div className="user-menu">
                    <div className="user-avatar">
                        {profile?.username?.charAt(0).toUpperCase() ||
                            user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
