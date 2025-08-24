import { supabase } from './lib/supabaseClient.js'

const run = async () => {
  const { data, error } = await supabase.from('notes').select('*').limit(1)
  console.log('DATA:', data)
  console.log('ERROR:', error)
}

run()
