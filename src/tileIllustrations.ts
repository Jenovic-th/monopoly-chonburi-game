import { boardTiles, type BoardTile } from './boardData'

export type TileVisualInfo = {
  tileId: number
  bannerImage: string
  icon: string
  themeGradient: string
  accentColor: string
  tagTh: string
  badgeLabel: string
  subtitleTh: string
  tierIcons: [string, string, string] // Small, Medium, Large tier icons
}

// Zone Background Images
const ZONE_IMAGES: Record<string, string> = {
  'Bangsaen + Nong Mon': '/assets/tiles/zone_bangsaen.jpg',
  'Sriracha + Laem Chabang': '/assets/tiles/zone_sriracha.jpg',
  'Amata City + Phan Thong': '/assets/tiles/zone_amata.jpg',
  'Pattaya': '/assets/tiles/zone_pattaya.jpg',
}

// Zone Gradient Themes
const ZONE_GRADIENTS: Record<string, string> = {
  'Bangsaen + Nong Mon': 'linear-gradient(135deg, rgba(6, 182, 212, 0.92), rgba(14, 116, 144, 0.95))',
  'Sriracha + Laem Chabang': 'linear-gradient(135deg, rgba(59, 130, 246, 0.92), rgba(30, 58, 138, 0.95))',
  'Amata City + Phan Thong': 'linear-gradient(135deg, rgba(16, 185, 129, 0.92), rgba(6, 95, 70, 0.95))',
  'Pattaya': 'linear-gradient(135deg, rgba(245, 158, 11, 0.92), rgba(180, 83, 9, 0.95))',
}

const ZONE_ACCENTS: Record<string, string> = {
  'Bangsaen + Nong Mon': '#06b6d4',
  'Sriracha + Laem Chabang': '#3b82f6',
  'Amata City + Phan Thong': '#10b981',
  'Pattaya': '#f59e0b',
}

// 40 Tiles Accurate Local Chonburi Context Metadata
const TILE_CONTEXT_META: Record<
  number,
  {
    icon: string
    tagTh: string
    badgeLabel: string
    subtitleTh: string
    tierIcons: [string, string, string]
  }
> = {
  0: {
    icon: '🏦',
    tagTh: 'ศูนย์การเงินชลบุรี',
    badgeLabel: 'Investment Corner',
    subtitleTh: 'จุดเริ่มต้นและธนาคารเพื่อการลงทุน',
    tierIcons: ['🪙', '💳', '🏛️'],
  },
  1: {
    icon: '🐟',
    tagTh: 'ตลาดปลาญี่ปุ่นชลบุรี',
    badgeLabel: 'Japanese Market',
    subtitleTh: 'ตลาดปลาและอาหารทะเลสไตล์ญี่ปุ่นยอดฮิต',
    tierIcons: ['🍣', '🍱', '🏪'],
  },
  2: {
    icon: '🐒',
    tagTh: 'จุดชมวิวแลนด์มาร์ก',
    badgeLabel: 'Monkey Mountain',
    subtitleTh: 'เขาสามมุข จุดชมวิวทะเลบางแสนและฝูงลิง',
    tierIcons: ['🥥', '☕', '🔭'],
  },
  3: {
    icon: '🏖️',
    tagTh: 'หาดแฮงก์เอาต์ยามเย็น',
    badgeLabel: 'Twilight Beach',
    subtitleTh: 'หาดวอนนภา สตรีทฟู้ดริมทะเลและจุดนัดพบวัยรุ่น',
    tierIcons: ['🍢', '🍹', '🌴'],
  },
  4: {
    icon: '🌉',
    tagTh: 'สะพานเลียบทะเลชลบุรี',
    badgeLabel: 'Coastal Bridge',
    subtitleTh: 'สะพานชลมารควิถี ถนนเลียบชายทะเลชลบุรี',
    tierIcons: ['🚲', '📸', '🛣️'],
  },
  5: {
    icon: '📢',
    tagTh: 'เวทีสาธารณะชลบุรี',
    badgeLabel: 'Provincial Event',
    subtitleTh: 'เหตุการณ์ทางการเมืองและมาตรการกระตุ้นเศรษฐกิจ',
    tierIcons: ['🗞️', '🎤', '🏛️'],
  },
  6: {
    icon: '🎋',
    tagTh: 'ตลาดของฝากเลื่องชื่อ',
    badgeLabel: 'Sticky Rice Market',
    subtitleTh: 'ตลาดหนองมน แหล่งข้าวหลามและของฝากชลบุรี',
    tierIcons: ['🎋', '🎁', '🏬'],
  },
  7: {
    icon: '⛱️',
    tagTh: 'หาดประวัติศาสตร์บางแสน',
    badgeLabel: 'Heritage Beach',
    subtitleTh: 'หาดบางแสน เตียงผ้าใบและกิจกรรมริมทะเลคลาสสิก',
    tierIcons: ['🤿', '🏄', '🏖️'],
  },
  8: {
    icon: '🌊',
    tagTh: 'ลานกิจกรรมแหลมแท่น',
    badgeLabel: 'Cape Square',
    subtitleTh: 'แหลมแท่น จุดชมพระอาทิตย์ตกและถนนคนเดิน',
    tierIcons: ['🍢', '🍧', '🎪'],
  },
  9: {
    icon: '🦪',
    tagTh: 'ตลาดหินครกและหอยสด',
    badgeLabel: 'Stone & Oyster Pier',
    subtitleTh: 'ตลาดอ่างศิลา ครกหินชื่อดังและฟาร์มหอยนางรม',
    tierIcons: ['🦪', '🗿', '⚓'],
  },
  10: {
    icon: '🎓',
    tagTh: 'สถาบันการศึกษาภาคตะวันออก',
    badgeLabel: 'University Campus',
    subtitleTh: 'มหาวิทยาลัยบูรพา ศูนย์กลางการเรียนรู้และวิจัย',
    tierIcons: ['📚', '🎓', '🏛️'],
  },
  11: {
    icon: '🐢',
    tagTh: 'เกาะและศูนย์อนุรักษ์เต่า',
    badgeLabel: 'Sea Bridge Island',
    subtitleTh: 'เกาะลอย ศรีราชา สะพานทอดยาวสู่เกาะกลางทะเล',
    tierIcons: ['🥥', '🚤', '🏯'],
  },
  12: {
    icon: '🚢',
    tagTh: 'เกาะประวัติศาสตร์อ่าวไทย',
    badgeLabel: 'Historic Island',
    subtitleTh: 'เกาะสีชัง พระจุฑาธุชราชฐานและท่าเรือท่องเที่ยว',
    tierIcons: ['🚲', '🏡', '🛳️'],
  },
  13: {
    icon: '⛩️',
    tagTh: 'หมู่บ้านญี่ปุ่นศรีราชา',
    badgeLabel: 'Little Osaka',
    subtitleTh: 'J-Park ศรีราชา ชุมชนธุรกิจและวัฒนธรรมญี่ปุ่น',
    tierIcons: ['🍡', '🍜', '⛩️'],
  },
  14: {
    icon: '🐯',
    tagTh: 'สวนสัตว์และธีมปาร์ค',
    badgeLabel: 'Safari & Wildlife',
    subtitleTh: 'สวนเสือศรีราชา แหล่งท่องเที่ยวครอบครัวและโชว์สัตว์',
    tierIcons: ['🧸', '🍧', '🐅'],
  },
  15: {
    icon: '🛍️',
    tagTh: 'ไลฟ์สไตล์มอลล์ศรีราชา',
    badgeLabel: 'Eco Shopping Hub',
    subtitleTh: 'เซ็นทรัล ศรีราชา ศูนย์การค้าริมทะเลสไตล์รักษ์โลก',
    tierIcons: ['👗', '☕', '🏢'],
  },
  16: {
    icon: '🏬',
    tagTh: 'ย่านค้าปลีกใจกลางเมือง',
    badgeLabel: 'Downtown Retail',
    subtitleTh: 'โรบินสัน ศรีราชา ย่านการค้าและคอมมูนิตี้คนเมือง',
    tierIcons: ['🛍️', '🍽️', '🏬'],
  },
  17: {
    icon: '🏪',
    tagTh: 'ถนนเศรษฐกิจศรีราชา',
    badgeLabel: 'Commercial Street',
    subtitleTh: 'ถนนสุรศักดิ์ แหล่งตึกแถวพาณิชย์และธุรกิจบริการ',
    tierIcons: ['📦', '💼', '🏢'],
  },
  18: {
    icon: '🌸',
    tagTh: 'อ่างเก็บน้ำชมดอกซากุระ',
    badgeLabel: 'Lake & Blossom',
    subtitleTh: 'อ่างเก็บน้ำบางพระ จุดปั่นจักรยานและชมธรรมชาติ',
    tierIcons: ['🚲', '☕', '🏕️'],
  },
  19: {
    icon: '🏗️',
    tagTh: 'ท่าเรือน้ำลึกระดับโลก',
    badgeLabel: 'Deep Sea Port',
    subtitleTh: 'ท่าเรือแหลมฉบัง ประตูนำเข้า-ส่งออกหลักของประเทศ',
    tierIcons: ['📦', '🚚', '🚢'],
  },
  20: {
    icon: '🔒',
    tagTh: 'เรือนจำพิเศษชลบุรี',
    badgeLabel: 'Prison & Craft Bazaar',
    subtitleTh: 'เรือนจำชลบุรี แหล่งฝึกอาชีพและตลาดสินค้าหัตถกรรม',
    tierIcons: ['🧵', '🎟️', '🔒'],
  },
  21: {
    icon: '🏭',
    tagTh: 'เมืองอุตสาหกรรมอัจฉริยะ',
    badgeLabel: 'Smart Industrial Park',
    subtitleTh: 'นิคมอมตะซิตี้ ศูนย์รวมโรงงานไฮเทคและยานยนต์',
    tierIcons: ['⚙️', '🔧', '🏭'],
  },
  22: {
    icon: '🚛',
    tagTh: 'ศูนย์กระจายสินค้าภาคตะวันออก',
    badgeLabel: 'Logistics Center',
    subtitleTh: 'คลังสินค้าพานทอง ฮับคลังสินค้าและระบบขนส่งด่วน',
    tierIcons: ['📦', '🚛', '🏬'],
  },
  23: {
    icon: '🏢',
    tagTh: 'ตึกแถวพาณิชย์นิคมอมตะ',
    badgeLabel: 'Factory Shophouses',
    subtitleTh: 'อาคารพาณิชย์และร้านค้าบริการรอบนิคมอุตสาหกรรม',
    tierIcons: ['🛒', '🍛', '🏢'],
  },
  24: {
    icon: '🍜',
    tagTh: 'ตลาดใหญ่คนทำงานอมตะ',
    badgeLabel: 'Worker Mega Market',
    subtitleTh: 'ตลาดดอนหัวฬ่อ แหล่งสตรีทฟู้ดและของใช้แรงงาน',
    tierIcons: ['🍲', '🧋', '🎪'],
  },
  25: {
    icon: '🛣️',
    tagTh: 'ชุมทางคมนาคมภาคตะวันออก',
    badgeLabel: 'Highway Junction',
    subtitleTh: 'ทางแยกต่างระดับพานทอง เชื่อมต่อกรุงเทพฯ-ระยอง',
    tierIcons: ['⛽', '🏪', '🛣️'],
  },
  26: {
    icon: '☕',
    tagTh: 'จุดพักรถมอเตอร์เวย์',
    badgeLabel: 'Motorway Rest Stop',
    subtitleTh: 'จุดพักรถมอเตอร์เวย์ ศูนย์รวมร้านอาหารและของฝาก 24 ชม.',
    tierIcons: ['🥤', '🍔', '🏪'],
  },
  27: {
    icon: '🛒',
    tagTh: 'ย่านการค้าชุมชนบ้านเก่า',
    badgeLabel: 'Industrial Retail',
    subtitleTh: 'ย่านการค้าบ้านเก่า ศูนย์รวมร้านค้าชุมชนคนทำงาน',
    tierIcons: ['🥬', '🏬', '🏢'],
  },
  28: {
    icon: '🏰',
    tagTh: 'ปราสาทสถาปัตยกรรมอมตะ',
    badgeLabel: 'Modern Castle Landmark',
    subtitleTh: 'ปราสาทอมตะ สถาปัตยกรรมโดดเด่นกลางเมืองอุตสาหกรรม',
    tierIcons: ['🖼️', '☕', '🏰'],
  },
  29: {
    icon: '🚣',
    tagTh: 'วิถีชีวิตริมคลองพานทอง',
    badgeLabel: 'Canal Waterfront',
    subtitleTh: 'ริมน้ำพานทอง ตลาดริมคลองและวิถีชุมชนดั้งเดิม',
    tierIcons: ['🥥', '🛶', '🏡'],
  },
  30: {
    icon: '💼',
    tagTh: 'สโมสรผู้มีอิทธิพลท้องถิ่น',
    badgeLabel: 'Power Broker Club',
    subtitleTh: 'ห้องลับผู้มีอิทธิพล ซื้อขายเส้นสายและการันตีความคุ้มครอง',
    tierIcons: ['🛡️', '📜', '💼'],
  },
  31: {
    icon: '🌴',
    tagTh: 'หาดพัทยาเหนือรีสอร์ต',
    badgeLabel: 'North Pattaya Bay',
    subtitleTh: 'หาดพัทยาเหนือ แหล่งพักผ่อนหรูริมหาดและกิจกรรมทางน้ำ',
    tierIcons: ['🍹', '🏄', '🏨'],
  },
  32: {
    icon: '🍸',
    tagTh: 'ถนนคนเดินระดับโลก',
    badgeLabel: 'Neon Nightlife Hub',
    subtitleTh: 'วอล์กกิ้งสตรีท พัทยา ศูนย์รวมสถานบันเทิงและแสงสียามค่ำคืน',
    tierIcons: ['🍸', '🎵', '🏙️'],
  },
  33: {
    icon: '⛵',
    tagTh: 'ท่าเรือหลักสู่เกาะล้าน',
    badgeLabel: 'Island Gateway Pier',
    subtitleTh: 'ท่าเรือแหลมบาลีฮาย ประตูสู่เกาะล้านและสปีดโบ๊ทอ่าวไทย',
    tierIcons: ['🎫', '🚤', '⚓'],
  },
  34: {
    icon: '🏄',
    tagTh: 'หาดทรายยาวและกีฬาทางน้ำ',
    badgeLabel: 'Windsurf Beach',
    subtitleTh: 'หาดจอมเทียน ศูนย์รวมกีฬาทางน้ำและร้านอาหารซีฟู้ด',
    tierIcons: ['🤿', '🍹', '🏖️'],
  },
  35: {
    icon: '🛶',
    tagTh: 'ตลาดน้ำสี่ภาคพัทยา',
    badgeLabel: 'Floating Heritage Market',
    subtitleTh: 'ตลาดน้ำ 4 ภาค พัทยา ล่องเรือไม้ชมวิถีไทยและชิมของอร่อย',
    tierIcons: ['🍡', '🛶', '🏬'],
  },
  36: {
    icon: '🏛️',
    tagTh: 'มหาปราสาทไม้แกะสลักริมทะเล',
    badgeLabel: 'Sanctuary of Truth',
    subtitleTh: 'ปราสาทสัจธรรม สถาปัตยกรรมไม้แกะสลักหนึ่งเดียวในโลก',
    tierIcons: ['🪵', '📸', '🏛️'],
  },
  37: {
    icon: '🌊',
    tagTh: 'สวนน้ำธีมภาพยนตร์ระดับโลก',
    badgeLabel: 'Movie Theme Waterpark',
    subtitleTh: 'โคลัมเบีย พิคเจอร์ส อควาเวิร์ส สวนน้ำและเครื่องเล่นระดับโลก',
    tierIcons: ['🍧', '🎢', '🌊'],
  },
  38: {
    icon: '🎭',
    tagTh: 'โรงละครคาบาเรต์โชว์ระดับตำนาน',
    badgeLabel: 'Grand Cabaret Theater',
    subtitleTh: 'ทิฟฟานี่โชว์ พัทยา การแสดงคาบาเรต์ชื่อก้องโลก',
    tierIcons: ['🎟️', '🥂', '🎭'],
  },
  39: {
    icon: '🏨',
    tagTh: 'ย่านโรงแรมห้าดาวพัทยาใต้',
    badgeLabel: 'Ultra Luxury Strip',
    subtitleTh: 'ย่านโรงแรมหรูพัทยาใต้ แหล่งรวมโรงแรม 5 ดาวและเพนต์เฮาส์',
    tierIcons: ['🍸', '🛎️', '🏨'],
  },
}

export function getTileVisualDetails(tileId: number): TileVisualInfo {
  const tile: BoardTile = boardTiles[tileId] ?? boardTiles[0]
  const bannerImage = ZONE_IMAGES[tile.zone] ?? '/assets/tiles/zone_bangsaen.jpg'
  const themeGradient = ZONE_GRADIENTS[tile.zone] ?? ZONE_GRADIENTS['Bangsaen + Nong Mon']
  const accentColor = ZONE_ACCENTS[tile.zone] ?? '#06b6d4'
  const meta = TILE_CONTEXT_META[tileId] ?? {
    icon: '📍',
    tagTh: tile.zoneTh,
    badgeLabel: tile.category.toUpperCase(),
    subtitleTh: tile.descriptionTh,
    tierIcons: ['🏪', '🏬', '🏢'],
  }

  return {
    tileId,
    bannerImage,
    icon: meta.icon,
    themeGradient,
    accentColor,
    tagTh: meta.tagTh,
    badgeLabel: meta.badgeLabel,
    subtitleTh: meta.subtitleTh,
    tierIcons: meta.tierIcons,
  }
}
