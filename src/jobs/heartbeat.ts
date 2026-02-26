import { AuditLogger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Sistema de Pulso (Heartbeat) 💓
 * Informa ao site Sens-PUBG que o bot está vivo e operacional.
 */
export function startHeartbeat() {
    const SITE_HEALTH_URL = 'https://sens-pubg.vercel.app/api/bot/health';

    AuditLogger.info('Initializing System Heartbeat (1min interval)...');

    setInterval(async () => {
        try {
            const response = await fetch(SITE_HEALTH_URL, {
                method: 'POST',
                headers: {
                    'x-bot-api-key': env.BOT_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'online',
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    AuditLogger.error('Heartbeat Unauthorized: BOT_API_KEY mismatch between Render and Vercel.');
                } else {
                    AuditLogger.info(`Site health endpoint status: ${response.status}`);
                }
            }
        } catch (err: any) {
            // Silencioso para não poluir os logs se o site estiver em rede lenta
            if (env.NODE_ENV === 'development') {
                console.warn('[HEARTBEAT] Site offline ou erro no sinal:', err?.message);
            }
        }
    }, 60000); // 1 minuto
}
