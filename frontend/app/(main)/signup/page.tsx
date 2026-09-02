"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { getAuthErrorMessage } from "@/lib/firebase/errors";
import { createUserProfileDocument } from "@/lib/firebase/userService";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
    const { loginWithGoogle, currentUser, loading } = useAuth();
    const router = useRouter();
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema)
    });

    useEffect(() => {
        if (!loading && currentUser) {
            router.push("/dashboard");
        }
    }, [currentUser, loading, router]);

    if (loading || currentUser) return null;

    const onSubmit = async (data: SignupFormValues) => {
        setSubmitting(true);
        setError("");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            await updateProfile(userCredential.user, { displayName: data.name });
            await createUserProfileDocument(userCredential.user, { name: data.name });
            router.push("/dashboard");
        } catch (err: unknown) {
            setError(getAuthErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleSignup = async () => {
        try {
            await loginWithGoogle();
            router.push("/dashboard");
        } catch (err: unknown) {
            setError(getAuthErrorMessage(err));
        }
    };

    return (
        <div className="container mx-auto px-4 max-w-md mt-24 mb-32">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Create an account</CardTitle>
                    <CardDescription>Start building your professional resume</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Input placeholder="Full Name" {...register("name")} />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Input placeholder="Email" {...register("email")} />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Input type="password" placeholder="Password" {...register("password")} />
                            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Input type="password" placeholder="Confirm Password" {...register("confirmPassword")} />
                            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? "Creating account..." : "Sign Up"}
                        </Button>
                    </form>

                    <div className="my-6 flex items-center">
                        <Separator className="flex-1" />
                        <span className="mx-4 text-xs text-muted-foreground uppercase">Or</span>
                        <Separator className="flex-1" />
                    </div>

                    <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignup}>
                        Continue with Google
                    </Button>
                </CardContent>
                <CardFooter className="flex justify-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline ml-1">Log in</Link>
                </CardFooter>
            </Card>
        </div>
    );
}
