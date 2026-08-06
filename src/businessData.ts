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

const thaiTierDescriptions: Record<BusinessTier, string> = {
  small: 'เริ่มต้นด้วยต้นทุนต่ำ มีความคล่องตัวทางการเงินสูงในช่วงแรก',
  medium: 'ทางเลือกที่สมดุล รายได้มั่นคง และมีความเสี่ยงปานกลาง',
  large: 'ธุรกิจขนาดใหญ่เพื่อรายได้สูงสุด แต่ต้องลงทุนเงินสดจำนวนมาก',
}

const thaiBusinessConcepts: Record<string, BusinessConcept> = {
  market: {
    small: 'แผงลอยในตลาด',
    medium: 'ร้านค้าย่อยประจำถิ่น',
    large: 'ร้านค้าแบรนด์เด่นประจำตลาด',
  },
  viewpoint: {
    small: 'ซุ้มเครื่องดื่มชมวิว',
    medium: 'คาเฟ่จุดชมวิว',
    large: 'ภัตตาคารชมวิวทะเลสูง',
  },
  beach: {
    small: 'เตียงผ้าใบและร่มหาด',
    medium: 'คาเฟ่ชิลริมหาด',
    large: 'ร้านอาหารทะเลริมชายหาด',
  },
  road: {
    small: 'แผงขายของริมทาง',
    medium: 'คีออสเช่าอุปกรณ์',
    large: 'จุดเช็คอินของฝากและจุดพักรถ',
  },
  wildlife: {
    small: 'ซุ้มต้อนรับนักท่องเที่ยว',
    medium: 'คาเฟ่ครอบครัวริมสวนสัตว์',
    large: 'จุดบริการจองทัวร์ป่าพรีเมียม',
  },
  island: {
    small: 'แผงของว่างท่าเรือเกาะ',
    medium: 'คาเฟ่ริมหาดบนเกาะ',
    large: 'เคาน์เตอร์ทัวร์พันธมิตรรีสอร์ท',
  },
  mall: {
    small: 'บูธป๊อปอัปคีออส',
    medium: 'ร้านค้าขายปลีก',
    large: 'ร้านค้าเรือธงสุดหรู',
  },
  industrial: {
    small: 'ร้านข้าวแกงคนงาน',
    medium: 'ร้านขายอุปกรณ์โรงงาน',
    large: 'บริการขนส่งและซัพพลายเชน',
  },
  landmark: {
    small: 'ซุ้มขายของที่ระลึก',
    medium: 'คาเฟ่บริการนักทัศนาจร',
    large: 'ศูนย์บริการข้อมูลท่องเที่ยวและจำหน่ายทัวร์',
  },
  show: {
    small: 'ซุ้มถ่ายรูปที่ระลึก',
    medium: 'มินิบาร์และร้านขนมหน้างาน',
    large: 'จุดประสานงานบัตรแพ็กเกจวีไอพี',
  },
  themepark: {
    small: 'ซุ้มเครื่องดื่มและป๊อปคอร์น',
    medium: 'ร้านอาหารครอบครัวในสวนสนุก',
    large: 'บริการสิทธิพิเศษพันธมิตรสวนสนุก',
  },
  nightlife: {
    small: 'ร้านขายมื้อดึกโต้รุ่ง',
    medium: 'ผับบาร์ดนตรีสด',
    large: 'สถานบันเทิงครบวงจร',
  },
}

export const businessLevelMultipliers = [1, 1.8, 2.5] as const

export function getBusinessCardsForTile(tile: BoardTile, language?: 'en' | 'th'): BusinessCard[] {
  const economy = zoneEconomy[tile.zone] ?? zoneEconomy['Bangsaen + Nong Mon']
  const concept = (language === 'th' && thaiBusinessConcepts[tile.category])
    ? thaiBusinessConcepts[tile.category]
    : (businessConcepts[tile.category] ?? fallbackConcept)

  return (['small', 'medium', 'large'] as const).map((tier) => {
    const price = economy[tier]

    return {
      id: `${tile.id}-${tier}`,
      tier,
      title: concept[tier],
      price,
      baseIncome: Math.round(price * incomeRates[tier]),
      description: language === 'th' ? thaiTierDescriptions[tier] : tierDescriptions[tier],
    }
  })
}
