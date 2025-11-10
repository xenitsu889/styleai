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
  // optional initial mode so callers can start the component in sign-in or sign-up
  initialMode?: "signin" | "signup";
  // When false, the component should not auto-navigate away if a persisted
  // authenticated session is detected on mount. This allows callers (like
  // the Welcome flow) to force the Auth UI to remain visible even when a
  // cached user exists.
  allowAutoRedirect?: boolean;
}

export function Auth({
  onAuthenticated,
  initialMode,
  allowAutoRedirect = true,
}: AuthProps) {
  const [mode, setMode] = useState<"signin" | "signup">(
    initialMode || "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Track whether the user actively submitted the form so we can allow
  // navigation even when allowAutoRedirect is false. This distinguishes
  // between a persisted session (initial load) and an active sign-in.
  const userSubmittedRef = React.useRef(false);

  React.useEffect(() => {
    // If parent changes initialMode, reflect it here
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  React.useEffect(() => {
    // If `allowAutoRedirect` is false, ignore the initial callback (which
    // represents the hydrated persisted auth state) and only call
    // `onAuthenticated` for subsequent sign-in events.
    const initialRef = { current: true } as { current: boolean };
    const unsub = onAuthUserChanged((u) => {
      if (initialRef.current) {
        initialRef.current = false;
        // If auto-redirect is disabled and a user exists right away, don't
        // trigger navigation. Wait for a subsequent auth event (e.g. user
        // actively signing in) to notify the parent.
        if (!allowAutoRedirect && u) return;
      }

      // If the user actively submitted the sign-in form, always allow
      // navigation regardless of allowAutoRedirect.
      if (u && userSubmittedRef.current) {
        userSubmittedRef.current = false;
        onAuthenticated();
        return;
      }

      if (u) onAuthenticated();
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onAuthenticated, allowAutoRedirect]);

  const submit = async () => {
    setError(null);
    setLoading(true);
    // Mark that the user actively submitted the form so the auth listener
    // will allow navigation even when allowAutoRedirect is false.
    userSubmittedRef.current = true;
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
        // For new signups, we'll let onAuthenticated handle the flow to profile setup
      } else {
        await signInWithEmail(email, password);
      }
      // If the sign-in succeeded, call onAuthenticated immediately.
      // This handles the case where the user was already signed in
      // (persisted session) and Firebase doesn't trigger a new auth
      // state change, so the listener wouldn't fire.
      onAuthenticated();
    } catch (e: any) {
      setError(e?.message || "Authentication failed");
      // Clear the submit flag if auth failed so we don't incorrectly
      // navigate if a persisted session callback fires.
      userSubmittedRef.current = false;
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
