import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import type { Metadata } from "next";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return { title: post ? post.title : "Post Not Found" };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/blog"
        className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
      >
        &larr; Back to blog
      </Link>

      <h1 className="text-3xl font-semibold tracking-tight mt-6">{post.title}</h1>
      <p className="text-neutral-500 mt-2">{formattedDate}</p>

      <div
        className={[
          "mt-8",
          "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:mt-8 [&_h2]:mb-4",
          "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3",
          "[&_h4]:text-lg [&_h4]:font-medium [&_h4]:mt-4 [&_h4]:mb-2",
          "[&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-neutral-700 dark:[&_p]:text-neutral-300",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1",
          "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1",
          "[&_li]:text-neutral-700 dark:[&_li]:text-neutral-300",
          "[&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:hover:opacity-80",
          "[&_table]:w-full [&_table]:my-6 [&_table]:border-collapse",
          "[&_th]:border [&_th]:border-neutral-300 dark:[&_th]:border-neutral-700 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-neutral-100 dark:[&_th]:bg-neutral-800 [&_th]:font-medium [&_th]:text-sm",
          "[&_td]:border [&_td]:border-neutral-300 dark:[&_td]:border-neutral-700 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm",
          "[&_code]:font-mono [&_code]:text-sm [&_code]:bg-neutral-100 dark:[&_code]:bg-neutral-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-neutral-300 dark:[&_blockquote]:border-neutral-700 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4",
          "[&_strong]:font-semibold",
          "[&_hr]:my-8 [&_hr]:border-neutral-200 dark:[&_hr]:border-neutral-800",
        ].join(" ")}
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </div>
  );
}
