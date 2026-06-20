'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';
import type { FormSlugGroupInfo } from '@/lib/publicParticipantAuthApi';

export interface GroupHeaderProps {
  group: FormSlugGroupInfo;
  className?: string;
}

export function GroupHeader({ group, className }: GroupHeaderProps) {
  const label = group.isCommunity ? 'Comunidade' : 'Grupo';

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl bg-muted/30 border shadow-sm',
        className
      )}
    >
      <Avatar className="h-14 w-14 rounded-xl border border-border shrink-0">
        {group.imageUrl ? (
          <AvatarImage src={group.imageUrl} alt={group.name} className="object-cover" />
        ) : null}
        <AvatarFallback className="rounded-xl text-lg font-semibold">
          <Users className="h-6 w-6 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </p>
        <p className="text-lg font-bold truncate">{group.name}</p>
      </div>
    </div>
  );
}
