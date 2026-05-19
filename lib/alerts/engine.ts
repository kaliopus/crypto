import type { RiskLevel } from '@/lib/protocols/types';
import type { WatchRecord } from '@/lib/db/repository';

const order: Record<RiskLevel, number> = {
  none: 0,
  safe: 1,
  watch: 2,
  warning: 3,
  critical: 4,
  liquidatable: 5,
  unknown: 2
};

function hasRiskWorsened(currentRiskLevel: RiskLevel, previousRiskLevel?: RiskLevel | null) {
  return Boolean(previousRiskLevel && order[currentRiskLevel] > order[previousRiskLevel]);
}

function hasCooldownPassed(watch: WatchRecord, now: Date) {
  if (!watch.lastAlertedAt) return true;
  return now.getTime() - watch.lastAlertedAt.getTime() >= watch.alertCooldownMinutes * 60_000;
}

export function shouldSendAlert(input: {
  watch: WatchRecord;
  currentRiskLevel: RiskLevel;
  previousRiskLevel?: RiskLevel | null;
  healthFactor: number | null;
  now?: Date;
}) {
  if (!input.watch.telegramChatId) {
    return { send: false, reason: 'No Telegram chat ID configured.' };
  }
  if (input.currentRiskLevel === 'none' || input.currentRiskLevel === 'safe') {
    return { send: false, reason: 'Risk level does not require alert.' };
  }
  if (hasRiskWorsened(input.currentRiskLevel, input.previousRiskLevel)) {
    return { send: true, reason: 'Risk level worsened.' };
  }
  if (input.healthFactor === null || input.healthFactor >= Number(input.watch.minHealthFactor)) {
    return { send: false, reason: 'Health Factor is above configured threshold.' };
  }
  if (hasCooldownPassed(input.watch, input.now ?? new Date())) {
    return { send: true, reason: 'Health Factor is below configured threshold and cooldown passed.' };
  }
  return { send: false, reason: 'Alert cooldown is active.' };
}
