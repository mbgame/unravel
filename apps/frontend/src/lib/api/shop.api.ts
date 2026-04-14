/**
 * Shop API — cosmetics listing, purchasing, and equipping.
 */

import { apiClient } from './client';

export interface CosmeticItem {
  key: string;
  type: string;
  name: string;
  description: string;
  iconUrl?: string;
  costCoins: number;
  requiredPlayerLevel: number;
  isDefault: boolean;
  owned: boolean;
  equipped: boolean;
}

export interface EquippedCosmetics {
  yarnColor: string;
  background: string;
  celebration: string;
}

/** Fetches all cosmetics. Default items have owned=true; others default to false. */
export async function getCosmetics(): Promise<CosmeticItem[]> {
  const { data } = await apiClient.get<{ data: CosmeticItem[] }>('/shop/cosmetics');
  return data.data;
}

/** Returns cosmetic keys owned by the authenticated user. */
export async function getOwnedKeys(): Promise<string[]> {
  const { data } = await apiClient.get<{ data: string[] }>('/shop/owned-keys');
  return data.data;
}

/** Returns the currently equipped cosmetic keys for the authenticated user. */
export async function getEquipped(): Promise<EquippedCosmetics> {
  const { data } = await apiClient.get<{ data: EquippedCosmetics }>('/shop/equipped');
  return data.data;
}

/** Purchase a cosmetic with coins. Returns the new coin balance. */
export async function purchaseCosmetic(key: string): Promise<{ newCoins: number }> {
  const { data } = await apiClient.post<{ data: { newCoins: number } }>(`/shop/purchase/${key}`);
  return data.data;
}

/** Equip an owned cosmetic (unequips previous of same type). */
export async function equipCosmetic(key: string): Promise<void> {
  await apiClient.post(`/shop/equip/${key}`);
}
