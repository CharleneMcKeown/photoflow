const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL || "";

const SIZES = [320, 640, 1024, 1536, 2048, 2560, 3840] as const;

export type ImageSize = (typeof SIZES)[number];
export type ImageFormat = "avif" | "webp" | "jpg";

export function getImageUrl(
  r2Key: string,
  size: ImageSize,
  format: ImageFormat
): string {
  return `${R2_PUBLIC_URL}/${r2Key}-${size}.${format}`;
}

export function getSrcSet(r2Key: string, format: ImageFormat): string {
  return SIZES.map((s) => `${getImageUrl(r2Key, s, format)} ${s}w`).join(", ");
}

export { SIZES };
