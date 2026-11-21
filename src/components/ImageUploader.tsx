import { useState, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadListingImage } from "@/lib/uploadImage";
import { useI18n } from "@/lib/i18n";

export function ImageUploader({
  value,
  onChange,
  userId,
  max = 6,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  userId: string;
  max?: number;
}) {
  const { locale } = useI18n();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = max - value.length;
    const list = Array.from(files).slice(0, room);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of list) {
        const url = await uploadListingImage(f, userId);
        urls.push(url);
      }
      onChange([...value, ...urls]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {value.map((url, i) => (
          <div
            key={i}
            className="relative aspect-square overflow-hidden rounded-xl border border-border"
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute top-1 end-1 grid h-6 w-6 place-items-center rounded-full bg-destructive text-destructive-foreground shadow"
              aria-label="remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-card text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
            <span className="text-xs">{locale === "ar" ? "أضف صورة" : "Add image"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {locale === "ar" ? `حتى ${max} صور` : `Up to ${max} images`}
      </p>
    </div>
  );
}
