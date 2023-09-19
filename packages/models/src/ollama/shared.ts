// Options docs: https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#parameter
export type OllamaModelOptions = {
  top_k?: number;
  top_p?: number;
  stop?: string;
  temperature?: number;
  repeat_penalty?: number;
  repeat_last_n?: number;
  num_threads?: number;
  num_gpu?: number;
  num_gqa?: number;
  num_ctx?: number;
  mirostat?: number;
  mirostat_eta?: number;
  mirostat_tau?: number;
  tfs_z?: number;
};
