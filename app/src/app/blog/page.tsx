import Link from "next/link";
import Navbar from "../Navbar";
import { posts } from "./posts";

export default function BlogPage() {
  return (
    <div style={{ background: "#faf9f7", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Navbar activePage="home" />

      <section style={{ paddingTop: "8rem", paddingBottom: "4rem", textAlign: "center", maxWidth: "900px", margin: "0 auto", padding: "8rem 1.5rem 3rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 400, marginBottom: "0.5rem" }}>
          Blog
        </h1>
        <p style={{ color: "#5a5a5a", fontSize: "1rem", fontWeight: 300, maxWidth: "560px", margin: "0 auto" }}>
          Research, architecture decisions, and the story behind Adduce.
        </p>
      </section>

      <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 1.5rem 6rem" }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", border: "1px dashed #e5e3df", borderRadius: "12px" }}>
            <p style={{ color: "#8a8a8a", fontSize: "0.9rem" }}>
              Coming soon. Follow our journey on{" "}
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" style={{ color: "#1a6b4a", textDecoration: "underline" }}>
                Twitter/X
              </a>
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem", alignItems: "stretch" }}>
            {[...posts].sort((a, b) => b.date.localeCompare(a.date)).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{ textDecoration: "none", color: "inherit", display: "flex" }}
              >
                <article style={{
                  border: "1px solid #e5e3df",
                  borderRadius: "12px",
                  overflow: "hidden",
                  background: "#fff",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  display: "flex",
                  flexDirection: "column" as const,
                  width: "100%",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image || "/hero-img.png"}
                    alt={post.title}
                    style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: "1.2rem", flex: 1, display: "flex", flexDirection: "column" as const }}>
                    <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.72rem", color: "#8a8a8a", marginBottom: "0.5rem" }}>
                      <span>{post.date}</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h2 style={{ fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.3, marginBottom: "0.5rem", color: "#0f0f0f" }}>
                      {post.title}
                    </h2>
                    <p style={{ fontSize: "0.82rem", color: "#5a5a5a", lineHeight: 1.5, fontWeight: 300, flex: 1 }}>
                      {post.excerpt}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
