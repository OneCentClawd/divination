<template>
  <view class="container">
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
    
    <!-- 保存按钮 -->
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

// 根据二进制找卦象
const findHexagram = (binary: string) => {
  return hexagramsData.hexagrams.find(h => h.binary === binary)
}

// 获取 AI 解读
const getAiInterpretation = async () => {
  aiLoading.value = true
  
  try {
    // 调用后端 API（小狗解卦）
    const res = await uni.request({
      url: 'https://lonely.centralus.cloudapp.azure.com/api/divination/interpret',
      method: 'POST',
      data: {
        hexagramName: hexagram.value?.chineseName,
        hexagramJudgment: hexagram.value?.judgment,
        hexagramImage: hexagram.value?.image,
        changeHexagramName: changeHexagram.value?.chineseName,
        hasChange: hasChange.value,
        question: question.value,
        lines: lines.value
      }
    })
    
    if (res.statusCode === 200 && (res.data as any).interpretation) {
      aiInterpretation.value = (res.data as any).interpretation
    } else {
      uni.showToast({ title: '解读失败', icon: 'none' })
    }
  } catch (e) {
    console.error('AI解读失败:', e)
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    aiLoading.value = false
  }
}

// 保存到历史
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
      return
    }
  }
  
  const binary = options.binary || '111111'
  const changeBinary = options.changeBinary || binary
  hasChange.value = options.hasChange === 'true'
  question.value = decodeURIComponent(options.question || '')
  lines.value = (options.lines || '').split(',').map(Number)
  
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
}
</style>
