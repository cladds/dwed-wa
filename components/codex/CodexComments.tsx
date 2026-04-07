"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
}

export function CodexComments({ articleId }: { articleId: string }) {
  const [supabase] = useState(() => createClient());
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("codex_comments")
      .select("*")
      .eq("article_id", articleId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setComments(data ?? []));

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserName(user.user_metadata.full_name ?? user.user_metadata.name ?? "CMDR");
    });
  }, [supabase, articleId]);

  async function postComment() {
    if (!newComment.trim() || !userName) return;
    setPosting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPosting(false); return; }

    const { data: operative } = await supabase
      .from("operatives")
      .select("id")
      .eq("discord_id", user.user_metadata.provider_id ?? user.id)
      .single();

    const { data, error } = await supabase
      .from("codex_comments")
      .insert({
        article_id: articleId,
        content: newComment.trim(),
        author_id: operative?.id ?? null,
        author_name: userName,
      })
      .select()
      .single();

    if (!error && data) {
      setComments(prev => [...prev, data]);
      setNewComment("");
    }
    setPosting(false);
  }

  return (
    <div className="mt-10 border-t border-border pt-6">
      <h3 className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase mb-4">
        Discussion ({comments.length})
      </h3>

      {comments.length > 0 && (
        <div className="space-y-4 mb-6">
          {comments.map((c) => (
            <div key={c.id} className="border border-border bg-bg-card px-5 py-3">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-system text-gold text-xs">{c.author_name}</span>
                <span className="font-system text-text-faint text-[9px]">
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
              <p className="font-body text-text-mid text-sm">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      {userName ? (
        <div className="flex gap-3">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && postComment()}
            placeholder="Add a comment..."
            className="flex-1 bg-bg-deep border border-border px-4 py-2.5 font-body text-text-primary text-sm focus:border-gold/50 focus:outline-none"
          />
          <button
            onClick={postComment}
            disabled={posting || !newComment.trim()}
            className="font-ui text-[9px] tracking-[0.15em] uppercase border border-gold/30 text-gold px-4 py-2 hover:bg-gold/10 cursor-pointer disabled:opacity-50"
          >
            {posting ? "..." : "Post"}
          </button>
        </div>
      ) : (
        <p className="font-system text-text-faint text-xs">Log in to comment</p>
      )}
    </div>
  );
}
