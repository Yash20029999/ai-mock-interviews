"use client";

import { useRouter } from "next/navigation";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/firebase/client";
import { signOut } from "@/lib/actions/auth.action";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Sign out from Firebase client-side
      await firebaseSignOut(auth);
      
      // Clear server-side session cookie
      await signOut();
      
      // Redirect to sign-in page
      router.push("/sign-in");
      router.refresh(); // Refresh to clear any cached data
    } catch (error) {
      console.error("Error signing out:", error);
      // Still try to redirect even if there's an error
      router.push("/sign-in");
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className="ml-auto"
    >
      Logout
    </Button>
  );
}

