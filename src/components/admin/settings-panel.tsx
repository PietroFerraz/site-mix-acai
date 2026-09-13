"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Field, Switch, TextArea, TextInput, apiRequest } from "@/components/admin/ui";
import { ImageUpload } from "@/components/admin/image-upload";
import { normalizeWhatsapp } from "@/lib/format";
import type { MenuData } from "@/lib/types";

type Props = {
  menu: MenuData;
  onChanged: () => Promise<void>;
  notify: (type: "success" | "error", text: string) => void;
};

type FormState = {
  name: string;
  tagline: string;
  coverImage: string;
  logoImage: string;
  facebookUrl: string;
  instagramUrl: string;
  whatsapp: string;
  address: string;
  openingHours: string;
  currency: string;
  locale: string;
  isOpen: boolean;
  deliveryFee: string;
  promoBadge: string;
  promoTitle: string;
  promoDescription: string;
  promoActive: boolean;
};

function buildForm(menu: MenuData): FormState {
  const { restaurant } = menu;
  const promotion = menu.promotions[0];
  return {
    name: restaurant.name,
    tagline: restaurant.tagline ?? "",
    coverImage: restaurant.coverImage ?? "",
    logoImage: restaurant.logoImage ?? "",
    facebookUrl: restaurant.facebookUrl ?? "",
    instagramUrl: restaurant.instagramUrl ?? "",
    whatsapp: restaurant.whatsapp ?? "",
    address: restaurant.address ?? "",
    openingHours: restaurant.openingHours ?? "",
    currency: restaurant.currency,
    locale: restaurant.locale,
    isOpen: restaurant.isOpen,
    deliveryFee: restaurant.deliveryFee.toFixed(2),
    promoBadge: promotion?.badge ?? "",
    promoTitle: promotion?.title ?? "",
    promoDescription: promotion?.description ?? "",
    promoActive: promotion?.isActive ?? false,
  };
}

export function SettingsPanel({ menu, onChanged, notify }: Props) {
  const [form, setForm] = useState<FormState>(() => buildForm(menu));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(buildForm(menu));
  }, [menu]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const previewNumber = normalizeWhatsapp(form.whatsapp);
  // Brazilian mobile numbers carry a 9th digit: 55 + DDD (2) + 9xxxxxxxx.
  // A 10-digit local part means the leading 9 was probably left out, which makes
  // wa.me fail with "invalid phone number".
  const missingDigit =
    previewNumber !== null &&
    previewNumber.startsWith("55") &&
    previewNumber.length - 2 === 10;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const result = await apiRequest("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify({
        restaurant: {
          name: form.name,
          tagline: form.tagline,
          coverImage: form.coverImage,
          logoImage: form.logoImage,
          facebookUrl: form.facebookUrl,
          instagramUrl: form.instagramUrl,
          whatsapp: form.whatsapp,
          address: form.address,
          openingHours: form.openingHours,
          currency: form.currency,
          locale: form.locale,
          isOpen: form.isOpen,
          deliveryFee: form.deliveryFee,
        },
        promotion: {
          badge: form.promoBadge,
          title: form.promoTitle,
          description: form.promoDescription,
          isActive: form.promoActive,
        },
      }),
    });
    setSaving(false);
    if (!result.ok) {
      notify("error", result.error);
      return;
    }
    notify("success", "Configurações salvas");
    await onChanged();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Configurações</h2>
          <p className="text-xs text-zinc-500">Dados do restaurante exibidos no cardápio.</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
          <Switch
            checked={form.isOpen}
            onChange={(value) => update("isOpen", value)}
            label={form.isOpen ? "Aberto para pedidos" : "Fechado para pedidos"}
          />
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-brand">Restaurante</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Nome">
            <TextInput required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </Field>
          <Field label="Slogan">
            <TextInput value={form.tagline} onChange={(e) => update("tagline", e.target.value)} />
          </Field>
          <div>
            <span className="text-xs font-semibold text-zinc-600">Imagem de capa</span>
            <div className="mt-1">
              <ImageUpload
                label="Capa (banner largo)"
                value={form.coverImage}
                onChange={(value) => update("coverImage", value)}
                previewClassName="h-24 w-full rounded-xl"
              />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-600">Logo</span>
            <div className="mt-1">
              <ImageUpload
                label="Logo (quadrada)"
                value={form.logoImage}
                onChange={(value) => update("logoImage", value)}
                previewClassName="h-24 w-24 rounded-full"
              />
            </div>
          </div>
          <Field label="Endereço">
            <TextInput value={form.address} onChange={(e) => update("address", e.target.value)} />
          </Field>
          <Field label="Horário de funcionamento">
            <TextInput
              value={form.openingHours}
              onChange={(e) => update("openingHours", e.target.value)}
              placeholder="Ter a Dom • 11h às 23h"
            />
          </Field>
        </div>
        <div className="mt-3 flex gap-3">
          <div className="h-20 flex-1 overflow-hidden rounded-xl bg-zinc-100">
            {form.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.coverImage} alt="Capa" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-white bg-zinc-100 shadow">
            {form.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logoImage} alt="Logo" className="h-full w-full object-cover" />
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-brand">Contato e redes sociais</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="WhatsApp" hint="Somente números, com DDI e DDD. Ex.: 5511999999999">
            <TextInput
              inputMode="numeric"
              value={form.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
            />
          </Field>
          <Field label="Facebook (URL)">
            <TextInput value={form.facebookUrl} onChange={(e) => update("facebookUrl", e.target.value)} />
          </Field>
          <Field label="Instagram (URL)">
            <TextInput value={form.instagramUrl} onChange={(e) => update("instagramUrl", e.target.value)} />
          </Field>
        </div>
        {previewNumber ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            <span>
              Link gerado: <span className="font-mono font-bold">wa.me/{previewNumber}</span>
            </span>
            {/* The admin panel is used on desktop, where wa.me redirects to
                api.whatsapp.com and gets blocked. WhatsApp Web goes straight. */}
            <a
              href={`https://web.whatsapp.com/send?phone=${previewNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto rounded-lg bg-[#25D366] px-2.5 py-1 font-bold text-white"
            >
              Testar no WhatsApp Web
            </a>
            <a
              href={`https://wa.me/${previewNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-emerald-300 px-2.5 py-1 font-bold text-emerald-800"
            >
              Testar app
            </a>
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            Sem WhatsApp configurado, os botões de contato ficam ocultos no cardápio.
          </p>
        )}
        {missingDigit ? (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            ⚠️ Esse número ficou com 10 dígitos depois do 55. Celulares no Brasil têm 9 dígitos
            depois do DDD — confira se não faltou o “9” (ex.: 82 9<strong>98745</strong>-3666).
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-brand">Pedidos e moeda</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Taxa de entrega">
            <TextInput
              inputMode="decimal"
              value={form.deliveryFee}
              onChange={(e) => update("deliveryFee", e.target.value)}
            />
          </Field>
          <Field label="Moeda (ISO)" hint="BRL, USD, EUR...">
            <TextInput
              maxLength={3}
              value={form.currency}
              onChange={(e) => update("currency", e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Idioma/região" hint="pt-BR, en-US, es-AR...">
            <TextInput value={form.locale} onChange={(e) => update("locale", e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-brand">Banner de promoção</h3>
          <Switch
            checked={form.promoActive}
            onChange={(value) => update("promoActive", value)}
            label={form.promoActive ? "Ativo" : "Inativo"}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr]">
          <Field label="Destaque" hint='Ex.: "50%"'>
            <TextInput value={form.promoBadge} onChange={(e) => update("promoBadge", e.target.value)} />
          </Field>
          <Field label="Título" hint='Ex.: "de desconto"'>
            <TextInput value={form.promoTitle} onChange={(e) => update("promoTitle", e.target.value)} />
          </Field>
        </div>
        <Field label="Descrição" className="mt-3">
          <TextArea
            rows={2}
            value={form.promoDescription}
            onChange={(e) => update("promoDescription", e.target.value)}
          />
        </Field>
        <p className="mt-2 text-[11px] text-zinc-400">
          O botão “Ver” do banner lista automaticamente todos os itens com preço original maior que o
          preço atual.
        </p>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="px-6">
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
