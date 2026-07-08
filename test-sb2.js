import { createClient } from '@supabase/supabase-js';
const sb = createClient('https://oqckavtxebrbrjhwkpma.supabase.co', 'sb_publishable_hTVCQOPlR_VYBXwCoIQkMQ_phjkkY3w');
sb.auth.signInWithPassword({ email: 'a@a.com', password: 'abc' }).then(console.log).catch(console.error);
