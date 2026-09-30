export default {
  async fetch(request, env) {
    // Allow requests from any website (CORS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const url = new URL(request.url);
    const name = url.searchParams.get("name") || "Guest";
    const room = url.searchParams.get("room") || "main-room";

    // Your LiveKit credentials
    const apiKey = "APIpzsmYcvxinqw";
    const apiSecret = "PEvHQ7wGAXHzfCyfd2gnA6YfcabmhhBXl4IWWLMUHpIA";

    // Create token
    const token = await createToken(apiKey, apiSecret, name, room);

    return new Response(JSON.stringify({ token }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};

async function createToken(apiKey, apiSecret, identity, roomName) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: apiKey,
    sub: identity,
    nbf: now,
    exp: now + 60 * 60 * 6, // 6 hours
    video: {
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  };

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const data = encoder.encode(headerB64 + "." + payloadB64);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `\( {headerB64}. \){payloadB64}.${sigB64}`;
}
