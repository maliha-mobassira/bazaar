// Deprecated. Route moved to src/app/api/dev/import/route.ts
export async function GET() {
  return new Response("Deprecated. Use /api/dev/import instead.", { status: 410 });
}
