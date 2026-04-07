"use client";

import { useState, useRef, useCallback } from "react";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  label?: string;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function ImageUpload({ onUpload, label }: ImageUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      setErrorMsg("Invalid format. Use jpg, png, gif, or webp.");
      setStatus("error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File exceeds 5MB limit.");
      setStatus("error");
      return;
    }

    // Show local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setStatus("uploading");
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Upload failed");
      }

      const data = await res.json();
      setStatus("success");
      onUpload(data.url);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
      setPreview(null);
    }
  }, [onUpload]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }

  function reset() {
    setStatus("idle");
    setPreview(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {label && (
        <label className="font-ui text-text-dim text-[10px] tracking-[0.25em] uppercase block">
          {label}
        </label>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => status !== "uploading" && inputRef.current?.click()}
        className={`
          border border-dashed p-6 text-center cursor-pointer transition-colors
          ${dragActive
            ? "border-gold/60 bg-gold/5"
            : "border-border bg-bg-deep hover:border-gold/30"
          }
          ${status === "uploading" ? "pointer-events-none opacity-70" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />

        {preview && status !== "error" ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Upload preview"
              className="max-h-32 mx-auto border border-border opacity-80"
            />
            {status === "uploading" && (
              <div className="space-y-2">
                <div className="h-px bg-border overflow-hidden">
                  <div className="h-full bg-gold/60 animate-pulse w-2/3 mx-auto" />
                </div>
                <p className="font-system text-text-faint text-[9px] tracking-[0.15em] uppercase">
                  Uploading...
                </p>
              </div>
            )}
            {status === "success" && (
              <div className="flex items-center justify-center gap-3">
                <p className="font-system text-status-success text-[9px] tracking-[0.15em] uppercase">
                  Upload complete
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="font-system text-text-faint text-[9px] hover:text-gold cursor-pointer"
                >
                  upload another
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="font-system text-text-dim text-xs">
              Drop an image here, or click to select
            </p>
            <p className="font-system text-text-faint text-[9px] mt-1">
              JPG, PNG, GIF, WEBP -- max 5MB
            </p>
          </div>
        )}
      </div>

      {status === "error" && errorMsg && (
        <div className="border border-status-danger/30 bg-status-danger/5 px-3 py-2">
          <p className="font-system text-status-danger text-[9px]">{errorMsg}</p>
          <button
            onClick={reset}
            className="font-system text-text-faint text-[9px] hover:text-gold mt-1 cursor-pointer"
          >
            try again
          </button>
        </div>
      )}
    </div>
  );
}
