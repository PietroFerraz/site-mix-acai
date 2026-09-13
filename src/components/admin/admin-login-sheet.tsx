"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CloseIcon } from "@/components/icons";
import { BottomSheet } from "@/components/ui/bottom-sheet";

/**
 * Acesso do restaurante. Discreto de propósito: um único item no rodapé do
 * cardápio abre esta folha, sem botão chamativo na interface do cliente.
 */
export function AdminLoginSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      setPassword("");
      onClose();
      router.push("/admin");
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet onClose={onClose} title="Acesso do restaurante">
      <form onSubmit={handleSubmit} className="px-4 pb-6 pt-2">
        <p className="text-xs text-zinc-500">
          Área restrita. Digite a senha do restaurante para gerenciar pedidos e o cardápio.
        </p>

        <label className="mt-4 block text-xs font-semibold text-zinc-600">
          Senha
          <input
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none transition focus:border-brand focus:bg-white"
          />
        </label>

        {error ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-zinc-200 text-zinc-500"
            aria-label="Cancelar"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-12 flex-1 rounded-xl bg-zinc-900 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
