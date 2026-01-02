import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const NotificationPanel = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                fetchNotifications(user.id);
                subscribeToNotifications(user.id);
            }
        };
        getUser();

        return () => {
            // Cleanup subscription
            supabase.channel('notifications').unsubscribe();
        };
    }, []);

    const fetchNotifications = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.read).length || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const subscribeToNotifications = (userId) => {
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    setNotifications(prev => [payload.new, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();
    };

    const markAsRead = async (notificationId) => {
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleInviteResponse = async (inviteId, projectId, accept) => {
        try {
            const { error } = await supabase
                .from('collaboration_invites')
                .update({ status: accept ? 'accepted' : 'rejected' })
                .eq('id', inviteId);

            if (error) throw error;

            if (accept) {
                alert('✅ Invitation accepted! Opening project...');
                navigate(`/studio/${projectId}`);
            } else {
                alert('Invitation rejected');
            }

            // Mark notification as read
            const notification = notifications.find(n => n.data?.invite_id === inviteId);
            if (notification) {
                markAsRead(notification.id);
            }
        } catch (error) {
            console.error('Error responding to invite:', error);
            alert('❌ Error: ' + error.message);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <Bell size={20} color="#6b7280" />
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: '#ef4444',
                            color: 'white',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.625rem',
                            fontWeight: 'bold'
                        }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 0.5rem)',
                        right: 0,
                        width: '400px',
                        maxHeight: '500px',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        border: '1px solid #e5e7eb',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: '1rem',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1f2937' }}>
                            Notifications
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#6b7280'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Notifications List */}
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                                <Bell size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
                                <p style={{ marginTop: '0.5rem' }}>No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid #f3f4f6',
                                        background: notification.read ? 'white' : '#eff6ff',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.875rem' }}>
                                                {notification.title}
                                            </div>
                                            <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                                {notification.message}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                                                {new Date(notification.created_at).toLocaleString()}
                                            </div>

                                            {/* Invite Actions */}
                                            {notification.type === 'collaboration_invite' && (
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleInviteResponse(
                                                                notification.data.invite_id,
                                                                notification.data.project_id,
                                                                true
                                                            );
                                                        }}
                                                        style={{
                                                            padding: '0.375rem 0.75rem',
                                                            background: '#10b981',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: '500',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleInviteResponse(
                                                                notification.data.invite_id,
                                                                notification.data.project_id,
                                                                false
                                                            );
                                                        }}
                                                        style={{
                                                            padding: '0.375rem 0.75rem',
                                                            background: '#ef4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: '500',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#9ca3af',
                                                padding: '0.25rem'
                                            }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
