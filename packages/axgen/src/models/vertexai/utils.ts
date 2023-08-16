import type { GoogleAuth } from 'google-auth-library';

export async function request<Response>(
  data: Object,
  options: {
    auth: GoogleAuth;
    endpoint: string;
    location: string;
    model: 'chat-bison' | 'text-bison' | 'textembedding-gecko';
  }
) {
  const { auth, endpoint, location, model } = options;

  const client = await auth.getClient();
  const projectId = await auth.getProjectId();

  return client.request<Response>({
    data: data,
    method: 'POST',
    url: `https://${endpoint}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`,
  });
}
