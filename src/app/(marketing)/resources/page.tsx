import type { Metadata } from 'next';
import { ResourcesList } from './resources-list';

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Guides, documentation, templates, and release notes for translating with Overset.',
};

export default function ResourcesPage() {
  return (
    <section className="mk-shell pb-10 pt-14">
      <h1 className="mk-display mb-10">Resources</h1>
      <ResourcesList />
    </section>
  );
}
