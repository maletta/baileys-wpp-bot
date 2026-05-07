import axios, { type AxiosError } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4444/api';

/** Cliente sem Bearer nem redirect em 401 — fluxo público de OTP. */
const client = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

client.interceptors.request.use(config => {
  if (config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else {
      delete (config.headers as Record<string, unknown>)['Content-Type'];
    }
  }
  return config;
});

export type ParticipantAuthContext = 'PUBLIC_FORM';
export type ParticipantAuthTokenType = 'AUTHORIZE_PARTICIPANT';

export interface RequestOtpPayload {
  cellphone: string;
  context: ParticipantAuthContext;
  type: ParticipantAuthTokenType;
}

export interface RequestOtpResponse {
  ok: boolean;
  otpSent: boolean;
  nextRequestAfterSec: number;
}

export interface VerifyOtpPayload extends RequestOtpPayload {
  otp: string;
}

export interface VerifyOtpResponse {
  ok: boolean;
  accessToken: string;
}

export async function postRequestOtp(body: RequestOtpPayload): Promise<RequestOtpResponse> {
  const { data } = await client.post<RequestOtpResponse>('/public/participant-auth/request-otp', body);
  return data;
}

export async function postResendOtp(body: RequestOtpPayload): Promise<RequestOtpResponse> {
  const { data } = await client.post<RequestOtpResponse>('/public/participant-auth/resend-otp', body);
  return data;
}

export async function postVerifyOtp(body: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  const { data } = await client.post<VerifyOtpResponse>('/public/participant-auth/verify-otp', body);
  return data;
}

export type ParticipantPortalSessionResponse =
  | {
      ok: true;
      authMode: 'participant_otp';
      participantIds: [string];
    }
  | {
      ok: true;
      authMode: 'google';
      participantIds: string[];
      user: { id: string; email: string; role: string };
    };

export async function getParticipantPortalSession(accessToken: string): Promise<ParticipantPortalSessionResponse> {
  const { data } = await client.get<ParticipantPortalSessionResponse>('/participant-portal/session', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return data;
}

/** Origem HTTP do backend (sem `/api`) para montar URLs de `/uploads/...`. */
export function getPublicApiFileBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4444/api';
  return base.replace(/\/api\/?$/, '');
}

export interface ParticipantPortalGroupRow {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
}

export interface ParticipantPortalFormDto {
  participantId: string;
  exists: boolean;
  sendFormMessageToGroup: boolean;
  photoUrl: string | null;
  /** Foto em BYTEA na base — usar `getParticipantPortalFormPhoto` com o mesmo token. */
  hasDbPhoto: boolean;
  name: string | null;
  pronoun: string | null;
  relationship: string | null;
  birthday: string | null;
  location: string | null;
  sexualOrientation: string | null;
  favoriteActivity: string | null;
  instagram: string | null;
}

export async function getParticipantPortalGroups(accessToken: string): Promise<ParticipantPortalGroupRow[]> {
  const { data } = await client.get<{ ok: true; groups: ParticipantPortalGroupRow[] }>(
    '/participant-portal/groups',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return data.groups;
}

export async function getParticipantPortalForm(
  accessToken: string,
  participantId?: string
): Promise<ParticipantPortalFormDto> {
  const { data } = await client.get<{ ok: true; form: ParticipantPortalFormDto }>('/participant-portal/form', {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: participantId ? { participantId } : undefined
  });
  return data.form;
}

/** Obtém o binário da foto (DB ou legado em disco), com o mesmo JWT do portal. */
export async function getParticipantPortalFormPhoto(
  accessToken: string,
  participantId?: string
): Promise<Blob> {
  const root = baseURL.replace(/\/$/, '');
  const q = participantId ? `?participantId=${encodeURIComponent(participantId)}` : '';
  const res = await fetch(`${root}/participant-portal/form/photo${q}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const err = new Error('Foto indisponível') as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.blob();
}

export interface PutParticipantPortalFormResponse {
  ok: boolean;
  messageSentToGroup: boolean;
  warnings: string[];
}

export async function putParticipantPortalForm(
  accessToken: string,
  formData: FormData
): Promise<PutParticipantPortalFormResponse> {
  const { data } = await client.put<PutParticipantPortalFormResponse>('/participant-portal/form', formData, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  return data;
}

export function getResend429RetryAfter(err: unknown): number | undefined {
  const ax = err as AxiosError<{ retryAfterSec?: number }>;
  if (ax.response?.status !== 429) {
    return undefined;
  }
  const sec = ax.response.data?.retryAfterSec;
  return typeof sec === 'number' && sec > 0 ? sec : undefined;
}
