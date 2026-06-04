"use client";

import { useState } from "react";
import { getSrcSet, getImageUrl } from "@/lib/r2";

interface ResponsivePhotoProps {
  r2Key: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

export default function ResponsivePhoto({
  r2Key,
  alt,
  width,
  height,
  blurDataURL,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1024px",
  priority = false,
  className = "",
}: ResponsivePhotoProps) {
  const [loaded, setLoaded] = useState(false);
  const aspectRatio = width / height;

  return (
    <div className="relative overflow-hidden" style={{ aspectRatio }}>
      {/* Blur placeholder */}
      {blurDataURL && !loaded && (
        <img
          src={blurDataURL}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg"
        />
      )}

      <picture>
        <source type="image/webp" srcSet={getSrcSet(r2Key, "webp", width)} sizes={sizes} />
        <source type="image/jpeg" srcSet={getSrcSet(r2Key, "jpg", width)} sizes={sizes} />
        <img
          src={getImageUrl(r2Key, 1024, "jpg")}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          onLoad={() => setLoaded(true)}
          className={`relative w-full h-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${className}`}
        />
      </picture>
    </div>
  );
}
