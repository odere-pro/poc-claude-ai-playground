import { AppHeader } from "@/components/organisms/AppHeader";
import { SessionRestoreBanner } from "@/components/organisms/SessionRestoreBanner";
import { UploadZone } from "@/components/organisms/UploadZone";
import { VoiceController } from "@/components/organisms/VoiceController";

export default function Home() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <SessionRestoreBanner />
        <UploadZone />
      </main>
      <VoiceController />
    </>
  );
}
