import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

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

  // Simple markdown-to-html: paragraphs, bold, headers
  const contentHtml = (article.content as string)
    .split("\n\n")
    .map((block: string) => {
      if (block.startsWith("### ")) return `<h3 class="font-ui text-gold text-sm tracking-wide mt-6 mb-2">${block.slice(4)}</h3>`;
      if (block.startsWith("## ")) return `<h2 class="font-heading text-gold text-lg mt-8 mb-3">${block.slice(3)}</h2>`;
      if (block.startsWith("# ")) return `<h1 class="font-heading text-gold text-xl mt-8 mb-3">${block.slice(2)}</h1>`;
      const formatted = block
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="font-system text-coord-blue text-sm bg-bg-deep px-1">$1</code>');
      return `<p class="font-body text-text-mid text-base leading-relaxed mb-4">${formatted}</p>`;
    })
    .join("");

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
        <h1 className="font-heading text-2xl text-gold tracking-wide mb-2">
          {article.title}
        </h1>

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
    </div>
  );
}
