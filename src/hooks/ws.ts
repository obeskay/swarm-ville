// Minimal WebSocket client - <30 lines
export function createWS(url: string, onEvent: (e: { type: string; data?: unknown }) => void) {
  const ws = new WebSocket(url);
  ws.onopen = () => console.log("[WS] Connected");
  ws.onmessage = (ev) => {
    try { onEvent(JSON.parse(ev.data)); }
    catch { console.error("[WS] Parse error"); }
  };
  ws.onclose = () => setTimeout(() => createWS(url, onEvent), 3000);
  return ws;
}
