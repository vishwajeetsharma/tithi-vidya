import { needsConsent } from "@/lib/region";

// Tells the cookie box whether the visitor is somewhere tracking cookies need a
// yes first (lib/region.ts). Vercel works out the country from the visitor's IP
// address and passes it in a header; neither is kept. Only the yes-or-no answer
// goes back, and only to this visitor: it's never cached.

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country");
  // Away from Vercel (npm run dev) there's no country: the box then works as it does outside Europe.
  const strict = process.env.VERCEL ? needsConsent(country, request.headers.get("x-vercel-ip-country-region")) : false;
  return Response.json({ strict }, { headers: { "Cache-Control": "private, no-store" } });
}
