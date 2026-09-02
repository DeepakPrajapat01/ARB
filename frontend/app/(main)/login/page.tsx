"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { getAuthErrorMessage } from "@/lib/firebase/errors";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { loginWithGoogle, currentUser, loading } = useAuth();
    const router = useRouter();
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema)
    });

    useEffect(() => {
        if (!loading && currentUser) {
            router.push("/dashboard");
        }
    }, [currentUser, loading, router]);

    if (loading || currentUser) return null;

    const onSubmit = async (data: LoginFormValues) => {
        setSubmitting(true);
        setError("");
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
            router.push("/dashboard");
        } catch (err: unknown) {
            setError(getAuthErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
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
                    <CardTitle className="text-2xl">Welcome back</CardTitle>
                    <CardDescription>Sign in to your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Input placeholder="Email" {...register("email")} />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Input type="password" placeholder="Password" {...register("password")} />
                            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>

                    <div className="my-6 flex items-center">
                        <Separator className="flex-1" />
                        <span className="mx-4 text-xs text-muted-foreground uppercase">Or</span>
                        <Separator className="flex-1" />
                    </div>

                    <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin}>
                        Continue with Google
                    </Button>
                </CardContent>
                <CardFooter className="flex justify-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-primary hover:underline ml-1">Sign up</Link>
                </CardFooter>
            </Card>
        </div>
    );
}
