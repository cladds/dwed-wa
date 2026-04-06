import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

// --- Config ---
const THREAD_URL = "https://forums.frontier.co.uk/threads/the-quest-to-find-raxxla.168253";
const MIN_DELAY_MS = 8000;
const MAX_DELAY_MS = 12000;

// --- Supabase ---
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function randomDelay(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  console.log(`  waiting ${(ms / 1000).toFixed(1)}s...`);
  return new Promise((r) => setTimeout(r, ms));
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

async function getThreadLastPage(page: import("playwright").Page): Promise<number> {
  // Navigate to the last page of the thread to find the actual page count
  await page.goto(THREAD_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

  // XenForo shows pagination with last page number
  const lastPage = await page.evaluate(() => {
    const navEl = document.querySelector(".pageNav-main .pageNav-page:last-child a");
    if (navEl) return parseInt(navEl.textContent?.trim() ?? "0", 10);

    // Fallback: check the page jump input
    const jumpEl = document.querySelector(".pageNav-page--skip input") as HTMLInputElement | null;
    if (jumpEl?.max) return parseInt(jumpEl.max, 10);

    return 0;
  });

  return lastPage;
}

function loadCookies(): Array<{ name: string; value: string; domain: string; path: string }> {
  const cookieFile = "./cookies.json";
  if (!existsSync(cookieFile)) {
    console.error("No cookies.json found. See README.md for setup instructions.");
    process.exit(1);
  }
  return JSON.parse(readFileSync(cookieFile, "utf-8"));
}

async function extractPosts(page: import("playwright").Page, pageNumber: number) {
  return page.evaluate((pgNum: number) => {
    const posts: {
      forum_post_id: string;
      thread_id: string;
      page_number: number;
      post_number: number | null;
      author_name: string;
      author_id: string | null;
      content_html: string;
      content_text: string;
      posted_at: string | null;
    }[] = [];

    document.querySelectorAll("article.message").forEach((el) => {
      const postId = el.getAttribute("data-content")?.replace("post-", "") ??
                     el.getAttribute("id")?.replace("js-post-", "") ??
                     `unknown-${Date.now()}-${Math.random()}`;

      const authorEl = el.querySelector(".message-name a, .message-userDetails h4 a, [data-user-id]");
      const authorName = el.getAttribute("data-author") ?? authorEl?.textContent?.trim() ?? "Unknown";
      const authorId = authorEl?.getAttribute("data-user-id") ?? null;

      const contentEl = el.querySelector(".message-body .bbWrapper, .message-content .bbWrapper, article .bbWrapper");
      const contentHtml = contentEl?.innerHTML ?? "";
      const contentText = contentEl?.textContent?.trim() ?? "";

      const timeEl = el.querySelector("time");
      const postedAt = timeEl?.getAttribute("datetime") ?? null;

      const postNumEl = el.querySelector(".message-attribution-opposite a, .u-concealed");
      const postNumText = postNumEl?.textContent?.replace("#", "").trim();
      const postNumber = postNumText ? parseInt(postNumText, 10) : null;

      if (contentText.length > 0) {
        posts.push({
          forum_post_id: postId,
          thread_id: "168253",
          page_number: pgNum,
          post_number: isNaN(postNumber ?? NaN) ? null : postNumber,
          author_name: authorName,
          author_id: authorId,
          content_html: contentHtml,
          content_text: contentText,
          posted_at: postedAt,
        });
      }
    });

    return posts;
  }, pageNumber);
}

// --- Main ---
async function main() {
  const lastScraped = await getLastScrapedPage();

  console.log(`\n=== Raxxla Thread Monitor ===`);
  console.log(`Last scraped page: ${lastScraped}`);

  if (lastScraped === 0) {
    console.log("No pages scraped yet. Run the full scraper first: npm run scrape");
    process.exit(0);
  }

  const cookies = loadCookies();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  await context.addCookies(cookies);
  const page = await context.newPage();

  // Check the thread's current last page
  const threadLastPage = await getThreadLastPage(page);
  console.log(`Thread last page: ${threadLastPage}`);

  if (threadLastPage <= lastScraped) {
    console.log("No new pages. Thread is up to date.");
    await browser.close();
    return;
  }

  const newPages = threadLastPage - lastScraped;
  console.log(`${newPages} new page(s) to scrape\n`);

  let totalPosts = 0;

  for (let pageNum = lastScraped + 1; pageNum <= threadLastPage; pageNum++) {
    const url = `${THREAD_URL}/page-${pageNum}`;
    console.log(`Page ${pageNum}: ${url}`);

    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      if (!response || response.status() !== 200) {
        console.log(`  Skipping (status: ${response?.status() ?? "null"})`);
        continue;
      }

      await page.waitForSelector("article.message", { timeout: 10000 }).catch(() => null);
      const posts = await extractPosts(page, pageNum);

      if (posts.length > 0) {
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  Error: ${msg}`);
    }

    if (pageNum < threadLastPage) await randomDelay();
  }

  await browser.close();
  console.log(`\nDone. ${totalPosts} new posts from ${newPages} pages.`);
}

main().catch(console.error);
