export const dynamic = "force-dynamic";
import { getPeople } from "@/lib/store";
import ProfilesGrid from "@/components/ProfilesGrid";

export default function ProfilesPage() {
  const people = getPeople();
  return <ProfilesGrid people={people} />;
}
