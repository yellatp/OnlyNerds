import path from 'path';
import parquet from 'parquetjs';
import { smartCareerLink } from './parser';
const { ParquetReader } = parquet;

const PARQUET_PATH = path.join(process.cwd(), 'public', 'data', 'startups_h1b_database.parquet');

export type H1BLikelihood = 'Very High' | 'High' | 'Medium' | 'Low' | 'Unknown';

export interface H1BCompany {
  name: string;
  sector: string;
  category: string;
  tags: string[];
  likelihood: H1BLikelihood;
  fortune500: boolean;
  fortune1500: boolean;
  boutique: boolean;
  analystsPick: boolean;
  publiclyTraded: boolean;
  careerUrl: string;
}

let _cache: H1BCompany[] | null = null;

export async function getH1BCompanies(): Promise<H1BCompany[]> {
  if (_cache) return _cache;

  const reader = await ParquetReader.openFile(PARQUET_PATH);
  const cursor = reader.getCursor();
  const results: H1BCompany[] = [];
  let row: Record<string, unknown> | null;
  while ((row = await cursor.next()) !== null) {
    const name = String(row.name ?? '');
    results.push({
      name: name.trim(),
      sector: String(row.sector ?? 'Other').trim(),
      category: String(row.category ?? 'Other').trim(),
      tags: String(row.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
      likelihood: normLikelihood(String(row.likelihood ?? '')),
      fortune500: Boolean(row.fortune500),
      fortune1500: Boolean(row.fortune1500),
      boutique: Boolean(row.boutique),
      analystsPick: Boolean(row.analystsPick),
      publiclyTraded: Boolean(row.publiclyTraded),
      careerUrl: smartCareerLink(name.trim()),
    });
  }
  reader.close();
  _cache = results;
  return _cache;
}

function normLikelihood(raw: string): H1BLikelihood {
  const v = raw.trim().toLowerCase();
  if (v.includes('very high')) return 'Very High';
  if (v.includes('high')) return 'High';
  if (v.includes('medium')) return 'Medium';
  if (v.includes('low')) return 'Low';
  return 'Unknown';
}

export async function getH1BSectors(): Promise<string[]> {
  const companies = await getH1BCompanies();
  return [...new Set(companies.map((c) => c.sector))].sort();
}

export async function getH1BCategories(): Promise<string[]> {
  const companies = await getH1BCompanies();
  return [...new Set(companies.map((c) => c.category))].sort();
}
