"use client";

import { useState } from "react";

export default function TestScan() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult("");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur réseau";
      setResult(message);
    }

    setLoading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Test du scan capillaire
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={handleFileChange}
            className="w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-surface file:px-4 file:py-2 file:text-sm file:text-foreground hover:file:bg-border"
          />

          {preview && (
            <img
              src={preview}
              alt="Aperçu"
              className="max-h-64 rounded-lg border border-border"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-3 font-medium text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? "Analyse en cours…" : "Lancer le scan"}
          </button>
        </form>

        {result && (
          <pre className="overflow-auto rounded-lg border border-border bg-surface p-4 text-sm text-accent">
            {result}
          </pre>
        )}
      </div>
    </main>
  );
}
