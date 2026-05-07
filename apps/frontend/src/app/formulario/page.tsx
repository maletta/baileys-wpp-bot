import { ParticipantPublicOtpForm } from '@/components/public-participant-auth/ParticipantPublicOtpForm';

export default function FormularioPublicoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-primary/10 via-background to-accent/10 px-6 pt-10 pb-16">
      <ParticipantPublicOtpForm />
    </div>
  );
}
