// Compresses the shareable config before it goes into the URL fragment, so the
// link stays short enough to survive being pasted into WhatsApp/Classroom/email
// without wrapping across multiple lines or getting silently truncated by the
// receiving app. Uses the browser's native Compression Streams API (gzip),
// supported in all current Chrome/Edge/Firefox/Safari. Always compresses (no
// uncompressed fallback) so encode and decode never disagree on format.

import { bytesToBase64Url, base64UrlToBytes } from "./base64url";

export function isCompressionSupported(): boolean {
  return typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
}

export async function encodeForLink(payload: unknown): Promise<string> {
  if (!isCompressionSupported()) {
    throw new Error("This browser doesn't support link compression. Please use a recent Chrome, Edge, Firefox, or Safari.");
  }
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  return bytesToBase64Url(compressed);
}

export async function decodeFromLink<T>(encoded: string): Promise<T> {
  if (!isCompressionSupported()) {
    throw new Error("This browser doesn't support opening this link. Please use a recent Chrome, Edge, Firefox, or Safari.");
  }
  const bytes = base64UrlToBytes(encoded);
  const stream = new Blob([bytes.slice()]).stream().pipeThrough(new DecompressionStream("gzip"));
  const decompressed = await new Response(stream).arrayBuffer();
  return JSON.parse(new TextDecoder().decode(decompressed)) as T;
}
