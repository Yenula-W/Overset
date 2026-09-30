import type { Metadata } from 'next';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Publisher plans, API access, custom limits, or help with a chapter. Talk to the Overset team.',
};

export default function ContactPage() {
  return (
    <section className="mk-shell flex flex-wrap gap-x-[72px] gap-y-12 pb-10 pt-14">
      <div className="flex flex-col gap-[22px]" style={{ flex: '1 1 420px' }}>
        <h1 className="mk-display">
          Talk
          <br />
          to us.
        </h1>
        <p className="m-0 max-w-[420px] text-[15px] leading-[1.6] text-ink-muted">
          Publisher plans, API access, custom limits, or help with a chapter that didn’t come out right. We read every
          message.
        </p>
      </div>
      <div className="max-w-[620px]" style={{ flex: '1 1 460px' }}>
        <ContactForm />
      </div>
    </section>
  );
}
