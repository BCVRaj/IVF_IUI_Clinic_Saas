import { OnboardingWizard } from "@/components/nurse/onboarding-wizard";

export default function NurseOnboardingPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Patient Onboarding{" "}
          <span className="font-light text-slate-400">/</span>{" "}
          <span className="text-[#1A237E]">Phase I</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Initiating legal clinical intake for IVF candidacy. Please ensure all government-issued documents are authentic and valid.
        </p>
      </header>

      <OnboardingWizard />
    </div>
  );
}
