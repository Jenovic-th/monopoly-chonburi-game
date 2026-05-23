export type TileCategory =
  | 'start'
  | 'market'
  | 'viewpoint'
  | 'beach'
  | 'road'
  | 'education'
  | 'politics'
  | 'wildlife'
  | 'island'
  | 'mall'
  | 'port'
  | 'industrial'
  | 'landmark'
  | 'influence'
  | 'jail'
  | 'nightlife'
  | 'show'
  | 'themepark'
  | 'placeholder'

export type BoardTile = {
  id: number
  name: string
  zone: string
  category: TileCategory
  description: string
  landPrice?: number
}

export const boardTiles: BoardTile[] = [
  {
    id: 0,
    name: 'Investment Bank',
    zone: 'Bangsaen + Nong Mon',
    category: 'start',
    description: 'Starting corner and investment hub for every player.',
  },
  {
    id: 1,
    name: 'Bangsaen Fish Market',
    zone: 'Bangsaen + Nong Mon',
    category: 'market',
    description: 'Japanese-style seafood market with strong food business potential.',
    landPrice: 850000,
  },
  {
    id: 2,
    name: 'Khao Sam Muk Viewpoint',
    zone: 'Bangsaen + Nong Mon',
    category: 'viewpoint',
    description: 'Hilltop viewpoint with local monkeys, cafes, and Bangsaen sea views.',
    landPrice: 800000,
  },
  {
    id: 3,
    name: 'Wonnapha Beach',
    zone: 'Bangsaen + Nong Mon',
    category: 'beach',
    description: 'Evening street food and beach hangout area popular with younger crowds.',
    landPrice: 900000,
  },
  {
    id: 4,
    name: 'Chonlamakwithi Bridge',
    zone: 'Bangsaen + Nong Mon',
    category: 'road',
    description: 'Scenic seaside road and bridge route for coastal traffic and tourism.',
    landPrice: 750000,
  },
  {
    id: 5,
    name: 'Political Event',
    zone: 'Bangsaen + Nong Mon',
    category: 'politics',
    description: 'Board-wide political or public event that can affect every player.',
  },
  {
    id: 6,
    name: 'Nong Mon Market 1',
    zone: 'Bangsaen + Nong Mon',
    category: 'market',
    description: 'Local souvenir and food market area, first section.',
    landPrice: 850000,
  },
  {
    id: 7,
    name: 'Nong Mon Market 2',
    zone: 'Bangsaen + Nong Mon',
    category: 'market',
    description: 'Local souvenir and food market area, second section.',
    landPrice: 850000,
  },
  {
    id: 8,
    name: 'Bangsaen Beach 1',
    zone: 'Bangsaen + Nong Mon',
    category: 'beach',
    description: 'Main beachfront land, first section.',
    landPrice: 1000000,
  },
  {
    id: 9,
    name: 'Bangsaen Beach 2',
    zone: 'Bangsaen + Nong Mon',
    category: 'beach',
    description: 'Main beachfront land, premium section of this zone.',
    landPrice: 1100000,
  },
  {
    id: 10,
    name: 'Burapha University',
    zone: 'Bangsaen + Nong Mon',
    category: 'education',
    description: 'Major university corner tile and student economy anchor.',
  },
  {
    id: 11,
    name: 'Bang Phra Reservoir',
    zone: 'Sriracha + Laem Chabang',
    category: 'viewpoint',
    description: 'Large reservoir area for nature, exercise, and weekend traffic.',
    landPrice: 1100000,
  },
  {
    id: 12,
    name: 'Sriracha Tiger Zoo',
    zone: 'Sriracha + Laem Chabang',
    category: 'wildlife',
    description: 'Former Sriracha landmark area with strong family tourism value.',
    landPrice: 1200000,
  },
  {
    id: 13,
    name: 'Koh Loi Health Park',
    zone: 'Sriracha + Laem Chabang',
    category: 'viewpoint',
    description: 'Seaside health park and local leisure area near Koh Loi.',
    landPrice: 1150000,
  },
  {
    id: 14,
    name: 'J-Park Nihon Mura',
    zone: 'Sriracha + Laem Chabang',
    category: 'market',
    description: 'Japanese-style community mall and lifestyle spot in Sriracha.',
    landPrice: 1400000,
  },
  {
    id: 15,
    name: 'Central Sriracha',
    zone: 'Sriracha + Laem Chabang',
    category: 'mall',
    description: 'Major shopping mall and commercial anchor for Sriracha.',
    landPrice: 1800000,
  },
  {
    id: 16,
    name: 'Koh Sichang',
    zone: 'Sriracha + Laem Chabang',
    category: 'island',
    description: 'Island destination connected to Sriracha tourism and ferry traffic.',
    landPrice: 1350000,
  },
  {
    id: 17,
    name: 'Khao Kheow Open Zoo',
    zone: 'Sriracha + Laem Chabang',
    category: 'wildlife',
    description: 'Super landmark wildlife attraction with high tourism draw.',
    landPrice: 1700000,
  },
  {
    id: 18,
    name: 'Laem Chabang Industrial Estate 1',
    zone: 'Sriracha + Laem Chabang',
    category: 'industrial',
    description: 'Industrial estate area tied to factories, jobs, and regional logistics.',
    landPrice: 1600000,
  },
  {
    id: 19,
    name: 'Laem Chabang Industrial Estate 2',
    zone: 'Sriracha + Laem Chabang',
    category: 'industrial',
    description: 'Second industrial estate section with stronger production value.',
    landPrice: 1800000,
  },
  {
    id: 20,
    name: 'Chonburi Prison',
    zone: 'Sriracha + Laem Chabang',
    category: 'jail',
    description: 'Corner tile for the Chonburi correctional facility, used as the jail space.',
  },
  {
    id: 21,
    name: 'Amata Castle',
    zone: 'Amata City + Phan Thong',
    category: 'landmark',
    description: 'Iconic landmark for the Amata industrial area.',
    landPrice: 1500000,
  },
  {
    id: 22,
    name: 'Ninja Amata Market',
    zone: 'Amata City + Phan Thong',
    category: 'market',
    description: 'Large worker and local market tied to the industrial economy.',
    landPrice: 1600000,
  },
  {
    id: 23,
    name: 'Pinthong Industrial Area 1',
    zone: 'Amata City + Phan Thong',
    category: 'industrial',
    description: 'Industrial zone near the Chonburi manufacturing corridor, first section.',
    landPrice: 1800000,
  },
  {
    id: 24,
    name: 'Pinthong Industrial Area 2',
    zone: 'Amata City + Phan Thong',
    category: 'industrial',
    description: 'Industrial zone near the Chonburi manufacturing corridor, second section.',
    landPrice: 1900000,
  },
  {
    id: 25,
    name: 'Global Tech Factory Zone 1',
    zone: 'Amata City + Phan Thong',
    category: 'industrial',
    description: 'Multinational technology factory area with high production value.',
    landPrice: 2200000,
  },
  {
    id: 26,
    name: 'Global Tech Factory Zone 2',
    zone: 'Amata City + Phan Thong',
    category: 'industrial',
    description: 'Second multinational technology factory area with strong rental potential.',
    landPrice: 2300000,
  },
  {
    id: 27,
    name: 'Amata City Chonburi 1',
    zone: 'Amata City + Phan Thong',
    category: 'industrial',
    description: 'Major industrial estate land, first section.',
    landPrice: 2400000,
  },
  {
    id: 28,
    name: 'Amata City Chonburi 2',
    zone: 'Amata City + Phan Thong',
    category: 'industrial',
    description: 'Major industrial estate land, second section.',
    landPrice: 2500000,
  },
  {
    id: 29,
    name: 'Amata City Chonburi 3',
    zone: 'Amata City + Phan Thong',
    category: 'industrial',
    description: 'Premium industrial estate land and strongest section of this zone.',
    landPrice: 2800000,
  },
  {
    id: 30,
    name: 'Local Power Broker',
    zone: 'Amata City + Phan Thong',
    category: 'influence',
    description: 'Corner tile for influential local forces that can disrupt business plans.',
  },
  {
    id: 31,
    name: 'Lan Pho Naklua Market',
    zone: 'Pattaya',
    category: 'market',
    description: 'Seafood market area in Naklua with strong local trading potential.',
    landPrice: 2000000,
  },
  {
    id: 32,
    name: 'Pattaya Floating Market',
    zone: 'Pattaya',
    category: 'market',
    description: 'Tourist market and cultural shopping destination.',
    landPrice: 2200000,
  },
  {
    id: 33,
    name: 'Tiffany Show',
    zone: 'Pattaya',
    category: 'show',
    description: 'Famous stage show and entertainment landmark in Pattaya.',
    landPrice: 2600000,
  },
  {
    id: 34,
    name: 'Jomtien Beach',
    zone: 'Pattaya',
    category: 'beach',
    description: 'Major beach zone for tourism, restaurants, and long-stay visitors.',
    landPrice: 2800000,
  },
  {
    id: 35,
    name: 'Sanctuary of Truth',
    zone: 'Pattaya',
    category: 'landmark',
    description: 'Iconic cultural landmark with high tourism draw.',
    landPrice: 3000000,
  },
  {
    id: 36,
    name: 'Nong Nooch Garden',
    zone: 'Pattaya',
    category: 'themepark',
    description: 'Large garden and attraction complex with strong visitor volume.',
    landPrice: 3200000,
  },
  {
    id: 37,
    name: 'Columbia Pictures Aquaverse',
    zone: 'Pattaya',
    category: 'themepark',
    description: 'Movie-themed water park attraction near Pattaya.',
    landPrice: 3400000,
  },
  {
    id: 38,
    name: 'Koh Larn',
    zone: 'Pattaya',
    category: 'island',
    description: 'Island tourism destination connected to Pattaya travel routes.',
    landPrice: 3600000,
  },
  {
    id: 39,
    name: 'Walking Street Pattaya',
    zone: 'Pattaya',
    category: 'nightlife',
    description: 'High-traffic nightlife district with premium commercial value.',
    landPrice: 4000000,
  },
]
