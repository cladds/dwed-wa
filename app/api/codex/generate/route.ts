import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check auth + rank
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: operative } = await supabase
    .from("operatives")
    .select("rank")
    .eq("discord_id", user.user_metadata.provider_id ?? user.id)
    .single();

  if (!operative || !["lead_investigator", "director"].includes(operative.rank)) {
    return NextResponse.json({ error: "Insufficient rank" }, { status: 403 });
  }

  const body = await request.json();
  const { urls, title, category } = body as {
    urls: Array<{ url: string; title: string; type: string }>;
    title: string;
    category: string;
  };

  if (!urls?.length || !title || !category) {
    return NextResponse.json({ error: "Missing urls, title, or category" }, { status: 400 });
  }

  // Fetch content from each URL
  const contents: string[] = [];
  for (const source of urls) {
    try {
      const res = await fetch(source.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; darkwheel.space)" },
      });
      if (res.ok) {
        const html = await res.text();
        // Strip HTML tags, keep text
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .substring(0, 8000); // Limit per source
        contents.push(`[Source: ${source.title}]\n${text}`);
      }
    } catch {
      contents.push(`[Source: ${source.title}] (failed to fetch)`);
    }
  }

  // Generate article with Claude
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: `You are writing for darkwheel.space, a Raxxla investigation platform for Elite Dangerous. Write like an experienced commander briefing their wing. Direct, knowledgeable, no fluff.

Rules:
- Write in markdown (## for sections, **bold** for emphasis)
- Sound like a veteran pilot, not a textbook or AI
- Short punchy paragraphs, 2-4 sentences max
- Use present tense for active investigations, past tense for historical events
- Include specific system names, dates, commander names when available
- No "it's worth noting", "interestingly", "in conclusion", "let's dive in" or any AI-sounding phrases
- No bullet points unless listing specific systems or coordinates
- Write an excerpt (1 sentence, under 150 chars) as the first line, prefixed with EXCERPT:
- Write suggested tags as the second line, prefixed with TAGS: (comma separated)
- Then the full article content`,
      messages: [
        {
          role: "user",
          content: `Write a codex article titled "${title}" for category "${category}". Use these sources:\n\n${contents.join("\n\n---\n\n")}`,
        },
      ],
    }),
  });

  if (!claudeRes.ok) {
    const err = await claudeRes.text();
    return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 500 });
  }

  const claudeData = await claudeRes.json();
  const rawContent = claudeData.content?.[0]?.text ?? "";

  // Parse excerpt and tags from the response
  const lines = rawContent.split("\n");
  let excerpt = "";
  let tags: string[] = [];
  let contentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("EXCERPT:")) {
      excerpt = lines[i].replace("EXCERPT:", "").trim();
      contentStart = i + 1;
    } else if (lines[i].startsWith("TAGS:")) {
      tags = lines[i].replace("TAGS:", "").split(",").map((t: string) => t.trim()).filter(Boolean);
      contentStart = i + 1;
    } else if (lines[i].trim() !== "") {
      break;
    }
  }

  const content = lines.slice(contentStart).join("\n").trim();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return NextResponse.json({
    title,
    slug,
    content,
    excerpt,
    tags,
    category,
    sources: urls,
  });
}
