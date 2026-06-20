'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import type { AxiosError } from 'axios';
import { ArrowLeft, Camera, Users, Upload } from 'lucide-react';
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
  /** Slug do formulário (/formulario/SLUG) para auto-resolver o grupo de notificação. */
  formSlug?: string;
}

export function ParticipantPortalFormStep({ accessToken, onSignOut, formSlug }: ParticipantPortalFormStepProps) {
  const onSignOutRef = useRef(onSignOut);
  onSignOutRef.current = onSignOut;

  const fileInputRef = useRef<HTMLInputElement>(null);
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
    // Quando há formSlug (URL /formulario/SLUG), envia o slug para resolução no backend
    if (formSlug) {
      fd.append('formSlug', formSlug);
      fd.append('sendFormMessageToGroup', 'true');
    } else {
      fd.append('sendFormMessageToGroup', String(values.sendFormMessageToGroup));
      if (values.sendFormMessageToGroup && values.idGroupWpp?.trim()) {
        fd.append('idGroupWpp', values.idGroupWpp.trim());
      }
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

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-2">
          <Controller
            name="photoFile"
            control={control}
            render={({ field }) => (
              <>
                {/* Input file oculto */}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="sr-only"
                  ref={(e) => {
                    field.ref(e);
                    (fileInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                  }}
                  onChange={e => {
                    field.onChange(e.target.files?.[0]);
                  }}
                />

                {/* Avatar clicável com overlay de câmera */}
                <label className="relative cursor-pointer group block"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Avatar className="h-28 w-28 rounded-2xl border-2 border-border group-active:scale-95 transition-transform duration-150">
                    {previewUrl ? (
                      <AvatarImage src={previewUrl} alt="Foto" className="object-cover" />
                    ) : null}
                    <AvatarFallback className="rounded-2xl bg-gradient-to-br from-muted to-muted/50">
                      <Camera className="h-10 w-10 text-muted-foreground/40" />
                    </AvatarFallback>
                  </Avatar>

                  {/* Overlay escuro + ícone de câmera no hover/toque */}
                  <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200">
                    <Camera className="h-8 w-8 text-white drop-shadow-md" />
                  </div>
                </label>
              </>
            )}
          />

          {/* Botão tappable abaixo do avatar */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 min-w-[120px] text-xs gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            {formDto.exists ? 'Alterar foto' : 'Escolher foto'}
          </Button>

          {formState.errors.photoFile && (
            <p className="text-xs text-destructive text-center max-w-[140px]">{formState.errors.photoFile.message}</p>
          )}
        </div>

        <p className="text-sm text-muted-foreground flex-1 text-center sm:text-left">
          Complete os dados como aparecem no grupo. Na primeira vez é{' '}
          <span className="font-medium text-foreground">obrigatória</span>{' '}
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
                @
              </span>
              <Input id="pf-ig" className="border-0 rounded-none focus-visible:ring-0" {...register('instagramHandle')} />
            </div>
            {formState.errors.instagramHandle && (
              <p className="text-xs text-destructive">{formState.errors.instagramHandle.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={saving}>
          Salvar formulário
        </Button>
      </form>
    </div>
  );
}
