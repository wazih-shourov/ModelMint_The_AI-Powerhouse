import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Loader } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const InviteCollaboratorModal = ({ isOpen, onClose, projectId, projectName }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [inviting, setInviting] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        getUser();
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length >= 2) {
            searchUsers();
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const searchUsers = async () => {
        setSearching(true);
        try {
            // Search users by username
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .ilike('username', `%${searchQuery}%`)
                .limit(10);

            if (error) throw error;

            // Filter out current user and already invited users
            const { data: existingInvites } = await supabase
                .from('collaboration_invites')
                .select('receiver_id')
                .eq('project_id', projectId)
                .in('status', ['pending', 'accepted']);

            const { data: existingCollaborators } = await supabase
                .from('project_collaborators')
                .select('user_id')
                .eq('project_id', projectId);

            const excludedIds = new Set([
                currentUser?.id,
                ...(existingInvites?.map(i => i.receiver_id) || []),
                ...(existingCollaborators?.map(c => c.user_id) || [])
            ]);

            const filteredResults = data?.filter(user => !excludedIds.has(user.id)) || [];
            setSearchResults(filteredResults);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleInvite = async (userId) => {
        setInviting(userId);
        try {
            const { error } = await supabase
                .from('collaboration_invites')
                .insert({
                    project_id: projectId,
                    sender_id: currentUser.id,
                    receiver_id: userId,
                    status: 'pending'
                });

            if (error) throw error;

            alert('✅ Invitation sent successfully!');
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Error sending invite:', error);
            alert('❌ Failed to send invitation: ' + error.message);
        } finally {
            setInviting(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: '16px',
                    width: '500px',
                    maxWidth: '90%',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '1.5rem',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                            Invite Collaborator
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            {projectName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Search Input */}
                <div style={{ padding: '1.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search
                            size={20}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search by username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.75rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>
                </div>

                {/* Search Results */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0 1.5rem 1.5rem',
                        minHeight: '200px'
                    }}
                >
                    {searching ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                            <Loader size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                            <p style={{ marginTop: '0.5rem' }}>Searching...</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {searchResults.map((user) => (
                                <div
                                    key={user.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '1.125rem'
                                            }}
                                        >
                                            {user.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1f2937' }}>
                                                @{user.username}
                                            </div>
                                            {user.full_name && (
                                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                    {user.full_name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleInvite(user.id)}
                                        disabled={inviting === user.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem 1rem',
                                            background: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: inviting === user.id ? 'not-allowed' : 'pointer',
                                            fontWeight: '500',
                                            opacity: inviting === user.id ? 0.6 : 1
                                        }}
                                    >
                                        {inviting === user.id ? (
                                            <>
                                                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                                Inviting...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={16} />
                                                Invite
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : searchQuery.trim().length >= 2 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                            <p>No users found matching "{searchQuery}"</p>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                            <Search size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
                            <p style={{ marginTop: '1rem' }}>Type at least 2 characters to search</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InviteCollaboratorModal;
