import {  OpenAI} from 'openai'


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Analyze the user\'s communication style from their messages and provide a concise summary in JSON format with the following keys: tone (formal/casual/mixed), verbosity (concise/moderate/detailed), technicality (basic/intermediate/advanced), engagement (passive/active/very active). Respond only with the JSON object.'
        },
        ...messages
      ]
    })

    const content = response.choices[0].message.content

    return new Response(content, {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in analyze-style API:', error)
    return new Response(JSON.stringify({ error: 'Failed to analyze style' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}