<template>
  <view class="container">
    <!-- 今日运势卡片 -->
    <view class="fortune-card">
      <view class="fortune-header">
        <text class="fortune-date">{{ todayDate }}</text>
        <text class="fortune-title">今日运势</text>
      </view>
      
      <view class="fortune-hexagram" v-if="dailyHexagram">
        <text class="hexagram-symbol">{{ dailyHexagram.symbol }}</text>
        <text class="hexagram-name">{{ dailyHexagram.chineseName }}</text>
      </view>
      
      <view class="fortune-content" v-if="dailyHexagram">
        <text class="fortune-text">{{ dailyHexagram.judgment }}</text>
        <text class="fortune-explain">{{ dailyHexagram.judgmentExplain }}</text>
      </view>
      
      <view class="fortune-image" v-if="dailyHexagram">
        <text class="image-label">象曰</text>
        <text class="image-text">{{ dailyHexagram.image }}</text>
      </view>
    </view>
    
    <!-- 快捷入口 -->
    <view class="quick-actions">
      <view class="action-card" @click="goToDivine('liuyao')">
        <text class="action-icon">🪙</text>
        <text class="action-title">六爻起卦</text>
        <text class="action-desc">铜钱法占卜</text>
      </view>
      
      <view class="action-card disabled">
        <text class="action-icon">🌸</text>
        <text class="action-title">梅花易数</text>
        <text class="action-desc">即将上线</text>
      </view>
      
      <view class="action-card disabled">
        <text class="action-icon">🎴</text>
        <text class="action-title">塔罗占卜</text>
        <text class="action-desc">即将上线</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import hexagramsData from '@/data/hexagrams.json'

const dailyHexagram = ref<any>(null)

const todayDate = computed(() => {
  const now = new Date()
  // 天干地支
  const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  const chineseMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '臘']
  const chineseDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十', '三十一']
  
  const year = now.getFullYear()
  const stemIndex = (year - 4) % 10
  const branchIndex = (year - 4) % 12
  const ganZhiYear = heavenlyStems[stemIndex] + earthlyBranches[branchIndex] + '年'
  
  return `${ganZhiYear} ${chineseMonths[now.getMonth()]}月${chineseDays[now.getDate() - 1]}`
})

// 根据日期生成每日卦象
const getDailyHexagram = () => {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = seed % hexagramsData.hexagrams.length
  dailyHexagram.value = hexagramsData.hexagrams[index]
}

const goToDivine = (method: string) => {
  uni.switchTab({
    url: '/pages/divine/divine'
  })
}

onMounted(() => {
  getDailyHexagram()
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
  padding: 30rpx;
}

.fortune-card {
  background: linear-gradient(135deg, #2d2d44 0%, #1f1f35 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
}

.fortune-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.fortune-date {
  color: #d4af37;
  font-size: 28rpx;
}

.fortune-title {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
}

.fortune-hexagram {
  text-align: center;
  margin: 40rpx 0;
}

.hexagram-symbol {
  font-size: 80rpx;
  color: #d4af37;
  display: block;
  margin-bottom: 20rpx;
}

.hexagram-name {
  font-size: 36rpx;
  color: #ffffff;
  font-weight: bold;
}

.fortune-content {
  text-align: center;
  margin: 30rpx 0;
}

.fortune-text {
  color: #e0e0e0;
  font-size: 30rpx;
  display: block;
  margin-bottom: 16rpx;
}

.fortune-explain {
  color: #a0a0a0;
  font-size: 26rpx;
}

.fortune-image {
  background: rgba(212, 175, 55, 0.1);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-top: 30rpx;
}

.image-label {
  color: #d4af37;
  font-size: 24rpx;
  display: block;
  margin-bottom: 12rpx;
}

.image-text {
  color: #c0c0c0;
  font-size: 28rpx;
  line-height: 1.6;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.action-card {
  flex: 1;
  min-width: 200rpx;
  background: linear-gradient(135deg, #2d2d44 0%, #1f1f35 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  text-align: center;
  border: 1rpx solid rgba(212, 175, 55, 0.2);
}

.action-card.disabled {
  opacity: 0.5;
}

.action-icon {
  font-size: 48rpx;
  display: block;
  margin-bottom: 16rpx;
}

.action-title {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}

.action-desc {
  color: #888888;
  font-size: 22rpx;
}
</style>
