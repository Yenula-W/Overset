import type { Metadata } from 'next';
import { Section } from '@/components/marketing/section';
import { OwnershipSection } from '@/components/marketing/sections';

export const metadata: Metadata = {
  title: 'Privacy and content ownership',
  description: 'What happens to the chapters you upload to Overset.',
};

export default function PrivacyPage() {
  return (
    <>
      <section className="pt-14">
        <div className="mk-shell">
          <p className="mk-eyebrow m-0 uppercase">Privacy</p>
          <h1 className="mk-display mt-4 max-w-[1100px] text-balance">Your chapters stay yours.</h1>
          <p className="mt-6 max-w-[620px] text-pretty text-[16px] leading-[1.6] text-ink-muted">
            Overset is localization software. You upload material you are authorized to work on, Overset processes
            it to produce your translation, and the result belongs to you.
          </p>
        </div>
      </section>

      <OwnershipSection />

      <Section id="ownership" eyebrow="In plain terms" title="What we do and don’t do.">
        <div className="mt-10 max-w-2xl space-y-6 text-[15px] leading-relaxed text-ink-muted">
          <p>
            <strong className="font-medium text-ink">You retain your rights.</strong> Uploading a chapter does not
            transfer ownership of it. Overset stores and processes your files so the product can do its job, and for
            no other purpose.
          </p>
          <p>
            <strong className="font-medium text-ink">Projects are private by default.</strong> Only you and the people
            you invite to a project can see it. Nothing you upload is published as public content.
          </p>
          <p>
            <strong className="font-medium text-ink">You are responsible for what you upload.</strong> Only upload
            material you own or are authorized to translate and process. Overset does not host, distribute, or make
            available anyone else’s comics.
          </p>
          <p>
            <strong className="font-medium text-ink">You can delete your content.</strong> Projects, chapters, pages,
            and exports can be deleted from your account, and deletion removes the underlying files.
          </p>
          <p>
            <strong className="font-medium text-ink">Free-trial abuse prevention.</strong> We use a signed,
            HTTP-only browser cookie and keyed hashes of network addresses to limit repeat trials. We don’t
            collect hardware identifiers or fingerprint your device. Trial eligibility records, including keyed network hashes, remain after
            account deletion to prevent repeat claims. One free-trial account is allowed per public connection,
            so people on shared Wi-Fi may share this limit. Paid access is unaffected.
          </p>
          <p>
            <strong className="font-medium text-ink">We don’t claim certifications we don’t have.</strong> Overset
            applies standard practices — encrypted transport, access control on every project, server-side handling of
            all AI provider keys. This page will say more only when there is more that is true.
          </p>
        </div>
      </Section>
    </>
  );
}
