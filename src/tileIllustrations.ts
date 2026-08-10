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

// Specific Landmark Overrides
const LANDMARK_SPECIFIC_IMAGES: Record<number, string> = {
  0: '/assets/tiles/investment_bank.jpg',
  10: '/assets/tiles/burapha_university.jpg',
  17: '/assets/tiles/khao_kheow_zoo.jpg',
  35: '/assets/tiles/sanctuary_of_truth.jpg',
  36: '/assets/tiles/nong_nooch_garden.jpg',
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

// 40 Tiles Accurate Local Chonburi Context Metadata (Exact 1:1 Match with boardData.ts)
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
    tagTh: 'ธนาคารเพื่อการลงทุน',
    badgeLabel: 'Investment Corner',
    subtitleTh: 'จุดเริ่มต้นและศูนย์กลางการลงทุนสำหรับผู้เล่นทุกคน',
    tierIcons: ['🪙', '💳', '🏛️'],
  },
  1: {
    icon: '🐟',
    tagTh: 'ตลาดปลาบางแสน',
    badgeLabel: 'Seafood Market',
    subtitleTh: 'ตลาดอาหารทะเลสไตล์ญี่ปุ่นที่มีศักยภาพสูงสำหรับธุรกิจอาหาร',
    tierIcons: ['🍣', '🍱', '🏪'],
  },
  2: {
    icon: '🐒',
    tagTh: 'จุดชมวิวเขาสามมุข',
    badgeLabel: 'Khao Sam Muk',
    subtitleTh: 'จุดชมวิวบนยอดเขาที่มีลิงประจำถิ่น คาเฟ่ และวิวทะเลบางแสน',
    tierIcons: ['🥥', '☕', '🔭'],
  },
  3: {
    icon: '🏖️',
    tagTh: 'หาดวอนนภา',
    badgeLabel: 'Wonnapha Beach',
    subtitleTh: 'แหล่งสตรีทฟู้ดยามเย็นและจุดแฮงก์เอาต์ริมหาดที่เป็นที่นิยมของวัยรุ่น',
    tierIcons: ['🍢', '🍹', '🌴'],
  },
  4: {
    icon: '🌉',
    tagTh: 'สะพานชลมารควิถี',
    badgeLabel: 'Coastal Bridge',
    subtitleTh: 'สะพานและถนนเลียบชายทะเลที่สวยงามสำหรับสัญจรและท่องเที่ยวชายฝั่ง',
    tierIcons: ['🚲', '📸', '🛣️'],
  },
  5: {
    icon: '📢',
    tagTh: 'เหตุการณ์ทางการเมือง',
    badgeLabel: 'Political Event',
    subtitleTh: 'เหตุการณ์สาธารณะหรือการเมืองระดับจังหวัดที่ส่งผลต่อผู้เล่นทุกคน',
    tierIcons: ['🗞️', '🎤', '🏛️'],
  },
  6: {
    icon: '🎋',
    tagTh: 'ตลาดหนองมน 1',
    badgeLabel: 'Nong Mon Market 1',
    subtitleTh: 'แหล่งรวมของฝากและข้าวหลามหนองมนเลื่องชื่อ โซนที่หนึ่ง',
    tierIcons: ['🎋', '🎁', '🏬'],
  },
  7: {
    icon: '🎋',
    tagTh: 'ตลาดหนองมน 2',
    badgeLabel: 'Nong Mon Market 2',
    subtitleTh: 'แหล่งรวมของฝากและข้าวหลามหนองมนเลื่องชื่อ โซนที่สอง',
    tierIcons: ['🎋', '🎁', '🏬'],
  },
  8: {
    icon: '⛱️',
    tagTh: 'ชายหาดบางแสน 1',
    badgeLabel: 'Bangsaen Beach 1',
    subtitleTh: 'ที่ดินริมชายหาดบางแสน เตียงผ้าใบและกิจกรรมริมทะเล โซนที่หนึ่ง',
    tierIcons: ['🤿', '🏄', '🏖️'],
  },
  9: {
    icon: '⛱️',
    tagTh: 'ชายหาดบางแสน 2',
    badgeLabel: 'Bangsaen Beach 2',
    subtitleTh: 'ที่ดินริมชายหาดบางแสน ทำเลทองยอดนิยม โซนพรีเมียม',
    tierIcons: ['🤿', '🏄', '🏖️'],
  },
  10: {
    icon: '🎓',
    tagTh: 'มหาวิทยาลัยบูรพา',
    badgeLabel: 'Burapha University',
    subtitleTh: 'มหาวิทยาลัยหลักภาคตะวันออก ศูนย์กลางการเรียนรู้และเศรษฐกิจนิสิต',
    tierIcons: ['📚', '🎓', '🏛️'],
  },
  11: {
    icon: '🌸',
    tagTh: 'อ่างเก็บน้ำบางพระ',
    badgeLabel: 'Bang Phra Reservoir',
    subtitleTh: 'อ่างเก็บน้ำขนาดใหญ่สำหรับพักผ่อนธรรมชาติ ออกกำลังกาย และชมดอกไม้',
    tierIcons: ['🚲', '☕', '🏕️'],
  },
  12: {
    icon: '🐯',
    tagTh: 'สวนเสือศรีราชา',
    badgeLabel: 'Sriracha Tiger Zoo',
    subtitleTh: 'อดีตแลนด์มาร์กสำคัญของศรีราชาที่มีคุณค่าด้านการท่องเที่ยวสำหรับครอบครัว',
    tierIcons: ['🧸', '🍧', '🐅'],
  },
  13: {
    icon: '🐢',
    tagTh: 'สวนสุขภาพเกาะลอย',
    badgeLabel: 'Koh Loi Health Park',
    subtitleTh: 'สวนสุขภาพริมทะเลและแหล่งพักผ่อนหย่อนใจยอดนิยมใกล้เกาะลอย',
    tierIcons: ['🥥', '🚤', '🏯'],
  },
  14: {
    icon: '⛩️',
    tagTh: 'เจพาร์ค นิฮอน มูระ',
    badgeLabel: 'J-Park Nihon Mura',
    subtitleTh: 'คอมมูนิตี้มอลล์สไตล์ญี่ปุ่นและจุดนัดพบไลฟ์สไตล์ในศรีราชา',
    tierIcons: ['🍡', '🍜', '⛩️'],
  },
  15: {
    icon: '🛍️',
    tagTh: 'เซ็นทรัล ศรีราชา',
    badgeLabel: 'Central Sriracha',
    subtitleTh: 'ศูนย์การค้าขนาดใหญ่และแกนกลางพาณิชย์ของศรีราชา',
    tierIcons: ['👗', '☕', '🏢'],
  },
  16: {
    icon: '🚢',
    tagTh: 'เกาะสีชัง',
    badgeLabel: 'Koh Sichang Island',
    subtitleTh: 'แหล่งท่องเที่ยวเกาะยอดนิยมที่เชื่อมต่อกับการท่องเที่ยวและท่าเรือศรีราชา',
    tierIcons: ['🚲', '🏡', '🛳️'],
  },
  17: {
    icon: '🦛',
    tagTh: 'สวนสัตว์เปิดเขาเขียว',
    badgeLabel: 'Khao Kheow Open Zoo',
    subtitleTh: 'สวนสัตว์เปิดและแลนด์มาร์กระดับประเทศ ดึงดูดนักท่องเที่ยวสูงมาก',
    tierIcons: ['🦛', '🎫', '🦒'],
  },
  18: {
    icon: '🏗️',
    tagTh: 'นิคมอุตสาหกรรมแหลมฉบัง 1',
    badgeLabel: 'Laem Chabang Estate 1',
    subtitleTh: 'นิคมอุตสาหกรรมขนาดใหญ่ที่เชื่อมโยงกับโรงงานและโลจิสติกส์ โซนแรก',
    tierIcons: ['📦', '🚚', '🏭'],
  },
  19: {
    icon: '🚢',
    tagTh: 'นิคมอุตสาหกรรมแหลมฉบัง 2',
    badgeLabel: 'Laem Chabang Estate 2',
    subtitleTh: 'นิคมอุตสาหกรรมแหลมฉบังส่วนที่สอง มีมูลค่าการผลิตและขนส่งสูงกว่า',
    tierIcons: ['📦', '🚚', '🚢'],
  },
  20: {
    icon: '🔒',
    tagTh: 'เรือนจำชลบุรี',
    badgeLabel: 'Chonburi Prison',
    subtitleTh: 'เรือนจำชลบุรี ใช้เป็นช่องขังและพื้นที่พิเศษสำหรับคดี',
    tierIcons: ['🧵', '🎟️', '🔒'],
  },
  21: {
    icon: '🏰',
    tagTh: 'ปราสาทอมตะ',
    badgeLabel: 'Amata Castle',
    subtitleTh: 'แลนด์มาร์กที่เป็นสัญลักษณ์อันโดดเด่นของนิคมอุตสาหกรรมอมตะ',
    tierIcons: ['🖼️', '☕', '🏰'],
  },
  22: {
    icon: '🍜',
    tagTh: 'ตลาดนินจาอมตะ',
    badgeLabel: 'Ninja Amata Market',
    subtitleTh: 'ตลาดนัดคนทำงานขนาดใหญ่ที่ผูกกับเศรษฐกิจอุตสาหกรรมในพื้นที่',
    tierIcons: ['🍲', '🧋', '🎪'],
  },
  23: {
    icon: '🏭',
    tagTh: 'นิคมอุตสาหกรรมปิ่นทอง 1',
    badgeLabel: 'Pinthong Industrial 1',
    subtitleTh: 'เขตอุตสาหกรรมในระเบียงการผลิตชลบุรี โซนแรก',
    tierIcons: ['⚙️', '🔧', '🏭'],
  },
  24: {
    icon: '🏭',
    tagTh: 'นิคมอุตสาหกรรมปิ่นทอง 2',
    badgeLabel: 'Pinthong Industrial 2',
    subtitleTh: 'เขตอุตสาหกรรมในระเบียงการผลิตชลบุรี โซนที่สอง',
    tierIcons: ['⚙️', '🔧', '🏭'],
  },
  25: {
    icon: '🤖',
    tagTh: 'เขตโรงงานเทคโนโลยีระดับโลก 1',
    badgeLabel: 'Global Tech Zone 1',
    subtitleTh: 'แหล่งโรงงานเทคโนโลยีข้ามชาติที่มีมูลค่าการผลิตและการลงทุนสูง',
    tierIcons: ['🤖', '💻', '🏢'],
  },
  26: {
    icon: '🤖',
    tagTh: 'เขตโรงงานเทคโนโลยีระดับโลก 2',
    badgeLabel: 'Global Tech Zone 2',
    subtitleTh: 'แหล่งโรงงานเทคโนโลยีข้ามชาติส่วนที่สอง มีศักยภาพค่าเช่าที่แข็งแกร่ง',
    tierIcons: ['🤖', '💻', '🏢'],
  },
  27: {
    icon: '🏢',
    tagTh: 'อมตะซิตี้ ชลบุรี 1',
    badgeLabel: 'Amata City Chonburi 1',
    subtitleTh: 'ที่ดินนิคมอุตสาหกรรมหลักเฟสแรก',
    tierIcons: ['📦', '💼', '🏢'],
  },
  28: {
    icon: '🏢',
    tagTh: 'อมตะซิตี้ ชลบุรี 2',
    badgeLabel: 'Amata City Chonburi 2',
    subtitleTh: 'ที่ดินนิคมอุตสาหกรรมหลักเฟสสอง',
    tierIcons: ['📦', '💼', '🏢'],
  },
  29: {
    icon: '🏢',
    tagTh: 'อมตะซิตี้ ชลบุรี 3',
    badgeLabel: 'Amata City Chonburi 3',
    subtitleTh: 'ที่ดินนิคมอุตสาหกรรมเกรดพรีเมียมและทำเลดีที่สุดในโซนนี้',
    tierIcons: ['📦', '💼', '🏢'],
  },
  30: {
    icon: '💼',
    tagTh: 'ผู้มีอิทธิพลท้องถิ่น',
    badgeLabel: 'Local Power Broker',
    subtitleTh: 'ช่องพิเศษของผู้มีอิทธิพลในพื้นที่ สามารถแทรกแซงหรือช่วยเหลือธุรกิจได้',
    tierIcons: ['🛡️', '📜', '💼'],
  },
  31: {
    icon: '🦀',
    tagTh: 'ตลาดลานโพธิ์นาเกลือ',
    badgeLabel: 'Lan Pho Naklua Market',
    subtitleTh: 'ตลาดอาหารทะเลสดในนาเกลือที่มีการค้าคึกคักและยอดนิยมของนักท่องเที่ยว',
    tierIcons: ['🦀', '🦐', '🏪'],
  },
  32: {
    icon: '🛶',
    tagTh: 'ตลาดน้ำสี่ภาคพัทยา',
    badgeLabel: 'Pattaya Floating Market',
    subtitleTh: 'แหล่งท่องเที่ยวเชิงวัฒนธรรมและตลาดน้ำเพื่อการช็อปปิ้งของนักท่องเที่ยว',
    tierIcons: ['🍡', '🛶', '🏬'],
  },
  33: {
    icon: '🎭',
    tagTh: 'ทิฟฟานี่โชว์',
    badgeLabel: 'Tiffany Show',
    subtitleTh: 'คาบาเรต์โชว์ระดับตำนานและแลนด์มาร์กความบันเทิงระดับโลกในพัทยา',
    tierIcons: ['🎟️', '🥂', '🎭'],
  },
  34: {
    icon: '🏄',
    tagTh: 'หาดจอมเทียน',
    badgeLabel: 'Jomtien Beach',
    subtitleTh: 'ชายหาดหลักสำหรับท่องเที่ยว ร้านอาหารริมทะเล และนักท่องเที่ยวพำนักระยะยาว',
    tierIcons: ['🤿', '🍹', '🏖️'],
  },
  35: {
    icon: '🏛️',
    tagTh: 'ปราสาทสัจธรรม',
    badgeLabel: 'Sanctuary of Truth',
    subtitleTh: 'สถาปัตยกรรมไม้แกะสลักอันงดงามและแลนด์มาร์กวัฒนธรรมยอดนิยม',
    tierIcons: ['🪵', '📸', '🏛️'],
  },
  36: {
    icon: '🌴',
    tagTh: 'สวนนงนุช',
    badgeLabel: 'Nong Nooch Garden',
    subtitleTh: 'สวนพฤกษศาสตร์และศูนย์แสดงวัฒนธรรมขนาดใหญ่ที่มีปริมาณนักท่องเที่ยวสูงมาก',
    tierIcons: ['🌺', '🦖', '🎪'],
  },
  37: {
    icon: '🌊',
    tagTh: 'โคลัมเบีย พิคเจอร์ส อควาเวิร์ส',
    badgeLabel: 'Aquaverse Waterpark',
    subtitleTh: 'สวนสนุกและสวนน้ำในธีมภาพยนตร์ฮอลลีวูดแห่งแรกของโลกใกล้พัทยา',
    tierIcons: ['🍧', '🎢', '🌊'],
  },
  38: {
    icon: '⛵',
    tagTh: 'เกาะล้าน',
    badgeLabel: 'Koh Larn Island',
    subtitleTh: 'เกาะท่องเที่ยวชายทะเลสีครามที่มีชื่อเสียงของเมืองพัทยา',
    tierIcons: ['🥥', '🚤', '🏝️'],
  },
  39: {
    icon: '🍸',
    tagTh: 'วอล์กกิ้งสตรีท พัทยา',
    badgeLabel: 'Walking Street Pattaya',
    subtitleTh: 'แหล่งท่องเที่ยวราตรีที่คึกคักที่สุดและมีมูลค่าทางพาณิชย์สูงมากระดับพรีเมียม',
    tierIcons: ['🍸', '🎵', '🏙️'],
  },
}

export function getTileVisualDetails(tileId: number): TileVisualInfo {
  const tile: BoardTile = boardTiles[tileId] ?? boardTiles[0]
  const bannerImage =
    LANDMARK_SPECIFIC_IMAGES[tileId] ??
    ZONE_IMAGES[tile.zone] ??
    '/assets/tiles/zone_bangsaen.jpg'
  const themeGradient = ZONE_GRADIENTS[tile.zone] ?? ZONE_GRADIENTS['Bangsaen + Nong Mon']
  const accentColor = ZONE_ACCENTS[tile.zone] ?? '#06b6d4'
  const meta = TILE_CONTEXT_META[tileId] ?? {
    icon: '📍',
    tagTh: tile.nameTh,
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
