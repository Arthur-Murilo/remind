import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { loginAction } from "@/server/actions";
import { getCurrentUser } from "@/server/auth";
import { LogoMark } from "@/components/logo-mark";

export const metadata: Metadata = {
  title: "Login | remind"
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/app");
  }

  const resolvedSearchParams = await searchParams;
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;

  return (
    <main className="auth-split">
      <section className="auth-panel-form" aria-labelledby="auth-heading">
        <div className="auth-form-inner">
          <div className="auth-brand">
            <div className="brand-mark">
              <LogoMark size={22} />
            </div>
            <span className="brand-name">remind</span>
          </div>

          <h1 id="auth-heading" className="auth-heading">
            Entrar no remind<span className="auth-heading-accent">.</span>
          </h1>

          {error ? <div className="error-box auth-error">{decodeURIComponent(error)}</div> : null}

          <form action={loginAction} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="voce@remind.local"
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Sua senha"
                autoComplete="current-password"
              />
            </div>

            <button className="auth-submit" type="submit">
              Entrar
            </button>
          </form>

          <p className="auth-hint">
            Credenciais iniciais: <code>npm run db:seed</code>
          </p>
        </div>
      </section>

      <aside className="auth-panel-visual" aria-hidden="true">
        <div className="auth-visual-mesh" />
        <div className="auth-visual-stars" />
      </aside>
    </main>
  );
}
