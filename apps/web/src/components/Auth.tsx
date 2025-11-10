import React, { useState } from "react";
import {
  signUpWithEmail,
  signInWithEmail,
  onAuthUserChanged,
} from "../services/auth";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface AuthProps {
  onAuthenticated: () => void;
}

export function Auth({ onAuthenticated }: AuthProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const unsub = onAuthUserChanged((u) => {
      if (u) onAuthenticated();
    });
    return () => unsub();
  }, [onAuthenticated]);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
        // For new signups, we'll let onAuthenticated handle the flow to profile setup
      } else {
        await signInWithEmail(email, password);
      }
      // Do NOT call onAuthenticated() directly here. We rely on the global
      // auth state observer (onAuthUserChanged) to notify the app so that
      // navigation (to dashboard or setup) occurs only after the auth
      // state is fully established and the profile check runs.
    } catch (e: any) {
      setError(e?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-slate-900 mb-4">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button
            disabled={loading || !email || password.length < 6}
            onClick={submit}
            className="w-full bg-slate-900 text-white"
          >
            {loading
              ? "Please wait…"
              : mode === "signin"
              ? "Sign in"
              : "Sign up"}
          </Button>
          <button
            className="text-sm text-slate-600 underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
}
