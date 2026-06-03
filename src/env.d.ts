/// <reference path="../.astro/types.d.ts" />

declare module 'parquetjs' {
  interface ParquetSchemaField {
    type: string;
    optional?: boolean;
    repeated?: boolean;
    fields?: Record<string, ParquetSchemaField>;
  }

  export class ParquetSchema {
    constructor(fields: Record<string, ParquetSchemaField>);
    fields: Record<string, ParquetSchemaField>;
  }

  interface ParquetReaderCursor {
    next(): Promise<Record<string, unknown> | null>;
  }

  export class ParquetReader {
    static openFile(path: string): Promise<ParquetReader>;
    getCursor(): ParquetReaderCursor;
    close(): void;
    schema: ParquetSchema;
    metadata: Record<string, unknown>;
  }

  export class ParquetWriter {
    static openFile(schema: ParquetSchema, path: string): Promise<ParquetWriter>;
    appendRow(row: Record<string, unknown>): Promise<void>;
    close(): Promise<void>;
  }
}