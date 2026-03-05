/**
 * 塔罗牌数据 - 大阿卡纳 22 张
 */

export interface TarotCard {
  id: number
  name: string          // 英文名
  chineseName: string   // 中文名
  emoji: string         // 代表性 emoji
  keywords: string[]    // 关键词
  upright: string       // 正位含义
  reversed: string      // 逆位含义
  element: string       // 对应元素
}

export const majorArcana: TarotCard[] = [
  {
    id: 0,
    name: 'The Fool',
    chineseName: '愚者',
    emoji: '🃏',
    keywords: ['新开始', '冒险', '天真', '自由'],
    upright: '新的开始、冒险精神、无限可能、纯真无畏',
    reversed: '鲁莽行事、缺乏计划、逃避现实、愚蠢决定',
    element: '风'
  },
  {
    id: 1,
    name: 'The Magician',
    chineseName: '魔术师',
    emoji: '🎩',
    keywords: ['创造', '意志力', '技能', '专注'],
    upright: '创造力、意志力、自信、技能娴熟、把握机会',
    reversed: '欺骗、操控、才能浪费、缺乏方向',
    element: '风'
  },
  {
    id: 2,
    name: 'The High Priestess',
    chineseName: '女祭司',
    emoji: '🌙',
    keywords: ['直觉', '神秘', '潜意识', '智慧'],
    upright: '直觉敏锐、内在智慧、神秘力量、静待时机',
    reversed: '忽视直觉、秘密暴露、表面化、内心混乱',
    element: '水'
  },
  {
    id: 3,
    name: 'The Empress',
    chineseName: '女皇',
    emoji: '👑',
    keywords: ['丰饶', '母性', '美丽', '自然'],
    upright: '富足丰饶、创造力、母性光辉、感官享受',
    reversed: '创意受阻、依赖他人、过度放纵、忽视自我',
    element: '土'
  },
  {
    id: 4,
    name: 'The Emperor',
    chineseName: '皇帝',
    emoji: '🏰',
    keywords: ['权威', '结构', '父性', '领导'],
    upright: '权威稳固、领导力、秩序规则、保护力量',
    reversed: '专制独裁、过度控制、缺乏纪律、权力滥用',
    element: '火'
  },
  {
    id: 5,
    name: 'The Hierophant',
    chineseName: '教皇',
    emoji: '⛪',
    keywords: ['传统', '信仰', '教导', '仪式'],
    upright: '传统智慧、精神指引、遵循规则、寻求认同',
    reversed: '打破常规、挑战权威、个人信仰、非传统道路',
    element: '土'
  },
  {
    id: 6,
    name: 'The Lovers',
    chineseName: '恋人',
    emoji: '💕',
    keywords: ['爱情', '选择', '和谐', '价值观'],
    upright: '真挚爱情、重要选择、价值观统一、和谐关系',
    reversed: '关系失衡、错误选择、价值观冲突、不和谐',
    element: '风'
  },
  {
    id: 7,
    name: 'The Chariot',
    chineseName: '战车',
    emoji: '🏎️',
    keywords: ['胜利', '意志', '决心', '控制'],
    upright: '胜利在望、意志坚定、克服困难、自我控制',
    reversed: '失去方向、缺乏控制、挫败感、攻击性',
    element: '水'
  },
  {
    id: 8,
    name: 'Strength',
    chineseName: '力量',
    emoji: '🦁',
    keywords: ['勇气', '耐心', '内在力量', '温柔'],
    upright: '内在力量、勇气坚韧、以柔克刚、自我掌控',
    reversed: '自我怀疑、软弱无力、缺乏勇气、内心恐惧',
    element: '火'
  },
  {
    id: 9,
    name: 'The Hermit',
    chineseName: '隐者',
    emoji: '🏔️',
    keywords: ['独处', '内省', '寻找', '智慧'],
    upright: '内在探索、独处沉思、寻找真理、精神指引',
    reversed: '孤僻封闭、逃避现实、过度孤独、迷失方向',
    element: '土'
  },
  {
    id: 10,
    name: 'Wheel of Fortune',
    chineseName: '命运之轮',
    emoji: '🎡',
    keywords: ['转变', '命运', '周期', '机遇'],
    upright: '命运转折、好运降临、生命周期、把握机遇',
    reversed: '厄运来临、抗拒改变、失控感、错失良机',
    element: '火'
  },
  {
    id: 11,
    name: 'Justice',
    chineseName: '正义',
    emoji: '⚖️',
    keywords: ['公正', '真相', '因果', '平衡'],
    upright: '公正公平、因果报应、真相大白、做出决定',
    reversed: '不公正、逃避责任、偏见、失去平衡',
    element: '风'
  },
  {
    id: 12,
    name: 'The Hanged Man',
    chineseName: '倒吊人',
    emoji: '🙃',
    keywords: ['牺牲', '等待', '新视角', '放手'],
    upright: '换个角度、暂时牺牲、顺其自然、内在转变',
    reversed: '无谓牺牲、拖延等待、自私自利、停滞不前',
    element: '水'
  },
  {
    id: 13,
    name: 'Death',
    chineseName: '死神',
    emoji: '💀',
    keywords: ['结束', '转变', '重生', '放下'],
    upright: '旧事结束、深刻转变、放下过去、迎接新生',
    reversed: '抗拒改变、恐惧结束、停滞不前、无法放手',
    element: '水'
  },
  {
    id: 14,
    name: 'Temperance',
    chineseName: '节制',
    emoji: '⚗️',
    keywords: ['平衡', '耐心', '调和', '适度'],
    upright: '平衡调和、有耐心、适度节制、内外兼修',
    reversed: '失去平衡、过度极端、缺乏耐心、冲突不断',
    element: '火'
  },
  {
    id: 15,
    name: 'The Devil',
    chineseName: '恶魔',
    emoji: '😈',
    keywords: ['束缚', '欲望', '物质', '阴暗'],
    upright: '受到束缚、物质执着、欲望控制、阴暗面',
    reversed: '挣脱束缚、面对阴暗、戒除恶习、重获自由',
    element: '土'
  },
  {
    id: 16,
    name: 'The Tower',
    chineseName: '塔',
    emoji: '🗼',
    keywords: ['突变', '崩塌', '觉醒', '解放'],
    upright: '突然变化、旧有崩塌、真相揭露、破而后立',
    reversed: '逃避灾难、恐惧改变、延迟崩塌、内心动荡',
    element: '火'
  },
  {
    id: 17,
    name: 'The Star',
    chineseName: '星星',
    emoji: '⭐',
    keywords: ['希望', '灵感', '宁静', '信心'],
    upright: '希望重燃、内心宁静、灵感涌现、信心满满',
    reversed: '失去希望、缺乏信心、创意枯竭、迷失方向',
    element: '风'
  },
  {
    id: 18,
    name: 'The Moon',
    chineseName: '月亮',
    emoji: '🌕',
    keywords: ['幻觉', '潜意识', '恐惧', '直觉'],
    upright: '面对恐惧、潜意识、直觉敏锐、事情不明',
    reversed: '走出迷惑、恐惧消散、真相浮现、内心清明',
    element: '水'
  },
  {
    id: 19,
    name: 'The Sun',
    chineseName: '太阳',
    emoji: '☀️',
    keywords: ['喜悦', '成功', '活力', '乐观'],
    upright: '喜悦幸福、成功胜利、活力充沛、光明未来',
    reversed: '暂时阴霾、过度乐观、延迟成功、内心不安',
    element: '火'
  },
  {
    id: 20,
    name: 'Judgement',
    chineseName: '审判',
    emoji: '📯',
    keywords: ['觉醒', '重生', '召唤', '反思'],
    upright: '内在觉醒、重获新生、听从召唤、自我反思',
    reversed: '自我怀疑、拒绝反思、错失机会、无法释怀',
    element: '火'
  },
  {
    id: 21,
    name: 'The World',
    chineseName: '世界',
    emoji: '🌍',
    keywords: ['完成', '整合', '成就', '圆满'],
    upright: '圆满完成、目标达成、世界和谐、新的循环',
    reversed: '尚未完成、缺乏收尾、半途而废、延迟圆满',
    element: '土'
  }
]

/**
 * 抽牌结果
 */
export interface DrawnCard {
  card: TarotCard
  isReversed: boolean   // 是否逆位
  position?: string     // 牌阵位置（如"过去"、"现在"、"未来"）
}

/**
 * 洗牌并抽取指定数量的牌
 */
export function drawCards(count: number): DrawnCard[] {
  // 复制牌组并洗牌
  const deck = [...majorArcana]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  
  // 抽取指定数量
  const drawn: DrawnCard[] = []
  for (let i = 0; i < count && i < deck.length; i++) {
    drawn.push({
      card: deck[i],
      isReversed: Math.random() < 0.5
    })
  }
  
  return drawn
}

/**
 * 单牌占卜
 */
export function singleCardReading(): DrawnCard {
  return drawCards(1)[0]
}

/**
 * 三牌阵（过去/现在/未来）
 */
export function threeCardReading(): DrawnCard[] {
  const cards = drawCards(3)
  cards[0].position = '过去'
  cards[1].position = '现在'
  cards[2].position = '未来'
  return cards
}
