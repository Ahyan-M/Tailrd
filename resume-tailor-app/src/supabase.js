import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tczjpsayyenfjptyqwwv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjempwc2F5eWVuZmpwdHlxd3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5OTYyODIsImV4cCI6MjA2NjU3MjI4Mn0.EEW3cUlMIP2JMiDN8ReXiZY9-pF9xXdKrGGZ_eiqEr0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 