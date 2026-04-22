/**
 * SaaS 接口对接与积分校验服务 (V4-3Step)
 */

export interface SaasUser {
  name: string;
  enterprise: string;
  integral: number;
}

export interface SaasTool {
  name: string;
  integral: number;
}

export interface SaasInitData {
  userId: string;
  toolId: string;
  context?: string;
  prompt?: string[];
  callbackUrl?: string;
}

export class SaasService {
  private static initData: SaasInitData | null = null;
  private static launchData: { user: SaasUser; tool: SaasTool } | null = null;

  /**
   * 初始化：监听 postMessage 信号并自动执行 launch
   */
  static init(onReady: () => void) {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SAAS_INIT') {
        const { userId, toolId, context, prompt, callbackUrl } = event.data;
        
        // 过滤无效 ID
        if (userId === "null" || userId === "undefined" || !userId) return;
        if (toolId === "null" || toolId === "undefined" || !toolId) return;

        this.initData = { userId, toolId, context, prompt, callbackUrl };
        console.log("SaaS Init Received:", this.initData);
        
        // 自动触发启动接口
        this.launch().then(onReady).catch(console.error);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // 同时也尝试从 URL 参数中获取（兼容某些嵌入方式）
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const toolId = urlParams.get('toolId');
    if (userId && toolId && userId !== "null" && toolId !== "null") {
      this.initData = { userId, toolId };
      this.launch().then(onReady).catch(console.error);
    }
  }

  /**
   * 调用后台代理接口
   */
  private static async request(path: string, body: any) {
    // 改为相对路径，由本地 server.ts 代理转发
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "SaaS 接口请求失败");
    }
    return result.data;
  }

  /**
   * 1. 启动阶段
   */
  static async launch() {
    if (!this.initData) return null;
    const data = await this.request("/api/tool/launch", {
      userId: this.initData.userId,
      toolId: this.initData.toolId
    });
    this.launchData = data;
    return data;
  }

  /**
   * 2. 校验阶段 (不扣分)
   */
  static async verify() {
    if (!this.initData) return true; // 未启用 SaaS 则跳过
    return await this.request("/api/tool/verify", {
      userId: this.initData.userId,
      toolId: this.initData.toolId
    });
  }

  /**
   * 3. 扣费阶段 (生成成功后)
   */
  static async consume() {
    if (!this.initData) return null;
    return await this.request("/api/tool/consume", {
      userId: this.initData.userId,
      toolId: this.initData.toolId
    });
  }

  static getInitData() { return this.initData; }
  static getLaunchData() { return this.launchData; }
}
