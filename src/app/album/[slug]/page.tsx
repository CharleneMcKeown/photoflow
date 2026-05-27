import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAlbums,
  getAlbum,
  getPhotosByAlbum,
  formatDate,
} from "@/lib/photos";
import { compositeId } from "@/lib/photo-ids";
import ResponsivePhoto from "@/components/ResponsivePhoto";

export const dynamicParams = false;

export async function generateStaticParams() {
  const albums = getAlbums();
  if (albums.length === 0) {
    return [{ slug: "_empty" }];
  }
  return albums.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = getAlbum(slug);
  return {
    title: album?.title ?? "Album",
    description: album
      ? `${album.photoCount} photos in ${album.title}`
      : undefined,
  };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = getAlbum(slug);

  if (!album) {
    notFound();
  }

  const photos = getPhotosByAlbum(slug);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
        >
          &larr; All Albums
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight mt-4">
          {album.title}
        </h1>
        {album.dateRange.from && (
          <p className="text-neutral-500 mt-2">
            {formatDate(album.dateRange.from)}
            {album.dateRange.to &&
              album.dateRange.to !== album.dateRange.from &&
              ` — ${formatDate(album.dateRange.to)}`}
          </p>
        )}
      </header>

      <div className="space-y-16">
        {photos.map((photo) => (
          <article key={photo.id}>
            <Link
              href={`/photo/${compositeId(slug, photo.id)}`}
              className="block rounded-lg overflow-hidden"
            >
              <ResponsivePhoto
                r2Key={photo.r2Key}
                alt={photo.title || photo.filename}
                width={photo.width}
                height={photo.height}
                blurDataURL={photo.blurDataURL}
                sizes="(max-width: 768px) calc(100vw - 3rem), 720px"
              />
            </Link>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
              {photo.title && (
                <h2 className="text-lg font-medium">{photo.title}</h2>
              )}
              {photo.dateTaken && (
                <time className="text-sm text-neutral-500">
                  {formatDate(photo.dateTaken)}
                </time>
              )}
            </div>

            {photo.description && (
              <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                {photo.description}
              </p>
            )}

            {(photo.exif.camera || photo.exif.aperture) && (
              <p className="text-xs text-neutral-400 mt-2 font-mono">
                {[
                  photo.exif.camera,
                  photo.exif.lens,
                  photo.exif.focalLength,
                  photo.exif.aperture && `ƒ/${photo.exif.aperture}`,
                  photo.exif.shutter,
                  photo.exif.iso && `ISO ${photo.exif.iso}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
