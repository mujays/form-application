"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Loader2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  nama: string;
  email: string;
  phone: string;
  domain: string;
  jenisPembelian: string;
  buktiTransfer: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const STATUS_OPTIONS = ["baru", "diproses", "selesai"] as const;
const STATUS_COLORS: Record<string, string> = {
  baru: "bg-yellow-100 text-yellow-700",
  diproses: "bg-blue-100 text-blue-700",
  selesai: "bg-green-100 text-green-700",
};

export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  // Filters
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(
    async (p = page) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(p));
        params.set("limit", "20");
        if (q.trim()) params.set("q", q.trim());
        if (dateFrom) params.set("from", dateFrom);
        if (dateTo) params.set("to", dateTo);
        if (statusFilter) params.set("status", statusFilter);

        const res = await fetch(`/api/orders?${params}`, {
          headers: { "x-api-key": apiKey },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Gagal mengambil data");
        setOrders(data.orders);
        setPagination(data.pagination);
        setFetched(true);
        setPage(p);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [apiKey, q, dateFrom, dateTo, statusFilter, page],
  );

  function startEdit(order: Order) {
    setEditingId(order.id);
    setEditStatus(order.status);
    setEditNotes(order.notes || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditStatus("");
    setEditNotes("");
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          id: editingId,
          status: editStatus,
          notes: editNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal update");
      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === editingId
            ? { ...o, status: data.order.status, notes: data.order.notes }
            : o,
        ),
      );
      cancelEdit();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // --- Login screen ---
  if (!fetched) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-neutral-50 px-4 py-10">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold">Admin - Lihat Pesanan</h1>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="key">API Key</Label>
            <Input
              id="key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan ADMIN_API_KEY"
              onKeyDown={(e) => e.key === "Enter" && apiKey && fetchOrders(1)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            className="w-full"
            onClick={() => fetchOrders(1)}
            disabled={loading || !apiKey}
          >
            {loading ? "Loading..." : "Lihat Pesanan"}
          </Button>
        </div>
      </main>
    );
  }

  // --- Main admin view ---
  return (
    <main className="min-h-[100dvh] bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            Pesanan{" "}
            {pagination && (
              <span className="text-base font-normal text-muted-foreground">
                ({pagination.total})
              </span>
            )}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(page)}
            disabled={loading}
          >
            {loading && <Loader2 className="size-3 animate-spin" />}
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Cari</Label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchOrders(1)}
              placeholder="Email, no. WA, ID, atau domain"
              className="h-9 w-64"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Dari</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Sampai</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Status</Label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border bg-white px-3 text-sm"
            >
              <option value="">Semua</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <Button size="sm" className="h-9" onClick={() => fetchOrders(1)}>
            Filter
          </Button>
          {(q || dateFrom || dateTo || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => {
                setQ("");
                setDateFrom("");
                setDateTo("");
                setStatusFilter("");
                setTimeout(() => fetchOrders(1), 0);
              }}
            >
              Reset
            </Button>
          )}
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {/* Orders list */}
        {orders.length === 0 ? (
          <p className="text-muted-foreground">Tidak ada pesanan.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const isEditing = editingId === order.id;
              return (
                <div
                  key={order.id}
                  className={cn(
                    "rounded-lg border bg-white p-4 shadow-sm transition",
                    isEditing && "ring-2 ring-blue-200",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <p className="font-medium">{order.nama}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.email} &middot; {order.phone}
                      </p>{" "}
                      {order.domain && (
                        <p className="text-sm font-medium text-emerald-700">
                          🌐 {order.domain}
                          {order.jenisPembelian === "langganan"
                            ? ".alunika.app"
                            : ".vercel.app"}
                        </p>
                      )}{" "}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-neutral-600">
                          {order.jenisPembelian === "langganan"
                            ? "Langganan"
                            : "Sekali Beli"}
                        </span>

                        {isEditing ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="rounded border px-2 py-0.5 text-xs"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={cn(
                              "rounded px-2 py-0.5",
                              STATUS_COLORS[order.status] ||
                                "bg-neutral-100 text-neutral-600",
                            )}
                          >
                            {order.status}
                          </span>
                        )}
                      </div>
                      {/* Notes */}
                      {isEditing ? (
                        <div className="pt-1">
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Tambah catatan..."
                            rows={2}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                          />
                        </div>
                      ) : (
                        order.notes && (
                          <p className="text-sm text-muted-foreground italic">
                            📝 {order.notes}
                          </p>
                        )
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("id-ID")}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        ID: {order.id}
                      </p>
                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
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
                              className="h-7 text-xs"
                              onClick={cancelEdit}
                              disabled={saving}
                            >
                              <X className="size-3" /> Batal
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => startEdit(order)}
                          >
                            Edit Status / Notes
                          </Button>
                        )}
                      </div>
                    </div>

                    {order.buktiTransfer && (
                      <a
                        href={order.buktiTransfer}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={order.buktiTransfer}
                          alt="Bukti"
                          className="h-20 w-20 rounded-md border object-cover"
                        />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => fetchOrders(page - 1)}
            >
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              Hal {page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => fetchOrders(page + 1)}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
