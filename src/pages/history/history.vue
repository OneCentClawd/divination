<template>
  <view class="container">
    <view class="header">
      <text class="title">历史记录</text>
      <text class="subtitle">最近的占卜记录</text>
    </view>
    
    <view class="empty" v-if="history.length === 0">
      <text class="empty-icon">📜</text>
      <text class="empty-text">暂无记录</text>
      <text class="empty-hint">去起一卦吧~</text>
    </view>
    
    <view class="history-list" v-else>
      <view 
        class="history-item" 
        v-for="item in history" 
        :key="item.id"
        @click="viewDetail(item)"
      >
        <view class="item-header">
          <text class="item-symbol">{{ item.hexagram?.symbol }}</text>
          <view class="item-info">
            <text class="item-name">{{ item.hexagram?.chineseName }}</text>
            <text class="item-date">{{ formatDate(item.date) }}</text>
          </view>
          <view class="item-badge" v-if="item.hasChange">
            <text class="badge-text">变卦</text>
          </view>
        </view>
        
        <view class="item-question" v-if="item.question">
          <text class="question-text">{{ item.question }}</text>
        </view>
        
        <view class="item-ai" v-if="item.aiInterpretation">
          <text class="ai-tag">🐕 已解读</text>
        </view>
      </view>
    </view>
    
    <button class="clear-btn" @click="clearHistory" v-if="history.length > 0">
      清空记录
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'

interface HistoryItem {
  id: number
  date: string
  hexagram: any
  changeHexagram?: any
  hasChange: boolean
  question: string
  aiInterpretation: string
}

const history = ref<HistoryItem[]>([])

const loadHistory = () => {
  history.value = uni.getStorageSync('divination_history') || []
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hour}:${minute}`
}

const viewDetail = (item: HistoryItem) => {
  // 将详情存入临时存储，跳转到结果页
  uni.setStorageSync('temp_divination', item)
  uni.navigateTo({
    url: `/pages/result/result?fromHistory=true`
  })
}

const clearHistory = () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有历史记录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('divination_history')
        history.value = []
        uni.showToast({ title: '已清空', icon: 'success' })
      }
    }
  })
}

// 页面显示时刷新
onShow(() => {
  loadHistory()
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
  padding: 30rpx;
}

.header {
  margin-bottom: 40rpx;
}

.title {
  font-size: 40rpx;
  color: #ffffff;
  font-weight: bold;
  display: block;
}

.subtitle {
  font-size: 26rpx;
  color: #888888;
}

.empty {
  text-align: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #666666;
  display: block;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #888888;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.history-item {
  background: linear-gradient(135deg, #2d2d44 0%, #1f1f35 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  border: 1rpx solid rgba(212, 175, 55, 0.2);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.item-symbol {
  font-size: 50rpx;
  color: #d4af37;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 30rpx;
  color: #ffffff;
  font-weight: bold;
  display: block;
}

.item-date {
  font-size: 24rpx;
  color: #888888;
}

.item-badge {
  background: rgba(255, 107, 107, 0.2);
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.badge-text {
  font-size: 22rpx;
  color: #ff6b6b;
}

.item-question {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.1);
}

.question-text {
  font-size: 26rpx;
  color: #a0a0a0;
}

.item-ai {
  margin-top: 12rpx;
}

.ai-tag {
  font-size: 22rpx;
  color: #d4af37;
}

.clear-btn {
  background: transparent;
  color: #666666;
  font-size: 26rpx;
  margin-top: 40rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 50rpx;
}
</style>
