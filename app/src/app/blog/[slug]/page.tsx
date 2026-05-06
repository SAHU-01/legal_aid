import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import Navbar from "../../Navbar";
import { posts } from "../posts";
import BlogContent from "../BlogContent";
import "../blog.css";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      images: [{ url: post.image || "/hero-img.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.image || "/hero-img.png"],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <div style={{ background: "#faf9f7", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Navbar activePage="home" />

      <article style={{ maxWidth: "720px", margin: "0 auto", padding: "8rem 1.5rem 6rem" }}>
        <Link href="/blog" style={{ fontSize: "0.8rem", color: "#1a6b4a", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "2rem" }}>
          &larr; All posts
        </Link>

        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.78rem", color: "#8a8a8a", marginBottom: "1rem" }}>
          <span>{post.date}</span>
          <span>{post.readTime}</span>
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 400, lineHeight: 1.2, marginBottom: "1.5rem" }}>
          {post.title}
        </h1>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.image || "/hero-img.png"}
          alt={post.title}
          style={{ width: "100%", borderRadius: "12px", marginBottom: "2rem", maxHeight: "400px", objectFit: "cover" }}
        />

        <BlogContent html={post.content} />

        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid #e5e3df" }}>
          <Link href="/blog" style={{ fontSize: "0.85rem", color: "#1a6b4a", textDecoration: "none" }}>
            &larr; Back to all posts
          </Link>
        </div>
      </article>
    </div>
  );
}
