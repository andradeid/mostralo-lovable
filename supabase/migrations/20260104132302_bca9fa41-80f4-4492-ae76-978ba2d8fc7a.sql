-- Drop tables if they exist (from failed migration)
DROP TABLE IF EXISTS tutorial_views;
DROP TABLE IF EXISTS tutorials;
DROP TABLE IF EXISTS tutorial_categories;

-- Tabela de categorias de tutoriais
CREATE TABLE tutorial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  featured_video_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de tutoriais
CREATE TABLE tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES tutorial_categories(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_minutes INT DEFAULT 0,
  display_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de visualizações de tutoriais
CREATE TABLE tutorial_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID REFERENCES tutorials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  watch_time_seconds INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_tutorials_category ON tutorials(category_id);
CREATE INDEX idx_tutorials_active ON tutorials(is_active);
CREATE INDEX idx_tutorials_featured ON tutorials(is_featured);
CREATE INDEX idx_tutorial_views_tutorial ON tutorial_views(tutorial_id);
CREATE INDEX idx_tutorial_views_user ON tutorial_views(user_id);
CREATE INDEX idx_tutorial_views_store ON tutorial_views(store_id);
CREATE INDEX idx_tutorial_categories_order ON tutorial_categories(display_order);
CREATE INDEX idx_tutorials_order ON tutorials(display_order);

-- Unique constraint para evitar duplicatas de visualização
CREATE UNIQUE INDEX idx_tutorial_views_unique ON tutorial_views(tutorial_id, user_id);

-- Enable RLS
ALTER TABLE tutorial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_views ENABLE ROW LEVEL SECURITY;

-- Policies para tutorial_categories
CREATE POLICY "Tutorial categories are viewable by authenticated users"
ON tutorial_categories FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Master admin can manage tutorial categories"
ON tutorial_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- Policies para tutorials
CREATE POLICY "Tutorials are viewable by authenticated users"
ON tutorials FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Master admin can manage tutorials"
ON tutorials FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- Policies para tutorial_views
CREATE POLICY "Users can view their own tutorial views"
ON tutorial_views FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tutorial views"
ON tutorial_views FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tutorial views"
ON tutorial_views FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Master admin can view all tutorial views"
ON tutorial_views FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tutorial_categories_updated_at
BEFORE UPDATE ON tutorial_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutorials_updated_at
BEFORE UPDATE ON tutorials
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutorial_views_updated_at
BEFORE UPDATE ON tutorial_views
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();