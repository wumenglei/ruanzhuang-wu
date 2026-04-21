/**
 * SaaS Service for handling integral validation and consumption.
 * Following the 3-Step Flow defined in API_SPEC.md
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
   * Listen for postMessage to initialize SaaS data
   */
  static init(onReady: () => void) {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SAAS_INIT') {
        const { userId, toolId, context, prompt, callbackUrl } = event.data;
        
        // Filter out "null" or "undefined" strings as per spec
        if (!userId || userId === 'null' || userId === 'undefined') return;
        if (!toolId || toolId === 'null' || toolId === 'undefined') return;

        this.initData = { userId, toolId, context, prompt, callbackUrl };
        console.log('[SaaS] Initialized:', this.initData);
        
        // Step 1: Launch
        this.launch().then(onReady).catch(err => {
          console.error('[SaaS] Launch failed:', err);
          onReady(); // Continue even if launch fails to allow local testing
        });
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Check if we already have data in URL (optional fallback)
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const toolId = urlParams.get('toolId');
    if (userId && toolId) {
      this.initData = { userId, toolId };
      this.launch().then(onReady);
    }
  }

  /**
   * Step 1: Launch - Initialize user and tool data
   */
  private static async launch() {
    if (!this.initData) return;
    
    try {
      const response = await fetch('/api/tool/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.initData.userId,
          toolId: this.initData.toolId
        })
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[SaaS] Received non-JSON response:', text);
        return;
      }

      const result = await response.json();
      if (result.success) {
        this.launchData = result.data;
      }
    } catch (error) {
      console.error('[SaaS] Error in launch:', error);
    }
  }

  /**
   * Step 2: Verify - Check if user has enough integral
   */
  static async verify() {
    if (!this.initData) return; // Skip if not in SaaS environment

    try {
      const response = await fetch('/api/tool/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.initData.userId,
          toolId: this.initData.toolId
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('SaaS 服务接口没有返回正确的 JSON 数据（可能是由于 404 错误或服务维护）。');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '积分不足');
      }
      return result.data;
    } catch (error: any) {
      console.error('[SaaS] Error in verify:', error);
      throw error;
    }
  }

  /**
   * Step 3: Consume - Deduct integral after success
   */
  static async consume() {
    if (!this.initData) return;

    try {
      const response = await fetch('/api/tool/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.initData.userId,
          toolId: this.initData.toolId
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[SaaS] Consume failed: Non-JSON response');
        return;
      }

      const result = await response.json();
      if (result.success && this.launchData) {
        this.launchData.user.integral = result.data.currentIntegral;
      }
      return result.data;
    } catch (error) {
      console.error('[SaaS] Error in consume:', error);
    }
  }

  static getLaunchData() {
    return this.launchData;
  }

  static getInitData() {
    return this.initData;
  }
}
