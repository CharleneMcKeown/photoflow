import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";
import remarkGfm from "remark-gfm";

const postsDirectory = path.join(process.cwd(), "content", "blog");

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverPhotoId?: string;
  content: string;
}

export interface BlogPostWithHtml extends BlogPost {
  html: string;
}

function getPostFiles(): string[] {
  try {
    return fs.readdirSync(postsDirectory).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
}

function parsePost(slug: string, fileContents: string): BlogPost {
  const { data, content } = matter(fileContents);
  return {
    slug,
    title: data.title,
    date: data.date,
    excerpt: data.excerpt,
    ...(data.coverPhotoId ? { coverPhotoId: data.coverPhotoId } : {}),
    content,
  };
}

export function getAllPosts(): BlogPost[] {
  return getPostFiles()
    .map((filename) => {
      const slug = filename.replace(/\.md$/, "");
      const filePath = path.join(postsDirectory, filename);
      const fileContents = fs.readFileSync(filePath, "utf8");
      return parsePost(slug, fileContents);
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export async function getPostBySlug(
  slug: string
): Promise<BlogPostWithHtml | null> {
  const filePath = path.join(postsDirectory, `${slug}.md`);

  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const post = parsePost(slug, fileContents);
    const result = await remark().use(remarkGfm).use(remarkHtml).process(post.content);
    return { ...post, html: result.toString() };
  } catch {
    return null;
  }
}

export function getAllSlugs(): string[] {
  return getPostFiles().map((f) => f.replace(/\.md$/, ""));
}
