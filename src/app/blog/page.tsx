import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata = { title: "Blog" };

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Blog</h1>

      {posts.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">
          No posts yet — check back soon!
        </p>
      ) : (
        <ul className="space-y-8">
          {posts.map((post) => (
            <li
              key={post.slug}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <Link href={`/blog/${post.slug}`} className="block space-y-2">
                <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">
                  {post.title}
                </h2>
                <time
                  dateTime={post.date}
                  className="block text-sm text-neutral-500 dark:text-neutral-400"
                >
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <p className="text-neutral-600 dark:text-neutral-300">
                  {post.excerpt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
