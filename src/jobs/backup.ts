import cron from 'node-cron';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { env } from '../config/env.js';
import { AuditLogger } from '../utils/logger.js';
import { db } from '../database/index.js';
import { backupsHistory, auditLogs } from '../database/schema.js';
import { lt } from 'drizzle-orm';

const execAsync = promisify(exec);

// Config
const MAX_BACKUP_FILES = 5;
const BACKUP_DIR = join(process.cwd(), 'backups');

export function startBackupCron() {
    if (!existsSync(BACKUP_DIR)) {
        mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Roda todos os dias às 03:00 para garantir consistência (conforme pedido de estabilidade)
    cron.schedule('0 3 * * *', async () => {
        AuditLogger.backup('Starting daily database backup job...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `sens-pubg-db-${timestamp}.sql.gz`;
        const filepath = join(BACKUP_DIR, filename);
        const backupId = randomUUID();

        try {
            // Verifica se pg_dump existe no path ou tenta rodar (Em ambientes Render/Vercel pode falhar se não houver binário)
            const command = `pg_dump "${env.DATABASE_URL}" | gzip > "${filepath}"`;
            await execAsync(command);

            const stats = statSync(filepath);
            const sizeMB = parseFloat((stats.size / (1024 * 1024)).toFixed(2));

            AuditLogger.backup(`Backup successful: \`${filename}\` (${sizeMB} MB)`);

            await db.insert(backupsHistory).values({
                id: backupId,
                fileName: filename,
                status: 'SUCCESS',
                fileSizeMb: sizeMB,
            });

            await cleanupDataAndFiles();

        } catch (error: any) {
            AuditLogger.backup(`Backup generation failed: ${error.message}`, true);

            await db.insert(backupsHistory).values({
                id: backupId,
                fileName: filename,
                status: 'FAILED',
                notes: error?.message,
            });
        }
    });

    AuditLogger.info('Cron Job registered: Automated Database Backups (Daily + Database Cleanup)');
}

async function cleanupDataAndFiles() {
    try {
        // 1. Limpeza de Arquivos Locais
        const files = readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.sql.gz'))
            .map(f => ({
                name: f,
                path: join(BACKUP_DIR, f),
                time: statSync(join(BACKUP_DIR, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        if (files.length > MAX_BACKUP_FILES) {
            const filesToDelete = files.slice(MAX_BACKUP_FILES);
            for (const file of filesToDelete) {
                unlinkSync(file.path);
                AuditLogger.backup(`Retention cleanup: Deleted old local backup \`${file.name}\``);
            }
        }

        // 2. Limpeza de Logs do Banco (Evitar estourar 512MB do Neon Free)
        // Deleta logs de auditoria mais antigos que 30 dias
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        await db.delete(auditLogs).where(lt(auditLogs.createdAt, thirtyDaysAgo));
        AuditLogger.backup(`Database Health: Purged old audit logs from more than 30 days.`);

    } catch (err: any) {
        AuditLogger.error('Failed to execute retention cleanup', err?.message);
    }
}
