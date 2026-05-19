import { beforeEach, describe, expect, it } from 'vitest';
import { GET as checkGet } from '@/app/api/check/route';
import { GET as healthGet } from '@/app/api/health/route';
import { GET as cronGet } from '@/app/api/cron/check-watches/route';
import { POST as watchesPost } from '@/app/api/watches/route';
import { __resetMemoryRepository, createWatch, listAlertEvents, listLatestSnapshots } from '@/lib/db/repository';
import { __setTelegramSenderForTests } from '@/lib/alerts/telegram';
import { __setProtocolAdapterForTests } from '@/lib/risk/engine';
import type { ProtocolAdapter } from '@/lib/protocols/types';

const walletAddress = '0x0000000000000000000000000000000000000001';

const mockAdapter: ProtocolAdapter = {
  protocolKey: 'aave-v3',
  async getPositionRisk(input) {
    return {
      protocolKey: 'aave-v3',
      chainKey: input.chainKey,
      walletAddress: input.walletAddress,
      blockNumber: 123n,
      healthFactor: 1.08,
      healthFactorRaw: '1080000000000000000',
      totalCollateralBase: 1500n,
      totalDebtBase: 1000n,
      availableBorrowsBase: 0n,
      currentLiquidationThreshold: 8000n,
      ltv: 7500n,
      riskLevel: 'critical',
      dangerReason: 'Health Factor is close to liquidation.',
      rescuePlan: {
        targetHealthFactor: input.targetHealthFactor,
        repayToTargetBase: 143n,
        collateralToTargetBase: 25n,
        explanation: 'Estimated action needed to restore Health Factor.',
        assumptions: ['mocked adapter']
      },
      raw: {
        mocked: true,
        liveLikeAave: {
          blockNumber: 123n,
          totalCollateralBase: 1500n,
          totalDebtBase: 1000n,
          nested: [1n, { value: 2n }]
        }
      }
    };
  }
};

beforeEach(() => {
  __resetMemoryRepository();
  __setProtocolAdapterForTests('aave-v3', mockAdapter);
  __setTelegramSenderForTests(null);
  delete process.env.CRON_SECRET;
});

describe('routes', () => {
  it('/api/health returns ok', async () => {
    const response = await healthGet();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, service: 'risk-sentinel' });
  });

  it('/api/watches creates watch shape', async () => {
    const request = new Request('http://localhost/api/watches', {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
        chainKey: 'base',
        protocolKey: 'aave-v3',
        minHealthFactor: 1.25,
        targetHealthFactor: 1.4
      })
    });
    const response = await watchesPost(request);
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.data.watch.walletAddress).toBe(walletAddress);
    expect(json.data.risk.riskLevel).toBe('critical');
    expect(json.data.risk.raw.liveLikeAave.totalDebtBase).toBe('1000');
    await expect(listLatestSnapshots()).resolves.toHaveLength(1);
  });

  it('/api/check returns mocked Aave risk shape', async () => {
    const response = await checkGet(
      new Request(`http://localhost/api/check?chain=base&wallet=${walletAddress}&protocol=aave-v3&targetHealthFactor=1.4`)
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      ok: true,
      data: {
        protocolKey: 'aave-v3',
        chainKey: 'base',
        walletAddress,
        healthFactor: 1.08,
        riskLevel: 'critical'
      }
    });
    expect(json.data.raw.liveLikeAave.totalCollateralBase).toBe('1500');
  });

  it('cron rejects missing secret', async () => {
    process.env.CRON_SECRET = 'test-secret';
    const response = await cronGet(new Request('http://localhost/api/cron/check-watches'));
    expect(response.status).toBe(401);
  });

  it('cron processes due watches, stores snapshots, and sends mocked Telegram alert', async () => {
    process.env.CRON_SECRET = 'test-secret';
    const sent: Array<{ chatId: string; text: string }> = [];
    __setTelegramSenderForTests(async (message) => {
      sent.push(message);
      return { ok: true };
    });
    await createWatch({
      walletAddress,
      chainKey: 'base',
      protocolKey: 'aave-v3',
      minHealthFactor: '1.25',
      targetHealthFactor: '1.40',
      telegramChatId: '123456789'
    });

    const response = await cronGet(
      new Request('http://localhost/api/cron/check-watches', {
        headers: { authorization: 'Bearer test-secret' }
      })
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({ ok: true, checked: 1, alertsSent: 1, failed: 0 });
    expect(sent[0]?.text).toContain('Risk Sentinel Alert');
    await expect(listLatestSnapshots()).resolves.toHaveLength(1);
    const alerts = await listAlertEvents();
    expect(alerts[0]).toMatchObject({ status: 'sent', channel: 'telegram' });
  });
});
