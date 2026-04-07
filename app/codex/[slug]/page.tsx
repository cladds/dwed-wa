import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CodexComments } from "@/components/codex/CodexComments";
import { CodexEditButton } from "@/components/codex/CodexEditButton";

interface Source {
  url: string;
  title: string;
  type: string;
}

interface CodexDetailProps {
  params: { slug: string };
}

export default async function CodexArticlePage({ params }: CodexDetailProps) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: article } = await supabase
    .from("codex_articles")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!article) notFound();

  const sources: Source[] = Array.isArray(article.sources) ? article.sources as Source[] : [];

  // Markdown-to-html: process line by line for headers, then group into paragraphs
  const lines = (article.content as string).split("\n");
  const htmlParts: string[] = [];
  let currentParagraph: string[] = [];

  function flushParagraph() {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(" ")
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary font-semibold">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="font-system text-coord-blue text-sm bg-bg-deep px-1.5 py-0.5">$1</code>');
      htmlParts.push(`<p class="font-body text-text-mid text-base leading-relaxed mb-4">${text}</p>`);
      currentParagraph = [];
    }
  }

  const imageRegex = /^!\[([^\]]*)\]\(([^)]+)\)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    const imageMatch = trimmed.match(imageRegex);
    if (imageMatch) {
      flushParagraph();
      const alt = imageMatch[1] || "Article image";
      const src = imageMatch[2];
      htmlParts.push(
        `<figure class="my-6"><img src="${src}" alt="${alt}" class="max-w-full border border-border opacity-90" />${
          imageMatch[1] ? `<figcaption class="font-system text-text-faint text-[9px] mt-2 tracking-wide">${alt}</figcaption>` : ""
        }</figure>`
      );
    } else if (trimmed.startsWith("### ")) {
      flushParagraph();
      htmlParts.push(`<h3 class="font-ui text-gold text-base tracking-wide mt-8 mb-3 uppercase">${trimmed.slice(4)}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      flushParagraph();
      htmlParts.push(`<h2 class="font-heading text-gold text-xl mt-10 mb-4">${trimmed.slice(3)}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      flushParagraph();
      htmlParts.push(`<h1 class="font-heading text-gold text-2xl mt-10 mb-4">${trimmed.slice(2)}</h1>`);
    } else if (trimmed === "") {
      flushParagraph();
    } else {
      currentParagraph.push(trimmed);
    }
  }
  flushParagraph();

  const contentHtml = htmlParts.join("");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/codex" className="font-system text-text-dim text-xs hover:text-gold transition-colors">
          &lt; Back to Codex
        </Link>
      </div>

      {article.cover_image && (
        <div
          className="h-48 bg-cover bg-center border border-border mb-6 opacity-80"
          style={{ backgroundImage: `url(${article.cover_image})` }}
        />
      )}

      <article>
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-heading text-2xl text-gold tracking-wide">
            {article.title}
          </h1>
          <CodexEditButton slug={article.slug} />
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {article.tags.map((tag: string) => (
              <span key={tag} className="font-system text-text-faint text-[9px] bg-bg-hover border border-border px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div
          className="codex-content"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {(() => {
          const pdfSource = sources.find(s => s.type === "pdf");
          if (!pdfSource) return null;
          return (
            <div className="mt-8 border border-gold/20 bg-gold/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-ui text-gold text-[10px] tracking-[0.2em] uppercase mb-1">
                    Original Document
                  </p>
                  <p className="font-body text-text-mid text-sm">
                    This article was generated from a PDF containing additional images, tables, and diagrams.
                  </p>
                </div>
                <a
                  href={pdfSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-ui text-[10px] tracking-[0.15em] uppercase border border-gold/30 text-gold px-4 py-2 hover:bg-gold/20 transition-colors shrink-0 ml-4"
                >
                  View PDF
                </a>
              </div>
            </div>
          );
        })()}
      </article>

      {sources.length > 0 && (
        <div className="mt-12 border-t border-border pt-6">
          <h3 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase mb-4">
            Sources
          </h3>
          <div className="space-y-2">
            {sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2 border border-border bg-bg-card hover:bg-bg-hover transition-colors"
              >
                <span className="font-system text-text-faint text-[9px] tracking-wider uppercase w-16">
                  {source.type}
                </span>
                <span className="font-body text-coord-blue text-sm hover:underline">
                  {source.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-border pt-4">
        <p className="font-system text-text-faint text-[9px]">
          Last updated: {new Date(article.updated_at).toLocaleDateString()}
        </p>
      </div>

      <CodexComments articleId={article.id} />
    </div>
  );
}
