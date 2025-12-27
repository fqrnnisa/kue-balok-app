import { createClient } from '@supabase/supabase-js'

// Client ini HANYA BOLEH dijalankan di Server Side (Server Actions / API)
// Jangan pernah import ini di komponen "use client"
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)