import { toDocument as pdfToDocument } from './pdf';
import { toDocument as txtToDocument } from './txt';

export const converters = Object.freeze({
  pdf: pdfToDocument,
  txt: txtToDocument,
});

export type ConverterKeys = keyof typeof converters;
