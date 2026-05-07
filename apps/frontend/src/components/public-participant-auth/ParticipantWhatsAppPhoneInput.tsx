'use client';

import PhoneInput, { type Value } from 'react-phone-number-input';
import ptBR from 'react-phone-number-input/locale/pt-BR.json';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

export type ParticipantPhoneValue = Value;

export interface ParticipantWhatsAppPhoneInputProps {
  id?: string;
  value: ParticipantPhoneValue | undefined;
  onChange: (value: ParticipantPhoneValue | undefined) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Telefone com país, bandeira e máscara dinâmica (libphonenumber por baixo).
 * Documentação: https://gitlab.com/catamphetamine/react-phone-number-input
 */
export function ParticipantWhatsAppPhoneInput({
  id,
  value,
  onChange,
  className,
  disabled
}: ParticipantWhatsAppPhoneInputProps) {
  return (
    <PhoneInput
      id={id}
      international
      countryCallingCodeEditable={false}
      defaultCountry="BR"
      labels={ptBR}
      limitMaxLength
      smartCaret
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn('phone-input-participant', className)}
    />
  );
}
