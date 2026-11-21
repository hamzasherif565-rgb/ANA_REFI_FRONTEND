import { backend } from "@/integrations/api/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export async function uploadListingImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await backend.uploads.bucket("listings").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signErr } = await backend.uploads
    .bucket("listings")
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data) throw signErr ?? new Error("Sign failed");
  return data.signedUrl;
}
