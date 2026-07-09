import { OnboardingForm } from "@/components/onboarding-form";
import { config } from "@/lib/config";

export default function Home() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="mt-1 text-sm text-muted-foreground">
            Aktivasi pesananmu
          </p>
        </div>
        <OnboardingForm />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Butuh bantuan? Chat CS kami langsung setelah mengisi form.
        </p>
      </div>
    </main>
  );
}
