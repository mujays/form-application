import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const JENIS = ["sekali_beli", "langganan"];
const ADMIN_KEY = process.env.ADMIN_API_KEY || "";

function isAdmin(req: NextRequest) {
  return ADMIN_KEY && req.headers.get("x-api-key") === ADMIN_KEY;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl;
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit")) || 20),
  );
  const from = url.searchParams.get("from"); // ISO date
  const to = url.searchParams.get("to"); // ISO date
  const statusFilter = url.searchParams.get("status"); // baru | diproses | selesai

  const where: Record<string, unknown> = {};

  if (from || to) {
    const createdAt: Record<string, Date> = {};
    if (from) createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      createdAt.lte = toDate;
    }
    where.createdAt = createdAt;
  }

  if (statusFilter && ["baru", "diproses", "selesai"].includes(statusFilter)) {
    where.status = statusFilter;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const id = String(body?.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    }

    const data: Record<string, string> = {};

    if (
      typeof body.status === "string" &&
      ["baru", "diproses", "selesai"].includes(body.status)
    ) {
      data.status = body.status;
    }
    if (typeof body.notes === "string") {
      data.notes = body.notes;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data untuk diupdate" },
        { status: 400 },
      );
    }

    const order = await prisma.order.update({ where: { id }, data });
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: "Gagal update pesanan" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nama = String(body?.nama ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const jenisPembelian = String(body?.jenisPembelian ?? "");
    const domain = String(body?.domain ?? "")
      .trim()
      .toLowerCase();
    const buktiTransfer =
      typeof body?.buktiTransfer === "string" ? body.buktiTransfer : null;

    if (!nama || !email || !phone)
      return NextResponse.json(
        { error: "Nama, email, dan nomor WA wajib diisi." },
        { status: 400 },
      );
    if (!domain || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(domain))
      return NextResponse.json(
        { error: "Domain tidak valid. Gunakan huruf kecil, angka, dan strip." },
        { status: 400 },
      );
    if (!JENIS.includes(jenisPembelian))
      return NextResponse.json(
        { error: "Jenis pembelian tidak valid." },
        { status: 400 },
      );
    if (jenisPembelian === "langganan" && !buktiTransfer)
      return NextResponse.json(
        { error: "Bukti transfer wajib untuk langganan." },
        { status: 400 },
      );

    const order = await prisma.order.create({
      data: { nama, email, phone, domain, jenisPembelian, buktiTransfer },
    });

    return NextResponse.json({ id: order.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json(
      { error: "Gagal menyimpan pesanan. Coba lagi." },
      { status: 500 },
    );
  }
}
