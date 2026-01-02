-- ============================================
-- COLLABORATIVE CANVAS SCHEMA (FIXED)
-- ============================================

-- 1. Project Collaborators Table
CREATE TABLE IF NOT EXISTS project_collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, user_id)
);

-- 2. Collaboration Invites Table
CREATE TABLE IF NOT EXISTS collaboration_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, receiver_id)
);

-- 3. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('collaboration_invite', 'invite_accepted', 'invite_rejected')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Canvas State Table (for real-time sync)
CREATE TABLE IF NOT EXISTS canvas_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    node_id TEXT NOT NULL,
    position JSONB NOT NULL, -- {x: number, y: number}
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, node_id)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_state ENABLE ROW LEVEL SECURITY;

-- Project Collaborators Policies (FIXED - No Recursion)
CREATE POLICY "Users can view collaborators of their projects"
    ON project_collaborators FOR SELECT
    USING (
        -- User is the owner of the project
        EXISTS (SELECT 1 FROM projects p WHERE p.id = project_collaborators.project_id AND p.user_id = auth.uid())
        OR
        -- User is listed as a collaborator on this project
        user_id = auth.uid()
    );

CREATE POLICY "Project owners can add collaborators"
    ON project_collaborators FOR INSERT
    WITH CHECK (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

CREATE POLICY "Project owners can remove collaborators"
    ON project_collaborators FOR DELETE
    USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

-- Collaboration Invites Policies
CREATE POLICY "Users can view their sent invites"
    ON collaboration_invites FOR SELECT
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send invites for their projects"
    ON collaboration_invites FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update invites they received"
    ON collaboration_invites FOR UPDATE
    USING (receiver_id = auth.uid());

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (user_id = auth.uid());

-- Canvas State Policies (FIXED - No Recursion)
CREATE POLICY "Collaborators can view canvas state"
    ON canvas_state FOR SELECT
    USING (
        -- User is the owner
        EXISTS (SELECT 1 FROM projects p WHERE p.id = canvas_state.project_id AND p.user_id = auth.uid())
        OR
        -- User is a collaborator
        EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = canvas_state.project_id AND pc.user_id = auth.uid())
    );

CREATE POLICY "Collaborators can update canvas state"
    ON canvas_state FOR INSERT
    WITH CHECK (
        -- User is the owner
        EXISTS (SELECT 1 FROM projects p WHERE p.id = canvas_state.project_id AND p.user_id = auth.uid())
        OR
        -- User is a collaborator
        EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = canvas_state.project_id AND pc.user_id = auth.uid())
    );

CREATE POLICY "Collaborators can modify canvas state"
    ON canvas_state FOR UPDATE
    USING (
        -- User is the owner
        EXISTS (SELECT 1 FROM projects p WHERE p.id = canvas_state.project_id AND p.user_id = auth.uid())
        OR
        -- User is a collaborator
        EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = canvas_state.project_id AND pc.user_id = auth.uid())
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to automatically add project owner as collaborator
CREATE OR REPLACE FUNCTION add_owner_as_collaborator()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO project_collaborators (project_id, user_id, role)
    VALUES (NEW.id, NEW.user_id, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add owner as collaborator on project creation
DROP TRIGGER IF EXISTS on_project_created ON projects;
CREATE TRIGGER on_project_created
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION add_owner_as_collaborator();

-- Function to create notification when invite is sent
CREATE OR REPLACE FUNCTION notify_on_invite()
RETURNS TRIGGER AS $$
DECLARE
    sender_username TEXT;
    project_name TEXT;
BEGIN
    -- Get sender username
    SELECT username INTO sender_username
    FROM profiles
    WHERE id = NEW.sender_id;

    -- Get project name
    SELECT name INTO project_name
    FROM projects
    WHERE id = NEW.project_id;

    -- Create notification
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
        NEW.receiver_id,
        'collaboration_invite',
        'New Collaboration Invite',
        sender_username || ' invited you to collaborate on "' || project_name || '"',
        jsonb_build_object(
            'invite_id', NEW.id,
            'project_id', NEW.project_id,
            'sender_id', NEW.sender_id,
            'sender_username', sender_username,
            'project_name', project_name
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification on invite
DROP TRIGGER IF EXISTS on_invite_created ON collaboration_invites;
CREATE TRIGGER on_invite_created
    AFTER INSERT ON collaboration_invites
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_invite();

-- Function to add collaborator when invite is accepted
CREATE OR REPLACE FUNCTION handle_invite_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Add user as collaborator
        INSERT INTO project_collaborators (project_id, user_id, role)
        VALUES (NEW.project_id, NEW.receiver_id, 'editor')
        ON CONFLICT (project_id, user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle invite acceptance
DROP TRIGGER IF EXISTS on_invite_updated ON collaboration_invites;
CREATE TRIGGER on_invite_updated
    AFTER UPDATE ON collaboration_invites
    FOR EACH ROW
    EXECUTE FUNCTION handle_invite_acceptance();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_project_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_invites_receiver ON collaboration_invites(receiver_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_invites_status ON collaboration_invites(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_canvas_state_project ON canvas_state(project_id);

-- ============================================
-- REALTIME PUBLICATION
-- ============================================

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE project_collaborators;
ALTER PUBLICATION supabase_realtime ADD TABLE canvas_state;
