import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Fonnte WhatsApp Gateway proxy endpoint (eliminates browser CORS issues)
  app.post("/api/fonnte/send", async (req, res) => {
    try {
      const { target, message, token } = req.body;
      const apiToken = token || "U9M+VF45H6DNsgIZdHkS";

      if (!target || !message) {
        return res.status(400).json({ status: false, message: "Target and message are required" });
      }

      const formData = new URLSearchParams();
      formData.append("target", target.trim());
      formData.append("message", message);
      formData.append("countryCode", "62");

      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: apiToken,
        },
        body: formData,
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      res.status(response.ok ? 200 : 400).json(responseData);
    } catch (error: any) {
      console.error("Fonnte API Proxy Error:", error);
      res.status(500).json({
        status: false,
        message: error.message || "Failed to reach Fonnte WhatsApp gateway",
      });
    }
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "Neo PoRT3 RT.03 RW.14 BPTW" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Neo PoRT3 Server running on http://localhost:${PORT}`);
  });
}

startServer();
