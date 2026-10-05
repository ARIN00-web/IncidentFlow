"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters.",
      );

      return;
    }

    setLoading(true);

    try {
      await api.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      /*
       * Register endpoint creates the user but
       * does not return a JWT.
       *
       * Therefore immediately login.
       */
      const loginResult = await api.login({
        email: email.trim(),
        password,
      });

      saveAuth(
        loginResult.accessToken,
        loginResult.user,
      );

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">
            IF
          </div>

          <div>
            <strong>IncidentFlow</strong>
            <span>Reliability operations</span>
          </div>
        </div>

        <div className="auth-heading">
          <h1>Create your account</h1>
          <p>
            Start managing incidents with your team.
          </p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            Full name

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Arin Kaushik"
              autoComplete="name"
              required
            />
          </label>

          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <button
            className="button button-primary"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}