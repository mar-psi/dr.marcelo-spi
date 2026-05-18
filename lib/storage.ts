import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const EMPTY_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=";

export async function getSignedStorageUrl(
  bucket: string,
  path: string | null | undefined,
  expiresIn = 60 * 30
): Promise<string | null> {
  if (!path) return null;

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) return null;
  return data.signedUrl;
}
