import { NextResponse, type NextRequest } from "next/server";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

const MAX_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      return NextResponse.json(
        { error: "Cloudinary belum dikonfigurasi" },
        { status: 500 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "File wajib diunggah" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format harus PNG, JPG, atau WEBP" },
        { status: 400 },
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran maksimal 3 MB" },
        { status: 400 },
      );
    }

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    uploadForm.append("api_key", API_KEY);
    uploadForm.append("timestamp", timestamp);
    uploadForm.append("folder", "onboarding");
    uploadForm.append(
      "signature",
      await generateSignature(timestamp, "onboarding"),
    );

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: uploadForm },
    );

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody?.error?.message || "Upload ke Cloudinary gagal";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      secure_url: data.secure_url,
      public_id: data.public_id,
    });
  } catch {
    return NextResponse.json(
      { error: "Upload gagal, coba lagi." },
      { status: 500 },
    );
  }
}

async function generateSignature(
  timestamp: string,
  folder: string,
): Promise<string> {
  const str = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
