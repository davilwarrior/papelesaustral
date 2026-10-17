# Papeles Austral — papelesaustral.com

Sitio web de **Papeles Austral** (antes PCC Austral): proveedor especializado de
papeles, cartulinas y cartones para el sector gráfico del Austro ecuatoriano.

> Territorio de marca: *"El material correcto, cuando lo necesitas."*

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** con tokens de marca en `src/app/globals.css`
- **lucide-react** para iconografía
- Despliegue objetivo: **Vercel**

## Comandos

```bash
npm run dev    # desarrollo
npm run build  # build de producción
npm run start  # servir build
npm run lint   # ESLint
```

## Arquitectura (Clean Architecture)

```
src/
├── domain/           Entidades e interfaces de repositorio (sin dependencias)
├── application/      Casos de uso (orquestan dominio + repositorios)
├── infrastructure/   Datos estáticos, repositorios concretos y container.ts
│                     (composition root: cambiar aquí StaticCatalogRepository
│                      por una implementación HTTP/DB cuando exista el backend)
├── presentation/     Componentes UI, secciones, layout y lib/ (cn)
└── app/              Rutas, metadata SEO, sitemap, robots, manifest, OG image
```

## Datos del negocio

Los textos de contacto, nombre legal y tagline viven en un único archivo:
`src/infrastructure/config/site-config.data.ts` (hoy con **placeholders** —
reemplazar WhatsApp, correo, dirección y horario por los datos reales).

## Asistente de chat (OpenAI)

Burbuja "¿Te ayudo?" en todas las páginas (`presentation/components/chat/`).
Responde dudas y arma pedidos sobre el **mismo carrito del cotizador**; el envío
sigue siendo por WhatsApp al asesor.

- Endpoint: `src/app/api/chat/route.ts` (AI SDK + `gpt-5.4-mini`, cambiable con `OPENAI_CHAT_MODEL`).
- Herramientas y prompt: `src/application/chat/`. Los precios y totales salen
  siempre del catálogo de Neon, nunca del modelo.
- Requiere `OPENAI_API_KEY` en `.env` y en Vercel. Configura un límite de gasto
  en platform.openai.com → Settings → Limits.

## Assets de marca

- `brand/` — material original (logo, línea gráfica, planificación estratégica,
  mockup del futuro sistema de inventario).
- `public/images/` — assets servidos: logo transparente (`logo.png`,
  `logo-white.png`), hero y foto de logística.

## Roadmap

1. **Fase 1 — Landing page** (este estado) ✅
2. **Fase 2** — Catálogo público de productos con buscador y filtros.
3. **Fase 3** — Sistema de inventario y gestión (`/admin`, auth, base de datos).
