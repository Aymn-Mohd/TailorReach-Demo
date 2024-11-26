import { NextResponse } from 'next/server';
import OpenAI from "openai";
import { fetchCustomers } from '@/app/utils/supabaseRequests';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  timeout: 30000,
});

interface Campaign {
  uid: string;
  name: string;
  description: string;
  keywords: string;
  campaign_date: string;
  products: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  keywords: string;
}

interface AnalysisResult {
  customerId: string;
  customerName: string;
  likelihood: number;
  reason: string;
}

export async function POST(request: Request) {
  const { campaign, product, userId, supabaseToken } = await request.json();

  if (!campaign || !userId || !supabaseToken) {
    return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
  }

  try {
    const customers = await fetchCustomers(userId, supabaseToken);

    if (!customers || customers.length === 0) {
      console.error('No customers found');
      return NextResponse.json({ error: 'No customers found' }, { status: 404 });
    }

    const results: AnalysisResult[] = await Promise.all(
      customers.map(async (customer) => {
        const prompt = `
          Analyze the likelihood of customer interest in a marketing campaign.

          Customer Profile:
          - Name: ${customer.name}
          - Interests/Likes: ${customer.likes || 'None specified'}
          - Dislikes: ${customer.dislikes || 'None specified'}

          Campaign Details:
          - Name: ${campaign.name}
          - Description: ${campaign.description || 'Not provided'}
          - Keywords: ${campaign.keywords || 'Not provided'}
          - Campaign Date: ${campaign.campaign_date}
          ${product ? `
          Related Product:
          - Name: ${product.name}
          - Description: ${product.description || 'Not provided'}
          - Keywords: ${product.keywords || 'Not provided'}
          ` : ''}

          Analyze the following factors:
          1. Match between customer interests and campaign theme
          2. Timing of the campaign relative to customer profile
          3. Relevance of campaign keywords to customer interests
          4. Past customer preferences and behavior patterns
          ${product ? '5. Alignment with product characteristics' : ''}

          Provide:
          1. A percentage (0-100) indicating the likelihood of customer interest
          2. A three-sentence explanation of the reasoning

          Format: Start with the percentage, followed by the explanation.
        `;

        try {
          const response = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt,
            max_tokens: 200,
            temperature: 0.7,
          });

          const text = response.choices[0]?.text || '';
          const likelihoodMatch = text.match(/(\d+(\.\d+)?)/);
          const likelihood = likelihoodMatch ? parseFloat(likelihoodMatch[0]) : Math.random() * 100;
          const reason = text.replace(/\d+(\.\d+)?%?/, '').trim();

          return {
            customerId: customer.id,
            customerName: customer.name,
            likelihood: Math.min(Math.max(likelihood, 0), 100),
            reason: reason || 'No specific reason provided',
          };
        } catch (error) {
          console.error(`Error analyzing customer ${customer.id}:`, error);
          return {
            customerId: customer.id,
            customerName: customer.name,
            likelihood: 0,
            reason: 'Error occurred during analysis',
          };
        }
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error analyzing customer interest:', error);
    return NextResponse.json({ error: 'Error analyzing customer interest' }, { status: 500 });
  }
}