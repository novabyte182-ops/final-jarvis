/*
  # Restructure profiles table for local user IDs

  1. Changes
    - Remove foreign key constraint from profiles.id to auth.users.id
    - Change profiles.id from uuid to text to support local user IDs like "user-1234567890"
    - Change all user_id foreign key columns from uuid to text
    - This allows the app to work without Supabase Auth, using locally generated user IDs

  2. Important Notes
    1) All user_id columns across tables are changed to text type
    2) Foreign key constraints are preserved but reference the text id column
    3) Data isolation is handled at the application level via user_id filtering
*/

-- First, drop all foreign key constraints
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE prayer_records DROP CONSTRAINT IF EXISTS prayer_records_user_id_fkey;
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_user_id_fkey;
ALTER TABLE study_sessions DROP CONSTRAINT IF EXISTS study_sessions_subject_id_fkey;

-- Drop the FK from profiles to auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Now we need to recreate the profiles table with text id
-- Since we can't alter the primary key type directly, we recreate

-- Create new profiles table with text id
CREATE TABLE IF NOT EXISTS profiles_new (
  id text PRIMARY KEY,
  name text DEFAULT 'Student',
  city text DEFAULT 'Dhaka',
  country text DEFAULT 'Bangladesh',
  created_at timestamptz DEFAULT now()
);

-- Copy any existing data (will fail if there's data with uuid that can't cast, but table is empty)
INSERT INTO profiles_new (id, name, city, country, created_at)
SELECT id::text, name, city, country, created_at FROM profiles;

-- Drop old table and rename
DROP TABLE profiles;
ALTER TABLE profiles_new RENAME TO profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add policies for profiles
CREATE POLICY "Allow anon read profiles" ON profiles FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert profiles" ON profiles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update profiles" ON profiles FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Change user_id columns to text
ALTER TABLE tasks ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE prayer_records ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE subjects ALTER COLUMN user_id TYPE text USING user_id::text;

-- Re-add foreign key constraints
ALTER TABLE tasks ADD CONSTRAINT tasks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE prayer_records ADD CONSTRAINT prayer_records_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE subjects ADD CONSTRAINT subjects_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Fix study_sessions subject_id (subjects.id is still uuid, which is fine)
ALTER TABLE study_sessions ADD CONSTRAINT study_sessions_subject_id_fkey
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
