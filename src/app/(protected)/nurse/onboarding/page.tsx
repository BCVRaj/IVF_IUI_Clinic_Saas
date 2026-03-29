import { OnboardingWizard } from "@/components/nurse/onboarding-wizard";

export default function NurseOnboardingPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#000666]">
          Patient Onboarding
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Register new couple for the Fertility Precision program.
        </p>
      </header>

      <OnboardingWizard />
    </div>
  );
}
