import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));

// SaaS Backend Proxy Target
// Version: 1.0.1 (Safest Update)
const SAAS_TARGET = process.env.SAAS_TARGET || "https://aibigtree.com";

const proxyRequest = async (req: express.Request, res: express.Response, targetPath: string) => {
  const targetUrl = `${SAAS_TARGET}${targetPath}`;
  console.log(`[Proxy] ${req.method} ${targetUrl}`);
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000, // Increased to 20s
    });
    
    // Explicitly handle cases where target returns a string that starts with "The page" or "<"
    if (typeof response.data === 'string') {
      const trimmed = response.data.trim();
      if (trimmed.startsWith('<') || trimmed.startsWith('The page')) {
        console.warn(`[Proxy] Target successful status ${response.status} but content is HTML/Text:`, trimmed.substring(0, 100));
        return res.status(response.status || 200).json({
          success: false,
          message: `SaaS 服务地址正确但返回了非 JSON 页面内容。可能是由于服务未启动或被拦截。`
        });
      }
    }

    console.log(`[Proxy] Success: ${response.status}`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data;
    console.error(`[Proxy] Error ${status} for ${targetPath}:`, error?.message);
    
    // Comprehensive check for ANY non-JSON strings in error block
    if (typeof errorData === 'string') {
      const trimmed = errorData.trim();
      if (trimmed.startsWith('<') || trimmed.startsWith('The page') || trimmed.includes('DOCTYPE')) {
        console.error(`[Proxy] backend returned raw HTML on error:`, trimmed.substring(0, 100));
        return res.status(status).json({
          success: false,
          message: `SaaS 服务接口地址失效或返回错误页面 (HTTP ${status})。请检查后端 API 状态。`
        });
      }
    }

    res.status(status).json(errorData || { 
      success: false, 
      message: error.message || "SaaS 代理请求链路中断" 
    });
  }
};

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// SaaS API Routes
app.post("/api/tool/launch", (req, res) => proxyRequest(req, res, "/api/tool/launch"));
app.post("/api/tool/verify", (req, res) => proxyRequest(req, res, "/api/tool/verify"));
app.post("/api/tool/consume", (req, res) => proxyRequest(req, res, "/api/tool/consume"));

// Catch-all API 404 to ensure JSON response
app.all("/api/*", (req, res) => {
  res.status(404).json({ success: false, message: `API route not found: ${req.url}` });
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
