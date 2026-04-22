import { useState, useEffect } from "react";
import { ImageUploader } from "./components/ImageUploader";
import { SceneCustomizer } from "./components/SceneCustomizer";
import { ImagePreview } from "./components/ImagePreview";
import { SceneAnalyzer } from "./components/SceneAnalyzer";
import { generateScene, AspectRatio, ImageSize } from "./lib/gemini";
import { SaasService, SaasUser, SaasTool } from "./lib/saas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Wand2, Info, Maximize2, RefreshCw, User, Coins, ArrowLeft } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function App() {
  const [step, setStep] = useState<"analysis" | "generation">("analysis");
  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
  const [analyzedStyle, setAnalyzedStyle] = useState("");
  
  const [productImage, setProductImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [imageSize, setImageSize] = useState<ImageSize>("2K");
  const [customPrompt, setCustomPrompt] = useState("");
  const [panoramicImage, setPanoramicImage] = useState<string | null>(null);
  const [midRangeImage, setMidRangeImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [saasUser, setSaasUser] = useState<SaasUser | null>(null);
  const [saasTool, setSaasTool] = useState<SaasTool | null>(null);

  useEffect(() => {
    // 1. SaaS Launch (First Step in 3-step flow)
    SaasService.init(() => {
      const launchData = SaasService.getLaunchData();
      if (launchData) {
        setSaasUser(launchData.user);
        setSaasTool(launchData.tool);
      }
    });
  }, []);

  const handleGenerate = async () => {
    if (!productImage) {
      toast.error("请先上传床具产品图片。");
      return;
    }

    setIsGenerating(true);
    try {
      // 2. SaaS Verify (Second Step in 3-step flow)
      await SaasService.verify();

      // 3. Prompt Merging Logic
      const initData = SaasService.getInitData();
      const s_context = initData?.context || "";
      const s_prompt = initData?.prompt?.join(", ") || "";
      const combinedPrompt = `${customPrompt} ${s_context} ${s_prompt}`.trim();

      const panoramic = await generateScene({
        analyzedStyle,
        aspectRatio,
        imageSize,
        sceneType: "panoramic",
        productImage,
        customPrompt: combinedPrompt,
      });
      setPanoramicImage(panoramic);

      const midRange = await generateScene({
        analyzedStyle,
        aspectRatio,
        imageSize,
        sceneType: "mid-range",
        productImage,
        customPrompt: combinedPrompt,
      });
      setMidRangeImage(midRange);

      // 4. SaaS Consume (Final Step in 3-step flow)
      await SaasService.consume();
      const updatedLaunch = SaasService.getLaunchData();
      if (updatedLaunch) setSaasUser({ ...updatedLaunch.user });

      toast.success("场景生成成功！");
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || "生成场景失败，请稍后重试。";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-primary/10">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">床具摆放助手</h1>
          </div>
          
          <div className="flex items-center gap-6">
            {saasUser && (
              <div className="hidden md:flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{saasUser.name}</span>
                </div>
                <div className="w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-2 text-primary">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm font-bold">{saasUser.integral} 积分</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Info className="w-4 h-4 mr-2" />
                使用指南
              </Button>
              {saasTool && (
                <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-md text-xs font-bold border border-orange-100">
                  每次消耗 {saasTool.integral} 积分
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {step === "analysis" ? (
          <SceneAnalyzer 
            onAnalysisComplete={(image, result) => {
              setSceneImageUrl(image);
              setAnalyzedStyle(result);
              setStep("generation");
            }} 
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Controls */}
            <div className="lg:col-span-4 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setStep("analysis")} className="text-slate-500 hover:text-slate-900 px-0">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    返回风格分析
                  </Button>
                </div>
                <Card className="shadow-sm border-muted/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">产品上传 (Product Upload)</CardTitle>
                    <CardDescription>上传您的床类产品图片。</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageUploader 
                      onImageUpload={setProductImage} 
                      onClear={() => setProductImage(null)} 
                    />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="shadow-sm border-muted/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">场景定制 (Customization)</CardTitle>
                    <CardDescription>选择比例和分辨率设置。</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SceneCustomizer 
                      analyzedStyle={analyzedStyle} 
                      setAnalyzedStyle={setAnalyzedStyle}
                      aspectRatio={aspectRatio}
                      setAspectRatio={setAspectRatio}
                      imageSize={imageSize}
                      setImageSize={setImageSize}
                      customPrompt={customPrompt}
                      setCustomPrompt={setCustomPrompt}
                    />
                    <Button 
                      className="w-full mt-8 h-12 text-base font-semibold shadow-lg shadow-primary/20" 
                      onClick={handleGenerate}
                      disabled={isGenerating || !productImage}
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          正在生成中...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5 mr-2" />
                          立即生成场景
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column: Preview */}
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <ImagePreview 
                  panoramicUrl={panoramicImage} 
                  midRangeUrl={midRangeImage}
                  isGenerating={isGenerating}
                  onRegenerate={handleGenerate}
                  aspectRatio={aspectRatio}
                />
              
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-muted/50 shadow-sm flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI 智能生成</p>
                    <p className="text-sm text-slate-600 mt-0.5">先进的场景构图与光影渲染技术。</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-muted/50 shadow-sm flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-50 text-green-600">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">超清画质</p>
                    <p className="text-sm text-slate-600 mt-0.5">支持高达 4K 分辨率的高清导出。</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-muted/50 shadow-sm flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">自动适配</p>
                    <p className="text-sm text-slate-600 mt-0.5">智能产品摆放与比例自动缩放。</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 床具摆放助手. 保留所有权利。
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-slate-900 transition-colors">隐私政策</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-slate-900 transition-colors">服务条款</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-slate-900 transition-colors">联系支持</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
