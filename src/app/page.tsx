import Link from "next/link";
import { getAlbums, getPhotosByAlbum, formatDate } from "@/lib/photos";
import ResponsivePhoto from "@/components/ResponsivePhoto";

export default function Home() {
  const albums = getAlbums();

  if (albums.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight mb-4">
          No albums yet
        </h1>
        <p className="text-neutral-500">
          Export photos from Lightroom then
          run{" "}
          <code className="font-mono text-sm bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
            npm run publish-photos
          </code>{" "}
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Albums</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.map((album) => {
          const photos = getPhotosByAlbum(album.slug);
          const coverPhoto =
            photos.find((p) => p.id === album.coverPhoto) || photos[0];

          return (
            <Link
              key={album.slug}
              href={`/album/${album.slug}`}
              className="group block rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
            >
              {coverPhoto && (
                <div className="aspect-[3/2] overflow-hidden">
                  <ResponsivePhoto
                    r2Key={coverPhoto.r2Key}
                    alt={album.title}
                    width={coverPhoto.width}
                    height={coverPhoto.height}
                    blurDataURL={coverPhoto.blurDataURL}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-4">
                <h2 className="font-medium text-lg">{album.title}</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  {album.photoCount} photo{album.photoCount !== 1 ? "s" : ""}
                  {album.dateRange.from && (
                    <> &middot; {formatDate(album.dateRange.from)}</>
                  )}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
