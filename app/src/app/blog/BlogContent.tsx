"use client";

import { useEffect, useRef } from "react";

function highlightCode(text: string): string {
  // Work on plain text, then output HTML
  const lines = text.split("\n");
  return lines.map((line) => {
    // Comments
    const commentIdx = line.indexOf("//");
    if (commentIdx === 0) {
      return `<span class="hl-comment">${escHtml(line)}</span>`;
    }

    let before = line;
    let comment = "";
    if (commentIdx > 0) {
      before = line.slice(0, commentIdx);
      comment = `<span class="hl-comment">${escHtml(line.slice(commentIdx))}</span>`;
    }

    let highlighted = escHtml(before)
      // Strings
      .replace(/(&quot;.*?&quot;|".*?"|'.*?'|`.*?`)/g, '<span class="hl-string">$1</span>')
      // Keywords
      .replace(/\b(import|from|export|const|let|var|async|await|function|return|new|if|else|try|catch|throw|of|in)\b/g, '<span class="hl-keyword">$1</span>')
      // Types
      .replace(/\b(AdduceClient|PublicKey|Keypair|Connection|Promise|Buffer|string|number|boolean|createLawyerCommitment|hashCitizenId)\b/g, '<span class="hl-type">$1</span>')
      // Numbers
      .replace(/\b(\d[\d_]*)\b/g, '<span class="hl-number">$1</span>');

    return highlighted + comment;
  }).join("\n");
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function BlogContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const pres = ref.current.querySelectorAll("pre");

    pres.forEach((pre) => {
      // Copy button
      if (!pre.querySelector(".copy-btn")) {
        const btn = document.createElement("button");
        btn.className = "copy-btn";
        btn.textContent = "Copy";
        btn.addEventListener("click", () => {
          const code = pre.querySelector("code")?.textContent || pre.textContent || "";
          navigator.clipboard.writeText(code.trim());
          btn.textContent = "Copied";
          setTimeout(() => { btn.textContent = "Copy"; }, 2000);
        });
        pre.style.position = "relative";
        pre.appendChild(btn);
      }

      // Syntax highlighting
      const codeEl = pre.querySelector("code");
      if (codeEl && !codeEl.dataset.highlighted) {
        const raw = codeEl.textContent || "";
        codeEl.innerHTML = highlightCode(raw);
        codeEl.dataset.highlighted = "true";
      }
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className="blog-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
