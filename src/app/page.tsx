import HomeClient from "./HomeClient";
import { createClient } from "@/lib/supabase";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <HomeClient isLoggedIn={!!user} />;
}