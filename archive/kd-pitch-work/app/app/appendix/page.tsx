import { readFileSync } from 'fs';
import { join } from 'path';
import Link from 'next/link';
import AppendixRenderer from '@/components/AppendixRenderer';

export default async function AppendixPage() {
  const profilePath = join(process.cwd(), 'content', 'appendix', 'profile.mdx');
  const trialPath = join(process.cwd(), 'content', 'appendix', 'trial-sprint.mdx');

  const profileContent = readFileSync(profilePath, 'utf-8');
  const trialContent = readFileSync(trialPath, 'utf-8');

  return (
    <main className="min-h-screen bg-cream py-12 px-4">
      <article className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl ring-1 ring-gold/40 p-8 md:p-12">
        <h1 className="font-display text-4xl text-plum mb-8">Appendix</h1>

        <section id="appendix-profile" className="mb-12 scroll-mt-8">
          <AppendixRenderer source={profileContent} />
        </section>

        <hr className="my-12 border-gold/30" />

        <section id="appendix-trial" className="scroll-mt-8">
          <AppendixRenderer source={trialContent} />
        </section>

        <div className="mt-12 pt-8 border-t border-gold/30">
          <Link
            href="/"
            className="inline-block text-plum hover:text-lavender underline font-medium"
          >
            ← Back to Pitch Deck
          </Link>
        </div>
      </article>
    </main>
  );
}
