"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/_components/ui/Button";
import { Input } from "@/_components/ui/Input";

type ProfileFormProps = {
  userId: string;
  name: string;
  email: string;
  image: string | null;
};

export function ProfileForm({ name, email, image }: ProfileFormProps) {
  const [preview, setPreview] = useState(image);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/uploads/profile", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setMessage(data.error ?? "Erro no upload");
      return;
    }

    setPreview(data.imageUrl);
    setMessage("Foto atualizada!");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-accent/40 bg-surface">
          {preview ? (
            <Image
              src={preview}
              alt="Avatar"
              fill
              className="object-cover"
              unoptimized={preview.startsWith("/uploads")}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl">
              👤
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-muted">{email}</p>
          <label className="mt-2 inline-block cursor-pointer">
            <span className="text-sm text-accent hover:underline">
              {uploading ? "Enviando..." : "Alterar foto"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>
      {message && (
        <p className="text-sm text-accent">{message}</p>
      )}
    </div>
  );
}
