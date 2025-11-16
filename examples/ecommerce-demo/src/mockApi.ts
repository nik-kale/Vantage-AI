export async function submitOrder(): Promise<{ ok: boolean }> {
  await new Promise((r) => setTimeout(r, 600));
  // Intentionally fail for demo
  return { ok: false };
}
