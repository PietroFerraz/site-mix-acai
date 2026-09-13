"use client";

import { useState, type FormEvent } from "react";
import { Button, Switch, apiRequest } from "@/components/admin/ui";
import { PlusIcon } from "@/components/icons";
import type { CategoryDTO, MenuData } from "@/lib/types";

type Props = {
  menu: MenuData;
  onChanged: () => Promise<void>;
  notify: (type: "success" | "error", text: string) => void;
};

export function CategoriesPanel({ menu, onChanged, notify }: Props) {
  const { categories } = menu;
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  async function create(event: FormEvent) {
    event.preventDefault();
    if (newName.trim().length < 2) return;
    setCreating(true);
    const result = await apiRequest("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name: newName.trim() }),
    });
    setCreating(false);
    if (!result.ok) {
      notify("error", result.error);
      return;
    }
    setNewName("");
    notify("success", "Categoria criada");
    await onChanged();
  }

  async function patch(category: CategoryDTO, body: Record<string, unknown>, message?: string) {
    setBusyId(category.id);
    const result = await apiRequest(`/api/admin/categories/${category.id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    setBusyId(null);
    if (!result.ok) {
      notify("error", result.error);
      return false;
    }
    if (message) notify("success", message);
    await onChanged();
    return true;
  }

  async function rename(category: CategoryDTO) {
    const draft = drafts[category.id];
    if (draft === undefined || draft.trim() === category.name) return;
    if (draft.trim().length < 2) {
      notify("error", "O nome precisa ter ao menos 2 caracteres.");
      return;
    }
    const ok = await patch(category, { name: draft.trim() }, "Categoria renomeada");
    if (ok) {
      setDrafts((current) => {
        const next = { ...current };
        delete next[category.id];
        return next;
      });
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const current = categories[index];
    const other = categories[target];
    setBusyId(current.id);
    const [first, second] = await Promise.all([
      apiRequest(`/api/admin/categories/${current.id}`, {
        method: "PUT",
        body: JSON.stringify({ sortOrder: target }),
      }),
      apiRequest(`/api/admin/categories/${other.id}`, {
        method: "PUT",
        body: JSON.stringify({ sortOrder: index }),
      }),
    ]);
    setBusyId(null);
    if (!first.ok || !second.ok) {
      notify("error", "Não foi possível reordenar");
    }
    await onChanged();
  }

  async function remove(category: CategoryDTO) {
    const warning =
      category.items.length > 0
        ? `Excluir "${category.name}" e seus ${category.items.length} itens? Essa ação não pode ser desfeita.`
        : `Excluir a categoria "${category.name}"?`;
    if (!window.confirm(warning)) return;
    setBusyId(category.id);
    const result = await apiRequest(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!result.ok) {
      notify("error", result.error);
      return;
    }
    notify("success", "Categoria excluída");
    await onChanged();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Categorias</h2>
          <p className="text-xs text-zinc-500">
            Organize as abas do cardápio. A ordem aqui é a ordem exibida para o cliente.
          </p>
        </div>
      </div>

      <form onSubmit={create} className="mt-4 flex gap-2">
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Nova categoria (ex.: Lanches)"
          className="h-10 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-brand"
        />
        <Button type="submit" disabled={creating || newName.trim().length < 2}>
          <PlusIcon className="h-4 w-4" /> Adicionar
        </Button>
      </form>

      <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
        {categories.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">Nenhuma categoria cadastrada.</p>
        ) : (
          categories.map((category, index) => (
            <div
              key={category.id}
              className="flex flex-wrap items-center gap-3 border-b border-zinc-100 p-3 last:border-b-0"
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label="Mover para cima"
                  disabled={index === 0 || busyId !== null}
                  onClick={() => move(index, -1)}
                  className="rounded px-1.5 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label="Mover para baixo"
                  disabled={index === categories.length - 1 || busyId !== null}
                  onClick={() => move(index, 1)}
                  className="rounded px-1.5 text-xs text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <input
                value={drafts[category.id] ?? category.name}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, [category.id]: event.target.value }))
                }
                onBlur={() => rename(category)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") (event.target as HTMLInputElement).blur();
                }}
                className="h-9 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-sm font-bold text-zinc-900 outline-none transition hover:border-zinc-200 focus:border-brand focus:bg-white"
              />
              <span className="text-xs text-zinc-400">
                {category.items.length} {category.items.length === 1 ? "item" : "itens"}
              </span>
              <Switch
                checked={category.isActive}
                disabled={busyId === category.id}
                onChange={(value) => patch(category, { isActive: value })}
                label={category.isActive ? "Visível" : "Oculta"}
              />
              <Button
                variant="danger"
                disabled={busyId === category.id}
                onClick={() => remove(category)}
              >
                Excluir
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
