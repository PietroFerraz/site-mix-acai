"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useCart } from "@/components/cart/cart-context";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { WhatsAppButton } from "@/components/whatsapp/whatsapp-button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { FoodImage } from "@/components/ui/food-image";
import { formatMoney, formatPhoneBR } from "@/lib/format";
import {
  FULFILLMENT_OPTIONS,
  PAYMENT_OPTIONS,
  labelFor,
  orderItemLabel,
  type FulfillmentValue,
  type OrderDTO,
  type PaymentValue,
  type RestaurantDTO,
} from "@/lib/types";
import { buildCartMessage, buildOrderMessage } from "@/lib/whatsapp";

const CUSTOMER_KEY = "mixrl-customer-v1";

type Props = {
  restaurant: RestaurantDTO;
  onClose: () => void;
};

type FormState = {
  name: string;
  phone: string;
  fulfillment: FulfillmentValue;
  address: string;
  payment: PaymentValue;
  notes: string;
};

const inputClass =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white";

export function CartDrawer({ restaurant, onClose }: Props) {
  const cart = useCart();
  const money = (value: number) => formatMoney(value, restaurant.currency, restaurant.locale);

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    fulfillment: "pickup",
    address: "",
    payment: "pix",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDTO | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CUSTOMER_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<FormState>;
        setForm((current) => ({
          ...current,
          name: saved.name ?? "",
          phone: saved.phone ?? "",
          address: saved.address ?? "",
          fulfillment: saved.fulfillment === "delivery" ? "delivery" : "pickup",
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  const deliveryFee = form.fulfillment === "delivery" ? restaurant.deliveryFee : 0;
  const total = cart.subtotal + deliveryFee;

  // The WhatsApp order text: every chosen product with size, quantity and total.
  const cartMessage =
    restaurant.whatsapp && cart.lines.length > 0
      ? buildCartMessage(restaurant, cart.lines, {
          customerName: form.name,
          customerPhone: form.phone,
          fulfillment: form.fulfillment,
          address: form.address,
          paymentMethod: labelFor(PAYMENT_OPTIONS, form.payment),
          notes: form.notes,
          deliveryFee,
        })
      : null;
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (cart.lines.length === 0) {
      setError("Sua sacola está vazia.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerPhone: form.phone,
          fulfillment: form.fulfillment,
          address: form.address,
          paymentMethod: form.payment,
          notes: form.notes,
          items: cart.lines.map((line) => ({
            itemId: line.itemId,
            variantId: line.variantId,
            quantity: line.quantity,
            notes: line.notes,
          })),
        }),
      });
      const data = (await response.json()) as { order?: OrderDTO; error?: string };
      if (!response.ok || !data.order) {
        throw new Error(data.error ?? "Não foi possível enviar o pedido.");
      }
      try {
        window.localStorage.setItem(
          CUSTOMER_KEY,
          JSON.stringify({
            name: form.name,
            phone: form.phone,
            address: form.address,
            fulfillment: form.fulfillment,
          }),
        );
      } catch {
        // ignore
      }
      setOrder(data.order);
      cart.clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (order) {
    const trackingUrl =
      typeof window !== "undefined" ? `${window.location.origin}/pedido/${order.id}` : undefined;
    const whatsappMessage = restaurant.whatsapp
      ? buildOrderMessage(restaurant, order, trackingUrl)
      : null;

    return (
      <BottomSheet onClose={onClose} title="Pedido enviado!">
        <div className="px-4 pb-6 pt-5 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckIcon className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-xl font-extrabold text-zinc-900">Pedido #{order.id}</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Recebemos seu pedido, {order.customerName.split(" ")[0]}! Em instantes ele será
            confirmado pelo restaurante.
          </p>

          <div className="mt-5 rounded-2xl bg-zinc-50 p-4 text-left text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between py-1">
                <span className="text-zinc-700">
                  {item.quantity}x {orderItemLabel(item)}
                </span>
                <span className="font-semibold text-zinc-900">
                  {money(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
            {order.deliveryFee > 0 ? (
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-zinc-500">
                <span>Taxa de entrega</span>
                <span>{money(order.deliveryFee)}</span>
              </div>
            ) : null}
            <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 text-base font-extrabold">
              <span>Total</span>
              <span className="text-brand">{money(order.total)}</span>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {whatsappMessage ? (
              <WhatsAppButton
                phone={restaurant.whatsapp ?? ""}
                message={whatsappMessage}
                label="Enviar pelo WhatsApp"
              />
            ) : null}
            <Link
              href={`/pedido/${order.id}`}
              className="flex h-12 w-full items-center justify-center rounded-xl border border-zinc-200 text-sm font-bold text-zinc-800"
            >
              Acompanhar pedido
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="h-11 w-full text-sm font-semibold text-zinc-500"
            >
              Voltar ao cardápio
            </button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          Sua sacola
          {cart.lines.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Remover todos os itens da sacola?")) cart.clear();
              }}
              className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-500 transition hover:bg-red-50 hover:text-red-600"
            >
              Limpar
            </button>
          ) : null}
        </span>
      }
      footer={
        <div className="space-y-2">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-zinc-500">
              Total{deliveryFee > 0 ? " (com entrega)" : ""}
            </span>
            <span className="text-lg font-extrabold text-zinc-900">{money(total)}</span>
          </div>

          {restaurant.whatsapp ? (
            <WhatsAppButton
              phone={restaurant.whatsapp}
              message={cartMessage ?? undefined}
              label={cart.lines.length === 0 ? "Adicione itens para concluir" : "Concluir no WhatsApp"}
              disabled={cart.lines.length === 0}
            />
          ) : null}

          <button
            type="submit"
            form="checkout-form"
            disabled={submitting || cart.lines.length === 0 || !restaurant.isOpen}
            className="flex h-12 w-full items-center justify-center rounded-2xl border border-zinc-200 text-sm font-bold text-zinc-700 transition active:scale-[0.98] disabled:opacity-50"
          >
            {!restaurant.isOpen
              ? "Loja fechada — use o WhatsApp"
              : submitting
                ? "Enviando..."
                : "Finalizar pelo site"}
          </button>
        </div>
      }
    >
      <form id="checkout-form" onSubmit={handleSubmit} className="px-4 pb-4">
        {cart.lines.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-4xl">🛍️</p>
            <p className="mt-3 text-sm font-semibold text-zinc-700">Sua sacola está vazia</p>
            <p className="mt-1 text-xs text-zinc-500">
              Adicione itens do cardápio para continuar.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {cart.lines.map((line) => (
              <li key={line.key} className="flex items-center gap-3 py-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                  <FoodImage
                    src={line.imageUrl}
                    alt={line.name}
                    fallbackEmoji="🥤"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-zinc-900">
                    {line.name}
                    {line.variantName ? (
                      <span className="ml-1.5 rounded-md bg-brand-light px-1.5 py-0.5 text-[11px] font-bold text-brand">
                        {line.variantName}
                      </span>
                    ) : null}
                  </p>
                  {line.notes ? (
                    <p className="truncate text-[11px] text-zinc-500">Obs: {line.notes}</p>
                  ) : null}
                  <p className="text-sm font-extrabold text-brand">
                    {money(line.price * line.quantity)}
                  </p>
                </div>
                <QuantityStepper
                  size="sm"
                  allowRemove
                  value={line.quantity}
                  onChange={(value) => cart.updateQuantity(line.key, value)}
                />
              </li>
            ))}
          </ul>
        )}

        {cart.lines.length > 0 ? (
          <>
            <div className="mt-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>{money(cart.subtotal)}</span>
              </div>
              {form.fulfillment === "delivery" ? (
                <div className="flex justify-between text-zinc-600">
                  <span>Taxa de entrega</span>
                  <span>{deliveryFee > 0 ? money(deliveryFee) : "Grátis"}</span>
                </div>
              ) : null}
            </div>

            <h3 className="mt-5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
              Como quer receber?
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {FULFILLMENT_OPTIONS.map((option) => {
                const active = form.fulfillment === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => update("fulfillment", option.value)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                      active
                        ? "border-brand bg-brand-light text-brand"
                        : "border-zinc-200 bg-white text-zinc-600"
                    }`}
                  >
                    {option.label}
                    {option.value === "delivery" ? (
                      <span className="block text-[11px] font-medium opacity-80">
                        {restaurant.deliveryFee > 0
                          ? `+ ${money(restaurant.deliveryFee)}`
                          : "Grátis"}
                      </span>
                    ) : (
                      <span className="block text-[11px] font-medium opacity-80">No balcão</span>
                    )}
                  </button>
                );
              })}
            </div>

            <h3 className="mt-5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
              Seus dados{" "}
              <span className="font-normal normal-case text-zinc-400">
                — opcionais, agiliza o atendimento
              </span>
            </h3>
            <label className="mt-2 block text-xs font-semibold text-zinc-600">
              Nome
              <input
                required
                minLength={2}
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Seu nome"
                className={inputClass}
              />
            </label>
            <label className="mt-3 block text-xs font-semibold text-zinc-600">
              Telefone / WhatsApp
              <input
                required
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="(11) 99999-9999"
                className={inputClass}
              />
            </label>
            {form.fulfillment === "delivery" ? (
              <label className="mt-3 block text-xs font-semibold text-zinc-600">
                Endereço de entrega
                <input
                  required
                  minLength={5}
                  value={form.address}
                  onChange={(event) => update("address", event.target.value)}
                  placeholder="Rua, número, bairro, complemento"
                  className={inputClass}
                />
              </label>
            ) : null}

            <h3 className="mt-5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
              Pagamento
            </h3>
            <div className="mt-2 flex gap-2">
              {PAYMENT_OPTIONS.map((option) => {
                const active = form.payment === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => update("payment", option.value)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                      active
                        ? "border-brand bg-brand-light text-brand"
                        : "border-zinc-200 bg-white text-zinc-600"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <label className="mt-4 block text-xs font-semibold text-zinc-600">
              Observações do pedido
              <textarea
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Troco, ponto de referência..."
                className={`${inputClass} resize-none`}
              />
            </label>

            {error ? (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {error}
              </p>
            ) : null}
          </>
        ) : null}
      </form>
    </BottomSheet>
  );
}
