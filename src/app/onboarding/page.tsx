import { AppShell } from "@/components/shell/AppShell";
import { ProfileForm } from "@/components/onboarding/ProfileForm";
import { VoiceEnrollment } from "@/components/onboarding/VoiceEnrollment";

export default function OnboardingPage() {
  return (
    <AppShell title="Onboarding" subtitle="Set up your profile and voice signature.">
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm />
        <VoiceEnrollment />
      </div>
    </AppShell>
  );
}
