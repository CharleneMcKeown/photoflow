const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL || "";

const SIZES = [320, 640, 1024, 1920, 2560] as const;

export type ImageSize = (typeof SIZES)[number];

export function getImageUrl(
  r2Key: string,
  size: ImageSize,
  format: "webp" | "jpg"
): string {
  return `${R2_PUBLIC_URL}/${r2Key}-${size}.${format}`;
}

export function getSrcSet(r2Key: string, format: "webp" | "jpg"): string {
  return SIZES.map((s) => `${getImageUrl(r2Key, s, format)} ${s}w`).join(", ");
}

export { SIZES };
