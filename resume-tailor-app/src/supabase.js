import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://tczjpsayyenfjptyqwwv.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjempwc2F5eWVuZmpwdHlxd3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5OTYyODIsImV4cCI6MjA2NjU3MjI4Mn0.EEW3cUlMIP2JMiDN8ReXiZY9-pF9xXdKrGGZ_eiqEr0'

// Get the current origin for redirect URLs
const getRedirectUrl = () => {
  // Use environment variable if available, otherwise use current origin
  return process.env.REACT_APP_SITE_URL || window.location.origin
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    redirectTo: getRedirectUrl()
  },
  global: {
    headers: {
      'X-Client-Info': 'resume-tailor-app'
    }
  }
})

// Export helper function for redirect URLs
export const getAuthRedirectUrl = () => getRedirectUrl() 