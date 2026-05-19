import pLimit from 'p-limit';
import { buildTelegramAlert } from '@/lib/alerts/templates';
import { sendTelegramMessage } from '@/lib/alerts/telegram';
import { shouldSendAlert } from '@/lib/alerts/engine';
import { checkPositionRisk } from '@/lib/risk/engine';
import { getLastSnapshotForWatch, listDueWatches, storeAlertEvent, storeRiskSnapshot, updateWatch } from '@/lib/db/repository';
import { logger } from '@/lib/logger';
import { withWorkerLock } from './locks';

export async function checkDueWatches() {
  const result = await withWorkerLock(async () => {
    const watches = await listDueWatches(50);
    const limit = pLimit(5);
    const summary = { checked: 0, alertsSent: 0, alertsSuppressed: 0, failed: 0 };

    await Promise.all(
      watches.map((watch) =>
        limit(async () => {
          try {
            const previous = await getLastSnapshotForWatch(watch.id);
            const risk = await checkPositionRisk({
              protocolKey: 'aave-v3',
              chainKey: watch.chainKey,
              walletAddress: watch.walletAddress as `0x${string}`,
              targetHealthFactor: Number(watch.targetHealthFactor)
            });
            const snapshot = await storeRiskSnapshot(watch.id, risk);
            const decision = shouldSendAlert({
              watch,
              currentRiskLevel: risk.riskLevel,
              previousRiskLevel: previous?.riskLevel as never,
              healthFactor: risk.healthFactor
            });

            if (decision.send && watch.telegramChatId) {
              const text = buildTelegramAlert({
                risk,
                minHealthFactor: Number(watch.minHealthFactor),
                targetHealthFactor: Number(watch.targetHealthFactor)
              });
              const telegram = await sendTelegramMessage({ chatId: watch.telegramChatId, text });
              await storeAlertEvent({
                watchId: watch.id,
                snapshotId: snapshot.id,
                channel: 'telegram',
                status: telegram.ok ? 'sent' : 'failed',
                reason: telegram.error ?? decision.reason,
                payloadJson: { text }
              });
              if (telegram.ok) {
                summary.alertsSent += 1;
                await updateWatch(watch.id, { lastAlertedAt: new Date() });
              } else {
                summary.failed += 1;
              }
            } else {
              await storeAlertEvent({
                watchId: watch.id,
                snapshotId: snapshot.id,
                channel: 'telegram',
                status: 'suppressed',
                reason: decision.reason,
                payloadJson: {}
              });
              summary.alertsSuppressed += 1;
            }
            await updateWatch(watch.id, { lastCheckedAt: new Date() });
            summary.checked += 1;
          } catch (error) {
            summary.failed += 1;
            logger.error('watch_check_failed', { watchId: watch.id, error: error instanceof Error ? error.message : String(error) });
          }
        })
      )
    );

    return summary;
  });

  return result ?? { checked: 0, alertsSent: 0, alertsSuppressed: 0, failed: 0, locked: true };
}
