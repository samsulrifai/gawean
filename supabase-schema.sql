-- ============================================================
-- GAWEAN - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. PAGES TABLE
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  icon TEXT NOT NULL DEFAULT '📄',
  cover_image TEXT,
  is_database BOOLEAN NOT NULL DEFAULT false,
  is_trashed BOOLEAN NOT NULL DEFAULT false,
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  content JSONB, -- TipTap editor JSON content
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for pages
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent_page_id ON pages(parent_page_id);
CREATE INDEX IF NOT EXISTS idx_pages_user_trashed ON pages(user_id, is_trashed);

-- RLS for pages
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pages"
  ON pages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pages"
  ON pages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pages"
  ON pages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pages"
  ON pages FOR DELETE
  USING (auth.uid() = user_id);

-- 2. PROPERTIES TABLE (database columns)
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  database_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  options JSONB NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  wrap_content BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_database_id ON properties(database_id);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own properties"
  ON properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own properties"
  ON properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own properties"
  ON properties FOR DELETE USING (auth.uid() = user_id);

-- 3. PROPERTY VALUES TABLE (cell values)
CREATE TABLE IF NOT EXISTS property_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_property_values_page_id ON property_values(page_id);
CREATE INDEX IF NOT EXISTS idx_property_values_property_id ON property_values(property_id);
CREATE INDEX IF NOT EXISTS idx_property_values_user_id ON property_values(user_id);

ALTER TABLE property_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own property values"
  ON property_values FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own property values"
  ON property_values FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own property values"
  ON property_values FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own property values"
  ON property_values FOR DELETE USING (auth.uid() = user_id);

-- 4. DATABASE VIEWS TABLE (view configurations)
CREATE TABLE IF NOT EXISTS database_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  database_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  type TEXT NOT NULL DEFAULT 'table',
  filter_config JSONB,
  sort_config JSONB NOT NULL DEFAULT '[]',
  group_by_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  calculations JSONB NOT NULL DEFAULT '[]',
  visible_properties JSONB NOT NULL DEFAULT '[]',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_database_views_database_id ON database_views(database_id);
CREATE INDEX IF NOT EXISTS idx_database_views_user_id ON database_views(user_id);

ALTER TABLE database_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own database views"
  ON database_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own database views"
  ON database_views FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own database views"
  ON database_views FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own database views"
  ON database_views FOR DELETE USING (auth.uid() = user_id);

-- 5. UPDATED_AT TRIGGER (auto-update timestamps)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pages_updated_at ON pages;
CREATE TRIGGER pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS property_values_updated_at ON property_values;
CREATE TRIGGER property_values_updated_at
  BEFORE UPDATE ON property_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. SEED DATA FUNCTION (creates starter pages for new users)
CREATE OR REPLACE FUNCTION create_seed_data_for_user()
RETURNS TRIGGER AS $$
DECLARE
  getting_started_id UUID;
  roadmap_id UUID;
  notes_id UUID;
  tracker_id UUID;
  design_id UUID;
  name_prop_id UUID;
  status_prop_id UUID;
  priority_prop_id UUID;
  due_prop_id UUID;
  assignee_prop_id UUID;
BEGIN
  -- Create starter pages
  getting_started_id := gen_random_uuid();
  roadmap_id := gen_random_uuid();
  notes_id := gen_random_uuid();
  tracker_id := gen_random_uuid();
  design_id := gen_random_uuid();

  INSERT INTO pages (id, user_id, title, icon, is_favorited, position) VALUES
    (getting_started_id, NEW.id, 'Getting Started', '🚀', true, 0),
    (roadmap_id, NEW.id, 'Project Roadmap', '🗺️', true, 1),
    (notes_id, NEW.id, 'Meeting Notes', '📝', false, 2),
    (tracker_id, NEW.id, 'Task Tracker', '✅', false, 3),
    (design_id, NEW.id, 'Design System', '🎨', false, 4);

  -- Mark Task Tracker as database
  UPDATE pages SET is_database = true WHERE id = tracker_id;

  -- Create default properties for Task Tracker
  name_prop_id := gen_random_uuid();
  status_prop_id := gen_random_uuid();
  priority_prop_id := gen_random_uuid();
  due_prop_id := gen_random_uuid();
  assignee_prop_id := gen_random_uuid();

  INSERT INTO properties (id, user_id, database_id, name, type, position, options) VALUES
    (name_prop_id, NEW.id, tracker_id, 'Name', 'text', 0, '{}'),
    (status_prop_id, NEW.id, tracker_id, 'Status', 'status', 1,
      '{"selectOptions": [
        {"id": "todo", "label": "To Do", "color": "Gray"},
        {"id": "in_progress", "label": "In Progress", "color": "Blue"},
        {"id": "done", "label": "Done", "color": "Green"}
      ]}'
    ),
    (priority_prop_id, NEW.id, tracker_id, 'Priority', 'select', 2,
      '{"selectOptions": [
        {"id": "low", "label": "Low", "color": "Gray"},
        {"id": "medium", "label": "Medium", "color": "Yellow"},
        {"id": "high", "label": "High", "color": "Orange"},
        {"id": "urgent", "label": "Urgent", "color": "Red"}
      ]}'
    ),
    (due_prop_id, NEW.id, tracker_id, 'Due Date', 'date', 3, '{}'),
    (assignee_prop_id, NEW.id, tracker_id, 'Assignee', 'text', 4, '{}');

  -- Create default view for Task Tracker
  INSERT INTO database_views (user_id, database_id, name, type, position) VALUES
    (NEW.id, tracker_id, 'Table view', 'table', 0),
    (NEW.id, tracker_id, 'Board view', 'board', 1);

  -- Add Getting Started content
  UPDATE pages SET content = '{
    "type": "doc",
    "content": [
      {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Welcome to Gawean! 👋"}]},
      {"type": "paragraph", "content": [{"type": "text", "text": "Gawean is your all-in-one workspace for notes, tasks, and projects."}]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Quick Start"}]},
      {"type": "bulletList", "content": [
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Type \"/\" for slash commands"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Press Ctrl+P to search"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Click + New Page to create pages"}]}]}
      ]}
    ]
  }'::jsonb WHERE id = getting_started_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create seed data when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_seed_data_for_user();

-- 7. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE pages;
ALTER PUBLICATION supabase_realtime ADD TABLE properties;
ALTER PUBLICATION supabase_realtime ADD TABLE property_values;
