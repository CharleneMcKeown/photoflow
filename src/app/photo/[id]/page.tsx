import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAlbums,
  getAlbum,
  getPhoto,
  getPhotosByAlbum,
  getAdjacentPhotos,
  formatDate,
} from "@/lib/photos";
import { compositeId, parseCompositeId } from "@/lib/photo-ids";
import ResponsivePhoto from "@/components/ResponsivePhoto";

export const dynamicParams = false;

export async function generateStaticParams() {
  const albums = getAlbums();
  const params = albums.flatMap((album) =>
    getPhotosByAlbum(album.slug).map((photo) => ({
      id: compositeId(album.slug, photo.id),
    }))
  );
  if (params.length === 0) {
    return [{ id: "_empty" }];
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = parseCompositeId(id);
  if (!parsed) return { title: "Photo" };
  const photo = getPhoto(parsed.albumSlug, parsed.photoId);
  return {
    title: photo?.title || "Photo",
    description: photo?.description || undefined,
  };
}

export default async function PhotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsed = parseCompositeId(id);

  if (!parsed) {
    notFound();
  }

  const { albumSlug, photoId } = parsed;
  const photo = getPhoto(albumSlug, photoId);
  const album = getAlbum(albumSlug);

  if (!photo || !album) {
    notFound();
  }

  const { prev, next } = getAdjacentPhotos(albumSlug, photoId);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href={`/album/${albumSlug}`}
        className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
      >
        &larr; {album.title}
      </Link>

      <div className="mt-6 rounded-lg overflow-hidden">
        <ResponsivePhoto
          r2Key={photo.r2Key}
          alt={photo.title || photo.filename}
          width={photo.width}
          height={photo.height}
          blurDataURL={photo.blurDataURL}
          priority
        />
      </div>

      <div className="mt-6">
        {photo.title && (
          <h1 className="text-2xl font-semibold tracking-tight">
            {photo.title}
          </h1>
        )}
        {photo.dateTaken && (
          <time className="block text-sm text-neutral-500 mt-1">
            {formatDate(photo.dateTaken)}
          </time>
        )}
        {photo.description && (
          <p className="text-neutral-600 dark:text-neutral-400 mt-3">
            {photo.description}
          </p>
        )}
      </div>

      {/* EXIF data */}
      {(photo.exif.camera || photo.exif.aperture) && (
        <div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-6">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">
            Camera Info
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {photo.exif.camera && (
              <div>
                <dt className="text-neutral-400">Camera</dt>
                <dd className="font-medium">{photo.exif.camera}</dd>
              </div>
            )}
            {photo.exif.lens && (
              <div>
                <dt className="text-neutral-400">Lens</dt>
                <dd className="font-medium">{photo.exif.lens}</dd>
              </div>
            )}
            {photo.exif.focalLength && (
              <div>
                <dt className="text-neutral-400">Focal Length</dt>
                <dd className="font-medium">{photo.exif.focalLength}</dd>
              </div>
            )}
            {photo.exif.aperture && (
              <div>
                <dt className="text-neutral-400">Aperture</dt>
                <dd className="font-medium">ƒ/{photo.exif.aperture}</dd>
              </div>
            )}
            {photo.exif.shutter && (
              <div>
                <dt className="text-neutral-400">Shutter</dt>
                <dd className="font-medium">{photo.exif.shutter}</dd>
              </div>
            )}
            {photo.exif.iso && (
              <div>
                <dt className="text-neutral-400">ISO</dt>
                <dd className="font-medium">{photo.exif.iso}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Prev / Next navigation */}
      <nav className="mt-10 flex justify-between border-t border-neutral-200 dark:border-neutral-800 pt-6">
        {prev ? (
          <Link
            href={`/photo/${compositeId(albumSlug, prev.id)}`}
            className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            &larr; Previous
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/photo/${compositeId(albumSlug, next.id)}`}
            className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            Next &rarr;
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
