/**
 * 梅花易数工具函数
 */

// 八卦对应（余数 → 卦）
// 0→坤，1→乾，2→兑，3→离，4→震，5→巽，6→坎，7→艮
const TRIGRAMS = ['坤', '乾', '兑', '离', '震', '巽', '坎', '艮']
const TRIGRAM_SYMBOLS = ['☷', '☰', '☱', '☲', '☳', '☴', '☵', '☶']
const TRIGRAM_ELEMENTS = ['土', '金', '金', '火', '木', '木', '水', '土']  // 五行
const TRIGRAM_BINARY = ['000', '111', '011', '101', '001', '110', '010', '100']  // 二进制（下到上）

// 五行生克关系
// 生：木生火、火生土、土生金、金生水、水生木
// 克：木克土、土克水、水克火、火克金、金克木
const ELEMENT_RELATIONS: Record<string, { sheng: string; ke: string; beSheng: string; beKe: string }> = {
  '木': { sheng: '火', ke: '土', beSheng: '水', beKe: '金' },
  '火': { sheng: '土', ke: '金', beSheng: '木', beKe: '水' },
  '土': { sheng: '金', ke: '水', beSheng: '火', beKe: '木' },
  '金': { sheng: '水', ke: '木', beSheng: '土', beKe: '火' },
  '水': { sheng: '木', ke: '火', beSheng: '金', beKe: '土' }
}

export interface MeihuaResult {
  upperTrigram: number      // 上卦索引
  lowerTrigram: number      // 下卦索引
  changingLine: number      // 动爻（1-6）
  upperName: string         // 上卦名
  lowerName: string         // 下卦名
  upperSymbol: string       // 上卦符号
  lowerSymbol: string       // 下卦符号
  hexagramBinary: string    // 六爻二进制
  changedBinary: string     // 变卦二进制
  tiGua: 'upper' | 'lower'  // 体卦
  yongGua: 'upper' | 'lower' // 用卦
  tiElement: string         // 体卦五行
  yongElement: string       // 用卦五行
  relation: string          // 体用关系
}

/**
 * 数字起卦
 * @param num1 第一个数字（用于上卦）
 * @param num2 第二个数字（用于下卦）
 */
export function divineByNumbers(num1: number, num2: number): MeihuaResult {
  // 上卦 = 第一数 ÷ 8 的余数
  const upperTrigram = num1 % 8
  // 下卦 = 第二数 ÷ 8 的余数
  const lowerTrigram = num2 % 8
  // 动爻 = (两数之和) ÷ 6 的余数 + 1（余数0视为6）
  let changingLine = (num1 + num2) % 6
  if (changingLine === 0) changingLine = 6
  
  return buildResult(upperTrigram, lowerTrigram, changingLine)
}

/**
 * 时间起卦
 * @param lunarYear 农历年份
 * @param lunarMonth 农历月份
 * @param lunarDay 农历日
 * @param hour 时辰（0-11，子时=0）
 */
export function divineByTime(lunarYear: number, lunarMonth: number, lunarDay: number, hour: number): MeihuaResult {
  // 年数取地支序数（年份 % 12）
  const yearNum = lunarYear % 12 || 12
  
  // 上卦 = (年 + 月 + 日) ÷ 8 的余数
  const upperSum = yearNum + lunarMonth + lunarDay
  const upperTrigram = upperSum % 8
  
  // 下卦 = (年 + 月 + 日 + 时) ÷ 8 的余数
  const lowerSum = yearNum + lunarMonth + lunarDay + (hour + 1)  // 时辰从1开始
  const lowerTrigram = lowerSum % 8
  
  // 动爻 = (年 + 月 + 日 + 时) ÷ 6 的余数
  let changingLine = lowerSum % 6
  if (changingLine === 0) changingLine = 6
  
  return buildResult(upperTrigram, lowerTrigram, changingLine)
}

/**
 * 当前时间自动起卦（需要传入农历信息）
 */
export function divineByCurrentTime(lunarYear: number, lunarMonth: number, lunarDay: number, currentHour: number): MeihuaResult {
  // 计算时辰（23:00-01:00=子时=0）
  let hour = Math.floor((currentHour + 1) / 2) % 12
  
  return divineByTime(lunarYear, lunarMonth, lunarDay, hour)
}

/**
 * 构建完整结果
 */
function buildResult(upperTrigram: number, lowerTrigram: number, changingLine: number): MeihuaResult {
  // 获取卦名和符号
  const upperName = TRIGRAMS[upperTrigram]
  const lowerName = TRIGRAMS[lowerTrigram]
  const upperSymbol = TRIGRAM_SYMBOLS[upperTrigram]
  const lowerSymbol = TRIGRAM_SYMBOLS[lowerTrigram]
  
  // 构建六爻二进制（下卦在前，上卦在后）
  const hexagramBinary = TRIGRAM_BINARY[lowerTrigram] + TRIGRAM_BINARY[upperTrigram]
  
  // 动爻变化后的二进制
  const binaryArray = hexagramBinary.split('')
  binaryArray[changingLine - 1] = binaryArray[changingLine - 1] === '0' ? '1' : '0'
  const changedBinary = binaryArray.join('')
  
  // 确定体用卦
  // 动爻在下卦（1-3爻）→ 下卦为用，上卦为体
  // 动爻在上卦（4-6爻）→ 上卦为用，下卦为体
  const tiGua = changingLine <= 3 ? 'upper' : 'lower'
  const yongGua = changingLine <= 3 ? 'lower' : 'upper'
  
  // 五行
  const tiElement = tiGua === 'upper' ? TRIGRAM_ELEMENTS[upperTrigram] : TRIGRAM_ELEMENTS[lowerTrigram]
  const yongElement = yongGua === 'upper' ? TRIGRAM_ELEMENTS[upperTrigram] : TRIGRAM_ELEMENTS[lowerTrigram]
  
  // 体用关系
  const relation = getElementRelation(tiElement, yongElement)
  
  return {
    upperTrigram,
    lowerTrigram,
    changingLine,
    upperName,
    lowerName,
    upperSymbol,
    lowerSymbol,
    hexagramBinary,
    changedBinary,
    tiGua,
    yongGua,
    tiElement,
    yongElement,
    relation
  }
}

/**
 * 获取体用关系
 */
function getElementRelation(tiElement: string, yongElement: string): string {
  if (tiElement === yongElement) {
    return '比和'  // 同类相助
  }
  
  const rel = ELEMENT_RELATIONS[tiElement]
  if (rel.sheng === yongElement) {
    return '体生用'  // 体耗
  }
  if (rel.ke === yongElement) {
    return '体克用'  // 体胜
  }
  if (rel.beSheng === yongElement) {
    return '用生体'  // 大吉
  }
  if (rel.beKe === yongElement) {
    return '用克体'  // 不利
  }
  
  return '未知'
}

/**
 * 根据二进制获取卦名（用于查找64卦）
 */
export function getHexagramIndex(binary: string): number {
  return parseInt(binary, 2)
}

export { TRIGRAMS, TRIGRAM_SYMBOLS, TRIGRAM_ELEMENTS }
