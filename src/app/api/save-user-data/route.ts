import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { createTables } from '@/app/utils/rpc-functions'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const { userId }: { userId: string | null } = await auth()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized: User not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { name, profession, style, chatHistory } = await req.json()

    if (!name || !profession || !style || !chatHistory) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data, error } = await supabase
      .from('users')
      .upsert({
        userid: userId,
        name: name,
        userprof: { profession },
        userstyle: style,
        useronchat: { messages: chatHistory }
      })
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return new Response(JSON.stringify({ error: `Database error: ${error.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Call the createTables function after saving user data
    const tableResults = await createTables(userId)

    return new Response(JSON.stringify({ userData: data, tableResults }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in save-user-data API:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}