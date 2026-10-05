import type { Metadata } from "next";
import { InviteForm } from "@/components/admin/invite-form";
import { UserRow, type UserRowData } from "@/components/admin/user-row";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { normalizeRoles } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nutzer" };

export default async function Page() {
  const self = await requireAdmin();
  const supabase = await createClient();

  const [{ data: profiles }, { data: authData }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, roles, active").order("display_name"),
    // Mailadressen stehen nur in der Auth Verwaltung, nicht in profiles.
    createAdminClient().auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const authById = new Map((authData?.users ?? []).map((user) => [user.id, user]));

  const users: UserRowData[] = (profiles ?? []).map((profile) => {
    const authUser = authById.get(profile.id);
    return {
      id: profile.id,
      displayName: profile.display_name,
      email: authUser?.email ?? "",
      roles: normalizeRoles(profile.roles),
      active: profile.active,
      invitePending: !!authUser && !authUser.email_confirmed_at && !authUser.last_sign_in_at,
      isSelf: profile.id === self.id,
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-display text-3xl font-bold">Person einladen</h2>
        <p className="mt-1 mb-4 text-muted">
          Sie bekommt eine Mail mit einem Link. Danach meldet sie sich jedes Mal mit ihrer Mailadresse an.
        </p>
        <InviteForm />
      </Card>

      <section aria-labelledby="nutzer-liste" className="space-y-3">
        <h2 id="nutzer-liste" className="font-display text-3xl font-bold">
          Nutzer ({users.length})
        </h2>
        <ul className="list-none space-y-3">
          {users.map((user) => (
            // Mailadresse als Schlüssel: „Erneut einladen“ erzeugt eine neue ID, die Meldung soll trotzdem stehen bleiben.
            <li key={user.email || user.id}>
              <UserRow user={user} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
