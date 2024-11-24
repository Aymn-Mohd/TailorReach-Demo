import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const { userId }: { userId: string | null } = await auth() 
    const { customer, product } = await req.json()

    // Fetch user profile data
    const { data: userData, error } = await supabase
      .from('users')
      .select('userprof, userstyle, useronchat, name') // Added name to select statement
      .eq('userid', userId)
      .single()

    if (error) {
      console.error("Error fetching user data:", error)
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    // Create a more structured prompt using the user's profile data
    const prompt = `Generate a personalized message for a customer about a product.

Customer Details:
- Name: ${customer.name}
- Likes: ${customer.likes}
- Dislikes: ${customer.dislikes}

Product Details:
- Name: ${product.name}
- Description: ${product.description}

Writing Style Instructions:
${userData.userstyle ? `- Writing Style: ${JSON.stringify(userData.userstyle)}` : ''}
${userData.userprof ? `- Professional Level: ${JSON.stringify(userData.userprof)}` : ''}

Previous Conversations for Context:
${userData.useronchat ? JSON.stringify(userData.useronchat) : 'No previous conversations'}

The message should be in ${customer.preferences} format and should be personalized based on their likes and dislikes.
${customer.preferences === 'email' ? 'For email format, provide a subject line followed by the email content.' : ''}
Please maintain consistency with the user's writing style and professional level while incorporating relevant context from previous conversations. The Customer is ${customer.name}. The person selling the product is ${userData.name}.`

    // Generate the message using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert in generating personalized customer messages that match specific writing styles and professional levels while maintaining context from previous interactions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    // Return the generated message
    return NextResponse.json({ 
      message: customer.preferences === 'email' 
        ? {
            subject: response.choices[0]?.message?.content?.split('\n')[0] ?? '',
            content: response.choices[0]?.message?.content?.split('\n').slice(1).join('\n').trim() ?? ''
          }
        : response.choices[0].message.content,
      style: userData.userstyle,
      profile: userData.userprof,
      context: userData.useronchat
    })

  } catch (error) {
    console.error('Error generating message:', error)
    return NextResponse.json(
      { error: 'Failed to generate message' },
      { status: 500 }
    )
  }
}