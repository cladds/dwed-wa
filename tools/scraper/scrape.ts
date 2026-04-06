import { chromium, type Page } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

// --- Config ---
const THREAD_URL = "https://forums.frontier.co.uk/threads/the-quest-to-find-raxxla.168253";
const PAGES_PER_RUN = 50;
const MIN_DELAY_MS = 8000;
const MAX_DELAY_MS = 12000;
const MAX_RETRIES = 3;

// --- Supabase ---
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Helpers ---
function randomDelay(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  console.log(`  waiting ${(ms / 1000).toFixed(1)}s...`);
  return new Promise((r) => setTimeout(r, ms));
}

interface ForumPost {
  forum_post_id: string;
  thread_id: string;
  page_number: number;
  post_number: number | null;
  author_name: string;
  author_id: string | null;
  content_html: string;
  content_text: string;
  posted_at: string | null;
}

async function getLastScrapedPage(): Promise<number> {
  const { data } = await supabase
    .from("forum_posts")
    .select("page_number")
    .eq("thread_id", "168253")
    .order("page_number", { ascending: false })
    .limit(1);

  return data && data.length > 0 ? data[0].page_number : 0;
}

const EXTRACT_SCRIPT = `
(pgNum) => {
  var posts = [];
  var postElements = document.querySelectorAll("article.message");

  postElements.forEach(function(el) {
    var postId = (el.getAttribute("data-content") || "").replace("post-", "") ||
                 (el.getAttribute("id") || "").replace("js-post-", "") ||
                 ("unknown-" + Date.now() + "-" + Math.random());

    var authorEl = el.querySelector(".message-name a, .message-userDetails h4 a, [data-user-id]");
    var authorName = el.getAttribute("data-author") ||
                     (authorEl ? authorEl.textContent.trim() : "Unknown");
    var authorId = authorEl ? authorEl.getAttribute("data-user-id") : null;

    var bodyEl = el.querySelector(".message-body .bbWrapper, .message-content .bbWrapper, article .bbWrapper");
    if (bodyEl) {
      bodyEl.querySelectorAll(".message-signature, .bbCodeBlock--signature, .signature").forEach(function(s) { s.remove(); });
      bodyEl.querySelectorAll(".bbCodeBlock-title").forEach(function(s) { s.remove(); });
      bodyEl.querySelectorAll("iframe, .bbMediaWrapper").forEach(function(s) { s.remove(); });
    }

    var contentHtml = bodyEl ? bodyEl.innerHTML : "";

    var rawText = "";
    if (bodyEl) {
      var walk = function(node) {
        if (node.nodeType === 3) return node.textContent || "";
        if (node.nodeType !== 1) return "";
        var tag = node.tagName ? node.tagName.toLowerCase() : "";
        var blockTags = ["p", "div", "br", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "table"];
        var text = "";
        if (tag === "td" || tag === "th") text += " | ";
        node.childNodes.forEach(function(c) { text += walk(c); });
        if (blockTags.indexOf(tag) !== -1) text += "\\n";
        return text;
      };
      rawText = walk(bodyEl);
    }

    var contentText = rawText.replace(/[ \\t]+/g, " ").replace(/\\n\\s*\\n+/g, "\\n\\n").trim();

    var timeEl = el.querySelector("time");
    var postedAt = timeEl ? timeEl.getAttribute("datetime") : null;

    var postNumEl = el.querySelector(".message-attribution-opposite a, .u-concealed");
    var postNumText = postNumEl ? postNumEl.textContent.replace("#", "").trim() : null;
    var postNumber = postNumText ? parseInt(postNumText, 10) : null;

    if (contentText.length > 0) {
      posts.push({
        forum_post_id: postId,
        thread_id: "168253",
        page_number: pgNum,
        post_number: isNaN(postNumber) ? null : postNumber,
        author_name: authorName,
        author_id: authorId,
        content_html: contentHtml,
        content_text: contentText,
        posted_at: postedAt
      });
    }
  });

  return posts;
}
`;

async function extractPosts(page: Page, pageNumber: number): Promise<ForumPost[]> {
  // Inject and call the extraction script as raw JS to avoid tsx transforms
  const result = await page.evaluate(`(${EXTRACT_SCRIPT})(${pageNumber})`);
  return result as ForumPost[];
}

async function loadCookies(): Promise<Array<{ name: string; value: string; domain: string; path: string }>> {
  const cookieFile = "./cookies.json";
  if (!existsSync(cookieFile)) {
    console.error(`
No cookies.json found. To create one:
1. Open Firefox/Chrome and log into forums.frontier.co.uk
2. Install a cookie export extension (e.g. "EditThisCookie" or "Cookie-Editor")
3. Export cookies for forums.frontier.co.uk as JSON
4. Save to tools/scraper/cookies.json

Expected format:
[
  { "name": "xf_session", "value": "...", "domain": ".frontier.co.uk", "path": "/" },
  { "name": "xf_user", "value": "...", "domain": ".frontier.co.uk", "path": "/" }
]
`);
    process.exit(1);
  }

  return JSON.parse(readFileSync(cookieFile, "utf-8"));
}

// --- Main ---
async function main() {
  const startPage = (await getLastScrapedPage()) + 1;
  const endPage = startPage + PAGES_PER_RUN - 1;

  console.log(`\n=== Raxxla Thread Scraper ===`);
  console.log(`Starting from page ${startPage}, will scrape up to page ${endPage}`);
  console.log(`Thread: ${THREAD_URL}\n`);

  const cookies = await loadCookies();

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });

  await context.addCookies(cookies);
  const page = await context.newPage();

  let totalPosts = 0;
  let consecutiveFailures = 0;

  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    const url = pageNum === 1 ? THREAD_URL : `${THREAD_URL}/page-${pageNum}`;
    console.log(`Page ${pageNum}: ${url}`);

    let retries = 0;
    let success = false;

    while (retries < MAX_RETRIES && !success) {
      try {
        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

        if (!response || response.status() === 404) {
          console.log(`  Page ${pageNum} not found (404). End of thread reached.`);
          await browser.close();
          console.log(`\nDone. Total posts scraped this run: ${totalPosts}`);
          return;
        }

        if (response.status() === 403) {
          console.log(`  403 Forbidden. Cookies may have expired.`);
          retries++;
          await randomDelay();
          continue;
        }

        // Wait for posts to load
        await page.waitForSelector("article.message", { timeout: 10000 }).catch(() => null);

        const posts = await extractPosts(page, pageNum);

        if (posts.length === 0) {
          console.log(`  No posts found on page ${pageNum}. May be end of thread.`);
          consecutiveFailures++;
          if (consecutiveFailures >= 3) {
            console.log("  3 consecutive empty pages. Stopping.");
            await browser.close();
            return;
          }
        } else {
          consecutiveFailures = 0;

          // Upsert posts (skip duplicates)
          const { error } = await supabase
            .from("forum_posts")
            .upsert(posts, { onConflict: "forum_post_id", ignoreDuplicates: true });

          if (error) {
            console.error(`  DB error: ${error.message}`);
          } else {
            console.log(`  Stored ${posts.length} posts`);
            totalPosts += posts.length;
          }
        }

        success = true;
      } catch (err) {
        retries++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  Error (attempt ${retries}/${MAX_RETRIES}): ${msg}`);
        if (retries < MAX_RETRIES) {
          const backoff = retries * 5000;
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }

    if (!success) {
      console.log(`  Skipping page ${pageNum} after ${MAX_RETRIES} failures`);
    }

    // Delay before next page
    if (pageNum < endPage) {
      await randomDelay();
    }
  }

  await browser.close();
  console.log(`\nDone. Total posts scraped this run: ${totalPosts}`);
  console.log(`Run again to continue from page ${endPage + 1}`);
}

main().catch(console.error);
