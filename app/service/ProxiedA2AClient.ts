import { A2AClient } from './A2AClient';
import { JSONRPCRequest } from '@/types/a2a_old';

/**
 * A client implementation for the A2A protocol that uses a server-side proxy
 * to avoid CORS issues when communicating with A2A servers.
 * This extends the original A2AClient but overrides the HTTP request methods.
 */
export class ProxiedA2AClient extends A2AClient {
  private useProxy: boolean;
  private proxyUrl: string;
  private customFetch: typeof fetch;
  private serverUrl: string;

  /**
   * Creates an instance of ProxiedA2AClient.
   * @param baseUrl The base URL of the A2A server endpoint.
   * @param useProxy Whether to use the proxy for requests (default: true).
   * @param proxyUrl The URL of the proxy server (default: '/api/a2a-proxy').
   */
  constructor(
    baseUrl: string,
    useProxy: boolean = true,
    proxyUrl: string = '/api/a2a-proxy',
    fetchImpl: typeof fetch = globalThis.fetch
  ) {
    super(baseUrl, fetchImpl);
    this.useProxy = useProxy;
    this.proxyUrl = proxyUrl;
    this.customFetch = fetchImpl.bind(globalThis); // Bind fetch to the global context
    this.serverUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  }

  /**
   * Helper method to create RPC errors
   */
  private createProxyRpcError(code: number, message: string, data?: unknown): Error {
    const error = new Error(message);
    Object.assign(error, { code, data, name: "RpcError" });
    return error;
  }

  /**
   * Helper to generate unique request IDs.
   * Uses crypto.randomUUID if available, otherwise a simple timestamp-based fallback.
   */
  private generateProxyRequestId(): string | number {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    } else {
      // Fallback for environments without crypto.randomUUID
      return Date.now();
    }
  }

  /**
   * Override the sendTask method to use the proxy
   */
  async sendTask(params: any): Promise<any> {
    if (!this.useProxy) {
      return super.sendTask(params);
    }
    return this.makeProxiedRequest("message/send", params);
  }

  /**
   * Override the getTask method to use the proxy
   */
  async getTask(params: any): Promise<any> {
    if (!this.useProxy) {
      return super.getTask(params);
    }

    return this.makeProxiedRequest("tasks/get", params);
  }

  /**
   * Override the cancelTask method to use the proxy
   */
  async cancelTask(params: any): Promise<any> {
    if (!this.useProxy) {
      return super.cancelTask(params);
    }

    return this.makeProxiedRequest("tasks/cancel", params);
  }

  /**
   * Override the sendTaskSubscribe method to use the proxy
   */
  sendTaskSubscribe(params: any): AsyncIterable<any> {
    if (!this.useProxy) {
      return super.sendTaskSubscribe(params);
    }
    return this.makeProxiedStreamingRequest("message/stream", params);
  }

  /**
   * Override the resubscribeTask method to use the proxy
   */
  resubscribeTask(params: any): AsyncIterable<any> {
    if (!this.useProxy) {
      return super.resubscribeTask(params);
    }

    return this.makeProxiedStreamingRequest("tasks/resubscribe", params);
  }

  /**
   * Helper method to make proxied JSON-RPC requests
   */
  private async makeProxiedRequest(method: string, params: any): Promise<any> {
    const requestId = this.generateProxyRequestId();
    const requestBody: JSONRPCRequest = {
      jsonrpc: "2.0",
      id: requestId,
      method: method,
      params: params,
    };

    try {
      console.log(`Using proxy for ${method} request to ${this.serverUrl}`);

      const response = await this.customFetch(this.proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUrl: this.serverUrl,
          acceptHeader: "application/json",
          requestBody: requestBody,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw this.createProxyRpcError(
          data.error.code || -32603,
          data.error.message || "Unknown error",
          data.error.data
        );
      }

      return data.result;
    } catch (error) {
      console.error("Error during proxied request:", error);
      throw this.createProxyRpcError(
        -32603,
        `Network error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error
      );
    }
  }

  /**
   * Helper method to make proxied streaming requests
   */
  private makeProxiedStreamingRequest(method: string, params: any): AsyncIterable<any> {
    const streamGenerator = async function* (
      this: ProxiedA2AClient
    ): AsyncIterable<any> {
      const requestId = this.generateProxyRequestId();
      const requestBody: JSONRPCRequest = {
        jsonrpc: "2.0",
        id: requestId,
        method: method,
        params: params,
      };

      try {
        console.log(`Using proxy for streaming ${method} request to ${this.serverUrl}`);

        const response = await this.customFetch(this.proxyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetUrl: this.serverUrl,
            acceptHeader: "text/event-stream",
            requestBody: requestBody,
          }),
        });

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          throw new Error(`HTTP error ${response.status}: ${errorText}`);
        }

        // Create a new response with the correct headers for streaming
        const streamResponse = new Response(response.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
          status: response.status,
          statusText: response.statusText,
        });

        if (!streamResponse.body) {
          throw new Error("Stream response body is null");
        }

        const reader = streamResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.replace(/\r/g, "").split("\n\n");
            buffer = lines.pop() || "";

            for (const message of lines) {
              if (message.startsWith("data: ")) {
                const dataLine = message.substring("data: ".length).trim();
                if (dataLine) {
                  try {
                    const parsedData = JSON.parse(dataLine);
                    if (parsedData.error) {
                      // Pass the error code and message directly from the server
                      throw this.createProxyRpcError(
                        parsedData.error.code || -32603,
                        parsedData.error.message || "Unknown error",
                        parsedData.error.data
                      );
                    }
                    yield parsedData.result;
                  } catch (parseError) {
                    console.error("Error parsing SSE data:", parseError, dataLine);
                  }
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        console.error("Error during proxied streaming request:", error);
        throw this.createProxyRpcError(
          -32603,
          `Network error: ${
            error instanceof Error ? error.message : String(error)
          }`,
          error
        );
      }
    }.bind(this)();

    return streamGenerator;
  }

  /**
   * Override the agentCard method to use the proxy for fetching agent cards
   */
  async agentCard(): Promise<any> {
    // If proxy is disabled, use the original implementation
    if (!this.useProxy) {
      return super.agentCard();
    }

    try {
      console.log(`Using proxy to fetch agent card from ${this.serverUrl}`);

      // Use the existing fetch-agent-card API endpoint
      const response = await this.customFetch('/api/fetch-agent-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: this.serverUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.agentCard;
    } catch (error) {
      console.error("Failed to fetch or parse agent card via proxy:", error);
      throw this.createProxyRpcError(
        -32603,
        `Could not retrieve agent card: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error
      );
    }
  }
}
