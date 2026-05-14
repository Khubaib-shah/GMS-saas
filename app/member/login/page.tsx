import { redirect } from "next/navigation";

// Member login has moved to the unified /login page.
// This redirect ensures any old bookmarks or links still work.
export default function MemberLoginRedirect() {
  redirect("/login");
}
