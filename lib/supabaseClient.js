import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' }) // <-- loads your file

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL=https://nvqrptokmwdhvpiufrad.supabase.com
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cXJwdG9rbXdkaHZwaXVmcmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzU0ODUsImV4cCI6MjA3MTYxMTQ4NX0.yvFalmZE7Xpvo_j6wzRj44Pa7Bx9LQegcyLzbz3QL5s


export const supabase = createClient(url, key)


