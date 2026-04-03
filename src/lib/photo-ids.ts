export function compositeId(albumSlug: string, photoId: string): string {
  return `${albumSlug}--${photoId}`;
}

export function parseCompositeId(id: string): {
  albumSlug: string;
  photoId: string;
} | null {
  const sep = id.indexOf("--");
  if (sep === -1) return null;
  return {
    albumSlug: id.slice(0, sep),
    photoId: id.slice(sep + 2),
  };
}
