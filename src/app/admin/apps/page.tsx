"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Save, Trash2, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type App = {
  id: string;
  name: string;
  slug: string;
  orderCount: number;
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, "");

export default function AdminAppsPage() {
  const [apiKey, setApiKey] = useState("");
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  // Create
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [saving, setSaving] = useState(false);

  // Deleting
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apps", { headers: { "x-api-key": apiKey } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal mengambil data");
      setApps(data.apps);
      setFetched(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  async function createApp() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ name: newName, slug: newSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal membuat app");
      setNewName("");
      setNewSlug("");
      await fetchApps();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(app: App) {
    setEditingId(app.id);
    setEditName(app.name);
    setEditSlug(app.slug);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditSlug("");
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/apps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ id: editingId, name: editName, slug: editSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal update");
      setApps((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? { ...a, name: data.app.name, slug: data.app.slug }
            : a,
        ),
      );
      cancelEdit();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteApp(app: App) {
    if (
      !confirm(`Hapus app "${app.name}" (${app.slug})? Tindakan ini permanen.`)
    )
      return;
    setDeletingId(app.id);
    setError(null);
    try {
      const res = await fetch(`/api/apps?id=${encodeURIComponent(app.id)}`, {
        method: "DELETE",
        headers: { "x-api-key": apiKey },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal menghapus");
      setApps((prev) => prev.filter((a) => a.id !== app.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  // --- Login screen ---
  if (!fetched) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-neutral-50 px-4 py-10">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold">Admin - Kelola App</h1>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="key">API Key</Label>
            <Input
              id="key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan ADMIN_API_KEY"
              onKeyDown={(e) => e.key === "Enter" && apiKey && fetchApps()}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            className="w-full"
            onClick={fetchApps}
            disabled={loading || !apiKey}
          >
            {loading ? "Loading..." : "Masuk"}
          </Button>
        </div>
      </main>
    );
  }

  // --- Main view ---
  return (
    <main className="min-h-[100dvh] bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            App{" "}
            <span className="text-base font-normal text-muted-foreground">
              ({apps.length})
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                Pesanan
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchApps}
              disabled={loading}
            >
              {loading && <Loader2 className="size-3 animate-spin" />}
              Refresh
            </Button>
          </div>
        </div>

        {/* Create form */}
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Nama App</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ngopio POS"
              className="h-9 w-56"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Slug</Label>
            <Input
              value={newSlug}
              onChange={(e) => setNewSlug(slugify(e.target.value))}
              onKeyDown={(e) =>
                e.key === "Enter" && newName && newSlug && createApp()
              }
              placeholder="ngopio"
              className="h-9 w-48"
            />
          </div>
          <Button
            size="sm"
            className="h-9"
            onClick={createApp}
            disabled={creating || !newName.trim() || !newSlug.trim()}
          >
            {creating ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Plus className="size-3" />
            )}
            Tambah
          </Button>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {/* List */}
        {apps.length === 0 ? (
          <p className="text-muted-foreground">Belum ada app.</p>
        ) : (
          <div className="space-y-3">
            {apps.map((app) => {
              const isEditing = editingId === app.id;
              return (
                <div
                  key={app.id}
                  className={cn(
                    "rounded-lg border bg-white p-4 shadow-sm transition",
                    isEditing && "ring-2 ring-blue-200",
                  )}
                >
                  {isEditing ? (
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Nama</Label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-9 w-56"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Slug</Label>
                        <Input
                          value={editSlug}
                          onChange={(e) => setEditSlug(slugify(e.target.value))}
                          className="h-9 w-48"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-9"
                          onClick={saveEdit}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Save className="size-3" />
                          )}
                          Simpan
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9"
                          onClick={cancelEdit}
                          disabled={saving}
                        >
                          <X className="size-3" /> Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">{app.name}</p>
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
                            {app.slug}
                          </code>
                          <Link
                            href={`/?app=${app.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            /?app={app.slug}
                            <ExternalLink className="size-3" />
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {app.orderCount} pesanan
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => startEdit(app)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-red-600 hover:text-red-700"
                          onClick={() => deleteApp(app)}
                          disabled={deletingId === app.id}
                        >
                          {deletingId === app.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Trash2 className="size-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
