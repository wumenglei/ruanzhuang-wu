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
      timeout: 15000, // 15s timeout
    });
    
    // Ensure the response is actually JSON if we are going to send it as such
    if (typeof response.data === 'string' && (response.data.trim().startsWith('<') || response.data.trim().startsWith('The page'))) {
      console.warn(`[Proxy] Target returned non-JSON for successful status ${response.status}`);
      return res.status(response.status || 200).json({
        success: false,
        message: `SaaS 服务返回了非 JSON 响应。请检查 SaaS 后端配置。`
      });
    }

    console.log(`[Proxy] Success: ${response.status}`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data;
    console.error(`[Proxy] Error ${status} for ${targetPath}:`, error?.message);
    
    // Comprehensive check for non-JSON error responses
    const isHtml = typeof errorData === 'string' && (
      errorData.includes('<!DOCTYPE html>') || 
      errorData.includes('<html') || 
      errorData.includes('The page')
    );

    if (isHtml) {
      return res.status(status).json({
        success: false,
        message: `SaaS 服务返回了非 JSON 响应 (${status})。可能是地址错误、路径不存在或后端服务异常。`
      });
    }

    res.status(status).json(errorData || { 
      success: false, 
      message: error.message || "SaaS 代理转发请求失败" 
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
