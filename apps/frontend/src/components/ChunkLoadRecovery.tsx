'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'wa_baileys_chunk_reload_once';

function isChunkLoadFailure(message: string): boolean {
  return (
    message.includes('Loading chunk') ||
    message.includes('ChunkLoadError') ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed')
  );
}

/**
 * Em dev, após reiniciar o Next ou com cache de chunk antigo, o primeiro load pode falhar.
 * Um reload único por aba costuma resolver ChunkLoadError / script truncado.
 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        /* ignore */
      }
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const tryReload = (reason: unknown) => {
      const message =
        typeof reason === 'object' && reason !== null && 'message' in reason
          ? String((reason as { message?: string }).message)
          : String(reason);
      const name =
        typeof reason === 'object' && reason !== null && 'name' in reason
          ? String((reason as { name?: string }).name)
          : '';

      if (!isChunkLoadFailure(message) && name !== 'ChunkLoadError') return;
      if (typeof window === 'undefined') return;
      if (sessionStorage.getItem(RELOAD_KEY)) return;
      sessionStorage.setItem(RELOAD_KEY, '1');
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (msg.includes('ChunkLoadError') || (msg.includes('Failed to fetch') && event.filename?.includes('_next'))) {
        tryReload(msg);
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      tryReload(event.reason);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
