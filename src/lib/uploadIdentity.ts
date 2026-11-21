import { backend } from "@/integrations/api/client";

/** Uploads a national-ID scan to the private identity-docs bucket. Returns the storage path. */
export async function uploadIdentityDoc(
  file: File,
  userId: string,
  side: "front" | "back",
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${side}-${crypto.randomUUID()}.${ext}`;
  const { error } = await backend.uploads.bucket("identity-docs").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
  return path;
}
