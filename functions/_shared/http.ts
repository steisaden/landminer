export function json(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('access-control-allow-origin', '*');
  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}
