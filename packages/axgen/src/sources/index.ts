import { NAME as fileSystem } from './file-system';
import { NAME as wikipedia } from './wikipedia';
import { NAME as textDocument } from './text-document';

export const SUPPORTED_DATA_SOURCES = [fileSystem, wikipedia, textDocument] as const;
export type SupportedDataSources = (typeof SUPPORTED_DATA_SOURCES)[number];

export { converters, type ConverterKeys } from './files';
export { FileSystem, type FileSystemOptions } from './file-system';
export { Wikipedia, type WikipediaOptions } from './wikipedia';
export { TextDocument, type TextDocumentOptions } from './text-document';
