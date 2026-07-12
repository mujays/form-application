"use client";

import { useState } from "react";
import {
  ShoppingBag,
  Repeat,
  Clock,
  MessageCircle,
  Users,
  Upload,
  Check,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { config, waChatLink } from "@/lib/config";
import { cn } from "@/lib/utils";

type Jenis = "" | "sekali_beli" | "langganan";
type Step = "form" | "detail" | "done";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const emailValid = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export function OnboardingForm({ slug }: { slug: string }) {
  const [step, setStep] = useState<Step>("form");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jenis, setJenis] = useState<Jenis>("");
  const [domain, setDomain] = useState("");
  const [bukti, setBukti] = useState<string | null>(null);
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const domainSuffix = jenis === "langganan" ? ".alunika.id" : ".vercel.app";
  const domainValid = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(domain);
  const step1Valid =
    nama.trim() &&
    emailValid(email) &&
    phone.trim().length >= 8 &&
    jenis &&
    domain &&
    domainValid;

  function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Ukuran maksimal 3 MB.");
      return;
    }
    // Show local preview
    const reader = new FileReader();
    reader.onload = () => setBuktiPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    uploadFile(file);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload gagal");
      setBukti(data.secure_url);
    } catch (e) {
      setError((e as Error).message);
      setBukti(null);
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app: slug,
          nama,
          email,
          phone,
          domain,
          jenisPembelian: jenis,
          buktiTransfer: jenis === "langganan" ? bukti : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal mengirim");
      setOrderId(data.id);
      setStep("done");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const waText = `Halo CS ${config.appName}, saya ${nama} (${email}). Saya sudah order ${
    jenis === "langganan" ? "paket Langganan" : "paket Sekali Beli"
  }.${orderId ? ` Order ID: ${orderId}` : ""}`;

  // --- Layar sukses ---
  if (step === "done") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-5 p-6 pt-6 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-green-100">
            <Check className="size-7 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Pesanan Diterima! 🎉</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Terima kasih, {nama.split(" ")[0]}.
            </p>
          </div>

          <div className="w-full rounded-lg border bg-muted/40 p-4 text-left text-sm">
            <p className="flex items-start gap-2">
              <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>
                Aplikasi akan kami <b>install dalam 1×24 jam</b> (sesuai
                antrian), lalu dikirim ke <b>Email</b> atau <b>WhatsApp</b>{" "}
                kamu.
              </span>
            </p>
          </div>

          <div className="flex w-full flex-col gap-2">
            {jenis === "langganan" && (
              <Button
                className="w-full"
                onClick={() => window.open(config.waGroupLink, "_blank")}
              >
                <Users className="size-4" /> Gabung Grup WhatsApp Langganan
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(waChatLink(waText), "_blank")}
            >
              <MessageCircle className="size-4" /> Chat CS WhatsApp
            </Button>
          </div>

          {orderId && (
            <p className="text-xs text-muted-foreground">
              No. Pesanan:{" "}
              <span className="font-mono">{orderId.slice(0, 8)}</span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // --- Halaman 2: detail sesuai jenis ---
  if (step === "detail") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {jenis === "langganan"
              ? "Pembayaran Langganan"
              : "Konfirmasi Pesanan"}
          </CardTitle>
          <CardDescription>
            {jenis === "langganan"
              ? "Selesaikan pembayaran untuk mengaktifkan langganan."
              : "Cek info di bawah, lalu konfirmasi pesananmu."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {jenis === "sekali_beli" ? (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <p className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  Pesananmu akan <b>di-install dalam 1×24 jam</b> (sesuai
                  antrian), lalu <b>dikirim via Email atau WhatsApp</b>. Ada
                  pertanyaan? Chat CS langsung di bawah.
                </span>
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total transfer
                  </span>
                  <span className="text-lg font-semibold">
                    {rupiah(config.subscriptionPrice)}
                  </span>
                </div>
                <div className="mt-2 border-t pt-2 text-sm">
                  <span className="text-muted-foreground">Tujuan: </span>
                  <span className="font-medium">{config.bankInfo}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Upload bukti transfer</Label>
                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition hover:bg-muted/50",
                    buktiPreview && "border-solid",
                  )}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loader2 className="size-8 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Mengupload bukti transfer...
                      </span>
                    </div>
                  ) : buktiPreview ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={buktiPreview}
                        alt="Bukti transfer"
                        className="max-h-40 rounded-md object-contain"
                      />
                      {bukti && (
                        <div className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-green-500 text-white">
                          <Check className="size-3" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <Upload className="size-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Ketuk untuk pilih gambar (maks 3 MB)
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </label>
                {buktiPreview && !uploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setBukti(null);
                      setBuktiPreview(null);
                    }}
                    className="self-start text-xs text-muted-foreground underline"
                  >
                    Ganti gambar
                  </button>
                )}
              </div>
            </>
          )}

          {jenis === "sekali_beli" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(waChatLink(waText), "_blank")}
            >
              <MessageCircle className="size-4" /> Chat CS WhatsApp
            </Button>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>

        <CardFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => setStep("form")}
            disabled={submitting}
          >
            <ArrowLeft className="size-4" /> Kembali
          </Button>
          <Button
            className="flex-1"
            onClick={submit}
            disabled={
              submitting || uploading || (jenis === "langganan" && !bukti)
            }
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {jenis === "langganan"
              ? "Kirim & Konfirmasi"
              : "Konfirmasi Pesanan"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // --- Halaman 1: data pemesan ---
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktivasi Aplikasi</CardTitle>
        <CardDescription>
          Isi data sesuai yang kamu masukkan saat beli di Lynk.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nama">Nama</Label>
          <Input
            id="nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama lengkap"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@contoh.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">No. WhatsApp</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="domain">Nama Domain</Label>
          <div className="flex items-center gap-0">
            <Input
              id="domain"
              value={domain}
              onChange={(e) =>
                setDomain(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                )
              }
              placeholder="namausaha"
              className="rounded-r-none"
            />
            <span className="inline-flex h-9 items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
              {jenis ? domainSuffix : ".vercel.app"}
            </span>
          </div>
          {domain && !domainValid && (
            <p className="text-xs text-destructive">
              Gunakan huruf kecil, angka, dan strip. Tidak boleh
              diawali/diakhiri strip.
            </p>
          )}
          {domain && domainValid && (
            <p className="text-xs text-muted-foreground">
              Alamat kamu:{" "}
              <span className="font-medium">
                {domain}
                {jenis ? domainSuffix : ".vercel.app"}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Jenis Pembelian</Label>
          <div className="grid grid-cols-2 gap-2">
            <JenisCard
              active={jenis === "sekali_beli"}
              onClick={() => setJenis("sekali_beli")}
              icon={<ShoppingBag className="size-5" />}
              title="Sekali Beli"
              desc="Bayar sekali, pakai selamanya"
            />
            <JenisCard
              active={jenis === "langganan"}
              onClick={() => setJenis("langganan")}
              icon={<Repeat className="size-5" />}
              title="Langganan"
              desc={`${rupiah(config.subscriptionPrice)} + grup support`}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          disabled={!step1Valid}
          onClick={() => setStep("detail")}
        >
          Lanjut
        </Button>
      </CardFooter>
    </Card>
  );
}

function JenisCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border p-3 text-left transition",
        active
          ? "border-primary ring-1 ring-primary"
          : "hover:border-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-md",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </button>
  );
}
