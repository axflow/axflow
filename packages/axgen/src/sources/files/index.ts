import { toDocument as pdfToDocument } from './pdf';
import { toDocument as txtToDocument } from './txt';

export const CONVERTERS = Object.freeze({
  pdf: pdfToDocument,
  txt: txtToDocument,
});

export type CONVERTER_KEYS = keyof typeof CONVERTERS;
