import React from 'react';
import { useLocation } from 'react-router-dom';
import NotificationPanel from './NotificationPanel';
import { supabase } from '../lib/supabaseClient';
import './Header.css';

const Header = ({ title, subtitle, user, profile }) => {
    return (
        <header className="app-header">
            <div className="header-left">
                <h1>{title}</h1>
                {subtitle && <p className="header-subtitle">{subtitle}</p>}
            </div>

            <div className="header-right">
                <NotificationPanel />
                <div className="user-profile-section">
                    <div className="user-avatar-header">
                        {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
