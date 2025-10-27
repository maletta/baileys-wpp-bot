"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { storage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DeviceInfo {
  id: string;
  name: string;
  platform: string;
}

interface ConnectionState {
  connected: boolean;
  device?: DeviceInfo;
  sessionId?: string;
}

interface UseWhatsAppConnectionReturn {
  // Estado
  isConnected: boolean;
  isConnecting: boolean;
  qrCode: string | null;
  deviceInfo: DeviceInfo | null;
  error: string | null;

  // Ações
  requestQrCode: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkStatus: () => Promise<void>;
}

export function useWhatsAppConnection(): UseWhatsAppConnectionReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const { toast } = useToast();
  const toastRef = useRef(toast);

  // Manter referência atualizada do toast
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // Inicializar conexão socket
  useEffect(() => {
    const token = storage.get('accessToken');

    if (!token) {
      return;
    }

    // Criar conexão socket
    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4444', {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    // Handlers de eventos do socket
    socket.on('connect', () => {
      console.log('Socket conectado');
      checkStatusInternal();
    });

    socket.on('connect_error', (err) => {
      console.error('Erro de conexão socket:', err);
      setError('Erro ao conectar com o servidor');
      toastRef.current({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor',
        variant: 'destructive'
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket desconectado. Razão:', reason);

      // Se foi desconectado pelo servidor ou por erro, tentar reconectar
      if (reason === 'io server disconnect') {
        // O servidor forçou a desconexão, reconectar manualmente
        socket.connect();
      }
    });

    // Evento de QR code recebido
    socket.on('session:qr-code', (data: { qrCode: string; sessionId: string }) => {
      console.log('QR Code recebido', { sessionId: data.sessionId, qrCodeLength: data.qrCode?.length });
      setQrCode(data.qrCode);
      setIsConnecting(true);
      setError(null);

      toastRef.current({
        title: 'QR Code gerado',
        description: 'Escaneie o QR code com seu WhatsApp para conectar',
      });
    });

    // Evento de conexão estabelecida
    socket.on('session:connected', (data: { sessionId: string; device: DeviceInfo; message: string }) => {
      console.log('Dispositivo conectado:', data);
      setIsConnected(true);
      setIsConnecting(false);
      setQrCode(null);
      setDeviceInfo(data.device);
      setError(null);

      toastRef.current({
        title: 'Conectado!',
        description: data.message || 'Dispositivo conectado com sucesso',
      });
    });

    // Evento de erro
    socket.on('session:error', (data: { sessionId: string; error: string; message: string }) => {
      console.error('Erro na sessão:', data);
      setIsConnecting(false);
      setQrCode(null);
      setError(data.error);

      toastRef.current({
        title: 'Erro',
        description: data.message || 'Erro ao conectar dispositivo',
        variant: 'destructive'
      });
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, []); // Remover toast das dependências para evitar reconexões

  // Verificar status da conexão internamente
  const checkStatusInternal = useCallback(() => {
    if (!socketRef.current?.connected) {
      return;
    }

    socketRef.current.emit('session:check-status', (response: any) => {
      if (response.success) {
        setIsConnected(response.connected);
        setDeviceInfo(response.device || null);

        if (!response.connected) {
          setQrCode(null);
          setIsConnecting(false);
        }
      }
    });
  }, []);

  // Verificar status da conexão (exposta)
  const checkStatus = useCallback(async () => {
    if (!socketRef.current?.connected) {
      setError('Socket não conectado');
      return;
    }

    socketRef.current.emit('session:check-status', (response: any) => {
      if (response.success) {
        setIsConnected(response.connected);
        setDeviceInfo(response.device || null);

        if (!response.connected) {
          setQrCode(null);
          setIsConnecting(false);
        }
      } else {
        setError(response.error || 'Erro ao verificar status');
      }
    });
  }, []);

  // Solicitar QR code para conectar
  const requestQrCode = useCallback(async () => {
    if (!socketRef.current?.connected) {
      setError('Socket não conectado');
      toast({
        title: 'Erro',
        description: 'Não foi possível conectar ao servidor',
        variant: 'destructive'
      });
      return;
    }

    setIsConnecting(true);
    setError(null);
    setQrCode(null);

    socketRef.current.emit('session:request-qr', (response: any) => {
      console.log('Solicitando QR Code', response);
      if (response.success) {
        if (response.connected) {
          // Já existe conexão ativa
          setIsConnected(true);
          setDeviceInfo(response.device);
          setIsConnecting(false);

          toastRef.current({
            title: 'Já conectado',
            description: 'Já existe um dispositivo conectado',
          });
        } else {
          // Aguardando QR code
          toastRef.current({
            title: 'Gerando QR Code',
            description: 'Aguarde a geração do QR code...',
          });
        }
      } else {
        setIsConnecting(false);
        setError(response.error);

        toastRef.current({
          title: 'Erro',
          description: response.error || 'Erro ao gerar QR code',
          variant: 'destructive'
        });
      }
    });
  }, []);

  // Desconectar dispositivo
  const disconnect = useCallback(async () => {
    if (!socketRef.current?.connected) {
      setError('Socket não conectado');
      return;
    }

    socketRef.current.emit('session:disconnect', (response: any) => {
      if (response.success) {
        setIsConnected(false);
        setDeviceInfo(null);
        setQrCode(null);
        setIsConnecting(false);
        setError(null);

        toastRef.current({
          title: 'Desconectado',
          description: 'Dispositivo desconectado com sucesso',
        });
      } else {
        setError(response.error);

        toastRef.current({
          title: 'Erro',
          description: response.error || 'Erro ao desconectar',
          variant: 'destructive'
        });
      }
    });
  }, []);

  return {
    isConnected,
    isConnecting,
    qrCode,
    deviceInfo,
    error,
    requestQrCode,
    disconnect,
    checkStatus
  };
}

