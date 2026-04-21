import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageUpload: (base64: string) => void;
  onClear: () => void;
}

export function ImageUploader({ onImageUpload, onClear }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onImageUpload(base64);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    multiple: false,
  } as any);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onClear();
  };

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative group rounded-xl overflow-hidden border-2 border-dashed border-muted-foreground/20 aspect-video bg-muted/30 flex items-center justify-center">
          <img 
            src={preview} 
            alt="Product Preview" 
            className="max-h-full max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button variant="destructive" size="sm" onClick={handleClear}>
              <X className="w-4 h-4 mr-2" />
              移除图片
            </Button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 aspect-video flex flex-col items-center justify-center gap-4",
            isDragActive 
              ? "border-primary bg-primary/5 scale-[0.99]" 
              : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="p-4 rounded-full bg-primary/10 text-primary">
            <Upload className="w-8 h-8" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium">
              {isDragActive ? "请在此处松开图片" : "点击或拖拽产品图片至此"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              支持 JPG, PNG, JPEG 格式
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
