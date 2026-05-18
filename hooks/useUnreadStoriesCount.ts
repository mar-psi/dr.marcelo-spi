"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
type StoryViewRow = Database["public"]["Tables"]["story_views"]["Row"];

export function useUnreadStoriesCount() {
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const now = new Date().toISOString();
      const [storiesResponse, viewsResponse] = await Promise.all([
        supabase
          .from("stories")
          .select("id,title,theme,category,status,access,media_path,thumbnail_path,duration_seconds,reactions,published_at,expires_at,created_by,created_at,updated_at")
          .eq("status", "published")
          .or(`expires_at.is.null,expires_at.gt.${now}`),
        user
          ? supabase.from("story_views").select("story_id,user_id,seen_at").eq("user_id", user.id)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (!active) return;
      if (storiesResponse.error || viewsResponse.error) {
        setCount(0);
        return;
      }

      const stories = (storiesResponse.data ?? []) as StoryRow[];
      const seen = new Set(((viewsResponse.data ?? []) as StoryViewRow[]).map((view) => view.story_id));
      setCount(stories.filter((story) => !seen.has(story.id)).length);
    };

    void load();

    return () => {
      active = false;
    };
  }, [supabase, user]);

  return count;
}
