import type { Metadata } from 'next';
import { Section } from '@/components/marketing/section';
import { Button, Card, Field, Input, Select, Textarea } from '@/components/ui';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <>
      <section className="pt-16 sm:pt-24">
        <div className="shell max-w-3xl">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-4 text-section font-semibold text-balance">Get in touch.</h1>
          <p className="lede mt-6">Questions about a chapter, a plan, or running Overset across a team.</p>
        </div>
      </section>

      <Section>
        <Card className="max-w-xl p-6">
          <form className="space-y-4">
            <Field label="Name" htmlFor="name">
              <Input id="name" name="name" autoComplete="name" />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" autoComplete="email" />
            </Field>
            <Field label="What is this about?" htmlFor="topic">
              <Select id="topic" name="topic" defaultValue="product">
                <option value="product">Using Overset</option>
                <option value="billing">Billing</option>
                <option value="teams">Teams and publishers</option>
                <option value="privacy">Privacy and content</option>
                <option value="other">Something else</option>
              </Select>
            </Field>
            <Field label="Message" htmlFor="message">
              <Textarea id="message" name="message" />
            </Field>
            <Button type="submit" size="lg" className="w-full">
              Send message
            </Button>
          </form>
        </Card>
      </Section>
    </>
  );
}
