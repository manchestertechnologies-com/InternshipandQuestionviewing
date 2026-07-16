'use client';

import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Crop as CropIcon, ZoomIn, ZoomOut, Check, X, RefreshCw } from 'lucide-react';

interface ImageCropperProps {
  onCropComplete: (base64Url: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ onCropComplete, onCancel }: ImageCropperProps) {
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Reset crop
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getCroppedImg = () => {
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    if (!image || !completedCrop) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const pixelRatio = window.devicePixelRatio;
    canvas.width = completedCrop.width * scaleX * pixelRatio;
    canvas.height = completedCrop.height * scaleY * pixelRatio;

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    const base64Image = canvas.toDataURL('image/png', 1.0);
    onCropComplete(base64Image);
  };

  return (
    <div className="space-y-4 p-4 bg-zinc-950 rounded-xl border border-brand-border">
      <div className="flex justify-between items-center pb-2 border-b border-brand-border">
        <span className="text-xs font-bold text-brand-gold uppercase tracking-wider flex items-center gap-1.5">
          <CropIcon className="w-4 h-4" />
          <span>Image Cropper Studio</span>
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-zinc-500 hover:text-white transition cursor-pointer border-0 bg-transparent"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* File Input */}
        {!imgSrc && (
          <div className="border border-dashed border-brand-border hover:border-brand-gold/30 rounded-lg p-6 text-center cursor-pointer bg-black relative group">
            <input
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <p className="text-xs text-zinc-400">Select worksheet screenshot to crop option or diagram</p>
            <p className="text-[10px] text-brand-muted mt-1 uppercase font-semibold">PNG, JPG, or WEBP only</p>
          </div>
        )}

        {imgSrc && (
          <div className="space-y-4">
            {/* Cropping Area */}
            <div className="max-h-80 overflow-auto border border-brand-border bg-black/60 rounded-lg flex items-center justify-center p-2">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
              >
                <img
                  ref={imgRef}
                  alt="Crop source"
                  src={imgSrc}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    transition: 'transform 0.1s ease',
                    maxHeight: '300px',
                    objectFit: 'contain',
                  }}
                />
              </ReactCrop>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                  className="p-1.5 bg-zinc-900 border border-brand-border rounded text-brand-gold hover:bg-zinc-800 transition cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-brand-muted font-semibold">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                  className="p-1.5 bg-zinc-900 border border-brand-border rounded text-brand-gold hover:bg-zinc-800 transition cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImgSrc('')}
                  className="py-1.5 px-3 bg-zinc-900 border border-brand-border hover:bg-zinc-800 text-zinc-300 rounded text-xs font-semibold transition cursor-pointer"
                >
                  Change Image
                </button>
                <button
                  type="button"
                  disabled={!completedCrop?.width || !completedCrop?.height}
                  onClick={getCroppedImg}
                  className="py-1.5 px-3 bg-brand-gold hover:bg-brand-gold-hover text-black rounded text-xs font-bold transition disabled:opacity-50 cursor-pointer border-0 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Crop & Attach</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
