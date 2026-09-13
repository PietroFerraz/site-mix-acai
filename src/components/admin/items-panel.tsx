"use client";

import { useState, type FormEvent } from "react";
import {
  Button,
  Field,
  Modal,
  Select,
  Switch,
  TextArea,
  TextInput,
  apiRequest,
} from "@/components/admin/ui";
import { ImageUpload } from "@/components/admin/image-upload";
import { FoodImage } from "@/components/ui/food-image";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { formatMoney } from "@/lib/format";
import type { MenuData, MenuItemDTO } from "@/lib/types";

type Props = {
  menu: MenuData;
  onChanged: () => Promise<void>;
  notify: (type: "success" | "error", text: string) => void;
};

type VariantRow = { id: number | null; name: string; price: string };

type FormState = {
  id: number | null;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: string;
  variants: VariantRow[];
};

function emptyForm(categoryId: number | undefined): FormState {
  return {
    id: null,
    categoryId: categoryId ? String(categoryId) : "",
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    imageUrl: "",
    isAvailable: true,
    isFeatured: false,
    sortOrder: "0",
    variants: [],
  };
}

function formFromItem(item: MenuItemDTO): FormState {
  return {
    id: item.id,
    categoryId: String(item.categoryId),
    name: item.name,
    description: item.description ?? "",
    price: item.price.toFixed(2),
    originalPrice: item.originalPrice ? item.originalPrice.toFixed(2) : "",
    imageUrl: item.imageUrl ?? "",
    isAvailable: item.isAvailable,
    isFeatured: item.isFeatured,
    sortOrder: String(item.sortOrder),
    variants: item.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: variant.price.toFixed(2),
    })),
  };
}

export function ItemsPanel({ menu, onChanged, notify }: Props) {
  const { restaurant, categories } = menu;
  const money = (value: number) => formatMoney(value, restaurant.currency, restaurant.locale);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));

  const updateVariant = (index: number, patch: Partial<VariantRow>) =>
    setForm((current) =>
      current
        ? {
            ...current,
            variants: current.variants.map((row, rowIndex) =>
              rowIndex === index ? { ...row, ...patch } : row,
            ),
          }
        : current,
    );

  const addVariantRow = () =>
    setForm((current) =>
      current
        ? {
            ...current,
            variants: [
              ...current.variants,
              {
                id: null,
                name: current.variants.length === 0 ? "300ml" : current.variants.length === 1 ? "500ml" : "",
                price: current.variants.length === 0 && current.price ? current.price : "",
              },
            ],
          }
        : current,
    );

  const removeVariantRow = (index: number) =>
    setForm((current) =>
      current
        ? { ...current, variants: current.variants.filter((_, rowIndex) => rowIndex !== index) }
        : current,
    );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    const hasVariants = form.variants.length > 0;
    setSaving(true);
    const payload = {
      categoryId: Number(form.categoryId),
      name: form.name,
      description: form.description,
      price: hasVariants ? undefined : form.price,
      originalPrice: hasVariants ? "" : form.originalPrice,
      imageUrl: form.imageUrl,
      isAvailable: form.isAvailable,
      isFeatured: form.isFeatured,
      sortOrder: Number(form.sortOrder) || 0,
      variants: form.variants.map((row) => ({
        id: row.id ?? undefined,
        name: row.name,
        price: row.price,
      })),
    };
    const result = form.id
      ? await apiRequest(`/api/admin/items/${form.id}`, { method: "PUT", body: JSON.stringify(payload) })
      : await apiRequest("/api/admin/items", { method: "POST", body: JSON.stringify(payload) });
    setSaving(false);
    if (!result.ok) {
      notify("error", result.error);
      return;
    }
    notify("success", form.id ? "Item atualizado" : "Item criado");
    setForm(null);
    await onChanged();
  }

  async function toggle(item: MenuItemDTO, field: "isAvailable" | "isFeatured", value: boolean) {
    setBusyId(item.id);
    const result = await apiRequest(`/api/admin/items/${item.id}`, {
      method: "PUT",
      body: JSON.stringify({ [field]: value }),
    });
    setBusyId(null);
    if (!result.ok) {
      notify("error", result.error);
      return;
    }
    await onChanged();
  }

  async function remove(item: MenuItemDTO) {
    if (!window.confirm(`Excluir "${item.name}"? Essa ação não pode ser desfeita.`)) return;
    setBusyId(item.id);
    const result = await apiRequest(`/api/admin/items/${item.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!result.ok) {
      notify("error", result.error);
      return;
    }
    notify("success", "Item excluído");
    await onChanged();
  }

  const term = search.trim().toLowerCase();
  const totalItems = categories.reduce((sum, category) => sum + category.items.length, 0);
  const hasVariants = (form?.variants.length ?? 0) > 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Itens do cardápio</h2>
          <p className="text-xs text-zinc-500">
            {totalItems} {totalItems === 1 ? "item" : "itens"} em {categories.length}{" "}
            {categories.length === 1 ? "categoria" : "categorias"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar item..."
            className="h-9 w-40 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-brand sm:w-56"
          />
          <Button onClick={() => setForm(emptyForm(categories[0]?.id))} disabled={categories.length === 0}>
            <PlusIcon className="h-4 w-4" /> Novo item
          </Button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
          Crie uma categoria primeiro para adicionar itens.
        </div>
      ) : null}

      <div className="mt-4 space-y-5">
        {categories.map((category) => {
          const items = term
            ? category.items.filter((item) => item.name.toLowerCase().includes(term))
            : category.items;
          if (term && items.length === 0) return null;
          return (
            <section key={category.id}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-brand">{category.name}</h3>
                {!category.isActive ? (
                  <span className="rounded-md bg-zinc-200 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600">
                    OCULTA
                  </span>
                ) : null}
                <span className="text-xs text-zinc-400">({items.length})</span>
              </div>
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400">
                  Nenhum item nesta categoria.
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center gap-3 border-b border-zinc-100 p-3 last:border-b-0"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                        <FoodImage
                          src={item.imageUrl}
                          alt={item.name}
                          fallbackEmoji="🥤"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-zinc-900">
                          {item.name}
                          {item.isFeatured ? (
                            <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              DESTAQUE
                            </span>
                          ) : null}
                        </p>
                        {item.variants.length > 0 ? (
                          <p className="mt-0.5 flex flex-wrap gap-1">
                            {item.variants.map((variant) => (
                              <span
                                key={variant.id}
                                className="rounded-md bg-brand-light px-1.5 py-0.5 text-[11px] font-semibold text-brand-dark"
                              >
                                {variant.name}{" "}
                                <span className="font-extrabold text-brand">{money(variant.price)}</span>
                              </span>
                            ))}
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-500">
                            <span className="font-bold text-brand">{money(item.price)}</span>
                            {item.originalPrice ? (
                              <span className="ml-1.5 line-through">{money(item.originalPrice)}</span>
                            ) : null}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={item.isAvailable}
                          disabled={busyId === item.id}
                          onChange={(value) => toggle(item, "isAvailable", value)}
                          label={item.isAvailable ? "Disponível" : "Esgotado"}
                        />
                        <Button variant="secondary" onClick={() => setForm(formFromItem(item))}>
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          disabled={busyId === item.id}
                          onClick={() => remove(item)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {form ? (
        <Modal title={form.id ? "Editar item" : "Novo item"} onClose={() => setForm(null)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Nome">
              <TextInput
                required
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Ex.: Açaí Maracujá"
              />
            </Field>
            <Field label="Categoria">
              <Select
                required
                value={form.categoryId}
                onChange={(event) => update("categoryId", event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-600">
                    Tamanhos / variações
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Ex.: 300ml e 500ml com preços diferentes. O cliente escolhe um ao adicionar.
                  </p>
                </div>
                <Button type="button" variant="secondary" onClick={addVariantRow}>
                  <PlusIcon className="h-4 w-4" /> Tamanho
                </Button>
              </div>
              {form.variants.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {form.variants.map((row, index) => (
                    <div key={index} className="grid grid-cols-[1fr_120px_auto] items-center gap-2">
                      <TextInput
                        required
                        value={row.name}
                        onChange={(event) => updateVariant(index, { name: event.target.value })}
                        placeholder="Nome (ex.: 300ml)"
                      />
                      <TextInput
                        required
                        inputMode="decimal"
                        value={row.price}
                        onChange={(event) => updateVariant(index, { price: event.target.value })}
                        placeholder="Preço"
                      />
                      <Button
                        type="button"
                        variant="danger"
                        className="mt-1"
                        aria-label="Remover tamanho"
                        onClick={() => removeVariantRow(index)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {hasVariants ? (
              <p className="rounded-lg bg-brand-light px-3 py-2 text-[11px] font-semibold text-brand-dark">
                O preço do item é definido pelos tamanhos acima.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field label={`Preço (${restaurant.currency})`}>
                  <TextInput
                    required
                    inputMode="decimal"
                    value={form.price}
                    onChange={(event) => update("price", event.target.value)}
                    placeholder="0,00"
                  />
                </Field>
                <Field label="Preço original" hint="Opcional. Exibe o desconto riscado.">
                  <TextInput
                    inputMode="decimal"
                    value={form.originalPrice}
                    onChange={(event) => update("originalPrice", event.target.value)}
                    placeholder="0,00"
                  />
                </Field>
              </div>
            )}

            <Field label="Descrição">
              <TextArea
                rows={3}
                maxLength={600}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Ingredientes, tamanho, acompanhamentos..."
              />
            </Field>
            <ImageUpload
              label="Foto do produto"
              value={form.imageUrl}
              onChange={(value) => update("imageUrl", value)}
              previewClassName="h-32 w-full rounded-xl"
            />
            <div className="flex flex-wrap items-center gap-5">
              <Switch
                checked={form.isAvailable}
                onChange={(value) => update("isAvailable", value)}
                label="Disponível"
              />
              <Switch
                checked={form.isFeatured}
                onChange={(value) => update("isFeatured", value)}
                label="Destaque"
              />
              <Field label="Ordem" className="ml-auto w-20">
                <TextInput
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => update("sortOrder", event.target.value)}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
