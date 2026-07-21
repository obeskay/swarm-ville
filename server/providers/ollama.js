import http from "http";

export async function generateOllamaResponse(prompt, model = "llama3") {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      model,
      prompt,
      stream: false
    });

    const req = http.request({
      hostname: "localhost",
      port: 11434,
      path: "/api/generate",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      },
      timeout: 3000
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          resolve(json.response || null);
        } catch {
          resolve(null);
        }
      });
    });

    req.on("error", () => resolve(null)); // Graceful fallback if Ollama not running
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}
