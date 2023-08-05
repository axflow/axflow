import { NAME as markdown } from './markdown';
import { NAME as text } from './text';
import { NAME as csv } from './csv';

export const SUPPORTED_DATA_SPLITTERS = [markdown, text, csv] as const;
export type SupportedDataSplitters = (typeof SUPPORTED_DATA_SPLITTERS)[number];

export { MarkdownSplitter, type MarkdownSplitterOptions } from './markdown';
export { TextSplitter, type TextSplitterOptions } from './text';
export { CSVSplitter, type CSVSplitterOptions } from './csv';
