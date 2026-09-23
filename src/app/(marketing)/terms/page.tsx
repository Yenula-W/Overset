import type { Metadata } from 'next';
import { Section } from '@/components/marketing/section';

export const metadata: Metadata = { title: 'Terms' };

const SECTIONS: Array<[string, string]> = [
  ['Your account', 'You are responsible for keeping your login credentials secure and for activity that happens under your account.'],
  ['What you may upload', 'Only upload material you own or are authorized to translate and process. You confirm this each time you upload a chapter. Overset does not host or distribute anyone else’s comics, and accounts used to process material without authorization may be suspended.'],
  ['Your content stays yours', 'Uploading does not transfer ownership. Overset stores and processes your files for the purpose of producing your translation, and for no other purpose. You can delete your projects and files at any time.'],
  ['Our service', 'Overset is AI-assisted software. Its output is a draft for you to review, not a guaranteed-correct translation. You are responsible for reviewing what you publish.'],
  ['Plans and billing', 'Paid plans renew until canceled. Page allowances reset each billing cycle and unused pages do not carry over. Additional page credits are consumed after the plan allowance.'],
  ['Availability', 'We aim to keep Overset running and to give notice before changes that affect how you work, but the service is provided as-is without a specific uptime guarantee.'],
  ['Changes to these terms', 'If these terms change materially, we will say what changed rather than quietly replacing the page.'],
];

export default function TermsPage() {
  return (
    <>
      <section className="pt-16 sm:pt-24">
        <div className="shell max-w-3xl">
          <p className="eyebrow">Terms</p>
          <h1 className="mt-4 text-section font-semibold text-balance">Terms of service.</h1>
          <p className="lede mt-6">Plain summary of how Overset may be used. This is a product outline, not legal advice.</p>
        </div>
      </section>

      <Section>
        <div className="max-w-2xl space-y-8">
          {SECTIONS.map(([title, body]) => (
            <div key={title}>
              <h2 className="text-[18px] font-semibold tracking-[-0.015em]">{title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
