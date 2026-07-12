import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_KEY = process.env.ADMIN_API_KEY || "";
const SLUG_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

function isAdmin(req: NextRequest) {
  return ADMIN_KEY && req.headers.get("x-api-key") === ADMIN_KEY;
}

function normalizeSlug(raw: unknown) {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}

// GET — daftar semua app + jumlah order
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apps = await prisma.app.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json({
    apps: apps.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      orderCount: a._count.orders,
    })),
  });
}

// POST — buat app baru
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const slug = normalizeSlug(body?.slug);

    if (!name)
      return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
    if (!SLUG_RE.test(slug))
      return NextResponse.json(
        { error: "Slug tidak valid. Gunakan huruf kecil, angka, dan strip." },
        { status: 400 },
      );

    const exists = await prisma.app.findUnique({ where: { slug } });
    if (exists)
      return NextResponse.json(
        { error: "Slug sudah dipakai." },
        { status: 409 },
      );

    const app = await prisma.app.create({ data: { name, slug } });
    return NextResponse.json({ app }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/apps]", err);
    return NextResponse.json({ error: "Gagal menyimpan app." }, { status: 500 });
  }
}

// PATCH — update app
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const id = String(body?.id ?? "").trim();
    if (!id)
      return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });

    const data: { name?: string; slug?: string } = {};

    if (typeof body?.name === "string") {
      const name = body.name.trim();
      if (!name)
        return NextResponse.json(
          { error: "Nama tidak boleh kosong." },
          { status: 400 },
        );
      data.name = name;
    }

    if (typeof body?.slug === "string") {
      const slug = normalizeSlug(body.slug);
      if (!SLUG_RE.test(slug))
        return NextResponse.json(
          { error: "Slug tidak valid. Gunakan huruf kecil, angka, dan strip." },
          { status: 400 },
        );
      const other = await prisma.app.findUnique({ where: { slug } });
      if (other && other.id !== id)
        return NextResponse.json(
          { error: "Slug sudah dipakai." },
          { status: 409 },
        );
      data.slug = slug;
    }

    if (Object.keys(data).length === 0)
      return NextResponse.json(
        { error: "Tidak ada data untuk diupdate." },
        { status: 400 },
      );

    const app = await prisma.app.update({ where: { id }, data });
    return NextResponse.json({ app });
  } catch (err) {
    console.error("[PATCH /api/apps]", err);
    return NextResponse.json({ error: "Gagal update app." }, { status: 500 });
  }
}

// DELETE — hapus app (ditolak jika masih ada order)
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = String(req.nextUrl.searchParams.get("id") ?? "").trim();
    if (!id)
      return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });

    const orderCount = await prisma.order.count({ where: { appId: id } });
    if (orderCount > 0)
      return NextResponse.json(
        {
          error: `Tidak bisa dihapus, masih ada ${orderCount} pesanan terkait.`,
        },
        { status: 409 },
      );

    await prisma.app.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/apps]", err);
    return NextResponse.json({ error: "Gagal menghapus app." }, { status: 500 });
  }
}
