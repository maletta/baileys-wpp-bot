import { fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

const CACHE_KEY = 'baileys_version';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

interface BaileysVersion {
  version: [number, number, number];
  isLatest: boolean;
}

/**
 * Busca a versão do Baileys com cache de 24 horas
 * Reduz drasticamente o tempo de conexão evitando chamadas repetidas à API
 */
export async function getCachedBaileysVersion(): Promise<BaileysVersion> {
  try {
    // Tentar buscar do cache
    const cached = await prisma.systemConfig.findUnique({
      where: { key: CACHE_KEY }
    });

    if (cached) {
      const cacheAge = Date.now() - cached.updatedAt.getTime();
      
      // Se o cache tem menos de 24 horas, usar ele
      if (cacheAge < CACHE_DURATION_MS) {
        const cachedData = JSON.parse(cached.value) as BaileysVersion;
        logger.info('Using cached Baileys version', {
          version: cachedData.version.join('.'),
          isLatest: cachedData.isLatest,
          cacheAgeHours: (cacheAge / (60 * 60 * 1000)).toFixed(2)
        });
        return cachedData;
      }

      logger.info('Baileys version cache expired, fetching new version', {
        cacheAgeHours: (cacheAge / (60 * 60 * 1000)).toFixed(2)
      });
    } else {
      logger.info('No cached Baileys version found, fetching from API');
    }

    // Cache não existe ou expirou, buscar da API
    logger.info('Fetching latest Baileys version from API...');
    const startTime = Date.now();
    
    const versionData = await fetchLatestBaileysVersion();
    
    const fetchDuration = Date.now() - startTime;
    logger.info('Baileys version fetched successfully', {
      version: versionData.version.join('.'),
      isLatest: versionData.isLatest,
      fetchDurationMs: fetchDuration
    });

    // Salvar no cache
    await prisma.systemConfig.upsert({
      where: { key: CACHE_KEY },
      create: {
        key: CACHE_KEY,
        value: JSON.stringify(versionData)
      },
      update: {
        value: JSON.stringify(versionData),
        updatedAt: new Date()
      }
    });

    logger.info('Baileys version cached successfully');

    return versionData;

  } catch (error) {
    logger.error('Error fetching Baileys version, using fallback', { error });
    
    // Tentar usar cache antigo mesmo que expirado
    try {
      const cached = await prisma.systemConfig.findUnique({
        where: { key: CACHE_KEY }
      });

      if (cached) {
        const cachedData = JSON.parse(cached.value) as BaileysVersion;
        logger.warn('Using expired cache due to fetch error', {
          version: cachedData.version.join('.'),
          cacheAge: Date.now() - cached.updatedAt.getTime()
        });
        return cachedData;
      }
    } catch (cacheError) {
      logger.error('Failed to read expired cache', { error: cacheError });
    }

    // Fallback para versão conhecida
    logger.warn('Using hardcoded fallback version');
    return {
      version: [2, 3000, 0], // Versão de fallback
      isLatest: false
    };
  }
}

/**
 * Limpa o cache da versão do Baileys
 * Útil para forçar uma nova busca da API
 */
export async function clearBaileysVersionCache(): Promise<void> {
  try {
    await prisma.systemConfig.delete({
      where: { key: CACHE_KEY }
    });
    logger.info('Baileys version cache cleared');
  } catch (error) {
    logger.error('Error clearing Baileys version cache', { error });
    throw error;
  }
}

/**
 * Obtém informações sobre o cache atual
 */
export async function getBaileysVersionCacheInfo(): Promise<{
  exists: boolean;
  version?: string;
  cacheAgeHours?: number;
  isExpired?: boolean;
}> {
  try {
    const cached = await prisma.systemConfig.findUnique({
      where: { key: CACHE_KEY }
    });

    if (!cached) {
      return { exists: false };
    }

    const cacheAge = Date.now() - cached.updatedAt.getTime();
    const cacheAgeHours = cacheAge / (60 * 60 * 1000);
    const isExpired = cacheAge >= CACHE_DURATION_MS;
    const versionData = JSON.parse(cached.value) as BaileysVersion;

    return {
      exists: true,
      version: versionData.version.join('.'),
      cacheAgeHours: parseFloat(cacheAgeHours.toFixed(2)),
      isExpired
    };
  } catch (error) {
    logger.error('Error getting cache info', { error });
    return { exists: false };
  }
}

