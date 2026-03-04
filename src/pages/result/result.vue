<template>
  <view class="container">
    <!-- 梅花易数体用关系展示 -->
    <view class="meihua-card" v-if="isMeihua">
      <view class="meihua-header">
        <text class="meihua-title">🌸 梅花易数</text>
      </view>
      <view class="meihua-gua">
        <view class="gua-item">
          <text class="gua-label" :class="{ ti: tiGua === 'upper' }">
            {{ tiGua === 'upper' ? '体卦' : '用卦' }}
          </text>
          <text class="gua-name">{{ hexagram?.upperTrigramName || '上卦' }}</text>
          <text class="gua-element">{{ tiGua === 'upper' ? tiElement : yongElement }}</text>
        </view>
        <view class="gua-divider">
          <text class="relation-text">{{ relation }}</text>
        </view>
        <view class="gua-item">
          <text class="gua-label" :class="{ ti: tiGua === 'lower' }">
            {{ tiGua === 'lower' ? '体卦' : '用卦' }}
          </text>
          <text class="gua-name">{{ hexagram?.lowerTrigramName || '下卦' }}</text>
          <text class="gua-element">{{ tiGua === 'lower' ? tiElement : yongElement }}</text>
        </view>
      </view>
      
      <!-- 互卦 -->
      <view class="hugua-section" v-if="huGua">
        <text class="hugua-label">互卦</text>
        <text class="hugua-name">{{ huGua?.chineseName }}</text>
        <text class="hugua-hint">（辅助判断事情发展过程）</text>
      </view>
      
      <view class="meihua-hint">
        <text class="hint-text">{{ getRelationHint(relation) }}</text>
      </view>
    </view>
    
    <!-- 卦象展示 -->
    <view class="hexagram-card">
      <view class="hexagram-header">
        <text class="hexagram-symbol">{{ hexagram?.symbol }}</text>
        <view class="hexagram-info">
          <text class="hexagram-name">{{ hexagram?.chineseName }}</text>
          <text class="hexagram-number">第{{ hexagram?.number }}卦</text>
        </view>
      </view>
      
      <!-- 卦辞 -->
      <view class="judgment-section">
        <text class="section-title">卦辞</text>
        <text class="judgment-text">{{ hexagram?.judgment }}</text>
        <text class="judgment-explain">{{ hexagram?.judgmentExplain }}</text>
      </view>
      
      <!-- 象辞 -->
      <view class="image-section">
        <text class="section-title">象曰</text>
        <text class="image-text">{{ hexagram?.image }}</text>
      </view>
      
      <!-- 变卦提示 -->
      <view class="change-section" v-if="hasChange && changeHexagram">
        <text class="change-arrow">↓ 变卦 ↓</text>
        <text class="change-name">{{ changeHexagram?.chineseName }}</text>
      </view>
    </view>
    
    <!-- 问题回顾 -->
    <view class="question-card" v-if="question">
      <text class="question-label">所问之事</text>
      <text class="question-text">{{ question }}</text>
    </view>
    
    <!-- AI 解读 -->
    <view class="ai-section">
      <view class="ai-header">
        <text class="ai-title">🐕 小狗解卦</text>
        <text class="ai-badge" v-if="!aiInterpretation">高级功能</text>
      </view>
      
      <view class="ai-content" v-if="aiInterpretation">
        <text class="ai-text">{{ aiInterpretation }}</text>
      </view>
      
      <button class="ai-btn" @click="getAiInterpretation" v-if="!aiInterpretation && !aiLoading">
        请小狗解卦
      </button>
      
      <view class="ai-loading" v-if="aiLoading">
        <text class="loading-text">小狗正在解读卦象...</text>
      </view>
    </view>
    
    <!-- 底部按钮 -->
    <button class="save-btn" @click="saveToHistory" v-if="!fromHistory">保存到历史记录</button>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import hexagramsData from '@/data/hexagrams.json'

const hexagram = ref<any>(null)
const changeHexagram = ref<any>(null)
const hasChange = ref(false)
const question = ref('')
const aiInterpretation = ref('')
const aiLoading = ref(false)
const lines = ref<number[]>([])
const fromHistory = ref(false)

// 梅花易数参数
const isMeihua = ref(false)
const tiGua = ref<'upper' | 'lower'>('upper')
const yongGua = ref<'upper' | 'lower'>('lower')
const tiElement = ref('')
const yongElement = ref('')
const relation = ref('')
const huGua = ref<any>(null)  // 互卦

// 根据二进制找卦象
const findHexagram = (binary: string) => {
  return hexagramsData.hexagrams.find(h => h.binary === binary)
}

// 体用关系吉凶提示
const getRelationHint = (rel: string): string => {
  const hints: Record<string, string> = {
    '用生体': '大吉 — 用卦生体卦，事顺利，有助力',
    '体克用': '吉 — 体卦克制用卦，可成事',
    '比和': '中平 — 体用同类，平稳之象',
    '体生用': '小耗 — 体卦生用卦，有付出',
    '用克体': '不利 — 用卦克体卦，需谨慎'
  }
  return hints[rel] || ''
}

// 获取 AI 解读
const getAiInterpretation = async () => {
  // 先检查缓存
  const cacheKey = `divination_ai_${hexagram.value?.binary}_${question.value}`
  const cached = uni.getStorageSync(cacheKey)
  if (cached) {
    aiInterpretation.value = cached
    return
  }
  
  aiLoading.value = true
  
  try {
    // 获取用户信息（如果有）
    const token = uni.getStorageSync('divination_token')
    const userInfo = uni.getStorageSync('divination_user') || {}
    
    const requestData: any = {
      hexagramName: hexagram.value?.chineseName,
      hexagramJudgment: hexagram.value?.judgment,
      hexagramImage: hexagram.value?.image,
      changeHexagramName: changeHexagram.value?.chineseName,
      hasChange: hasChange.value,
      question: question.value,
      lines: lines.value,
      // 用户信息（可选）
      userInfo: userInfo.birthYear ? {
        birthYear: userInfo.birthYear,
        birthMonth: userInfo.birthMonth,
        birthDay: userInfo.birthDay,
        birthHour: userInfo.birthHour,
        gender: userInfo.gender
      } : null
    }
    
    // 梅花易数额外参数
    if (isMeihua.value) {
      requestData.type = 'meihua'
      requestData.tiGua = tiGua.value
      requestData.tiElement = tiElement.value
      requestData.yongElement = yongElement.value
      requestData.relation = relation.value
    }
    
    const res = await uni.request({
      url: 'https://lonely.centralus.cloudapp.azure.com/api/divination/interpret',
      method: 'POST',
      header: token ? { 'Authorization': `Bearer ${token}` } : {},
      data: requestData
    })
    
    if (res.statusCode === 200 && (res.data as any).interpretation) {
      aiInterpretation.value = (res.data as any).interpretation
      // 缓存解读结果到本地
      const cacheKey = `divination_ai_${hexagram.value?.binary}_${question.value}`
      uni.setStorageSync(cacheKey, aiInterpretation.value)
      
      // 保存到后端
      if (token) {
        saveToBackend()
      }
    } else if (res.statusCode === 401) {
      // 清除过期的 token
      uni.removeStorageSync('divination_token')
      uni.removeStorageSync('divination_user')
      
      uni.showModal({
        title: '需要登录',
        content: (res.data as any).error || '请先登录后使用AI解卦功能',
        confirmText: '去登录',
        success: (modalRes) => {
          if (modalRes.confirm) {
            uni.switchTab({ url: '/pages/profile/profile' })
          }
        }
      })
    } else {
      uni.showToast({ title: (res.data as any).error || '解读失败', icon: 'none' })
    }
  } catch (e) {
    console.error('AI解读失败:', e)
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    aiLoading.value = false
  }
}

// 保存到后端
const saveToBackend = async () => {
  const token = uni.getStorageSync('divination_token')
  if (!token) return
  
  try {
    await uni.request({
      url: 'https://lonely.centralus.cloudapp.azure.com/api/divination/user/records',
      method: 'POST',
      header: { 'Authorization': `Bearer ${token}` },
      data: {
        hexagramBinary: hexagram.value?.binary,
        hexagramName: hexagram.value?.chineseName,
        changeBinary: changeHexagram.value?.binary,
        changeHexagramName: changeHexagram.value?.chineseName,
        hasChange: hasChange.value,
        isMeihua: isMeihua.value,
        tiGua: tiGua.value,
        tiElement: tiElement.value,
        yongElement: yongElement.value,
        relation: relation.value,
        question: question.value,
        aiInterpretation: aiInterpretation.value
      }
    })
  } catch (e) {
    console.error('保存到后端失败:', e)
  }
}

// 保存到历史（本地）
const saveToHistory = () => {
  const history = uni.getStorageSync('divination_history') || []
  history.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    hexagram: hexagram.value,
    changeHexagram: changeHexagram.value,
    hasChange: hasChange.value,
    question: question.value,
    aiInterpretation: aiInterpretation.value,
    lines: lines.value
  })
  // 只保留最近 50 条
  if (history.length > 50) history.pop()
  uni.setStorageSync('divination_history', history)
  uni.showToast({ title: '已保存', icon: 'success' })
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any).options || {}
  
  // 检查是否从历史记录进入
  if (options.fromHistory === 'true') {
    fromHistory.value = true
    const tempData = uni.getStorageSync('temp_divination')
    if (tempData) {
      hexagram.value = tempData.hexagram
      changeHexagram.value = tempData.changeHexagram
      hasChange.value = tempData.hasChange
      question.value = tempData.question
      aiInterpretation.value = tempData.aiInterpretation
      lines.value = tempData.lines || []
      // 梅花易数参数
      isMeihua.value = tempData.isMeihua || false
      tiGua.value = tempData.tiGua || 'upper'
      tiElement.value = tempData.tiElement || ''
      yongElement.value = tempData.yongElement || ''
      relation.value = tempData.relation || ''
      return
    }
  }
  
  const binary = options.binary || '111111'
  const changeBinary = options.changeBinary || binary
  hasChange.value = options.hasChange === 'true'
  question.value = decodeURIComponent(options.question || '')
  lines.value = (options.lines || '').split(',').map(Number)
  
  // 梅花易数参数
  isMeihua.value = options.meihua === 'true'
  if (isMeihua.value) {
    tiGua.value = options.tiGua as 'upper' | 'lower' || 'upper'
    tiElement.value = options.tiElement || ''
    yongElement.value = options.yongElement || ''
    relation.value = decodeURIComponent(options.relation || '')
    // 互卦
    if (options.huGuaBinary) {
      huGua.value = findHexagram(options.huGuaBinary)
    }
  }
  
  hexagram.value = findHexagram(binary)
  if (hasChange.value) {
    changeHexagram.value = findHexagram(changeBinary)
  }
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
  padding: 30rpx;
}

/* 梅花易数卡片 */
.meihua-card {
  background: linear-gradient(135deg, #2d2d44 0%, #1f1f35 100%);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}

.meihua-header {
  text-align: center;
  margin-bottom: 20rpx;
}

.meihua-title {
  font-size: 32rpx;
  color: #d4af37;
}

.meihua-gua {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 20rpx;
}

.gua-item {
  text-align: center;
}

.gua-label {
  display: block;
  font-size: 24rpx;
  color: #888888;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 8rpx;
}

.gua-label.ti {
  color: #d4af37;
  background: rgba(212, 175, 55, 0.2);
}

.gua-name {
  display: block;
  font-size: 32rpx;
  color: #ffffff;
  margin-bottom: 4rpx;
}

.gua-element {
  display: block;
  font-size: 24rpx;
  color: #888888;
}

.gua-divider {
  text-align: center;
}

.relation-text {
  font-size: 28rpx;
  color: #d4af37;
}

.hugua-section {
  text-align: center;
  margin: 20rpx 0;
  padding: 16rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12rpx;
}

.hugua-label {
  font-size: 24rpx;
  color: #888888;
  margin-right: 12rpx;
}

.hugua-name {
  font-size: 28rpx;
  color: #d4af37;
  font-weight: bold;
}

.hugua-hint {
  font-size: 22rpx;
  color: #666666;
  margin-left: 8rpx;
}

.meihua-hint {
  text-align: center;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 12rpx;
  padding: 16rpx;
}

.hint-text {
  font-size: 24rpx;
  color: #cccccc;
}

.hexagram-card {
  background: linear-gradient(135deg, #2d2d44 0%, #1f1f35 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}

.hexagram-header {
  display: flex;
  align-items: center;
  gap: 30rpx;
  margin-bottom: 30rpx;
}

.hexagram-symbol {
  font-size: 80rpx;
  color: #d4af37;
}

.hexagram-info {
  flex: 1;
}

.hexagram-name {
  font-size: 40rpx;
  color: #ffffff;
  font-weight: bold;
  display: block;
}

.hexagram-number {
  font-size: 24rpx;
  color: #888888;
}

.section-title {
  font-size: 26rpx;
  color: #d4af37;
  display: block;
  margin-bottom: 12rpx;
}

.judgment-section {
  margin-bottom: 30rpx;
}

.judgment-text {
  font-size: 32rpx;
  color: #ffffff;
  display: block;
  margin-bottom: 12rpx;
}

.judgment-explain {
  font-size: 26rpx;
  color: #a0a0a0;
}

.image-section {
  background: rgba(212, 175, 55, 0.1);
  border-radius: 16rpx;
  padding: 24rpx;
}

.image-text {
  font-size: 28rpx;
  color: #c0c0c0;
  line-height: 1.6;
}

.change-section {
  text-align: center;
  margin-top: 30rpx;
  padding-top: 30rpx;
  border-top: 1rpx solid rgba(212, 175, 55, 0.2);
}

.change-arrow {
  font-size: 24rpx;
  color: #ff6b6b;
  display: block;
  margin-bottom: 12rpx;
}

.change-name {
  font-size: 32rpx;
  color: #ff6b6b;
}

.question-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 30rpx;
}

.question-label {
  font-size: 24rpx;
  color: #888888;
  display: block;
  margin-bottom: 12rpx;
}

.question-text {
  font-size: 28rpx;
  color: #ffffff;
}

.ai-section {
  background: linear-gradient(135deg, #2d2d44 0%, #1f1f35 100%);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.ai-title {
  font-size: 32rpx;
  color: #d4af37;
  font-weight: bold;
}

.ai-badge {
  font-size: 22rpx;
  color: #d4af37;
  background: rgba(212, 175, 55, 0.2);
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.ai-content {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16rpx;
  padding: 24rpx;
}

.ai-text {
  font-size: 28rpx;
  color: #e0e0e0;
  line-height: 1.8;
}

.ai-btn {
  background: linear-gradient(135deg, #d4af37 0%, #aa8a2e 100%);
  color: #1a1a2e;
  font-size: 28rpx;
  font-weight: bold;
  padding: 20rpx 60rpx;
  border-radius: 50rpx;
  border: none;
}

.ai-loading {
  text-align: center;
  padding: 30rpx;
}

.loading-text {
  font-size: 26rpx;
  color: #a0a0a0;
}

.save-btn {
  background: rgba(212, 175, 55, 0.2);
  color: #d4af37;
  font-size: 28rpx;
  padding: 24rpx;
  border-radius: 50rpx;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  margin-top: 20rpx;
}
</style>
