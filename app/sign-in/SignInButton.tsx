"use client";

import { useState } from "react";
import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient({
  baseURL: typeof window === "undefined" ? undefined : window.location.origin,
});

type Props = {
  callbackURL: string;
};

export function SignInButton({ callbackURL }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithGitHub() {
    setError("");
    setLoading(true);

    const result = await authClient.signIn.social({
      callbackURL,
      provider: "github",
    });

    if (result.error) {
      setError(result.error.message || "登录失败");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        className="btn-primary min-h-10 px-5 disabled:opacity-50"
        disabled={loading}
        onClick={() => void signInWithGitHub()}
        type="button"
      >
        {loading ? "正在跳转..." : "使用 GitHub 登录"}
      </button>
      {error && (
        <p className="mt-4 rounded-sm bg-error-soft px-3 py-2 text-body-sm text-error-deep">
          {error}
        </p>
      )}
    </div>
  );
}
