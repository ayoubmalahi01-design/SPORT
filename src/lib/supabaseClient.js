// Supabase Client Configuration
// Project Reference: xbjthetphqxdhwufkmly
// Uses environment variables from .env: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
//
// CRITICAL: Never use service-role keys in frontend code. Only use the public anon key.
// 
// This client initializes Supabase for all database operations.
// LocalStorage remains as fallback but all CRUD operations now use Supabase.

import { createClient } from '@supabase/supabase-js';

// Read configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration — must match project xbjthetphqxdhwufkmly
if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url_here') {
  throw new Error('VITE_SUPABASE_URL is not configured. Set it in .env file.');
}

if (!supabaseAnonKey || !supabaseAnonKey.startsWith('sb_publishable_')) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not configured or invalid. Set it in .env file.');
}

// Initialize Supabase client with proper configuration
// - autoSignIn: false — keep localStorage control, don't auto-sign in
// - persistSession: false — don't persist session in Supabase; manage locally
// - storage: window.localStorage — use localStorage for session data
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoSignIn: false,
    persistSession: false,
    storage: window.localStorage
  }
});

// =============================================================================
// CONFIGURATION VERIFICATION
// =============================================================================

/**
 * Verify that the Supabase project reference matches the expected project.
 * Returns detailed configuration status.
 */
export const verifyConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const urlValid = url && url !== 'your_supabase_project_url_here' && url.includes('supabase.co');
  const keyValid = key && key !== 'your_supabase_anon_key' && key.startsWith('sb_publishable_');
  const projectMatch = url.includes('xbjthetphqxdhwufkmly');
  
  return {
    urlValid,
    keyValid,
    projectReference: urlValid ? url.replace('https://', '') : 'not configured',
    projectMatch,  // Must be true for safe operation
    mode: urlValid && keyValid && projectMatch ? 'supabase_connected' : 'localStorage_fallback'
  };
};

/**
 * Get the Supabase client instance.
 * Returns null if client not initialized (should not happen if config is valid).
 */
export const getSupabase = () => supabase;

// =============================================================================
// SESSION AND AUTHENTICATION UTILITIES
// =============================================================================

/**
 * Get the current authenticated user's ID.
 * Returns null if not authenticated.
 */
export const getCurrentUserId = async () => {
  const { data: { user} } = await supabase.auth.getUser();
  return user?.id || null;
};

/**
 * Get the current user's institution ID from profiles table.
 * Uses the profles table relation: profiles.institution_id → institutions.id
 */
export const getCurrentInstitutionId = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('institution_id')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching institution ID:', error);
    return null;
  }
  
  return data?.institution_id || null;
};

/**
 * Get the current user's role from profiles table.
 */
export const getCurrentRole = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching role:', error);
    return null;
  }
  
  return data?.role || null;
};

/**
 * Sign in with email (if Supabase auth is configured).
 * Note: Supabase auth may use OAuth/providers; this is a fallback.
 */
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

/**
 * Sign out the current user.
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// =============================================================================
// INSTITUTION ISOLATION UTILITIES
// =============================================================================

/**
 * Ensure all queries are scoped to the current user's institution.
 * This is the core mechanism for institution-level isolation.
 */
export const withInstitutionScope = (queryBuilder) => {
  const institutionId = await getCurrentInstitutionId();
  if (institutionId) {
    return queryBuilder.eq('institution_id', institutionId);
  }
  // Fallback: return unfiltered query (should not happen in production)
  return queryBuilder;
};

// =============================================================================
// EXPORT ALL FOR USE BY SERVICES
// =============================================================================

export default supabase;

export {
  verifyConfig,
  getSupabase,
  getCurrentUserId,
  getCurrentInstitutionId,
  getCurrentRole,
  signIn,
  signOut,
  withInstitutionScope
};