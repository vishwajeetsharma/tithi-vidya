import { llmsFullTxt } from "@/lib/llms";

export const dynamic = "force-static";
// Made again every 10 minutes, so posts that went live since the deploy are listed (see LISTS_REVALIDATE in lib/blog.ts).
export const revalidate = 600;

export function GET() {
  return new Response(llmsFullTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
