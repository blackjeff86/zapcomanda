"use client";

import { useRef, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  hint?: string;
  aspectSquare?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  folder,
  label,
  hint,
  aspectSquare = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [value]);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("zapcomanda")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from("zapcomanda").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Erro ao enviar imagem"
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      {label && (
        <p className="mb-1 block text-sm font-medium text-gray-700">{label}</p>
      )}

      <div className="flex items-start gap-4">
        {value && !imgError ? (
          <img
            src={value}
            alt="Preview"
            className={`shrink-0 rounded-xl border border-gray-200 object-cover ${
              aspectSquare ? "h-20 w-20" : "h-20 w-32"
            }`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`shrink-0 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center ${
              aspectSquare ? "h-20 w-20" : "h-20 w-32"
            }`}
          >
            <svg
              className="h-7 w-7 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 12h18M3 7.5h18"
              />
            </svg>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {uploading ? "Enviando..." : value ? "Trocar imagem" : "Selecionar imagem"}
          </button>

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-left text-xs text-red-500 hover:text-red-700"
            >
              Remover imagem
            </button>
          )}

          {hint && !uploadError && (
            <p className="text-xs text-gray-400">{hint}</p>
          )}
          {uploadError && (
            <p className="text-xs text-red-600">{uploadError}</p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileChange}
        disabled={uploading}
      />
    </div>
  );
}
