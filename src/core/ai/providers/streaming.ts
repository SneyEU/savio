/** Lit un corps de réponse HTTP ligne par ligne (NDJSON ou Server-Sent Events). */
export async function* readLines(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf('\n');
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line.length > 0) yield line;
        newline = buffer.indexOf('\n');
      }
    }
    const rest = (buffer + decoder.decode()).trim();
    if (rest.length > 0) yield rest;
  } finally {
    reader.releaseLock();
  }
}

export function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export async function describeHttpError(response: Response): Promise<string> {
  let detail = '';
  try {
    detail = (await response.text()).slice(0, 300);
  } catch {
    // corps illisible : on garde le statut seul
  }
  return `HTTP ${response.status}${detail ? ` — ${detail}` : ''}`;
}
