const ORIGIN = "https://ledgerzero.cosmiclaus.com";

function rewriteLocation(headers, publicOrigin) {
  const location = headers.get("location");
  if (!location) return;

  const origin = new URL(ORIGIN);
  const next = new URL(location, ORIGIN);
  if (next.origin === origin.origin) {
    headers.set("location", `${publicOrigin}${next.pathname}${next.search}${next.hash}`);
  }
}

export default {
  async fetch(request) {
    const publicUrl = new URL(request.url);
    const upstreamUrl = new URL(`${publicUrl.pathname}${publicUrl.search}`, ORIGIN);
    const upstreamRequest = new Request(upstreamUrl, request);
    const upstreamResponse = await fetch(upstreamRequest);
    const headers = new Headers(upstreamResponse.headers);

    rewriteLocation(headers, publicUrl.origin);
    headers.delete("content-security-policy");
    headers.delete("content-security-policy-report-only");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  },
};
