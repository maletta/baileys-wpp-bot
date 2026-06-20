import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4444/api';

function authHeaders() {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('participantAccessToken') || localStorage.getItem('accessToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ManageableGroupConfig {
  notificationGroupId: string | null;
  welcomeMessageTemplate: string | null;
}

export interface ManageableGroup {
  id: string;
  name: string;
  whatsappRegistry: string;
  isCommunity: boolean;
  formSlug: string | null;
  imageUrl: string | null;
  config: ManageableGroupConfig | null;
}

export interface ListManageableResponse {
  ok: boolean;
  groups: ManageableGroup[];
}

export async function getManageableGroups(): Promise<ManageableGroup[]> {
  const { data } = await axios.get<ListManageableResponse>(`${baseURL}/groups/manage`, {
    headers: authHeaders()
  });
  return data.groups;
}

export interface UpdateGroupPayload {
  formSlug?: string | null;
  notificationGroupId?: string | null;
  welcomeMessageTemplate?: string | null;
}

export async function updateManageableGroup(id: string, payload: UpdateGroupPayload): Promise<void> {
  await axios.put(`${baseURL}/groups/manage/${id}`, payload, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json'
    }
  });
}
