import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Real-time Canvas Synchronization Hook
 * Syncs node positions, class additions, and other canvas changes across collaborators
 */
export const useRealtimeSync = (projectId, userId) => {
    const channelRef = useRef(null);
    const syncTimeoutRef = useRef({});

    // Subscribe to real-time changes
    useEffect(() => {
        if (!projectId || !userId) return;

        // Create a channel for this project
        const channel = supabase.channel(`project:${projectId}`, {
            config: {
                broadcast: { self: false }, // Don't receive our own broadcasts
            },
        });

        // Listen for canvas state changes (node movements)
        channel
            .on('broadcast', { event: 'node-move' }, (payload) => {
                const event = new CustomEvent('realtime-node-move', {
                    detail: payload.payload
                });
                window.dispatchEvent(event);
            })
            .on('broadcast', { event: 'node-create' }, (payload) => {
                const event = new CustomEvent('realtime-node-create', {
                    detail: payload.payload
                });
                window.dispatchEvent(event);
            })
            .on('broadcast', { event: 'node-delete' }, (payload) => {
                const event = new CustomEvent('realtime-node-delete', {
                    detail: payload.payload
                });
                window.dispatchEvent(event);
            })
            .on('broadcast', { event: 'class-add' }, (payload) => {
                const event = new CustomEvent('realtime-class-add', {
                    detail: payload.payload
                });
                window.dispatchEvent(event);
            })
            .on('broadcast', { event: 'class-delete' }, (payload) => {
                const event = new CustomEvent('realtime-class-delete', {
                    detail: payload.payload
                });
                window.dispatchEvent(event);
            })
            .on('broadcast', { event: 'class-update' }, (payload) => {
                const event = new CustomEvent('realtime-class-update', {
                    detail: payload.payload
                });
                window.dispatchEvent(event);
            })
            .on('broadcast', { event: 'sample-add' }, (payload) => {
                const event = new CustomEvent('realtime-sample-add', {
                    detail: payload.payload
                });
                window.dispatchEvent(event);
            })
            .on('broadcast', { event: 'training-start' }, (payload) => {
                const event = new CustomEvent('realtime-training-start', {
                    detail: payload.payload
                });
                window.dispatchEvent(event);
            })
            .on('broadcast', { event: 'training-complete' }, (payload) => {
                const event = new CustomEvent('realtime-training-complete', {
                    detail: payload.payload
                });
                window.dispatchEvent(event);
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            channel.unsubscribe();
        };
    }, [projectId, userId]);

    // Broadcast node movement
    const broadcastNodeMove = useCallback((nodeId, position, username) => {
        if (!channelRef.current) return;

        // Debounce broadcasts to avoid flooding
        if (syncTimeoutRef.current[nodeId]) {
            clearTimeout(syncTimeoutRef.current[nodeId]);
        }

        syncTimeoutRef.current[nodeId] = setTimeout(() => {
            channelRef.current.send({
                type: 'broadcast',
                event: 'node-move',
                payload: {
                    nodeId,
                    position,
                    userId,
                    username,
                    timestamp: Date.now()
                }
            });
        }, 100); // 100ms debounce
    }, [userId]);

    // Broadcast node creation
    const broadcastNodeCreate = useCallback((nodeId, nodeType, position, data) => {
        if (!channelRef.current) return;

        channelRef.current.send({
            type: 'broadcast',
            event: 'node-create',
            payload: {
                nodeId,
                nodeType,
                position,
                data,
                userId,
                timestamp: Date.now()
            }
        });
    }, [userId]);

    // Broadcast node deletion
    const broadcastNodeDelete = useCallback((nodeId) => {
        if (!channelRef.current) return;

        channelRef.current.send({
            type: 'broadcast',
            event: 'node-delete',
            payload: {
                nodeId,
                userId,
                timestamp: Date.now()
            }
        });
    }, [userId]);

    // Broadcast class addition
    const broadcastClassAdd = useCallback((classData) => {
        if (!channelRef.current) return;

        channelRef.current.send({
            type: 'broadcast',
            event: 'class-add',
            payload: {
                classData,
                userId,
                timestamp: Date.now()
            }
        });
    }, [userId]);

    // Broadcast class deletion
    const broadcastClassDelete = useCallback((classId) => {
        if (!channelRef.current) return;

        channelRef.current.send({
            type: 'broadcast',
            event: 'class-delete',
            payload: {
                classId,
                userId,
                timestamp: Date.now()
            }
        });
    }, [userId]);

    // Broadcast class update
    const broadcastClassUpdate = useCallback((classId, updates) => {
        if (!channelRef.current) return;

        channelRef.current.send({
            type: 'broadcast',
            event: 'class-update',
            payload: {
                classId,
                updates,
                userId,
                timestamp: Date.now()
            }
        });
    }, [userId]);

    // Broadcast sample addition
    const broadcastSampleAdd = useCallback((classId, sampleData) => {
        if (!channelRef.current) return;

        channelRef.current.send({
            type: 'broadcast',
            event: 'sample-add',
            payload: {
                classId,
                sampleData,
                userId,
                timestamp: Date.now()
            }
        });
    }, [userId]);

    // Broadcast training start
    const broadcastTrainingStart = useCallback(() => {
        if (!channelRef.current) return;

        channelRef.current.send({
            type: 'broadcast',
            event: 'training-start',
            payload: {
                userId,
                timestamp: Date.now()
            }
        });
    }, [userId]);

    // Broadcast training complete
    const broadcastTrainingComplete = useCallback(() => {
        if (!channelRef.current) return;

        channelRef.current.send({
            type: 'broadcast',
            event: 'training-complete',
            payload: {
                userId,
                timestamp: Date.now()
            }
        });
    }, [userId]);

    return {
        broadcastNodeMove,
        broadcastNodeCreate,
        broadcastNodeDelete,
        broadcastClassAdd,
        broadcastClassDelete,
        broadcastClassUpdate,
        broadcastSampleAdd,
        broadcastTrainingStart,
        broadcastTrainingComplete
    };
};
