<template>
  <view class="container">
    <!-- 牌面展示 -->
    <view class="cards-section">
      <view class="section-title">
        <text class="title-icon">🔮</text>
        <text class="title-text">{{ spreadTitle }}</text>
      </view>
      
      <view class="cards-display">
        <view 
          class="card-item" 
          v-for="(card, index) in cards" 
          :key="index"
          :class="{ reversed: card.isReversed }"
        >
          <text class="card-position" v-if="card.position">{{ card.position }}</text>
          <view class="card-face">
            <text class="card-emoji">{{ getCardInfo(card.id)?.emoji }}</text>
            <text class="card-name">{{ card.name }}</text>
            <text class="card-orientation" :class="{ negative: card.isReversed }">
              {{ card.isReversed ? '逆位 ↓' : '正位 ↑' }}
            </text>
          </view>
          <view class="card-meaning">
            <text class="meaning-label">{{ card.isReversed ? '逆位含义' : '正位含义' }}</text>
            <text class="meaning-text">{{ card.isReversed ? getCardInfo(card.id)?.reversed : getCardInfo(card.id)?.upright }}</text>
          </view>
          <view class="card-keywords-wrap">
            <text class="keyword" v-for="kw in getCardInfo(card.id)?.keywords" :key="kw">{{ kw }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 问题 -->
    <view class="question-section" v-if="question">
      <text class="question-label">问题</text>
      <text class="question-text">{{ question }}</text>
    </view>
    
    <!-- AI 解读 -->
    <view class="ai-section">
      <view class="ai-header">
        <text class="ai-icon">🐕</text>
        <text class="ai-title">小狗解牌</text>
      </view>
      
      <view class="ai-content" v-if="aiInterpretation">
        <text class="ai-text">{{ aiInterpretation }}</text>
      </view>
      
      <view class="ai-loading" v-else-if="aiLoading">
        <text class="loading-text">小狗正在解读塔罗的神秘启示...</text>
      </view>
      
      <button class="ai-btn" @click="getAiInterpretation" v-else>
        🔮 请小狗解牌
      </button>
    </view>
    
    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button class="btn-secondary" @click="goBack">返回重占</button>
      <button class="btn-primary" @click="saveToHistory">保存记录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { majorArcana } from '@/utils/tarot'

interface CardParam {
  id: number
  name: string
  isReversed: boolean
  position: string
}

const cards = ref<CardParam[]>([])
const question = ref('')
const spreadType = ref('single')
const aiInterpretation = ref('')
const aiLoading = ref(false)

// 标题
const spreadTitle = computed(() => {
  return spreadType.value === 'single' ? '单牌占卜' : '三牌阵 · 过去/现在/未来'
})

// 获取牌详情
const getCardInfo = (id: number) => {
  return majorArcana.find(c => c.id === id)
}

// 获取 AI 解读
const getAiInterpretation = async () => {
  const token = uni.getStorageSync('divination_token')
  
  if (!token) {
    uni.showModal({
      title: '需要登录',
      content: '请先登录后使用AI解牌功能',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          uni.switchTab({ url: '/pages/profile/profile' })
        }
      }
    })
    return
  }
  
  aiLoading.value = true
  
  try {
    const userInfo = uni.getStorageSync('divination_user') || {}
    
    const res = await uni.request({
      url: 'https://lonely.centralus.cloudapp.azure.com/api/divination/interpret',
      method: 'POST',
      header: { 'Authorization': `Bearer ${token}` },
      data: {
        type: 'tarot',
        spreadType: spreadType.value,
        cards: cards.value.map(c => ({
          name: c.name,
          isReversed: c.isReversed,
          position: c.position,
          upright: getCardInfo(c.id)?.upright,
          reversed: getCardInfo(c.id)?.reversed,
          keywords: getCardInfo(c.id)?.keywords
        })),
        question: question.value,
        userInfo: userInfo.birthYear ? {
          birthYear: userInfo.birthYear,
          birthMonth: userInfo.birthMonth,
          birthDay: userInfo.birthDay,
          birthHour: userInfo.birthHour,
          gender: userInfo.gender
        } : null
      }
    })
    
    if (res.statusCode === 200 && (res.data as any).interpretation) {
      aiInterpretation.value = (res.data as any).interpretation
      
      // 保存到后端
      saveToBackend()
    } else if (res.statusCode === 401) {
      uni.removeStorageSync('divination_token')
      uni.removeStorageSync('divination_user')
      uni.showModal({
        title: '需要登录',
        content: '登录已过期，请重新登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            uni.switchTab({ url: '/pages/profile/profile' })
          }
        }
      })
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
        hexagramBinary: 'tarot',  // 标记为塔罗
        hexagramName: spreadType.value === 'single' ? '单牌占卜' : '三牌阵',
        question: question.value,
        aiInterpretation: aiInterpretation.value,
        tarotCards: JSON.stringify(cards.value)
      }
    })
  } catch (e) {
    console.error('保存失败:', e)
  }
}

// 保存到历史
const saveToHistory = () => {
  const history = uni.getStorageSync('tarot_history') || []
  history.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    spreadType: spreadType.value,
    cards: cards.value,
    question: question.value,
    aiInterpretation: aiInterpretation.value
  })
  if (history.length > 50) history.pop()
  uni.setStorageSync('tarot_history', history)
  uni.showToast({ title: '已保存', icon: 'success' })
}

// 返回
const goBack = () => {
  uni.navigateBack()
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any).options || {}
  
  if (options.cards) {
    cards.value = JSON.parse(decodeURIComponent(options.cards))
  }
  question.value = decodeURIComponent(options.question || '')
  spreadType.value = options.spreadType || 'single'
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a0a2e 0%, #16213e 50%, #0f0f1a 100%);
  padding: 30rpx;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}

.title-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.title-text {
  font-size: 36rpx;
  color: #e0c3fc;
  font-weight: bold;
}

/* 牌面展示 */
.cards-display {
  display: flex;
  justify-content: center;
  gap: 20rpx;
  flex-wrap: wrap;
  margin-bottom: 40rpx;
}

.card-item {
  width: 300rpx;
  background: linear-gradient(135deg, #2d1b4e 0%, #1f1035 100%);
  border: 2rpx solid rgba(224, 195, 252, 0.3);
  border-radius: 20rpx;
  padding: 24rpx;
  text-align: center;
}

.card-position {
  font-size: 24rpx;
  color: #9d4edd;
  display: block;
  margin-bottom: 12rpx;
}

.card-face {
  margin-bottom: 16rpx;
}

.card-emoji {
  font-size: 60rpx;
  display: block;
  margin-bottom: 8rpx;
}

.card-name {
  font-size: 32rpx;
  color: #e0c3fc;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}

.card-orientation {
  font-size: 24rpx;
  color: #4ade80;
  display: block;
}

.card-orientation.negative {
  color: #f87171;
}

.card-meaning {
  background: rgba(157, 78, 221, 0.15);
  border-radius: 12rpx;
  padding: 16rpx;
  margin-bottom: 16rpx;
}

.meaning-label {
  font-size: 22rpx;
  color: #9d4edd;
  display: block;
  margin-bottom: 8rpx;
}

.meaning-text {
  font-size: 24rpx;
  color: #c4b5d0;
  line-height: 1.5;
}

.card-keywords-wrap {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8rpx;
}

.keyword {
  font-size: 20rpx;
  color: #8b7fa8;
  background: rgba(157, 78, 221, 0.2);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

/* 问题 */
.question-section {
  background: rgba(45, 27, 78, 0.4);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 30rpx;
}

.question-label {
  font-size: 24rpx;
  color: #9d4edd;
  display: block;
  margin-bottom: 8rpx;
}

.question-text {
  font-size: 28rpx;
  color: #e0c3fc;
}

/* AI 解读 */
.ai-section {
  background: linear-gradient(135deg, #2d1b4e 0%, #1f1035 100%);
  border: 2rpx solid rgba(224, 195, 252, 0.2);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.ai-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.ai-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.ai-title {
  font-size: 32rpx;
  color: #e0c3fc;
  font-weight: bold;
}

.ai-content {
  background: rgba(157, 78, 221, 0.1);
  border-radius: 16rpx;
  padding: 24rpx;
}

.ai-text {
  font-size: 28rpx;
  color: #c4b5d0;
  line-height: 1.8;
  white-space: pre-wrap;
}

.ai-loading {
  text-align: center;
  padding: 40rpx;
}

.loading-text {
  color: #9d4edd;
  font-size: 28rpx;
}

.ai-btn {
  background: linear-gradient(135deg, #9d4edd 0%, #7b2cbf 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  padding: 28rpx;
  border-radius: 50rpx;
  border: none;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}

.btn-primary {
  flex: 1;
  background: linear-gradient(135deg, #9d4edd 0%, #7b2cbf 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  padding: 28rpx;
  border-radius: 50rpx;
  border: none;
}

.btn-secondary {
  flex: 1;
  background: rgba(157, 78, 221, 0.2);
  color: #e0c3fc;
  font-size: 32rpx;
  padding: 28rpx;
  border-radius: 50rpx;
  border: 2rpx solid rgba(224, 195, 252, 0.3);
}
</style>
</template>
