'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import type { AxiosError } from 'axios';
import { ArrowLeft, Camera, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  getParticipantPortalForm,
  getParticipantPortalFormPhoto,
  getParticipantPortalGroups,
  getPublicApiFileBaseUrl,
  putParticipantPortalForm,
  type ParticipantPortalFormDto,
  type ParticipantPortalGroupRow
} from '@/lib/publicParticipantAuthApi';

const PRONOUNS = ['Ele', 'Ela', 'Ele/Ela'] as const;
const RELATIONSHIPS = ['Solteiro(a)', 'Em relacionamento', 'Em relacionamento (não mono)'] as const;
const ORIENTATIONS = ['Bissexual', 'Gay', 'Hétero', 'Lésbica', 'Não-binário', 'Pan'] as const;

const selectClassName = cn(
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

const portalFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Obrigatório').max(120),
    pronoun: z.string().min(1).max(80),
    relationship: z.string().min(1).max(120),
    birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use uma data válida'),
    location: z.string().trim().min(1, 'Obrigatório').max(200),
    sexualOrientation: z.string().min(1).max(120),
    favoriteActivity: z.string().trim().min(1, 'Obrigatório').max(200),
    instagramHandle: z.string().max(200).optional(),
    sendFormMessageToGroup: z.boolean(),
    idGroupWpp: z.string().optional(),
    photoFile: z.custom<File | undefined>(val => val === undefined || val instanceof File).optional()
  })
  .refine(d => !d.sendFormMessageToGroup || Boolean(d.idGroupWpp?.trim()), {
    message: 'Escolha um grupo.',
    path: ['idGroupWpp']
  });

type PortalFormValues = z.infer<typeof portalFormSchema>;

function birthdayInputFromIso(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toISOString().slice(0, 10);
}

function resolvePhotoSrc(photoUrl: string | null): string | null {
  if (!photoUrl) {
    return null;
  }
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  const origin = getPublicApiFileBaseUrl();
  return `${origin}${photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`}`;
}

function resolveGroupImageSrc(g: ParticipantPortalGroupRow): string | null {
  const u = g.imageUrl;
  if (!u) {
    return null;
  }
  if (u.startsWith('http://') || u.startsWith('https://')) {
    return u;
  }
  return `${getPublicApiFileBaseUrl()}${u.startsWith('/') ? u : `/${u}`}`;
}

function coerceSelect<T extends readonly string[]>(
  val: string | null | undefined,
  options: T,
  fallback: T[number]
): T[number] {
  if (val && (options as readonly string[]).includes(val)) {
    return val as T[number];
  }
  return fallback;
}

function parseApiError(err: unknown): string {
  const ax = err as AxiosError<{ message?: string; details?: { field: string; message: string }[] }>;
  const d = ax.response?.data;
  if (d?.details?.length) {
    return d.details.map(x => x.message).join(' · ');
  }
  if (typeof d?.message === 'string') {
    return d.message;
  }
  return 'Não foi possível salvar. Tente novamente.';
}

export interface ParticipantPortalFormStepProps {
  accessToken: string;
  onSignOut: () => void;
}

export function ParticipantPortalFormStep({ accessToken, onSignOut }: ParticipantPortalFormStepProps) {
  const onSignOutRef = useRef(onSignOut);
  onSignOutRef.current = onSignOut;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<ParticipantPortalGroupRow[]>([]);
  const [formDto, setFormDto] = useState<ParticipantPortalFormDto | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [gList, f] = await Promise.all([
          getParticipantPortalGroups(accessToken),
          getParticipantPortalForm(accessToken)
        ]);
        if (cancelled) {
          return;
        }
        setGroups(gList);
        setFormDto(f);
      } catch {
        if (!cancelled) {
          toast({
            variant: 'destructive',
            title: 'Não foi possível carregar',
            description: 'Verifique a conexão ou inicie novamente com o telefone.'
          });
          onSignOutRef.current();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const defaultGroupId = useMemo(() => {
    if (groups.length === 1) {
      return groups[0].id;
    }
    return '';
  }, [groups]);

  const form = useForm<PortalFormValues>({
    resolver: zodResolver(portalFormSchema),
    defaultValues: {
      name: '',
      pronoun: 'Ele',
      relationship: 'Solteiro(a)',
      birthday: '',
      location: '',
      sexualOrientation: 'Bissexual',
      favoriteActivity: '',
      instagramHandle: '',
      sendFormMessageToGroup: true,
      idGroupWpp: '',
      photoFile: undefined
    }
  });

  const { register, control, handleSubmit, reset, watch, setError, clearErrors, formState } = form;
  const watchGroup = watch('idGroupWpp');
  const watchPhoto = watch('photoFile');

  useEffect(() => {
    if (!formDto || loading) {
      return;
    }
    const canSend = groups.length > 0;
    const sendDefault = canSend ? formDto.sendFormMessageToGroup : false;
    reset({
      name: formDto.name ?? '',
      pronoun: coerceSelect(formDto.pronoun, PRONOUNS, 'Ele'),
      relationship: coerceSelect(formDto.relationship, RELATIONSHIPS, 'Solteiro(a)'),
      birthday: birthdayInputFromIso(formDto.birthday),
      location: formDto.location ?? '',
      sexualOrientation: coerceSelect(formDto.sexualOrientation, ORIENTATIONS, 'Bissexual'),
      favoriteActivity: formDto.favoriteActivity?.trim() ? formDto.favoriteActivity : '',
      instagramHandle: formDto.instagram?.replace(/^@/, '') ?? '',
      sendFormMessageToGroup: sendDefault,
      idGroupWpp: defaultGroupId || '',
      photoFile: undefined
    });
  }, [formDto, loading, groups.length, defaultGroupId, reset]);

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;

    void (async () => {
      if (watchPhoto instanceof File) {
        objectUrl = URL.createObjectURL(watchPhoto);
        setPreviewUrl(objectUrl);
        return;
      }
      if (!formDto) {
        setPreviewUrl(null);
        return;
      }
      if (formDto.hasDbPhoto) {
        try {
          const blob = await getParticipantPortalFormPhoto(accessToken);
          if (cancelled) {
            return;
          }
          objectUrl = URL.createObjectURL(blob);
          setPreviewUrl(objectUrl);
        } catch {
          if (!cancelled) {
            setPreviewUrl(null);
          }
        }
        return;
      }
      setPreviewUrl(resolvePhotoSrc(formDto.photoUrl));
    })();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [watchPhoto, formDto, accessToken]);

  const selectedGroup = groups.find(x => x.id === watchGroup);

  const onSubmit = handleSubmit(async values => {
    if (!formDto) {
      return;
    }
    if (!formDto.exists && !values.photoFile) {
      setError('photoFile', { type: 'custom', message: 'Envie uma foto na primeira submissão.' });
      return;
    }
    clearErrors('photoFile');

    const fd = new FormData();
    fd.append('name', values.name);
    fd.append('pronoun', values.pronoun);
    fd.append('relationship', values.relationship);
    fd.append('birthday', values.birthday);
    fd.append('location', values.location);
    fd.append('sexualOrientation', values.sexualOrientation);
    fd.append('favoriteActivity', values.favoriteActivity);
    const ig = values.instagramHandle?.trim();
    if (ig) {
      fd.append('instagram', ig.startsWith('@') ? ig : `@${ig}`);
    }
    fd.append('sendFormMessageToGroup', String(values.sendFormMessageToGroup));
    if (values.sendFormMessageToGroup && values.idGroupWpp?.trim()) {
      fd.append('idGroupWpp', values.idGroupWpp.trim());
    }
    if (values.photoFile) {
      fd.append('photo', values.photoFile);
    }

    setSaving(true);
    try {
      const res = await putParticipantPortalForm(accessToken, fd);
      toast({
        title: 'Formulário salvo',
        description: res.warnings?.length
          ? res.warnings.join(' ')
          : res.messageSentToGroup
            ? 'Resumo enviado ao grupo.'
            : 'Alterações registradas.'
      });
      const fresh = await getParticipantPortalForm(accessToken);
      setFormDto(fresh);
      const sendOk = groups.length > 0 ? fresh.sendFormMessageToGroup : false;
      reset({
        name: fresh.name ?? values.name,
        pronoun: coerceSelect(fresh.pronoun, PRONOUNS, coerceSelect(values.pronoun, PRONOUNS, 'Ele')),
        relationship: coerceSelect(
          fresh.relationship,
          RELATIONSHIPS,
          coerceSelect(values.relationship, RELATIONSHIPS, 'Solteiro(a)')
        ),
        birthday: birthdayInputFromIso(fresh.birthday),
        location: fresh.location ?? values.location,
        sexualOrientation: coerceSelect(
          fresh.sexualOrientation,
          ORIENTATIONS,
          coerceSelect(values.sexualOrientation, ORIENTATIONS, 'Bissexual')
        ),
        favoriteActivity: fresh.favoriteActivity?.trim() ? fresh.favoriteActivity : values.favoriteActivity,
        instagramHandle: fresh.instagram?.replace(/^@/, '') ?? values.instagramHandle,
        sendFormMessageToGroup: sendOk,
        idGroupWpp: values.idGroupWpp?.trim() ? values.idGroupWpp : defaultGroupId,
        photoFile: undefined
      });
      setPreviewUrl(resolvePhotoSrc(fresh.photoUrl));
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: parseApiError(e)
      });
    } finally {
      setSaving(false);
    }
  });

  if (loading || !formDto) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Carregando formulário…
      </div>
    );
  }

  const noGroups = groups.length === 0;
  const sendDisabled = noGroups;

  return (
    <div className="space-y-5 w-full">
      <button
        type="button"
        onClick={onSignOut}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Sair e usar outro número
      </button>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex flex-col items-center gap-2">
          <Avatar className="h-24 w-24 rounded-xl border border-border">
            {previewUrl ? <AvatarImage src={previewUrl} alt="Foto" className="object-cover" /> : null}
            <AvatarFallback className="rounded-xl">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <label className="cursor-pointer">
            <span className="text-xs text-primary hover:underline">{formDto.exists ? 'Alterar foto' : 'Escolher foto'}</span>
            <Controller
              name="photoFile"
              control={control}
              render={({ field }) => (
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    field.onChange(f);
                  }}
                  ref={field.ref}
                />
              )}
            />
          </label>
          {formState.errors.photoFile && (
            <p className="text-xs text-destructive text-center max-w-[140px]">{formState.errors.photoFile.message}</p>
          )}
        </div>

        <p className="text-sm text-muted-foreground flex-1">
          Complete os dados como aparecem no grupo. Na primeira vez é <span className="font-medium text-foreground">obrigatória</span>{' '}
          uma foto (JPG, PNG ou WebP, até 5&nbsp;MB).
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="pf-name" className="text-sm font-medium">
              Nome
            </label>
            <Input id="pf-name" {...register('name')} />
            {formState.errors.name && (
              <p className="text-xs text-destructive">{formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pf-pronoun" className="text-sm font-medium">
              Pronome
            </label>
            <select id="pf-pronoun" className={selectClassName} {...register('pronoun')}>
              {PRONOUNS.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pf-rel" className="text-sm font-medium">
              Relacionamento
            </label>
            <select id="pf-rel" className={selectClassName} {...register('relationship')}>
              {RELATIONSHIPS.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pf-bday" className="text-sm font-medium">
              Nascimento
            </label>
            <Input id="pf-bday" type="date" {...register('birthday')} />
            {formState.errors.birthday && (
              <p className="text-xs text-destructive">{formState.errors.birthday.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pf-loc" className="text-sm font-medium">
              Local / cidade
            </label>
            <Input id="pf-loc" {...register('location')} />
            {formState.errors.location && (
              <p className="text-xs text-destructive">{formState.errors.location.message}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="pf-orient" className="text-sm font-medium">
              Orientação sexual
            </label>
            <select id="pf-orient" className={selectClassName} {...register('sexualOrientation')}>
              {ORIENTATIONS.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="pf-fav" className="text-sm font-medium">
              Qual seu rolê favorito?
            </label>
            <Input id="pf-fav" placeholder="Ex.: festa, bar, praia…" {...register('favoriteActivity')} />
            {formState.errors.favoriteActivity && (
              <p className="text-xs text-destructive">{formState.errors.favoriteActivity.message}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="pf-ig" className="text-sm font-medium">
              Instagram <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <div className="flex rounded-md border border-input shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-ring">
              <span className="flex items-center px-3 text-xs text-muted-foreground bg-muted/40 border-r border-input whitespace-nowrap">
                instagram.com/
              </span>
              <Input id="pf-ig" className="border-0 rounded-none focus-visible:ring-0" {...register('instagramHandle')} />
            </div>
            {formState.errors.instagramHandle && (
              <p className="text-xs text-destructive">{formState.errors.instagramHandle.message}</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/20">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-sm font-medium">Grupo para o resumo no WhatsApp</p>
              <p className="text-xs text-muted-foreground">
                Se ativar o envio, escolha um grupo onde você é membro. O backend confirma a participação antes de enviar.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pf-group" className="text-sm font-medium">
              Grupo
            </label>
            <select
              id="pf-group"
              className={selectClassName}
              disabled={noGroups}
              {...register('idGroupWpp')}
            >
              <option value="">{noGroups ? 'Sem grupos disponíveis' : 'Selecione…'}</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            {formState.errors.idGroupWpp && (
              <p className="text-xs text-destructive">{formState.errors.idGroupWpp.message}</p>
            )}
          </div>

          {selectedGroup && (
            <div className="flex gap-3 rounded-lg border border-border bg-background p-3 text-sm">
              <Avatar className="h-12 w-12 rounded-lg shrink-0">
                {resolveGroupImageSrc(selectedGroup) ? (
                  <AvatarImage src={resolveGroupImageSrc(selectedGroup)!} alt="" className="object-cover" />
                ) : null}
                <AvatarFallback className="rounded-lg text-xs">{selectedGroup.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium truncate">{selectedGroup.name}</p>
                {selectedGroup.description ? (
                  <p className="text-xs text-muted-foreground line-clamp-2">{selectedGroup.description}</p>
                ) : null}
              </div>
            </div>
          )}

          <Controller
            name="sendFormMessageToGroup"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={field.value}
                  disabled={sendDisabled}
                  onChange={e => field.onChange(e.target.checked)}
                />
                <span className="text-sm">
                  Enviar mensagem com o resumo ao grupo ao guardar
                  {sendDisabled ? (
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      Indisponível: não há grupos associados à sua conta.
                    </span>
                  ) : null}
                </span>
              </label>
            )}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" loading={saving}>
          Salvar formulário
        </Button>
      </form>
    </div>
  );
}
