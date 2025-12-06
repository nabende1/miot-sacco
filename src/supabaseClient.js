/// src/supabaseClient.js - FIXED
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Main client for regular operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export as default
export default supabase;

// Also export named export for backward compatibility
export { supabase };

// Admin client (requires service role key - keep secure!)
let supabaseAdmin = null;
try {
  const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
} catch (error) {
  console.warn('Service role key not available. Admin features limited.');
}

export { supabaseAdmin };