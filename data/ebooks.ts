export type EbookCategory = "doencas" | "transtornos" | "curiosidades";

export interface Ebook {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverUrl: string;
  fileUrl: string;
  pages: number;
  category: EbookCategory;
  isFree: boolean;
  publishedAt: string;
  downloads: number;
  tags: string[];
  relatedAulaSlug?: string;
}

export const ebooksData: Ebook[] = [];

export function getAllEbooks(): Ebook[] {
  return ebooksData;
}

export function getEbookBySlug(slug: string): Ebook | null {
  return ebooksData.find((e) => e.slug === slug) ?? null;
}

export function getFreeEbooks(): Ebook[] {
  return ebooksData.filter((e) => e.isFree);
}
