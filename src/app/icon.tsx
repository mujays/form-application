import { ImageResponse } from "next/og";

// Metadata gambar
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Favicon Alunika — huruf "A" putih di atas latar mengikuti warna --primary.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          background: "#171717",
          color: "#fafafa",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
        }}
      >
        A
      </div>
    ),
    { ...size }
  );
}
