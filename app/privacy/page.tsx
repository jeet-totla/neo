import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy — Neo" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="November 1, 2026">
      <section>
        <h2>What Neo stores</h2>
        <p>Your email address and password (the password is handled by Supabase Auth and never visible to us), the topics, sources and short description of yourself that you give Neo, your delivery email, and the briefings Neo writes for you.</p>
      </section>
      <section>
        <h2>How it is used</h2>
        <p>Only to write and deliver your briefings. Your topics, sources and description are sent to the AI provider you chose (Google Gemini, OpenAI or Anthropic) along with public news stories so the briefing can be written for you. We do not sell your data or use it for advertising.</p>
      </section>
      <section>
        <h2>Who processes it</h2>
        <p>Supabase (database and sign-in), Vercel (hosting), your chosen AI provider (writing the briefing) and Google (sending the email through Gmail). Each handles data under its own terms.</p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>You can edit your topics, sources and description in settings at any time. To delete your account and everything stored about you, email <a href="mailto:jeettotla@gmail.com">jeettotla@gmail.com</a> and it will be removed.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p><a href="mailto:jeettotla@gmail.com">jeettotla@gmail.com</a></p>
      </section>
    </LegalPage>
  );
}
