"use client";

import { signOut as firebaseSignOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase/client";
import { signOut } from "@/lib/actions/auth.action";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Sign out from Firebase client-side
      await firebaseSignOut(auth);
      
      // Sign out from server-side (clear session cookie)
      const result = await signOut();
      
      if (result.success) {
        // Redirect to sign-in page
        router.push("/sign-in");
        router.refresh(); // Refresh to clear any cached data
      }
    } catch (error) {
      console.error("Error signing out:", error);
      // Still try to redirect even if there's an error
      router.push("/sign-in");
      router.refresh();
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className="ml-auto"
    >
      Sign Out
    </Button>
  );
}

