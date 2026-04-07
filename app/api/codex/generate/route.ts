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
  const { urls, title, category, pdfContent, pdfName, pdfUrl } = body as {
    urls: Array<{ url: string; title: string; type: string }>;
    title?: string;
    category: string;
    pdfContent?: string; // base64 encoded PDF
    pdfName?: string;
    pdfUrl?: string; // public URL of hosted PDF
  };

  if ((!urls?.length && !pdfContent) || !category) {
    return NextResponse.json({ error: "Missing sources or category" }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  // Build message content blocks
  const messageContent: Array<Record<string, unknown>> = [];

  // Add PDF as document if provided
  if (pdfContent) {
    messageContent.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: pdfContent,
      },
    });
  }

  // Fetch URL sources
  const contents: string[] = [];
  for (const source of urls ?? []) {
    try {
      const res = await fetch(source.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; darkwheel.space)" },
      });
      if (res.ok) {
        const html = await res.text();
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .substring(0, 8000);
        contents.push(`[Source: ${source.title}]\n${text}`);
      }
    } catch {
      contents.push(`[Source: ${source.title}] (failed to fetch)`);
    }
  }

  // Build the text prompt
  let prompt = `Write a codex article for category "${category}".${title ? ` Suggested title: "${title}".` : " Generate an appropriate title."}`;

  if (pdfContent) {
    prompt += `\n\nThe attached PDF document "${pdfName ?? "uploaded document"}" is the primary source. Extract all key information, system names, character details, lore analysis, and investigation notes from it.`;
    if (pdfUrl) {
      prompt += `\n\nThe original PDF is hosted at: ${pdfUrl}\nIf the PDF contains images, tables, diagrams, or maps that cannot be conveyed in text, add a note directing readers to view the original PDF. For example: "See the original document for the full system data table and route maps."`;
    }
    prompt += `\n\nIMPORTANT: If the PDF contains tables, try to represent the key data in text form (e.g. system names with distances). If it contains images or diagrams that add important context, describe what they show and note that the full visuals are available in the original PDF document.`;
  }

  if (contents.length > 0) {
    prompt += `\n\nAdditional sources:\n\n${contents.join("\n\n---\n\n")}`;
  }

  messageContent.push({ type: "text", text: prompt });

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
- NEVER use em dashes (--) or (---). Use commas, periods, or semicolons instead
- No bullet points unless listing specific systems or coordinates
- If the source is research notes or a PDF document, synthesise the findings into a coherent briefing. Preserve all system names, character names, and specific details
- If the source content is written in roleplay (RP) or in-character style, extract the real investigation intel, systems, and lore references from it and write the article in a factual briefing style instead
- First line: TITLE: (suggested article title, max 60 chars)
- Second line: EXCERPT: (1 sentence summary, under 150 chars)
- Third line: TAGS: (comma separated tags)
- Then the full article content`,
      messages: [{ role: "user", content: messageContent }],
    }),
  });

  if (!claudeRes.ok) {
    const err = await claudeRes.text();
    return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 500 });
  }

  const claudeData = await claudeRes.json();
  const rawContent = claudeData.content?.[0]?.text ?? "";

  // Parse title, excerpt, and tags from the response
  const lines = rawContent.split("\n");
  let generatedTitle = title ?? "";
  let excerpt = "";
  let tags: string[] = [];
  let contentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("TITLE:")) {
      generatedTitle = line.replace("TITLE:", "").trim();
      contentStart = i + 1;
    } else if (line.startsWith("EXCERPT:")) {
      excerpt = line.replace("EXCERPT:", "").trim();
      contentStart = i + 1;
    } else if (line.startsWith("TAGS:")) {
      tags = line.replace("TAGS:", "").split(",").map((t: string) => t.trim()).filter(Boolean);
      contentStart = i + 1;
    } else if (line !== "") {
      break;
    }
  }

  const content = lines.slice(contentStart).join("\n").trim();
  const finalTitle = generatedTitle || "Untitled Article";
  const slug = finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return NextResponse.json({
    title: finalTitle,
    slug,
    content,
    excerpt,
    tags,
    category,
    sources: urls ?? [],
  });
}
