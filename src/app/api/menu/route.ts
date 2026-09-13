import { getMenuData } from "@/lib/menu";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("all") === "1";
    const data = await getMenuData({ includeInactive });
    if (!data) {
      return Response.json({ error: "Restaurante não encontrado" }, { status: 404 });
    }
    return Response.json(data);
  } catch (error) {
    console.error("GET /api/menu failed", error);
    return Response.json({ error: "Erro ao carregar o cardápio" }, { status: 500 });
  }
}
