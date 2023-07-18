import { NAME as markdown } from './markdown';
import { NAME as text } from './text';

export const SUPPORTED_DATA_SPLITTERS = [markdown, text] as const;
export type SupportedDataSplitters = (typeof SUPPORTED_DATA_SPLITTERS)[number];

export { MarkdownSplitter, type MarkdownSplitterOptions } from './markdown';
export { TextSplitter, type TextSplitterOptions } from './text';
