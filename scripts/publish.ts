import fs from "fs";
import path from "path";
import os from "os";
import { createInterface } from "readline";
import sharp from "sharp";
import exifr from "exifr";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhotoExif {
  camera: string | null;
  lens: string | null;
  focalLength: string | null;
  aperture: string | null;
  shutter: string | null;
  iso: number | null;
}

interface Photo {
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
}

interface Album {
  slug: string;
  title: string;
  coverPhoto: string;
  photoCount: number;
  dateRange: { from: string | null; to: string | null };
}

interface Manifest {
  albums: Album[];
  photos: Photo[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env.local — copy .env.example and fill in values");
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const SIZES = [320, 640, 1024, 1920] as const;
const FORMATS = ["webp", "jpg"] as const;

const PHOTOS_SOURCE_DIR = (process.env.PHOTOS_SOURCE_DIR || "~/Pictures/saved")
  .replace("~", os.homedir());

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const MANIFEST_PATH = path.resolve(process.cwd(), "content/photos.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatShutter(exposureTime: number | undefined | null): string | null {
  if (!exposureTime) return null;
  if (exposureTime >= 1) return `${exposureTime}s`;
  return `1/${Math.round(1 / exposureTime)}`;
}

function createS3Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

function readManifest(): Manifest {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  }
  return { albums: [], photos: [] };
}

function writeManifest(manifest: Manifest) {
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

async function r2KeyExists(s3: S3Client, key: string): Promise<boolean> {
  try {
    await s3.send(
      new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key })
    );
    return true;
  } catch {
    return false;
  }
}

async function uploadToR2(
  s3: S3Client,
  key: string,
  body: Buffer,
  contentType: string
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

// ---------------------------------------------------------------------------
// EXIF extraction
// ---------------------------------------------------------------------------

async function extractExif(
  filePath: string
): Promise<{ exif: PhotoExif; dateTaken: string | null }> {
  try {
    const data = await exifr.parse(filePath, {
      pick: [
        "Make",
        "Model",
        "LensModel",
        "FocalLength",
        "FNumber",
        "ExposureTime",
        "ISO",
        "DateTimeOriginal",
      ],
    });

    if (!data) return { exif: emptyExif(), dateTaken: null };

    const camera = [data.Make, data.Model].filter(Boolean).join(" ") || null;
    const lens = data.LensModel || null;
    const focalLength = data.FocalLength ? `${data.FocalLength}mm` : null;
    const aperture = data.FNumber ? `f/${data.FNumber}` : null;
    const shutter = formatShutter(data.ExposureTime);
    const iso = data.ISO ?? null;
    const dateTaken = data.DateTimeOriginal
      ? new Date(data.DateTimeOriginal).toISOString()
      : null;

    return { exif: { camera, lens, focalLength, aperture, shutter, iso }, dateTaken };
  } catch {
    return { exif: emptyExif(), dateTaken: null };
  }
}

function emptyExif(): PhotoExif {
  return {
    camera: null,
    lens: null,
    focalLength: null,
    aperture: null,
    shutter: null,
    iso: null,
  };
}

// ---------------------------------------------------------------------------
// Image processing
// ---------------------------------------------------------------------------

async function processPhoto(
  s3: S3Client,
  filePath: string,
  albumSlug: string,
  photoId: string,
  manifest: Manifest
): Promise<Photo | null> {
  const filename = path.basename(filePath);
  const r2Key = `${albumSlug}/${photoId}`;

  // Check if already processed
  const existing = manifest.photos.find(
    (p) => p.albumSlug === albumSlug && p.filename === filename
  );
  if (existing) {
    const srcStat = fs.statSync(filePath);
    // Check if the first variant exists in R2 as a proxy for "already uploaded"
    const firstKey = `${r2Key}-320.webp`;
    if (await r2KeyExists(s3, firstKey)) {
      console.log(`  ⏭  ${filename} (already uploaded)`);
      return existing;
    }
  }

  console.log(`  📷 Processing ${filename}...`);

  const image = sharp(filePath).rotate(); // Auto-rotate from EXIF
  const metadata = await image.metadata();
  const width = metadata.width!;
  const height = metadata.height!;

  // Extract EXIF
  const { exif, dateTaken } = await extractExif(filePath);

  // Generate blur placeholder (20px wide, WebP, base64)
  const blurBuf = await sharp(filePath)
    .rotate()
    .resize(20, Math.round((height / width) * 20))
    .webp({ quality: 10 })
    .toBuffer();
  const blurDataURL = `data:image/webp;base64,${blurBuf.toString("base64")}`;

  // Generate and upload responsive sizes
  for (const size of SIZES) {
    if (size > width) continue; // Don't upscale

    const resizedHeight = Math.round((height / width) * size);

    for (const format of FORMATS) {
      const key = `${r2Key}-${size}.${format}`;
      const contentType = format === "webp" ? "image/webp" : "image/jpeg";

      let buffer: Buffer;
      if (format === "webp") {
        buffer = await sharp(filePath)
          .rotate()
          .resize(size, resizedHeight)
          .webp({ quality: 80 })
          .toBuffer();
      } else {
        buffer = await sharp(filePath)
          .rotate()
          .resize(size, resizedHeight)
          .jpeg({ quality: 75 })
          .toBuffer();
      }

      await uploadToR2(s3, key, buffer, contentType);
      console.log(`    ✅ Uploaded ${key}`);
    }
  }

  return {
    id: photoId,
    albumSlug,
    filename,
    r2Key,
    title: existing?.title || "",
    description: existing?.description || "",
    exif,
    blurDataURL,
    width,
    height,
    dateTaken,
  };
}

// ---------------------------------------------------------------------------
// Album scanning
// ---------------------------------------------------------------------------

function getAlbumFolders(): { name: string; path: string }[] {
  if (!fs.existsSync(PHOTOS_SOURCE_DIR)) {
    console.error(`Source directory not found: ${PHOTOS_SOURCE_DIR}`);
    console.error("Update PHOTOS_SOURCE_DIR in .env.local");
    process.exit(1);
  }

  const entries = fs.readdirSync(PHOTOS_SOURCE_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => ({ name: e.name, path: path.join(PHOTOS_SOURCE_DIR, e.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getPhotosInFolder(folderPath: string): string[] {
  return fs
    .readdirSync(folderPath)
    .filter((f) => /\.(jpg|jpeg)$/i.test(f))
    .sort()
    .map((f) => path.join(folderPath, f));
}

// ---------------------------------------------------------------------------
// Interactive metadata editing
// ---------------------------------------------------------------------------

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function editMetadata(manifest: Manifest): Promise<boolean> {
  const answer = await prompt(
    "\nWould you like to edit album titles or photo descriptions? (y/N) "
  );
  if (answer.toLowerCase() !== "y") return false;

  for (const album of manifest.albums) {
    const newTitle = await prompt(
      `Album "${album.title}" — new title (Enter to keep): `
    );
    if (newTitle) album.title = newTitle;

    const albumPhotos = manifest.photos.filter(
      (p) => p.albumSlug === album.slug
    );
    for (const photo of albumPhotos) {
      const desc = await prompt(
        `  ${photo.filename} — description (Enter to skip): `
      );
      if (desc) photo.description = desc;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🔍 Scanning for albums in:", PHOTOS_SOURCE_DIR);

  // Validate R2 config
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
    console.error("Missing R2 credentials in .env.local — see .env.example");
    process.exit(1);
  }

  const s3 = createS3Client();
  const manifest = readManifest();
  const folders = getAlbumFolders();

  if (folders.length === 0) {
    console.log("No album folders found. Create subfolders in your export directory.");
    process.exit(0);
  }

  console.log(`Found ${folders.length} album(s)\n`);

  const newPhotos: Photo[] = [];
  const newAlbums: Album[] = [];

  for (const folder of folders) {
    const albumSlug = slugify(folder.name);
    const photoFiles = getPhotosInFolder(folder.path);

    if (photoFiles.length === 0) {
      console.log(`📁 ${folder.name} — no JPGs found, skipping`);
      continue;
    }

    console.log(`📁 ${folder.name} (${photoFiles.length} photos)`);

    const albumPhotos: Photo[] = [];

    for (let i = 0; i < photoFiles.length; i++) {
      const filePath = photoFiles[i];
      const fileSlug = slugify(path.basename(filePath, path.extname(filePath)));
      const photoId = fileSlug;

      const photo = await processPhoto(s3, filePath, albumSlug, photoId, manifest);
      if (photo) albumPhotos.push(photo);
    }

    // Sort photos by date taken, then filename
    albumPhotos.sort((a, b) => {
      if (a.dateTaken && b.dateTaken) return a.dateTaken.localeCompare(b.dateTaken);
      if (a.dateTaken) return -1;
      if (b.dateTaken) return 1;
      return a.filename.localeCompare(b.filename);
    });

    // Build date range
    const dates = albumPhotos
      .map((p) => p.dateTaken)
      .filter((d): d is string => d !== null)
      .sort();

    const existingAlbum = manifest.albums.find((a) => a.slug === albumSlug);

    newAlbums.push({
      slug: albumSlug,
      title: existingAlbum?.title || titleCase(albumSlug),
      coverPhoto: albumPhotos[0]?.id || "",
      photoCount: albumPhotos.length,
      dateRange: {
        from: dates[0] || null,
        to: dates[dates.length - 1] || null,
      },
    });

    newPhotos.push(...albumPhotos);
  }

  // Update manifest
  manifest.albums = newAlbums;
  manifest.photos = newPhotos;

  // Interactive editing
  await editMetadata(manifest);

  // Write manifest
  writeManifest(manifest);
  console.log(`\n✅ Manifest written to ${MANIFEST_PATH}`);
  console.log(
    `   ${manifest.albums.length} album(s), ${manifest.photos.length} photo(s)`
  );

  // Summary
  console.log("\n📋 Summary:");
  for (const album of manifest.albums) {
    console.log(`   ${album.title} — ${album.photoCount} photos`);
  }

  console.log("\nNext steps:");
  console.log("  1. git add content/photos.json");
  console.log('  2. git commit -m "Publish photos"');
  console.log("  3. git push (triggers Netlify deploy)");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
