export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://adduce.vercel.app/sitemap.xml",
  };
}
