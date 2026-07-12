import { notFound } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { prisma } from "@/lib/prisma";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const appParam = (await searchParams).app;
  const slug = typeof appParam === "string" ? appParam.trim() : "";

  // Tanpa ?app=slug → 404
  if (!slug) notFound();

  // Slug tidak terdaftar di DB → 404
  const app = await prisma.app.findUnique({
    where: { slug },
    select: { slug: true },
  });
  if (!app) notFound();

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="mt-1 text-sm text-muted-foreground">
            Aktivasi pesananmu
          </p>
        </div>
        <OnboardingForm slug={app.slug} />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Butuh bantuan? Chat CS kami langsung setelah mengisi form.
        </p>
      </div>
    </main>
  );
}
