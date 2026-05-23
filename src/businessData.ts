import type { BoardTile, TileCategory } from './boardData'

export type BusinessTier = 'small' | 'medium' | 'large'

export type BusinessCard = {
  id: string
  tier: BusinessTier
  title: string
  price: number
  baseIncome: number
  description: string
}

type ZoneEconomy = {
  small: number
  medium: number
  large: number
}

type BusinessConcept = {
  small: string
  medium: string
  large: string
}

const zoneEconomy: Record<string, ZoneEconomy> = {
  'Bangsaen + Nong Mon': {
    small: 10000,
    medium: 35000,
    large: 80000,
  },
  'Sriracha + Laem Chabang': {
    small: 15000,
    medium: 45000,
    large: 100000,
  },
  'Amata City + Phan Thong': {
    small: 20000,
    medium: 60000,
    large: 120000,
  },
  Pattaya: {
    small: 30000,
    medium: 80000,
    large: 150000,
  },
}

const businessConcepts: Partial<Record<TileCategory, BusinessConcept>> = {
  market: {
    small: 'Market Stall',
    medium: 'Local Shop',
    large: 'Signature Store',
  },
  viewpoint: {
    small: 'Snack Cart',
    medium: 'View Cafe',
    large: 'Scenic Restaurant',
  },
  beach: {
    small: 'Beach Vendor',
    medium: 'Beach Cafe',
    large: 'Seaside Restaurant',
  },
  road: {
    small: 'Roadside Stand',
    medium: 'Rental Kiosk',
    large: 'Scenic Stop',
  },
  wildlife: {
    small: 'Visitor Kiosk',
    medium: 'Family Cafe',
    large: 'Tour Package Desk',
  },
  island: {
    small: 'Ferry Snack Stand',
    medium: 'Island Cafe',
    large: 'Resort Partner Desk',
  },
  mall: {
    small: 'Pop-up Counter',
    medium: 'Retail Shop',
    large: 'Flagship Store',
  },
  industrial: {
    small: 'Worker Food Stall',
    medium: 'Supply Shop',
    large: 'Logistics Service',
  },
  landmark: {
    small: 'Souvenir Kiosk',
    medium: 'Tour Cafe',
    large: 'Visitor Center',
  },
  show: {
    small: 'Photo Booth',
    medium: 'Show Snack Bar',
    large: 'Premium Package Desk',
  },
  themepark: {
    small: 'Drink Stand',
    medium: 'Family Restaurant',
    large: 'Attraction Partner',
  },
  nightlife: {
    small: 'Late-night Food Cart',
    medium: 'Music Bar',
    large: 'Entertainment Venue',
  },
}

const fallbackConcept: BusinessConcept = {
  small: 'Small Business',
  medium: 'Local Business',
  large: 'Anchor Business',
}

const incomeRates: Record<BusinessTier, number> = {
  small: 0.12,
  medium: 0.1,
  large: 0.09,
}

const tierDescriptions: Record<BusinessTier, string> = {
  small: 'Low-cost entry point with the best early cash flexibility.',
  medium: 'Balanced business option for steady income and moderate risk.',
  large: 'High-cost play for bigger income, but it ties up cash quickly.',
}

export const businessLevelMultipliers = [1, 1.8, 2.5] as const

export function getBusinessCardsForTile(tile: BoardTile): BusinessCard[] {
  const economy = zoneEconomy[tile.zone] ?? zoneEconomy['Bangsaen + Nong Mon']
  const concept = businessConcepts[tile.category] ?? fallbackConcept

  return (['small', 'medium', 'large'] as const).map((tier) => {
    const price = economy[tier]

    return {
      id: `${tile.id}-${tier}`,
      tier,
      title: concept[tier],
      price,
      baseIncome: Math.round(price * incomeRates[tier]),
      description: tierDescriptions[tier],
    }
  })
}
