import { NAME as fileSystem } from './file-system';
import { NAME as wikipedia } from './wikipedia';

export const SUPPORTED_DATA_SOURCES = [fileSystem, wikipedia] as const;
export type SupportedDataSources = (typeof SUPPORTED_DATA_SOURCES)[number];

export { FileSystem, type FileSystemOptions } from './file-system';
export { Wikipedia, type WikipediaOptions } from './wikipedia';
