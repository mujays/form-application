// Isi lewat .env (NEXT_PUBLIC_*) atau ganti nilai fallback di bawah.
export const config = {
  appName: "Aplikasi Aktivasi",
  // Nomor WA CS (format internasional tanpa +, mis. 6281234567890)
  waNumber: process.env.NEXT_PUBLIC_WA_NUMBER || "6285719610153",
  // Link undangan grup WhatsApp khusus pelanggan langganan
  waGroupLink:
    process.env.NEXT_PUBLIC_WA_GROUP_LINK ||
    "https://chat.whatsapp.com/CHANGE-ME",
  // Info rekening tujuan transfer langganan
  bankInfo:
    process.env.NEXT_PUBLIC_BANK_INFO || "BCA 1234567890 a.n. MUJI BURROHMAN",
  subscriptionPrice: 20000,
} as const;

export function waChatLink(text: string): string {
  return `https://wa.me/${config.waNumber}?text=${encodeURIComponent(text)}`;
}
