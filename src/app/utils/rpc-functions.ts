import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function createTables(userId: string) {
  const tables = ['campaigns', 'customers', 'products']
  const results: { [key: string]: any } = {}

  for (const table of tables) {
    const { data, error } = await supabase.rpc(`create_${table}_table`, { user_id: userId })
    
    if (error) {
      console.error(`Error creating ${table} table:`, error)
      results[table] = { error: error.message }
    } else {
      console.log(`${table} table created successfully:`, data)
      results[table] = data
    }
  }

  return results
}

