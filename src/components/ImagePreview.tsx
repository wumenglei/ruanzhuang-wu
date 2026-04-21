import React from 'react';
import { Download, RefreshCw, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './../lib/utils';
import * as Dialog from '@radix-ui/react-dialog';

interface ImagePreviewProps {
  panoramicUrl: string | null;
  midRangeUrl: string | null;
  isGenerating: boolean;
  onRegenerate: () => void;
  aspectRatio: string;
}

export function ImagePreview({ panoramicUrl, midRangeUrl, isGenerating, onRegenerate, aspectRatio }: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const handleDownload = (url: string | null, name: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const aspectClass = aspectRatio.replace(':', '/');

  const ImageFrame = ({ url, title, name }: { url: string | null; title: string; name: string }) => (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {url && !isGenerating && (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDownload(url, name); }}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setPreviewUrl(url); }}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      <div 
        className={cn(
          "relative w-full rounded-xl overflow-hidden bg-muted/20 border border-muted flex items-center justify-center transition-all duration-500 shadow-inner",
          url && !isGenerating && "cursor-zoom-in hover:ring-2 ring-primary/20 bg-white"
        )}
        style={{ aspectRatio: aspectClass }}
        onClick={() => url && !isGenerating && setPreviewUrl(url)}
      >
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-medium text-muted-foreground animate-pulse uppercase tracking-widest">正在生成中...</p>
            </motion.div>
          ) : url ? (
            <motion.img
              key="image"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              src={url}
              alt={title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-center p-4">
              <RefreshCw className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">等待生成</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Universal Grid: Two images per row on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ImageFrame url={panoramicUrl} title="全景展示 (Panoramic)" name="panoramic" />
        <ImageFrame url={midRangeUrl} title="近景主体 (Near View)" name="near-view" />
      </div>
      
      { (panoramicUrl || midRangeUrl) && !isGenerating && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onRegenerate} className="rounded-full px-8">
            <RefreshCw className="w-4 h-4 mr-2" />
            重新生成全部场景
          </Button>
        </div>
      )}

      {/* Modal Preview */}
      <Dialog.Root open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] h-[95vh] z-[101] flex items-center justify-center outline-none animate-in zoom-in-95 duration-300">
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 z-10 rounded-full h-12 w-12">
                  <X className="w-6 h-6" />
                </Button>
              </Dialog.Close>
              
              {previewUrl && (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              )}
              
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                <Button 
                  onClick={() => handleDownload(previewUrl, 'preview')}
                  className="bg-white text-black hover:bg-white/90 px-8 rounded-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载高清图
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
