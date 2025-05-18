import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy handler for A2A requests
 * This handles both regular JSON responses and streaming responses
 */
export async function POST(request: NextRequest) {
  console.log('POST request received at /api/a2a-proxy');

  try {
    // Parse the request body
    const requestData = await request.json();
    const { targetUrl, acceptHeader, requestBody } = requestData;

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Target URL is required' },
        { status: 400 }
      );
    }

    console.log(`Proxying request to: ${targetUrl}`);
    console.log(`Accept header: ${acceptHeader}`);

    console.log(requestBody)
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': acceptHeader || 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    // Check if the response is not successful
    if (!response.ok) {
      console.error(`Error response from target API: ${response.status}`);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      return NextResponse.json(
        { error: `Target API returned an error: ${response.status}`, details: errorData },
        { status: response.status }
      );
    }
    
    // Handle streaming responses (SSE)
    if (acceptHeader === 'text/event-stream') {
      // Check content type to ensure we're actually getting a stream
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);
      
      // Create a TransformStream to proxy the streaming response
      const { readable, writable } = new TransformStream();

      // Pipe the response body to the transform stream
      if (response.body) {
        console.log('------response.body--------')
        const reader = response.body.getReader();
        const writer = writable.getWriter();

        // Start the streaming process
        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log('Stream complete');
                await writer.close();
                break;
              }
              
              // 打印响应内容到控制台
              const text = new TextDecoder().decode(value);
              console.log('Streaming response chunk:', text);
              
              await writer.write(value);
            }
          } catch (error) {
            console.error('Error while streaming response:', error);
            writer.abort(error);
          }
        })();
      } else {
        console.error('No response body available for streaming');
        return NextResponse.json(
          { error: 'No response body available for streaming' },
          { status: 500 }
        );
      }

      // Return the streaming response
      return new NextResponse(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // For regular JSON responses
    const data = await response.json();

    // Return the proxied response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in A2A proxy:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

// Add a GET handler to test if the route is registered
export async function GET() {
  return NextResponse.json({ message: 'This endpoint requires a POST request with targetUrl and requestBody' }, { status: 405 });
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
