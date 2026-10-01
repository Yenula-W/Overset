'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LibraryBig, Plus } from 'lucide-react';
import { AppShellPage, PageHeader } from '@/components/app/page-header';
import { ProjectCard } from '@/components/app/project-card';
import { ProjectFormModal } from '@/components/app/project-form';
import { Button, EmptyState, Skeleton, useToast } from '@/components/ui';
import { useUser } from '@/lib/store/hooks';
import { useWorkspace } from '@/lib/store/workspace';
import { createProject } from '@/lib/store/repo';

export default function ProjectsPage() {
  const user = useUser();
  const router = useRouter();
  const toast = useToast();
  const ws = useWorkspace();
  const [creating, setCreating] = React.useState(false);
  const data = ws.data;

  return (
    <AppShellPage>
      <PageHeader
        title="Projects"
        lede="Chapters, characters, terminology, and memory live inside a project."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={15} />
            New project
          </Button>
        }
      />

      {!data ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      ) : data.projects.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<LibraryBig size={18} />}
          title="No projects yet."
          body="Create your first project to keep chapters, characters, and terminology organized."
          action={<Button onClick={() => setCreating(true)}>Create project</Button>}
        />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.projects.map((p) => {
            const latest = data.chapters.find((c) => c.chapter.projectId === p.id);
            return (
              <ProjectCard
                key={p.id}
                project={p}
                latest={latest?.chapter}
                latestStats={latest?.stats}
                latestStatus={latest?.status}
                totals={data.totalsByProject.get(p.id) ?? { chapters: 0, pages: 0, terms: 0 }}
              />
            );
          })}
        </div>
      )}

      <ProjectFormModal
        open={creating}
        onClose={() => setCreating(false)}
        title="New project"
        submitLabel="Create project"
        onSubmit={async (v) => {
          const p = await createProject(user.id, v);
          toast({ message: `Created ${p.name}.`, tone: 'ok' });
          router.push(`/projects/${p.id}`);
        }}
      />
    </AppShellPage>
  );
}
