import { RetroApiClient } from "@retro/api-client";

export function createAdminDataProvider(apiUrl: string) {
  const api = new RetroApiClient(apiUrl);
  return {
    conversations: () => api.listConversations(),
  };
}
