/**
 * PDF
 *
 * Aetherius PDF viewer with annotations, form fill, search and digital signatures.
 *
 * This is a scaffold. Replace the placeholder with the real domain logic.
 */

export const PdfVersion = "0.1.0";

export interface PdfState {
  initialized: boolean;
}

export function createPdf(): PdfState {
  return { initialized: true };
}
