import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAction } from "@/server/actions";
import { getCurrentUser } from "@/server/auth";

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
    <main className="auth-wrap">
      <section className="auth-card">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div className="brand-name">remind</div>
          <p className="brand-copy">
            Gestão interna de projetos, tarefas, filtros operacionais e lembretes visíveis no próprio app.
          </p>
        </div>

        {error ? <div className="error-box">{decodeURIComponent(error)}</div> : null}

        <form action={loginAction} className="form-grid">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required placeholder="voce@remind.local" />
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input id="password" name="password" type="password" required placeholder="Sua senha" />
          </div>

          <button className="button" type="submit">
            Entrar
          </button>
        </form>

        <div className="muted">
          Credenciais iniciais podem ser geradas com <code>npm run db:seed</code>.
        </div>

        <Link className="link-button" href="https://nextjs.org/docs">
          Referência técnica do runtime
        </Link>
      </section>
    </main>
  );
}
