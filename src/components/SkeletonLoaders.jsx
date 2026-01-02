import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './SkeletonLoaders.css';

// ============================================================================
// PROJECTS PAGE SKELETON
// ============================================================================
export const ProjectsSkeleton = () => (
    <div className="dashboard-layout">
        <Sidebar sidebarOpen={true} setSidebarOpen={() => { }} />

        <div className="main-content-wrapper" style={{ marginLeft: '260px' }}>
            <div className="skeleton-topbar"></div>

            <main className="projects-main">
                {/* Header Skeleton */}
                <div className="projects-header">
                    <div className="skeleton-page-title"></div>
                    <div className="skeleton-create-button"></div>
                </div>

                {/* Filter Tabs Skeleton */}
                <div className="filter-tabs">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton-filter-tab"></div>
                    ))}
                </div>

                {/* Projects Grid Skeleton */}
                <div className="projects-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="project-card skeleton-animate">
                            <div className="skeleton-project-image"></div>
                            <div className="skeleton-project-title"></div>
                            <div className="skeleton-project-meta"></div>
                            <div className="skeleton-project-stats">
                                <div className="skeleton-stat-item"></div>
                                <div className="skeleton-stat-item"></div>
                            </div>
                            <div className="skeleton-project-actions">
                                <div className="skeleton-action-button"></div>
                                <div className="skeleton-action-button"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    </div>
);

// ============================================================================
// API KEYS PAGE SKELETON
// ============================================================================
export const ApiKeysSkeleton = () => (
    <div className="dashboard-layout">
        <Sidebar sidebarOpen={true} setSidebarOpen={() => { }} />

        <div className="main-content-wrapper" style={{ marginLeft: '260px' }}>
            <div className="skeleton-topbar"></div>

            <main className="api-keys-main">
                {/* Header Skeleton */}
                <div className="api-keys-header">
                    <div>
                        <div className="skeleton-page-title"></div>
                        <div className="skeleton-page-subtitle"></div>
                    </div>
                    <div className="skeleton-generate-button"></div>
                </div>

                {/* Stats Cards Skeleton */}
                <div className="api-stats-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="stat-card skeleton-animate">
                            <div className="skeleton-stat-icon"></div>
                            <div className="skeleton-stat-value"></div>
                            <div className="skeleton-stat-label"></div>
                        </div>
                    ))}
                </div>

                {/* API Keys List Skeleton */}
                <div className="api-keys-list">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="api-key-card skeleton-animate">
                            <div className="skeleton-key-header">
                                <div className="skeleton-key-name"></div>
                                <div className="skeleton-key-badge"></div>
                            </div>
                            <div className="skeleton-key-value"></div>
                            <div className="skeleton-key-meta">
                                <div className="skeleton-key-date"></div>
                                <div className="skeleton-key-usage"></div>
                            </div>
                            <div className="skeleton-key-actions">
                                <div className="skeleton-action-icon"></div>
                                <div className="skeleton-action-icon"></div>
                                <div className="skeleton-action-icon"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    </div>
);

// ============================================================================
// API ANALYTICS PAGE SKELETON
// ============================================================================
export const ApiAnalyticsSkeleton = () => (
    <div className="dashboard-layout">
        <Sidebar sidebarOpen={true} setSidebarOpen={() => { }} />

        <div className="main-content-wrapper" style={{ marginLeft: '260px' }}>
            <div className="skeleton-topbar"></div>

            <main className="analytics-main">
                {/* Header Skeleton */}
                <div className="analytics-header">
                    <div className="skeleton-page-title"></div>
                    <div className="skeleton-date-range"></div>
                </div>

                {/* Charts Grid Skeleton */}
                <div className="charts-grid">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="chart-card skeleton-animate">
                            <div className="skeleton-chart-title"></div>
                            <div className="skeleton-chart-area"></div>
                        </div>
                    ))}
                </div>

                {/* Rate Limits Section Skeleton */}
                <div className="rate-limits-section skeleton-animate">
                    <div className="skeleton-section-title"></div>
                    <div className="rate-limits-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="rate-limit-item">
                                <div className="skeleton-limit-label"></div>
                                <div className="skeleton-limit-bar"></div>
                                <div className="skeleton-limit-text"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    </div>
);

// ============================================================================
// PROFILE PAGE SKELETON
// ============================================================================
export const ProfileSkeleton = () => (
    <div className="dashboard-layout">
        <Sidebar sidebarOpen={true} setSidebarOpen={() => { }} />

        <div className="main-content-wrapper" style={{ marginLeft: '260px' }}>
            <div className="skeleton-topbar"></div>

            <main className="profile-main">
                {/* Profile Header Skeleton */}
                <div className="profile-header skeleton-animate">
                    <div className="skeleton-avatar"></div>
                    <div>
                        <div className="skeleton-profile-name"></div>
                        <div className="skeleton-profile-email"></div>
                    </div>
                </div>

                {/* Profile Form Skeleton */}
                <div className="profile-form skeleton-animate">
                    <div className="skeleton-form-title"></div>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="form-group">
                            <div className="skeleton-form-label"></div>
                            <div className="skeleton-form-input"></div>
                        </div>
                    ))}
                    <div className="skeleton-save-button"></div>
                </div>

                {/* Account Stats Skeleton */}
                <div className="account-stats skeleton-animate">
                    <div className="skeleton-section-title"></div>
                    <div className="stats-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="stat-item">
                                <div className="skeleton-stat-label"></div>
                                <div className="skeleton-stat-value"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    </div>
);

// ============================================================================
// SETTINGS PAGE SKELETON
// ============================================================================
export const SettingsSkeleton = () => (
    <div className="dashboard-layout">
        <Sidebar sidebarOpen={true} setSidebarOpen={() => { }} />

        <div className="main-content-wrapper" style={{ marginLeft: '260px' }}>
            <div className="skeleton-topbar"></div>

            <main className="settings-main">
                {/* Settings Header Skeleton */}
                <div className="settings-header">
                    <div className="skeleton-page-title"></div>
                </div>

                {/* Settings Tabs Skeleton */}
                <div className="settings-tabs">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton-settings-tab"></div>
                    ))}
                </div>

                {/* Settings Content Skeleton */}
                <div className="settings-content skeleton-animate">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="settings-section">
                            <div className="skeleton-section-title"></div>
                            <div className="skeleton-section-description"></div>
                            <div className="skeleton-toggle"></div>
                        </div>
                    ))}
                </div>

                {/* Danger Zone Skeleton */}
                <div className="danger-zone skeleton-animate">
                    <div className="skeleton-danger-title"></div>
                    <div className="skeleton-danger-description"></div>
                    <div className="skeleton-danger-button"></div>
                </div>
            </main>
        </div>
    </div>
);

// ============================================================================
// STUDIO PAGE SKELETON
// ============================================================================
export const StudioSkeleton = () => (
    <div className="studio-layout">
        {/* Studio Header Skeleton */}
        <div className="studio-header skeleton-animate">
            <div className="skeleton-studio-title"></div>
            <div className="skeleton-studio-actions">
                {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton-header-button"></div>
                ))}
            </div>
        </div>

        {/* Canvas Area Skeleton */}
        <div className="studio-canvas skeleton-animate">
            <div className="skeleton-canvas-placeholder">
                <div className="skeleton-canvas-icon"></div>
                <div className="skeleton-canvas-text"></div>
            </div>
        </div>

        {/* Dock Skeleton */}
        <div className="studio-dock skeleton-animate">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton-dock-item"></div>
            ))}
        </div>
    </div>
);
