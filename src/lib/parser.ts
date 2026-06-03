/**
 * Robust CSV parser — handles quoted fields, escaped quotes, CRLF/LF.
 */
export function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let i = 0;

  while (i < lines.length) {
    const row: string[] = [];

    while (i < lines.length && lines[i] !== '\n') {
      if (lines[i] === '"') {
        // Quoted field
        i++; // consume opening quote
        let field = '';
        while (i < lines.length) {
          if (lines[i] === '"' && lines[i + 1] === '"') {
            field += '"';
            i += 2;
          } else if (lines[i] === '"') {
            i++; // consume closing quote
            break;
          } else {
            field += lines[i++];
          }
        }
        row.push(field);
        if (i < lines.length && lines[i] === ',') i++;
      } else {
        // Unquoted field
        let field = '';
        while (i < lines.length && lines[i] !== ',' && lines[i] !== '\n') {
          field += lines[i++];
        }
        if (i < lines.length && lines[i] === ',') i++;
        row.push(field.trim());
      }
    }

    if (i < lines.length && lines[i] === '\n') i++;
    if (row.length > 0 && row.some((f) => f.length > 0)) rows.push(row);
  }

  return rows;
}

export function csvToObjects<T extends Record<string, string>>(
  content: string
): T[] {
  const rows = parseCSV(content);
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? '';
    });
    return obj as T;
  });
}

export function smartCareerLink(name: string, url?: string): string {
  if (url && url.trim() && url.trim() !== 'N/A' && url.startsWith('http')) {
    return url.trim();
  }
  return `https://www.google.com/search?q=${encodeURIComponent(name + ' Careers')}`;
}
