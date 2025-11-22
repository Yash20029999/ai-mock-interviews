"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { signIn, signUp } from "@/lib/actions/auth.action";
import FormField from "./FormField";

const authFormSchema = (type: FormType) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (type === "sign-up") {
        const { name, email, password } = data;

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          password,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        // Automatically sign in the user after successful sign-up
        // Force refresh the token to ensure it's valid
        const idToken = await userCredential.user.getIdToken(true);
        if (!idToken) {
          toast.error("Account created but sign in failed. Please sign in manually.");
          router.push("/sign-in");
          return;
        }

        // Small delay to ensure user is fully created in Firebase Auth
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log("Calling signIn server action after sign-up...");
        const signInResult = await signIn({
          email,
          idToken,
        });

        console.log("SignIn result after sign-up:", signInResult);

        if (!signInResult?.success) {
          console.error("Sign in failed after sign-up:", signInResult);
          toast.error(signInResult.message || "Account created but sign in failed. Please sign in manually.");
          router.push("/sign-in");
          return;
        }

        console.log("Sign in successful after sign-up, redirecting...");
        toast.success("Account created successfully!");
        // Small delay to ensure cookie is set, then redirect
        await new Promise(resolve => setTimeout(resolve, 200));
        // Use window.location for a full page reload to ensure cookie is recognized
        window.location.href = "/";
      } else {
        const { email, password } = data;

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        const idToken = await userCredential.user.getIdToken();
        if (!idToken) {
          toast.error("Sign in Failed. Please try again.");
          return;
        }

        console.log("Calling signIn server action...");
        const signInResult = await signIn({
          email,
          idToken,
        });

        console.log("SignIn result:", signInResult);

        if (!signInResult?.success) {
          console.error("Sign in failed:", signInResult);
          toast.error(signInResult.message || "Sign in failed. Please try again.");
          return;
        }

        console.log("Sign in successful, redirecting...");
        toast.success("Signed in successfully.");
        // Small delay to ensure cookie is set, then redirect
        await new Promise(resolve => setTimeout(resolve, 200));
        // Use window.location for a full page reload to ensure cookie is recognized
        window.location.href = "/";
      }
    } catch (error: any) {
      console.error("Auth form error:", error);
      const errorMessage = error?.message || error?.toString() || "An unexpected error occurred";
      toast.error(`There was an error: ${errorMessage}`);
    }
  };

  const isSignIn = type === "sign-in";

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">PrepWise</h2>
        </div>

        <h3>Practice job interviews with AI</h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 mt-4 form"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your Name"
                type="text"
              />
            )}

            <FormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="Your email address"
              type="email"
            />

            <FormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              type="password"
            />

            <Button className="btn" type="submit">
              {isSignIn ? "Sign In" : "Create an Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center">
          {isSignIn ? "No account yet?" : "Have an account already?"}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
