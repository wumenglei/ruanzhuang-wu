import React from 'react';
import { Label } from '@/components/ui/label';
import { AspectRatio, ImageSize } from '@/src/lib/gemini';
import { Separator } from '@/components/ui/separator';

import { Textarea } from '@/components/ui/textarea';

interface SceneCustomizerProps {
  analyzedStyle: string;
  setAnalyzedStyle: (style: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  imageSize: ImageSize;
  setImageSize: (size: ImageSize) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
}

const ASPECT_RATIOS: { id: AspectRatio; label: string }[] = [
  { id: '1:1', label: '1:1 正方形' },
  { id: '3:4', label: '3:4 纵向' },
  { id: '4:3', label: '4:3 横向' },
  { id: '16:9', label: '16:9 宽屏' },
];

const IMAGE_SIZES: { id: ImageSize; label: string }[] = [
  { id: '1K', label: '1K (基础)' },
  { id: '2K', label: '2K (高清 - 推荐)' },
  { id: '4K', label: '4K (超清 - 推荐)' },
];

export function SceneCustomizer({
  analyzedStyle,
  setAnalyzedStyle,
  aspectRatio,
  setAspectRatio,
  imageSize,
  setImageSize,
  customPrompt,
  setCustomPrompt,
}: SceneCustomizerProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-semibold">分析出的风格 (Analyzed Style)</Label>
        <Textarea 
          value={analyzedStyle}
          onChange={(e) => setAnalyzedStyle(e.target.value)}
          className="resize-none h-24 text-sm bg-muted/20"
          placeholder="AI 正在分析风格..."
        />
        <p className="text-[10px] text-muted-foreground">
          基于您第一步上传的场景图分析得到的风格描述。
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-semibold">自定义描述 (可选)</Label>
        <Textarea 
          placeholder="例如：人坐在床上，阳光洒在窗台上..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="resize-none h-20 text-sm"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-semibold">画面比例 (Aspect Ratio)</Label>
        <div className="grid grid-cols-2 gap-2">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r.id}
              onClick={() => setAspectRatio(r.id)}
              className={`p-2 text-sm rounded-lg border-2 transition-all ${
                aspectRatio === r.id 
                  ? "border-primary bg-primary/5 font-medium" 
                  : "border-muted hover:border-muted-foreground/30 bg-card"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-semibold">分辨率 (Resolution)</Label>
        <div className="grid grid-cols-2 gap-2">
          {IMAGE_SIZES.map((s) => (
            <button
              key={s.id}
              onClick={() => setImageSize(s.id)}
              className={`p-2 text-sm rounded-lg border-2 transition-all ${
                imageSize === s.id 
                  ? "border-primary bg-primary/5 font-medium" 
                  : "border-muted hover:border-muted-foreground/30 bg-card"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
