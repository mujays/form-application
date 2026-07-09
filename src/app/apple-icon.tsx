import { ImageResponse } from "next/og";

// Metadata gambar
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon Alunika — huruf "A" putih di atas latar warna --primary.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 118,
          fontWeight: 700,
          background: "#171717",
          color: "#fafafa",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        A
      </div>
    ),
    { ...size }
  );
}
