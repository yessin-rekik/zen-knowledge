import "server-only";

const CHUNK_SIZE_CHARS = 2000; // approx 500 tokens (grossière estimation ~4 chars/token)
const OVERLAP_CHARS = 200; // approx 50 tokens

export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE_CHARS, text.length);
    chunks.push(text.slice(start, end).trim());

    if (end === text.length) break;
    start = end - OVERLAP_CHARS;
  }

  return chunks.filter((c) => c.length > 0);
}