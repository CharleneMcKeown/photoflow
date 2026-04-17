import photosData from "../../content/photos.json";

export interface PhotoExif {
  camera: string | null;
  lens: string | null;
  focalLength: string | null;
  aperture: string | null;
  shutter: string | null;
  iso: number | null;
}

export interface Photo {
  id: string;
  albumSlug: string;
  filename: string;
  r2Key: string;
  title: string;
  description: string;
  exif: PhotoExif;
  blurDataURL: string;
  width: number;
  height: number;
  dateTaken: string | null;
  processingVersion?: number;
}

export interface Album {
  slug: string;
  title: string;
  coverPhoto: string;
  photoCount: number;
  dateRange: { from: string | null; to: string | null };
}

export interface Manifest {
  albums: Album[];
  photos: Photo[];
}

const manifest = photosData as unknown as Manifest;

export function getAlbums(): Album[] {
  return manifest.albums;
}

export function getAlbum(slug: string): Album | undefined {
  return manifest.albums.find((a) => a.slug === slug);
}

export function getPhotosByAlbum(albumSlug: string): Photo[] {
  return manifest.photos
    .filter((p) => p.albumSlug === albumSlug)
    .sort((a, b) => {
      if (!a.dateTaken && !b.dateTaken) return 0;
      if (!a.dateTaken) return 1;
      if (!b.dateTaken) return -1;
      return new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime();
    });
}

export function getPhoto(
  albumSlug: string,
  photoId: string
): Photo | undefined {
  return manifest.photos.find(
    (p) => p.albumSlug === albumSlug && p.id === photoId
  );
}

export function getAdjacentPhotos(
  albumSlug: string,
  photoId: string
): { prev: Photo | null; next: Photo | null } {
  const photos = getPhotosByAlbum(albumSlug);
  const index = photos.findIndex((p) => p.id === photoId);
  return {
    prev: index > 0 ? photos[index - 1] : null,
    next: index < photos.length - 1 ? photos[index + 1] : null,
  };
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
