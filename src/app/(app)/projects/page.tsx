import type { Metadata } from 'next';
import { Plus, LibraryBig } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { ProjectCard } from '@/components/app/project-card';
import { Button, EmptyState } from '@/components/ui';
import { DEMO_CHAPTERS, DEMO_PROJECTS } from '@/lib/data/workspace';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  if (DEMO_PROJECTS.length === 0) {
    return (
      <AppShellPage>
        <PageHeader title="Projects" />
        <EmptyState
          className="mt-8"
          icon={<LibraryBig size={18} />}
          title="No projects yet."
          body="Create your first project to keep chapters, characters, and terminology organized."
          action={<Button href="/translate">Create project</Button>}
        />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage>
      <PageHeader
        title="Projects"
        lede="Chapters, characters, terminology, and memory live inside a project."
        actions={
          <Button href="/translate">
            <Plus size={15} />
            New project
          </Button>
        }
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {DEMO_PROJECTS.map((p) => (
          <ProjectCard key={p.id} project={p} latest={DEMO_CHAPTERS.find((c) => c.projectId === p.id)} />
        ))}
      </div>
    </AppShellPage>
  );
}
