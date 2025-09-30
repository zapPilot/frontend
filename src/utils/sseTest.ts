/**
 * Simple SSE connection test utility
 * Use this to test if the SSE endpoint is working
 */

/* eslint-disable no-console */

export function testSSEConnection(
  intentId: string,
  baseUrl: string = "http://127.0.0.1:3002"
) {
  const streamUrl = `${baseUrl}/api/unifiedzap/${intentId}/stream`;

  console.log("🧪 Testing SSE connection to:", streamUrl);

  const eventSource = new EventSource(streamUrl);

  eventSource.onopen = () => {
    console.log("✅ SSE connection opened successfully");
  };

  eventSource.onmessage = event => {
    console.log("📨 SSE message received:", event.data);
    try {
      const data = JSON.parse(event.data);
      console.log("📊 Parsed SSE data:", data);
    } catch (e) {
      console.log("❌ Failed to parse SSE data:", e);
    }
  };

  eventSource.onerror = event => {
    console.log("❌ SSE connection error:", {
      event,
      readyState: eventSource.readyState,
      url: streamUrl,
    });
  };

  // Return cleanup function
  return () => {
    console.log("🧹 Cleaning up SSE test connection");
    eventSource.close();
  };
}

// Example usage:
// const cleanup = testSSEConnection('unifiedZap_1758955938583_6EA82B_3f51a89d716f7c54');
// setTimeout(cleanup, 10000); // Clean up after 10 seconds
