# PhotoFlow

A photography portfolio that publishes straight from your Lightroom export folder. Drop JPGs into subfolders, run one command, and your site rebuilds with optimised images, EXIF metadata, and album pages.

## How it works

```
~/Pictures/saved/
  cats/
    DSCF0299.jpg
    DSCF0303.jpg
  landscapes/
    IMG_1234.jpg
```

Each subfolder becomes an album. When you run the publish script, it:

1. Scans your export folder for new photos
2. Extracts EXIF data (camera, lens, aperture, shutter speed, ISO)
3. Generates 7 responsive sizes (320, 640, 1024, 1536, 2048, 2560, 3840px) in AVIF + WebP + JPEG, with sRGB color management for accurate display on retina/wide-gamut screens
4. Creates blur placeholders for instant loading
5. Uploads everything to Cloudflare R2
6. Updates the photo manifest (`content/photos.json`)

Then `npm run build` generates a static site you can deploy anywhere.

## Stack

- **Next.js 15** — static export (`output: 'export'`)
- **Tailwind CSS v4** — styling
- **Cloudflare R2** — image storage (S3-compatible, zero egress fees)
- **sharp** — image optimisation and resizing
- **exifr** — EXIF metadata extraction
- **Netlify** — hosting (or any static host)

## Setup

### Prerequisites

- Node.js 18+
- A Cloudflare account with an R2 bucket

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your values:

| Variable | Description |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | R2 bucket name (default: `photoflow`) |
| `R2_PUBLIC_URL` | R2 public access URL (`https://pub-xxx.r2.dev`) |
| `NEXT_PUBLIC_R2_URL` | Same as above (used at build time) |
| `PHOTOS_SOURCE_DIR` | Lightroom export folder (default: `~/Pictures/saved`) |

### 3. Enable public access on your R2 bucket

In the Cloudflare dashboard: **R2** → your bucket → **Settings** → **Public access** → **Allow Access**. Copy the `pub-*.r2.dev` URL into your `.env.local`.

## Usage

### Publish photos

Export photos from Lightroom into subfolders of your `PHOTOS_SOURCE_DIR`, then:

```bash
npm run publish-photos
```

The script is incremental — it skips photos that are already uploaded at the current processing version. When the encoding pipeline changes (sizes, formats, or quality), bump `PROCESSING_VERSION` in `scripts/publish.ts` and the next run will automatically reprocess and re-upload every existing photo.

### Build the site

```bash
npm run build
```

The static site is output to `out/`.

### Preview locally

```bash
npx serve out
```

## Deploying to Netlify

1. Push this repo to GitHub
2. In Netlify: **Add new site** → **Import an existing project** → select the repo
3. Add `NEXT_PUBLIC_R2_URL` as an environment variable in **Site configuration** → **Environment variables**
4. Deploy — Netlify will use the settings in `netlify.toml`

Future pushes trigger automatic deploys.

## Project structure

```
scripts/publish.ts        — Photo processing and R2 upload script
content/photos.json       — Auto-generated manifest of albums and photos
src/app/page.tsx          — Home page (album grid)
src/app/album/[slug]/     — Album page (blog-style photo list)
src/app/photo/[id]/       — Individual photo page (EXIF, prev/next nav)
src/components/           — ResponsivePhoto component (srcset, blur-up)
src/lib/photos.ts         — Manifest reader and typed accessors
src/lib/r2.ts             — R2 URL builder and srcset helper
src/lib/photo-ids.ts      — Composite ID encoding for photo URLs
```
