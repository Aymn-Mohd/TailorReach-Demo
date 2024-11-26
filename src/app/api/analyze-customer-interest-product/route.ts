import { NextResponse } from 'next/server';
import OpenAI from "openai";
import { fetchCustomers } from '@/app/utils/supabaseRequests';

// Configure OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  timeout: 30000,
});

interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface AnalysisResult {
  customerId: string;
  customerName: string;
  likelihood: number;
  reason: string;
}

export async function POST(request: Request) {
  const { product, userId, supabaseToken }: { product: Product; userId: string; supabaseToken: string } = await request.json();

  if (!product || !userId || !supabaseToken) {
    return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
  }

  try {
    // Fetch customer data using the imported function
    const customers = await fetchCustomers(userId, supabaseToken);

    if (!customers || customers.length === 0) {
      console.error('No customers found');
      return NextResponse.json({ error: 'No customers found' }, { status: 404 });
    }

    // Process each customer with OpenAI
    const results: AnalysisResult[] = await Promise.all(
      customers.map(async (customer) => {
        const prompt = `
          Customer name: ${customer.name}
          Email: ${customer.email}
          Phone: ${customer.phone}
          Likes: ${customer.likes || 'None'}
          Dislikes: ${customer.dislikes || 'None'}
          
          Product: ${product.name}
          Category: ${product.category}
          Description: ${product.description || 'Not provided'}

          Based on the customer's likes, and dislikes, assess the likelihood (as a percentage) that they would be interested in purchasing this product and provide the main reason. Make sure the reason is 3 sentences. If the same people are given for the same product, don't change the answer.
        `;

        try {
          const response = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt,
            max_tokens: 100,
            temperature: 0.7,
          });

          const text = response.choices[0]?.text || '';
          const likelihoodMatch = text.match(/(\d+(\.\d+)?)/);
          const likelihood = likelihoodMatch ? parseFloat(likelihoodMatch[0]) : Math.random() * 100;
          const reason = text.replace(/\d+(\.\d+)?%/g, '').trim();

          return {
            customerId: customer.id,
            customerName: customer.name,
            likelihood: Math.min(Math.max(likelihood, 0), 100), // Ensure percentage within 0-100
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