import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type AspectRatio = "1:1" | "3:4" | "4:3" | "16:9" | "9:16";
export type ImageSize = "512px" | "1K" | "2K" | "4K";

export type SceneType = "panoramic" | "mid-range";

export interface GenerationParams {
  analyzedStyle: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  sceneType: SceneType;
  productImage?: string; // base64
  customPrompt?: string;
}

export async function analyzeSceneStyle(imageContent: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          text: `请分析这张室内设计或场景图片，并为 AI 图像生成器提供详细的风格描述。
          请务必使用中文，并按以下几个维度分点列出（每个点前带上 · 符号）：
          
          · 装修风格：(例如：现代简约、法式复古、奶油风等)
          · 空间灯光：(描述光源来源、色温、光影氛围)
          · 色彩搭配：(列出主色调、辅助色及点缀色)
          · 材质纹理：(包含木质、石材、面料等细节)
          · 整体氛围：(如：温馨舒适、高级奢华、自然清新等)
          
          描述应专业且具有启发性，适合引导另一个 AI 完美复现该环境的审美细节。即使图片不是卧室，也要重点提取那些可以定义在高端主卧套房中的元素。
          仅返回分点列出的描述内容。`,
        },
        {
          inlineData: {
            data: imageContent.split(",")[1],
            mimeType: "image/png",
          },
        },
      ],
    },
  });

  return response.text || "";
}

export async function generateScene(params: GenerationParams) {
  const { analyzedStyle, aspectRatio, imageSize, sceneType, productImage, customPrompt } = params;

  let scenePrompt = "";
  if (sceneType === "panoramic") {
    scenePrompt = "an ultra-luxurious, visually saturated medium-shot architectural photograph of a master suite. The camera is positioned closer than a traditional wide-angle to focus more on the bed's immediate environment while still capturing the stunning architectural backdrop. The background MUST be a tour de force of interior design: floor-to-ceiling custom joinery, intricate 3D wall paneling with metallic inlays, and sophisticated material transitions. Every pixel must drip with detail and intentionality.";
  } else {
    // mid-range (Near View) - STRICT 90%+ PRODUCT RATIO & ANCHORED PLACEMENT
    scenePrompt = "a high-impact product macro shot. The bed MUST occupy 90% to 95% of the frame and MUST be firmly anchored against a solid, high-detail headboard wall. The remaining 5% to 10% of the frame MUST ONLY show the immediate texture of this wall (e.g., stone, wood, or fabric panels). ABSOLUTELY NO windows, NO sofas, and NO distant room views should be visible in the background sliver. The camera is so close that only the product and its immediate wall anchor are visible.";
  }

  const fullPrompt = `Task: You are the most elite architectural and interior photographer. Your goal is to generate an 8k image that captures a high-end bedroom environment while maintaining absolute product dominance for the Near View shot.

  [CORE STYLE DATA (Ignore any non-bedroom labels)]: ${analyzedStyle}
  [SHOT TYPE]: ${scenePrompt}
  [CUSTOM INPUT]: ${customPrompt || "None"}
  
  [CRITICAL VISUAL CONSTRAINTS]:
  0. COMPOSITION MANDATE: ${sceneType === "mid-range" ? "STRICT 90/10 RATIO: The product (bed) MUST occupy 90%+ of the frame. The background sliver (<10%) MUST be a solid wall. ABSOLUTELY NO windows, NO sofas, and NO distant room views in the background. Zoom in obsessively on the bed." : "Intimate medium-shot architectural view. Vary camera angles (e.g., three-quarter view, high-angle bed-down, or side profile)."}
  1. STRICT BEDROOM LOCK (ZERO-TOLERANCE POLICY): The target environment is EXCLUSIVELY a private, high-end BEDROOM. COMPLETELY DISCARD and REMOVE any concepts of 'living room', 'parlor', 'lounge', 'kitchen', or 'public space' from the analyzed style data. 
     - FORBIDDEN OBJECTS: ABSOLUTELY NO sofas, NO large coffee tables, NO TV stands, NO dining tables, NO kitchen counters, NO entrance hallways. 
     - REQUIRED ELEMENTS: The scene MUST contain bedroom-specific architecture: a dedicated headboard wall, symmetrical nightstands with reading lamps, and a private, intimate atmosphere designed for sleep.
  2. ARCHITECTURAL DIVERSITY & GLOBAL SETTINGS (STRICT - ELIMINATE REPETITIVE TEMPLATES): 
     Every generation MUST place the bedroom in a radically different geographic location and architectural context. DO NOT use consistent room templates. Strictly cycle through:
     - SKYLINE PENTHOUSE: Ultra-high-rise with panoramic glass walls overlooking a glowing megacity at dusk.
     - FOREST/TROPICAL SANCTUARY: An organic, semi-open architecture with dense greenery or tropical rain patterns visible outside.
     - SNOWY ALPINE RETREAT: A warm, timber-clad suite with a massive stone fireplace and views of glaciated mountains.
     - MEDITERRANEAN CAVE / ORGANIC: Sculptural white-plaster curved walls, arched entrances, and rhythmic organic shapes.
     - MODERN INDUSTRIAL LOFT: Double-height ceilings, exposed brick or concrete textures, and massive black-framed factory windows.
     - DESERT MIRAGE: Minimalist earth-toned structures with sculptural desert views and extreme play of harsh sunlight and deep shadows.
  3. SPATIAL GEOMETRY & LAYOUT: Experiment with non-standard bed placements: bed on a raised stone platform (Split-level), bed positioned as an 'Island' in the center of a circular room, or bed recessed into a custom-designed architectural alcove.
  4. ELIMINATE AI MONOTONY: Every wall must have architectural interest. No flat/plain surfaces. Use ray-traced physical accuracy for all background light-spills.
  4. LIGHTING COMPLEXITY: Multi-source cinematic lighting (natural window spill + warm recessed LEDs + designer bedside spots). Unique shadows for each geometry.
  5. ANTI-AI SHEEN: Introduction of realistic micro-imperfections (textile grain, natural shadows).
  6. PRODUCT FIDELITY: The bed from the product image must be reproduced with 100% accuracy.`;

  const contents = {
    parts: [
      { text: fullPrompt },
    ] as any[],
  };

  if (productImage) {
    contents.parts.push({
      inlineData: {
        data: productImage.split(",")[1], // Remove data:image/png;base64,
        mimeType: "image/png",
      },
    });
    contents.parts[0].text += " Use the provided product image and place it realistically in the scene.";
  }

  try {
    // Switch to higher end model for 2K/4K if needed
    const modelName = (imageSize === "2K" || imageSize === "4K") ? "gemini-3.1-flash-image-preview" : "gemini-2.5-flash-image";

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        imageConfig: {
          aspectRatio,
          imageSize: (imageSize === "512px") ? "512px" : (imageSize === "1K" ? "1K" : (imageSize === "2K" ? "2K" : "4K")),
        },
        seed: Math.floor(Math.random() * 1000000),
      },
    });

    const candidates = response.candidates || [];
    if (candidates.length === 0) {
      throw new Error("Model returned no candidates. This might be due to safety filters.");
    }

    for (const part of candidates[0].content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    if (response.text) {
      console.warn("Model returned text instead of an image:", response.text);
      throw new Error(`Model refused to generate image: ${response.text}`);
    }

    throw new Error("No image generated in response. The model might have blocked the request due to safety policies.");
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    
    // Handle specific quota/billing errors
    const errorMessage = error?.message || "";
    if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429")) {
      if (
        errorMessage.includes("prepayment credits are depleted") || 
        errorMessage.includes("spending cap") ||
        errorMessage.includes("check your plan and billing details") ||
        errorMessage.includes("monthly spending cap")
      ) {
        throw new Error("您的 Gemini API 已达到每月支出建议上限。请前往 AI Studio (https://ai.studio/spend) 调整您的项目支出限制或检查账单余额。");
      }
      throw new Error("API 调用频率过快或配额不足。如果您使用的是免费版，请稍等一分钟再试；如果是付费版，请检查配备设置。");
    }

    if (errorMessage.includes("UNAVAILABLE") || errorMessage.includes("503")) {
      throw new Error("模型目前请求量过大，出现暂时性繁忙（503）。这通常是暂时性的，请在几秒钟后再次点击生成按钮重试。");
    }
    
    throw error;
  }
}
