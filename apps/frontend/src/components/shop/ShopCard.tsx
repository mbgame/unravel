'use client';

import React, { memo } from 'react';
import type { CosmeticItem } from '../../lib/api/shop.api';
import { CoinIcon } from '../ui/CoinIcon';

interface ShopCardProps {
  cosmetic:    CosmeticItem;
  playerLevel: number;
  coins:       number;
  onPurchase:  (key: string) => void;
  onEquip:     (key: string) => void;
  loading?:    boolean;
}

/** Preview colour swatches for yarn_color cosmetics. */
const YARN_COLOR_SWATCHES: Record<string, string[]> = {
  default: ['#E63946', '#F4A261', '#2A9D8F', '#8338EC', '#3A86FF'],
  pastel:  ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF'],
  neon:    ['#FF0090', '#FF6B00', '#FFE600', '#00FF9F', '#00BFFF'],
  earth:   ['#8B4513', '#D2691E', '#DAA520', '#6B8E23', '#2F4F4F'],
};

const BG_PREVIEWS: Record<string, { from: string; to: string }> = {
  sky:    { from: '#D6EEFF', to: '#A8D8F8' },
  galaxy: { from: '#0D0D2B', to: '#1A1A4E' },
  forest: { from: '#1A3D1F', to: '#2E7D32' },
};

const CELEBRATE_ICONS: Record<string, string> = {
  confetti:  '🎊',
  stars:     '⭐',
  fireworks: '🎆',
};

/**
 * Renders a preview tile based on cosmetic type.
 */
function CosmeticPreview({ cosmetic }: { cosmetic: CosmeticItem }) {
  if (cosmetic.type === 'yarn_color') {
    const swatches = YARN_COLOR_SWATCHES[cosmetic.key] ?? YARN_COLOR_SWATCHES.default;
    return (
      <div
        style={{
          display:        'flex',
          gap:            '3px',
          justifyContent: 'center',
          marginBottom:   '0.5rem',
        }}
      >
        {swatches.map((c) => (
          <div
            key={c}
            style={{
              width:        '1.1rem',
              height:       '1.1rem',
              borderRadius: '50%',
              background:   c,
              border:       '1.5px solid rgba(0,0,0,0.10)',
            }}
          />
        ))}
      </div>
    );
  }

  if (cosmetic.type === 'background') {
    const bg = BG_PREVIEWS[cosmetic.key] ?? BG_PREVIEWS.sky;
    return (
      <div
        style={{
          width:           '3.5rem',
          height:          '2rem',
          borderRadius:    '0.5rem',
          background:      `linear-gradient(135deg, ${bg.from}, ${bg.to})`,
          margin:          '0 auto 0.5rem',
          border:          '1px solid rgba(0,0,0,0.10)',
        }}
      />
    );
  }

  if (cosmetic.type === 'celebration') {
    return (
      <div
        style={{
          fontSize:     '2rem',
          textAlign:    'center',
          marginBottom: '0.4rem',
          lineHeight:   1,
        }}
      >
        {CELEBRATE_ICONS[cosmetic.key] ?? '✨'}
      </div>
    );
  }

  return null;
}

/**
 * ShopCard — displays one cosmetic item in the shop.
 * States: free/default, owned, locked (level), affordable, too-expensive.
 */
export const ShopCard = memo(function ShopCard({
  cosmetic,
  playerLevel,
  coins,
  onPurchase,
  onEquip,
  loading = false,
}: ShopCardProps) {
  const isLocked    = !cosmetic.isDefault && !cosmetic.owned && playerLevel < cosmetic.requiredPlayerLevel;
  const canAfford   = coins >= cosmetic.costCoins;
  const isEquipped  = cosmetic.equipped;
  const isOwned     = cosmetic.owned;
  const isFree      = cosmetic.costCoins === 0;

  let buttonLabel: React.ReactNode;
  let buttonStyle: React.CSSProperties;
  let buttonDisabled = false;

  if (isEquipped) {
    buttonLabel = 'Equipped ✓';
    buttonStyle = { background: '#06D6A0', color: '#fff' };
    buttonDisabled = true;
  } else if (isOwned || isFree) {
    buttonLabel = 'Equip';
    buttonStyle = { background: '#3A86FF', color: '#fff' };
  } else if (isLocked) {
    buttonLabel = `Lv.${cosmetic.requiredPlayerLevel} required`;
    buttonStyle = { background: 'rgba(0,0,0,0.12)', color: '#999' };
    buttonDisabled = true;
  } else if (canAfford) {
    buttonLabel = <><CoinIcon size={13} /> {cosmetic.costCoins}</>;
    buttonStyle = { background: '#FFD700', color: '#7A6000' };
  } else {
    buttonLabel = <><CoinIcon size={13} /> {cosmetic.costCoins}</>;
    buttonStyle = { background: 'rgba(0,0,0,0.08)', color: '#bbb' };
    buttonDisabled = true;
  }

  const handleClick = () => {
    if (buttonDisabled || loading) return;
    if (isOwned || isFree) {
      onEquip(cosmetic.key);
    } else {
      onPurchase(cosmetic.key);
    }
  };

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        background:    isEquipped
          ? 'rgba(6,214,160,0.12)'
          : isLocked
            ? 'rgba(0,0,0,0.04)'
            : 'rgba(255,255,255,0.85)',
        border:        isEquipped
          ? '1.5px solid #06D6A0'
          : '1px solid rgba(0,0,0,0.09)',
        borderRadius:  '1rem',
        padding:       '0.85rem 0.65rem 0.7rem',
        width:         'clamp(5.5rem, 28vw, 8rem)',
        flexShrink:    0,
        opacity:       isLocked ? 0.65 : 1,
        transition:    'transform 0.15s',
        cursor:        buttonDisabled ? 'default' : 'pointer',
      }}
      onClick={handleClick}
    >
      <CosmeticPreview cosmetic={cosmetic} />

      <div
        style={{
          fontWeight:   700,
          fontSize:     'clamp(0.72rem, 2.8vw, 0.82rem)',
          color:        '#222',
          textAlign:    'center',
          marginBottom: '0.45rem',
          lineHeight:   1.2,
        }}
      >
        {cosmetic.name}
      </div>

      <button
        disabled={buttonDisabled || loading}
        onClick={(e) => { e.stopPropagation(); handleClick(); }}
        style={{
          padding:      '0.3rem 0.6rem',
          borderRadius: '2rem',
          border:       'none',
          fontWeight:   700,
          fontSize:     'clamp(0.68rem, 2.5vw, 0.76rem)',
          cursor:       buttonDisabled || loading ? 'default' : 'pointer',
          transition:   'opacity 0.15s',
          opacity:      loading ? 0.6 : 1,
          whiteSpace:   'nowrap',
          ...buttonStyle,
        }}
      >
        {loading ? '…' : buttonLabel}
      </button>
    </div>
  );
});
