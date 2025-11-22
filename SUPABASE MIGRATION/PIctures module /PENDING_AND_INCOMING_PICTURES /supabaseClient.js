// Supabase Client Configuration
// Location: lib/supabaseClient.js

const SUPABASE_URL = 'https://nvqrptokmwdhvpiufrad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cXJwdG9rbXdkaHZwaXVmcmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzU0ODUsImV4cCI6MjA3MTYxMTQ4NX0.yvFalmZE7Xpvo_j6wzRj44Pa7Bx9LQegcyLzbz3QL5s';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get current authenticated user
async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
}

// Get user profile with role info
async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    return null;
  }
}

// Export for use in other modules
export { supabase, getCurrentUser, getUserProfile };
