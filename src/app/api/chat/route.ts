import { OpenAI } from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Extract the profession from the system message
  const systemMessage = messages.find((m: { role: string; content: string }) => m.role === 'system')
  const profession = systemMessage ? systemMessage.content.split('their profession is: ')[1].split('.')[0] : 'unknown'

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      messages: [
        { 
          role: 'system', 
          content: `You are THE CUSTOMER. The user's profession is ${profession}. Engage in brief conversations as if you are the customer trying to buy a product related to their profession. Inquire about the product, ask for a demo, and ask about the price.` 
        },
        ...messages.filter((m: { role: string }) => m.role !== 'system')
      ]
    })

    const stream = OpenAIStream(response)
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error('Error in chat API:', error)
    return new Response(JSON.stringify({ error: 'An error occurred during the chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}