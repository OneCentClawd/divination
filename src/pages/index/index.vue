<template>
  <view class="container">
    <!-- 今日运势卡片 -->
    <view class="fortune-card">
      <view class="fortune-header">
        <view class="date-info">
          <text class="fortune-date-gregorian">{{ todayDate.gregorian }}</text>
          <text class="fortune-date-lunar">{{ todayDate.lunar }}</text>
        </view>
        <text class="fortune-title">今日運勢</text>
      </view>
      
      <!-- 有用户信息时显示个人运势 -->
      <view class="personal-fortune" v-if="fortune.hasUserInfo">
        <view class="fortune-score">
          <text class="score-emoji">{{ fortune.emoji }}</text>
          <text class="score-level">{{ fortune.level }}</text>
          <text class="score-number">{{ fortune.score }}分</text>
        </view>
        
        <view class="fortune-info">
          <text class="info-item">🐾 {{ fortune.zodiac }} · {{ fortune.birthElement }}命</text>
          <text class="info-item">📅 {{ fortune.dayGanZhi }} · {{ fortune.dayElement }}日</text>
        </view>
        
        <view class="fortune-summary">
          <text>{{ fortune.summary }}</text>
        </view>
        
        <view class="fortune-details">
          <view class="detail-row">
            <text class="detail-label">✅ 宜</text>
            <text class="detail-value">{{ fortune.suitable?.join('、') }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">❌ 忌</text>
            <text class="detail-value">{{ fortune.avoid?.join('、') }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">🧭 吉方</text>
            <text class="detail-value">{{ fortune.luckyDirection }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">🎨 幸运色</text>
            <text class="detail-value">{{ fortune.luckyColor }}</text>
          </view>
        </view>
      </view>
      
      <!-- 无用户信息时显示通用卦象 -->
      <view class="general-fortune" v-else>
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
        
        <view class="profile-hint" @click="goToProfile">
          <text>💡 完善个人资料，获取专属今日运势</text>
        </view>
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
const fortune = ref<any>({})

const todayDate = computed(() => {
  const now = new Date()
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
  
  const gregorian = `${year}年${now.getMonth() + 1}月${now.getDate()}日`
  const lunar = `${ganZhiYear} ${chineseMonths[now.getMonth()]}月${chineseDays[now.getDate() - 1]}`
  
  return { gregorian, lunar }
})

// 获取每日卦象（无用户信息时用）
const getDailyHexagram = () => {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = seed % hexagramsData.hexagrams.length
  dailyHexagram.value = hexagramsData.hexagrams[index]
}

// 获取个人运势
const getPersonalFortune = async () => {
  const user = uni.getStorageSync('divination_user')
  if (!user || !user.birthYear) {
    fortune.value = { hasUserInfo: false }
    return
  }
  
  try {
    const res = await uni.request({
      url: `https://lonely.centralus.cloudapp.azure.com/api/divination/fortune`,
      data: {
        birthYear: user.birthYear,
        birthMonth: user.birthMonth,
        birthDay: user.birthDay,
        birthHour: user.birthHour
      }
    })
    
    if ((res.data as any).success) {
      fortune.value = res.data
    } else {
      fortune.value = { hasUserInfo: false }
    }
  } catch (e) {
    console.error('获取运势失败:', e)
    fortune.value = { hasUserInfo: false }
  }
}

const goToDivine = (method: string) => {
  uni.switchTab({
    url: '/pages/divine/divine'
  })
}

const goToProfile = () => {
  uni.switchTab({
    url: '/pages/profile/profile'
  })
}

onMounted(() => {
  getDailyHexagram()
  getPersonalFortune()
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
  align-items: flex-start;
  margin-bottom: 30rpx;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.fortune-date-gregorian {
  color: #888888;
  font-size: 24rpx;
}

.fortune-date-lunar {
  color: #d4af37;
  font-size: 28rpx;
  font-weight: bold;
}

.fortune-title {
  color: #d4af37;
  font-size: 36rpx;
  font-weight: bold;
}

/* 个人运势样式 */
.fortune-score {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.score-emoji {
  font-size: 48rpx;
}

.score-level {
  font-size: 48rpx;
  font-weight: bold;
  color: #d4af37;
}

.score-number {
  font-size: 28rpx;
  color: #888888;
}

.fortune-info {
  display: flex;
  justify-content: center;
  gap: 30rpx;
  margin-bottom: 24rpx;
}

.info-item {
  font-size: 24rpx;
  color: #aaaaaa;
}

.fortune-summary {
  text-align: center;
  padding: 20rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}

.fortune-summary text {
  font-size: 28rpx;
  color: #ffffff;
  line-height: 1.6;
}

.fortune-details {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.detail-label {
  font-size: 26rpx;
  color: #888888;
  width: 120rpx;
}

.detail-value {
  font-size: 26rpx;
  color: #ffffff;
  flex: 1;
}

/* 通用运势样式 */
.fortune-hexagram {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24rpx;
}

.hexagram-symbol {
  font-size: 72rpx;
  color: #d4af37;
  margin-bottom: 8rpx;
}

.hexagram-name {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: bold;
}

.fortune-content {
  margin-bottom: 24rpx;
}

.fortune-text {
  font-size: 30rpx;
  color: #d4af37;
  display: block;
  margin-bottom: 12rpx;
  text-align: center;
}

.fortune-explain {
  font-size: 26rpx;
  color: #cccccc;
  display: block;
  text-align: center;
  line-height: 1.6;
}

.fortune-image {
  background: rgba(212, 175, 55, 0.1);
  border-radius: 12rpx;
  padding: 20rpx;
}

.image-label {
  font-size: 24rpx;
  color: #d4af37;
  display: block;
  margin-bottom: 8rpx;
}

.image-text {
  font-size: 26rpx;
  color: #cccccc;
  line-height: 1.6;
}

.profile-hint {
  margin-top: 24rpx;
  text-align: center;
  padding: 20rpx;
  background: rgba(212, 175, 55, 0.15);
  border-radius: 12rpx;
  border: 1rpx dashed rgba(212, 175, 55, 0.5);
}

.profile-hint text {
  font-size: 26rpx;
  color: #d4af37;
}

/* 快捷入口 */
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
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1rpx solid rgba(212, 175, 55, 0.2);
}

.action-card.disabled {
  opacity: 0.5;
}

.action-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}

.action-title {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.action-desc {
  font-size: 22rpx;
  color: #888888;
}
</style>
