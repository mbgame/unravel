'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShopCard } from '../../components/shop/ShopCard';
import {
  getCosmetics,
  getOwnedKeys,
  getEquipped,
  purchaseCosmetic,
  equipCosmetic,
  type CosmeticItem,
} from '../../lib/api/shop.api';
import { useGamificationStore } from '../../stores/gamificationStore';
import { useAuthStore } from '../../stores/authStore';
import { CoinIcon } from '../../components/ui/CoinIcon';

type CosmeticType = 'yarn_color' | 'background' | 'celebration';

const SECTION_LABELS: Record<CosmeticType, string> = {
  yarn_color:  '🧶 Yarn Colours',
  background:  '🌌 Backgrounds',
  celebration: '🎉 Celebrations',
};

/**
 * ShopPage — browse and purchase cosmetics with coins.
 */
export default function ShopPage() {
  const router          = useRouter();
  const coins           = useGamificationStore((s) => s.coins);
  const playerLevel     = useGamificationStore((s) => s.playerLevel);
  const setCoins        = useGamificationStore((s) => s.setCoins);
  const setEquipped     = useGamificationStore((s) => s.setEquipped);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [cosmetics, setCosmetics] = useState<CosmeticItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [busy, setBusy]           = useState<string | null>(null); // key of item being acted on
  const [toast, setToast]         = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [items, owned, equipped] = await Promise.all([
        getCosmetics(),
        isAuthenticated ? getOwnedKeys() : Promise.resolve([] as string[]),
        isAuthenticated ? getEquipped() : Promise.resolve(null),
      ]);

      const ownedSet    = new Set(owned);
      const equippedKeys = equipped
        ? new Set([equipped.yarnColor, equipped.background, equipped.celebration])
        : new Set<string>();

      const merged = items.map((c) => ({
        ...c,
        owned:    c.isDefault || ownedSet.has(c.key),
        equipped: equippedKeys.has(c.key),
      }));
      setCosmetics(merged);
    } catch {
      setError('Could not load shop. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  const handlePurchase = async (key: string) => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    setBusy(key);
    try {
      const { newCoins } = await purchaseCosmetic(key);
      setCoins(newCoins);
      setCosmetics((prev) =>
        prev.map((c) => (c.key === key ? { ...c, owned: true } : c)),
      );
      showToast('Purchased! Tap Equip to use it.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Purchase failed';
      showToast(msg);
    } finally {
      setBusy(null);
    }
  };

  const handleEquip = async (key: string) => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    setBusy(key);
    try {
      await equipCosmetic(key);
      const cosmeticType = cosmetics.find((c) => c.key === key)?.type as CosmeticType | undefined;
      if (cosmeticType) {
        setEquipped(cosmeticType, key);
        setCosmetics((prev) =>
          prev.map((c) =>
            c.type === cosmeticType
              ? { ...c, equipped: c.key === key }
              : c,
          ),
        );
      }
      showToast('Equipped!');
    } catch {
      showToast('Could not equip. Try again.');
    } finally {
      setBusy(null);
    }
  };

  const sections: CosmeticType[] = ['yarn_color', 'background', 'celebration'];

  return (
    <main
      style={{
        width:         '100dvw',
        minHeight:     '100dvh',
        background:    'linear-gradient(160deg, #D6EEFF 0%, #A8D8F8 40%, #C5E8FF 70%, #EAF6FF 100%)',
        fontFamily:    'sans-serif',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        padding:       'clamp(1rem, 4vw, 2rem)',
        paddingBottom: '4rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          width:        '100%',
          maxWidth:     '40rem',
          display:      'flex',
          alignItems:   'center',
          marginBottom: '1.25rem',
          gap:          '0.75rem',
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            background:   'rgba(255,255,255,0.80)',
            border:       '1px solid rgba(0,0,0,0.12)',
            borderRadius: '2rem',
            padding:      '0.4rem 0.9rem',
            fontWeight:   600,
            fontSize:     '0.9rem',
            color:        '#333',
            cursor:       'pointer',
            display:      'flex',
            alignItems:   'center',
            gap:          '0.3rem',
            boxShadow:    '0 2px 8px rgba(0,0,0,0.08)',
            touchAction:  'manipulation',
          }}
        >
          ‹ Back
        </button>

        <div
          style={{
            flex:          1,
            textAlign:     'center',
            fontWeight:    900,
            fontSize:      'clamp(1.2rem, 5vw, 1.6rem)',
            color:         '#222',
            letterSpacing: '-0.02em',
          }}
        >
          🛍 Shop
        </div>

        {/* Coin balance */}
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '0.3rem',
            background:   'rgba(255,255,255,0.88)',
            border:       '1px solid rgba(184,134,11,0.25)',
            borderRadius: '2rem',
            padding:      '0.35rem 0.75rem',
            fontWeight:   700,
            fontSize:     '0.9rem',
            color:        '#B8860B',
          }}
        >
          <CoinIcon size={16} /> {coins}
        </div>
      </div>

      {/* Player level badge */}
      <div
        style={{
          marginBottom: '1.25rem',
          background:   'rgba(131,56,236,0.12)',
          border:       '1px solid rgba(131,56,236,0.25)',
          borderRadius: '2rem',
          padding:      '0.3rem 0.9rem',
          fontWeight:   700,
          fontSize:     '0.85rem',
          color:        '#8338EC',
        }}
      >
        ⭐ Player Level {playerLevel}
      </div>

      {/* Content */}
      <div style={{ width: '100%', maxWidth: '40rem' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
            Loading shop…
          </div>
        )}

        {error && (
          <div
            style={{
              textAlign:    'center',
              color:        '#E63946',
              padding:      '1.5rem',
              background:   'rgba(255,255,255,0.7)',
              borderRadius: '1rem',
            }}
          >
            {error}
            <br />
            <button
              onClick={load}
              style={{
                marginTop:    '0.75rem',
                padding:      '0.4rem 1.2rem',
                borderRadius: '2rem',
                border:       'none',
                background:   '#3A86FF',
                color:        '#fff',
                fontWeight:   700,
                cursor:       'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && sections.map((type) => {
          const items = cosmetics.filter((c) => c.type === type);
          if (items.length === 0) return null;
          return (
            <div key={type} style={{ marginBottom: '1.75rem' }}>
              <div
                style={{
                  fontWeight:    800,
                  fontSize:      'clamp(0.95rem, 4vw, 1.1rem)',
                  color:         '#333',
                  marginBottom:  '0.75rem',
                  letterSpacing: '-0.01em',
                }}
              >
                {SECTION_LABELS[type]}
              </div>

              <div
                style={{
                  display:        'flex',
                  gap:            '0.65rem',
                  overflowX:      'auto',
                  paddingBottom:  '0.5rem',
                  scrollbarWidth: 'none',
                }}
              >
                {items.map((c) => (
                  <ShopCard
                    key={c.key}
                    cosmetic={c}
                    playerLevel={playerLevel}
                    coins={coins}
                    onPurchase={handlePurchase}
                    onEquip={handleEquip}
                    loading={busy === c.key}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {!isAuthenticated && !loading && (
          <div
            style={{
              textAlign:    'center',
              marginTop:    '1rem',
              padding:      '1rem',
              background:   'rgba(255,255,255,0.7)',
              borderRadius: '1rem',
              color:        '#666',
              fontSize:     '0.9rem',
            }}
          >
            <a
              href="/auth/login"
              style={{ color: '#3A86FF', fontWeight: 700, textDecoration: 'none' }}
            >
              Log in
            </a>{' '}
            to purchase and equip cosmetics.
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position:     'fixed',
            bottom:       '2rem',
            left:         '50%',
            transform:    'translateX(-50%)',
            background:   '#222',
            color:        '#fff',
            padding:      '0.65rem 1.4rem',
            borderRadius: '2rem',
            fontWeight:   600,
            fontSize:     '0.9rem',
            zIndex:       100,
            boxShadow:    '0 4px 20px rgba(0,0,0,0.25)',
            whiteSpace:   'nowrap',
          }}
        >
          {toast}
        </div>
      )}
    </main>
  );
}
