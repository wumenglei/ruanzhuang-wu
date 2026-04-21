import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";
import { analyzeSceneStyle } from "../lib/gemini";
import { RefreshCw, Wand2, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface SceneAnalyzerProps {
  onAnalysisComplete: (image: string, analysis: string) => void;
}

export function SceneAnalyzer({ onAnalysisComplete }: SceneAnalyzerProps) {
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [subStep, setSubStep] = useState<"upload" | "result">("upload");

  const handleAnalyze = async () => {
    if (!sceneImage) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeSceneStyle(sceneImage);
      setAnalysis(result);
      setSubStep("result");
      toast.success("场景分析完成！");
    } catch (error: any) {
      console.error(error);
      toast.error("场景分析失败，请重试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-[80vh] flex items-center justify-center">
      <AnimatePresence mode="wait">
        {subStep === "upload" ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl text-center"
          >
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 uppercase tracking-wider">
                Step 01: Atmosphere Analysis
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-slate-900">
                上传场景灵感图
              </h2>
              <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
                上传一张卧室、样板间或任何室内外空间的图片，AI 将通过图像识别提取其独特的光影与材质指纹。
              </p>
            </div>

            <Card className="border-muted/50 shadow-2xl overflow-hidden bg-white/80 backdrop-blur-xl border-2">
              <CardContent className="p-8">
                <ImageUploader 
                  onImageUpload={setSceneImage} 
                  onClear={() => setSceneImage(null)} 
                />
                
                <Button 
                  onClick={handleAnalyze} 
                  className="w-full mt-8 h-14 text-lg font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/95 transition-all"
                  disabled={!sceneImage || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                      正在提取空间美学资产...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-6 h-6 mr-3" />
                      开始 AI 风格分析
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mb-4 uppercase tracking-wider">
                  Analysis Complete
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-slate-900 leading-tight">
                  空间指纹已经提取
                </h2>
                <p className="text-lg text-slate-500 leading-relaxed">
                  AI 已经完成了对图片的深度解析。您可以检查并微调这些风格标签，确保它们符合您的设计愿景。
                </p>
              </div>

              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src={sceneImage!} 
                  alt="Source" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <div className="text-white text-sm font-medium">Source Inspiration Image</div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setSubStep("upload")}
                className="rounded-full h-12 px-6"
              >
                重新上传
              </Button>
            </div>

            <Card className="border-muted/50 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden border-2 rounded-[32px]">
              <CardHeader className="pb-4 bg-slate-50 border-b">
                <CardTitle className="text-2xl font-bold flex items-center justify-between">
                  风格方案 (Style Schema)
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </CardTitle>
                <CardDescription className="text-base">
                  根据图片生成的定制化空间描述。
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="min-h-[300px]">
                  <Textarea
                    value={analysis}
                    onChange={(e) => setAnalysis(e.target.value)}
                    placeholder="分析结果将显示在此..."
                    className="w-full h-full min-h-[350px] resize-none border-none focus-visible:ring-0 shadow-none p-0 text-slate-700 leading-[1.8] text-lg font-medium selection:bg-primary/20"
                    disabled={isAnalyzing}
                  />
                </div>
                
                <div className="pt-6 border-t">
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full h-16 text-xl font-bold group rounded-2xl shadow-2xl shadow-primary/30"
                    disabled={!analysis || isAnalyzing}
                    onClick={() => onAnalysisComplete(sceneImage!, analysis)}
                  >
                    确认并开始生成产品图
                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
