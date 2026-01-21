import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AuthButton() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const signOut = async () => {
    "use server";

    const supabase = createClient();
    await supabase.auth.signOut();
    return redirect("/sign-in");
  };

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">Hey, {user.email}!</span>
      <form action={signOut}>
        <button className="py-2 px-4 rounded-md no-underline bg-red-600 hover:bg-red-700 text-white transition-colors">
          Logout
        </button>
      </form>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <Link
        href="/sign-in"
        className="py-2 px-4 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
      >
        Iniciar Sesión
      </Link>
      <Link
        href="/sign-up"
        className="py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-medium transition-all"
      >
        Comenzar Gratis
      </Link>
    </div>
  );
}
