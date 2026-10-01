'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LibraryBig } from 'lucide-react';
import { Button, EmptyState, Select } from '@/components/ui';
import { useLiveQuery, useUser } from '@/lib/store/hooks';
import { listProjects } from '@/lib/store/repo';
import type { ProjectRecord } from '@/lib/store/schema';

/**
 * Glossary, characters, and memory belong to a project. The choice lives in
 * ?project= so links and reloads keep it.
 */
export function useProjectChoice() {
  const user = useUser();
  const router = useRouter();
  const projects = useLiveQuery(() => listProjects(user.id), [user.id], ['projects']);
  const [projectId, setProjectId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!projects.data) return;
    const fromUrl = new URLSearchParams(window.location.search).get('project');
    const valid = (id: string | null) => !!id && projects.data!.some((p) => p.id === id);
    if (valid(projectId)) return;
    setProjectId(valid(fromUrl) ? fromUrl : projects.data[0]?.id ?? null);
  }, [projects.data, projectId]);

  const choose = React.useCallback(
    (id: string) => {
      setProjectId(id);
      const url = new URL(window.location.href);
      url.searchParams.set('project', id);
      router.replace(`${url.pathname}${url.search}`, { scroll: false });
    },
    [router],
  );

  const project = projects.data?.find((p) => p.id === projectId) ?? null;
  return { projects: projects.data, project, choose, loading: !projects.data };
}

export function ProjectPicker({ projects, value, onChange }: { projects: ProjectRecord[]; value: string; onChange: (id: string) => void }) {
  if (projects.length < 2) return null;
  return (
    <div className="w-full max-w-xs">
      <label htmlFor="project-picker" className="sr-only">
        Project
      </label>
      <Select id="project-picker" value={value} onChange={(e) => onChange(e.target.value)}>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function NoProjects({ what }: { what: string }) {
  return (
    <EmptyState
      className="mt-8"
      icon={<LibraryBig size={18} />}
      title="No projects yet."
      body={`${what} belong to a project. Create one first.`}
      action={<Button href="/projects">Go to projects</Button>}
    />
  );
}
