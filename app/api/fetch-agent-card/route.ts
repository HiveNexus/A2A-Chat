import { NextResponse } from 'next/server';
import { AgentCard } from '@/types/a2a';

// Make sure this is properly exported as a Route Handler
export async function POST(request: Request) {
  console.log('POST request received at /api/fetch-agent-card');

  try {
    // Parse the request body to get the domain
    const body = await request.json();
    console.log('Request body:', body);

    const { domain } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Construct the URL to fetch the agent card
    // Check if the domain already includes the path to agent.json
    const url = domain.includes('/.well-known/agent.json')
      ? domain
      : `${domain}/.well-known/agent.json`;

    console.log('Fetching agent card from URL:', url);

    // Fetch the agent card from the server side
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch agent card: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Parse the response as JSON
    const agentCard: AgentCard = await response.json();

    // Return the agent card
    return NextResponse.json({ agentCard });
  } catch (error) {
    console.error('Error fetching agent card:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

// Add a GET handler to test if the route is registered
export async function GET() {
  return NextResponse.json({ message: 'This endpoint requires a POST request with a domain' }, { status: 405 });
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
