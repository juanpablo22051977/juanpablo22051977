export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  files?: FileAttachment[];
}

export interface FileAttachment {
  name: string;
  type: string;
  content: string;
}

export async function sendMessage(
  messages: { role: string; content: string }[],
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión con el servidor' }));
    throw new Error(error.error || `Error ${response.status}`);
  }

  const data = await response.json();
  return data.content;
}

export function parseChartBlocks(content: string): { text: string; charts: any[] } {
  const charts: any[] = [];
  const text = content.replace(/~~~chart\s*\n([\s\S]*?)\n~~~/g, (_match, json) => {
    try {
      const chart = JSON.parse(json);
      charts.push(chart);
      return `\n[📊 Gráfico: ${chart.title || 'Ver abajo'}]\n`;
    } catch {
      return _match;
    }
  });
  return { text, charts };
}
