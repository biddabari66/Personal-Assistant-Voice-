import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oqckavtxebrbrjhwkpma.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hTVCQOPlR_VYBXwCoIQkMQ_phjkkY3w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

