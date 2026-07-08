import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oqckavtxebrbrjhwkpma.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xY2thdnR4ZWJyYnJqaHdrcG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNjIzNTQsImV4cCI6MjA5NzkzODM1NH0.Y8OU0QOHkRY5knHKb5Ede73kFsYjloHSm9HbGLknFQk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

