import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const CATEGORY_LABELS: Record<string, string> = {
  mystery: "Mystery",
  lore: "Lore",
  faction: "Faction",
  location: "Location",
  mechanic: "Mechanic",
  history: "History",
  guide: "Guide",
};

export default async function CodexPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: articles } = await supabase
    .from("codex_articles")
    .select("*")
    .eq("published", true)
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  // Group by category
  const grouped: Record<string, typeof articles> = {};
  if (articles) {
    for (const article of articles) {
      if (!grouped[article.category]) grouped[article.category] = [];
      grouped[article.category]!.push(article);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-xl text-gold tracking-wide">
            The Codex
          </h1>
          <p className="font-body text-text-mid text-sm mt-1">
            The accumulated knowledge of the Raxxla investigation. Curated briefings on every mystery, faction, and lead.
          </p>
        </div>
      </div>

      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-10">
          {Object.entries(grouped).map(([category, catArticles]) => (
            <div key={category}>
              <h2 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase mb-4 border-b border-border pb-2">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catArticles!.map((article) => (
                  <Link
                    key={article.id}
                    href={`/codex/${article.slug}`}
                    className="border border-border bg-bg-card hover:bg-bg-hover transition-colors group"
                  >
                    {article.cover_image && (
                      <div
                        className="h-32 bg-cover bg-center border-b border-border opacity-70 group-hover:opacity-90 transition-opacity"
                        style={{ backgroundImage: `url(${article.cover_image})` }}
                      />
                    )}
                    <div className="p-5">
                      <h3 className="font-body text-text-primary text-base mb-2 group-hover:text-gold transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="font-body text-text-mid text-sm line-clamp-3">
                          {article.excerpt}
                        </p>
                      )}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {article.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="font-system text-text-faint text-[9px] bg-bg-hover px-2 py-0.5">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border bg-bg-card p-12 text-center">
          <h2 className="font-heading text-lg text-gold mb-3">No articles yet</h2>
          <p className="font-body text-text-mid text-sm max-w-lg mx-auto">
            The Codex is where curated briefings live. Directors and Lead Investigators can create articles
            by feeding links from forum posts, Reddit threads, and wiki pages.
          </p>
        </div>
      )}
    </div>
  );
}
