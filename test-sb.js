import { createClient } from '@supabase/supabase-js';
try {
  const sb = createClient('https://oqckavtxebrbrjhwkpma.supabase.co', 'sb_publishable_hTVCQOPlR_VYBXwCoIQkMQ_phjkkY3w');
  console.log("OK");
} catch(e) {
  console.log("Error:", e.message);
}
