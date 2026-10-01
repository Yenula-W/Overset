import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/authz';
import { PAGES_BUCKET } from '@/lib/supabase/config';
import { serviceClient } from '@/lib/supabase/server';

/** Deletes the caller's login, page images, and (by cascade) every record they own. */
export async function DELETE() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: { code: 'unauthenticated', message: 'Log in to delete your account.' } }, { status: 401 });
  }
  const admin = serviceClient();
  if (!admin) {
    return NextResponse.json(
      { error: { code: 'not_configured', message: 'Account deletion isn’t available yet: the server is missing SUPABASE_SERVICE_ROLE_KEY.' } },
      { status: 501 },
    );
  }

  const bucket = admin.storage.from(PAGES_BUCKET);
  for (;;) {
    const { data, error } = await bucket.list(user.id, { limit: 1000 });
    if (error) return NextResponse.json({ error: { code: 'storage', message: error.message } }, { status: 500 });
    if (!data.length) break;
    const removed = await bucket.remove(data.map((f) => `${user.id}/${f.name}`));
    if (removed.error) return NextResponse.json({ error: { code: 'storage', message: removed.error.message } }, { status: 500 });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: { code: 'auth', message: error.message } }, { status: 500 });
  return NextResponse.json({ ok: true });
}
