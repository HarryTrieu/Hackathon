// Who is signed in with Google, as the server sees it. { user: null } when
// signed out (the app then runs as a demo persona).
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  return Response.json(
    {
      user: user
        ? {
            id: user.id,
            email: user.email ?? null,
            name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
            avatar: user.user_metadata?.avatar_url ?? null,
          }
        : null,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
