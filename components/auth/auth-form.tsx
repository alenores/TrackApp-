"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type AuthMode = "login" | "register";

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Navegación dura post-login: garantiza que las cookies de sesión
      // de Supabase estén disponibles en el próximo request al servidor.
      // router.push + router.refresh en secuencia compiten y pueden fallar
      // en mobile con red variable.
      window.location.href = "/";
      return;
    }

    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      setLoading(false);
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          nombre: nombre.trim(),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (signUpData.session) {
      window.location.href = "/";
      return;
    }

    setMessage("Registrado. Ahora iniciá sesión.");
    setMode("login");
    setLoading(false);
  };

  return (
    <Card className="space-y-5">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-foreground">TrackApp</h1>
        <p className="text-sm text-muted">
          {mode === "login"
            ? "Ingresá para acceder a tus rutas"
            : "Creá tu cuenta para empezar"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
            setMessage(null);
          }}
          className={[
            "min-h-11 rounded-lg text-sm font-semibold transition-colors",
            mode === "login"
              ? "bg-surface-elevated text-foreground"
              : "text-muted hover:text-foreground",
          ].join(" ")}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError(null);
            setMessage(null);
          }}
          className={[
            "min-h-11 rounded-lg text-sm font-semibold transition-colors",
            mode === "register"
              ? "bg-surface-elevated text-foreground"
              : "text-muted hover:text-foreground",
          ].join(" ")}
        >
          Registrarse
        </button>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        {mode === "register" ? (
          <Input
            label="Nombre"
            type="text"
            autoComplete="name"
            required
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Tu nombre"
          />
        ) : null}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 6 caracteres"
        />

        {error ? (
          <p role="alert" className="rounded-lg border border-red-800/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
            {message}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={loading}>
          {loading
            ? "Procesando…"
            : mode === "login"
              ? "Entrar"
              : "Crear cuenta"}
        </Button>
      </form>
    </Card>
  );
}
