import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://estuvpzyycowcdkdrpze.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdHV2cHp5eWNvd2Nka2RycHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTI0MTQsImV4cCI6MjA5MDk2ODQxNH0.FpnRa6aUokiHXF9ZKmWtZjtTaW1AuiEAFoIrkRGFhlE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
