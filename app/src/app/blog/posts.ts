export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  image: string;
  content: string;
}

export const posts: BlogPost[] = [
  // Add blog posts here. Each will render as a card on /blog
  // and a full page at /blog/[slug].
  //
  // Example:
  // {
  //   slug: "why-paper-certificates-fail",
  //   title: "The Credential Issuance Problem: Why Paper Certificates Still Run Legal Aid in 2026",
  //   excerpt: "6-12 month payment delays across EU. The asymmetry between digital storage and paper issuance.",
  //   date: "2026-05-06",
  //   readTime: "8 min",
  //   image: "/blog/default.png",
  //   content: `Your full markdown or HTML content here...`,
  // },
];
