<template>
  <view class="container">
    <!-- 选择起卦方式 -->
    <view class="method-stage" v-if="stage === 'method'">
      <view class="method-header">
        <text class="method-icon">🌸</text>
        <text class="method-title">梅花易数</text>
        <text class="method-subtitle">请选择起卦方式</text>
      </view>
      
      <view class="method-list">
        <view class="method-item" @click="selectMethod('number')">
          <text class="method-item-icon">🔢</text>
          <view class="method-item-info">
            <text class="method-item-title">数字起卦</text>
            <text class="method-item-desc">输入两个数字，以数成卦</text>
          </view>
          <text class="method-arrow">›</text>
        </view>
        
        <view class="method-item" @click="selectMethod('time')">
          <text class="method-item-icon">🕐</text>
          <view class="method-item-info">
            <text class="method-item-title">时间起卦</text>
            <text class="method-item-desc">以当前时辰自动成卦</text>
          </view>
          <text class="method-arrow">›</text>
        </view>
      </view>
    </view>
    
    <!-- 输入问题 -->
    <view class="question-stage" v-if="stage === 'question'">
      <view class="question-content">
        <text class="question-icon">❓</text>
        <text class="question-title">心中所问</text>
        <text class="question-subtitle">请输入您想占卜的问题</text>
        
        <textarea 
          class="question-textarea" 
          v-model="question" 
          placeholder="例如：今日事业运势如何..."
          maxlength="100"
        />
        
        <button class="next-btn" @click="goToInput">下一步</button>
        <text class="skip-text" @click="goToInput">跳过，直接起卦</text>
      </view>
    </view>
    
    <!-- 数字输入 -->
    <view class="number-stage" v-if="stage === 'number'">
      <view class="number-content">
        <text class="number-title">请输入两个数字</text>
        <text class="number-hint">心中默念问题，随意想两个数字</text>
        
        <view class="number-inputs">
          <input 
            class="number-input" 
            type="number" 
            v-model="num1" 
            placeholder="第一个数"
          />
          <text class="number-divider">与</text>
          <input 
            class="number-input" 
            type="number" 
            v-model="num2" 
            placeholder="第二个数"
          />
        </view>
        
        <button class="divine-btn" @click="doDivineByNumber" :disabled="!canDivine">
          起卦
        </button>
      </view>
    </view>
    
    <!-- 时间起卦确认 -->
    <view class="time-stage" v-if="stage === 'time'">
      <view class="time-content">
        <text class="time-title">时间起卦</text>
        <text class="time-hint">以当前时辰成卦</text>
        
        <view class="time-display">
          <text class="time-lunar">{{ lunarDate }}</text>
          <text class="time-hour">{{ currentHour }}</text>
        </view>
        
        <button class="divine-btn" @click="doDivineByTime">
          起卦
        </button>
      </view>
    </view>
    
    <!-- 结果展示 -->
    <view class="result-stage" v-if="stage === 'result'">
      <view class="result-content">
        <text class="result-title">卦象已成</text>
        
        <view class="gua-display">
          <view class="gua-item">
            <text class="gua-symbol">{{ result?.upperSymbol }}</text>
            <text class="gua-name">{{ result?.upperName }}</text>
            <text class="gua-role" :class="{ ti: result?.tiGua === 'upper' }">
              {{ result?.tiGua === 'upper' ? '体卦' : '用卦' }}
            </text>
          </view>
          <view class="gua-item">
            <text class="gua-symbol">{{ result?.lowerSymbol }}</text>
            <text class="gua-name">{{ result?.lowerName }}</text>
            <text class="gua-role" :class="{ ti: result?.tiGua === 'lower' }">
              {{ result?.tiGua === 'lower' ? '体卦' : '用卦' }}
            </text>
          </view>
        </view>
        
        <view class="result-info">
          <text class="info-item">动爻：第 {{ result?.changingLine }} 爻</text>
          <text class="info-item">体卦五行：{{ result?.tiElement }}</text>
          <text class="info-item">用卦五行：{{ result?.yongElement }}</text>
          <text class="info-item relation">体用关系：{{ result?.relation }}</text>
        </view>
        
        <view class="result-actions">
          <button class="action-btn primary" @click="viewInterpretation">
            查看解卦
          </button>
          <button class="action-btn secondary" @click="divineAgain">
            再起一卦
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { divineByNumbers, divineByCurrentTime, type MeihuaResult } from '@/utils/meihua'
// @ts-ignore
import { Solar } from 'lunar-javascript'

const stage = ref<'method' | 'question' | 'number' | 'time' | 'result'>('method')
const method = ref<'number' | 'time'>('number')
const question = ref('')
const num1 = ref('')
const num2 = ref('')
const result = ref<MeihuaResult | null>(null)

// 获取农历信息
const getLunarInfo = () => {
  const now = new Date()
  const solar = Solar.fromDate(now)
  const lunar = solar.getLunar()
  return {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
    monthChinese: lunar.getMonthInChinese(),
    dayChinese: lunar.getDayInChinese()
  }
}

// 农历日期
const lunarDate = computed(() => {
  const lunar = getLunarInfo()
  return `农历${lunar.monthChinese}月${lunar.dayChinese}`
})

// 当前时辰
const currentHour = computed(() => {
  const hours = new Date().getHours()
  const hourNames = ['子时', '丑时', '寅时', '卯时', '辰时', '巳时', 
                     '午时', '未时', '申时', '酉时', '戌时', '亥时']
  const hourIndex = Math.floor((hours + 1) / 2) % 12
  return hourNames[hourIndex]
})

// 是否可以起卦
const canDivine = computed(() => {
  return num1.value && num2.value && 
         parseInt(num1.value) > 0 && parseInt(num2.value) > 0
})

// 选择起卦方式
const selectMethod = (m: 'number' | 'time') => {
  method.value = m
  stage.value = 'question'
}

// 进入输入阶段
const goToInput = () => {
  stage.value = method.value
}

// 数字起卦
const doDivineByNumber = () => {
  const n1 = parseInt(num1.value)
  const n2 = parseInt(num2.value)
  result.value = divineByNumbers(n1, n2)
  stage.value = 'result'
}

// 时间起卦
const doDivineByTime = () => {
  const lunar = getLunarInfo()
  const currentHourNum = new Date().getHours()
  result.value = divineByCurrentTime(lunar.year, lunar.month, lunar.day, currentHourNum)
  stage.value = 'result'
}

// 查看解卦
const viewInterpretation = () => {
  if (!result.value) return
  
  uni.navigateTo({
    url: `/pages/result/result?binary=${result.value.hexagramBinary}&changeBinary=${result.value.changedBinary}&hasChange=true&question=${encodeURIComponent(question.value)}&meihua=true&tiGua=${result.value.tiGua}&yongGua=${result.value.yongGua}&tiElement=${result.value.tiElement}&yongElement=${result.value.yongElement}&relation=${encodeURIComponent(result.value.relation)}`
  })
}

// 再起一卦
const divineAgain = () => {
  stage.value = 'method'
  question.value = ''
  num1.value = ''
  num2.value = ''
  result.value = null
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
  padding: 30rpx;
}

/* 方法选择 */
.method-header {
  text-align: center;
  padding: 60rpx 0;
}

.method-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.method-title {
  font-size: 48rpx;
  color: #d4af37;
  display: block;
  margin-bottom: 10rpx;
}

.method-subtitle {
  font-size: 28rpx;
  color: #888888;
  display: block;
}

.method-list {
  margin-top: 40rpx;
}

.method-item {
  display: flex;
  align-items: center;
  background: rgba(212, 175, 55, 0.1);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.method-item-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.method-item-info {
  flex: 1;
}

.method-item-title {
  font-size: 32rpx;
  color: #d4af37;
  display: block;
}

.method-item-desc {
  font-size: 24rpx;
  color: #888888;
  display: block;
  margin-top: 8rpx;
}

.method-arrow {
  font-size: 36rpx;
  color: #d4af37;
}

/* 问题输入 */
.question-stage {
  padding: 60rpx 0;
}

.question-content {
  text-align: center;
}

.question-icon {
  font-size: 60rpx;
  display: block;
  margin-bottom: 20rpx;
}

.question-title {
  font-size: 40rpx;
  color: #d4af37;
  display: block;
  margin-bottom: 10rpx;
}

.question-subtitle {
  font-size: 26rpx;
  color: #888888;
  display: block;
  margin-bottom: 40rpx;
}

.question-textarea {
  width: 100%;
  height: 200rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  border-radius: 16rpx;
  padding: 20rpx;
  color: #ffffff;
  font-size: 28rpx;
  box-sizing: border-box;
}

.next-btn {
  margin-top: 40rpx;
  background: linear-gradient(135deg, #d4af37 0%, #aa8a2e 100%);
  color: #1a1a2e;
  font-size: 32rpx;
  font-weight: bold;
  padding: 24rpx;
  border-radius: 50rpx;
  border: none;
}

.skip-text {
  display: block;
  margin-top: 20rpx;
  font-size: 26rpx;
  color: #888888;
}

/* 数字输入 */
.number-stage {
  padding: 80rpx 0;
}

.number-content {
  text-align: center;
}

.number-title {
  font-size: 40rpx;
  color: #d4af37;
  display: block;
  margin-bottom: 10rpx;
}

.number-hint {
  font-size: 26rpx;
  color: #888888;
  display: block;
  margin-bottom: 60rpx;
}

.number-inputs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  margin-bottom: 60rpx;
}

.number-input {
  width: 200rpx;
  height: 100rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  border-radius: 16rpx;
  color: #d4af37;
  font-size: 40rpx;
  text-align: center;
}

.number-divider {
  font-size: 32rpx;
  color: #888888;
}

.divine-btn {
  background: linear-gradient(135deg, #d4af37 0%, #aa8a2e 100%);
  color: #1a1a2e;
  font-size: 36rpx;
  font-weight: bold;
  padding: 28rpx 120rpx;
  border-radius: 50rpx;
  border: none;
}

.divine-btn:disabled {
  opacity: 0.5;
}

/* 时间起卦 */
.time-stage {
  padding: 80rpx 0;
}

.time-content {
  text-align: center;
}

.time-title {
  font-size: 40rpx;
  color: #d4af37;
  display: block;
  margin-bottom: 10rpx;
}

.time-hint {
  font-size: 26rpx;
  color: #888888;
  display: block;
  margin-bottom: 60rpx;
}

.time-display {
  background: rgba(212, 175, 55, 0.1);
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 60rpx;
}

.time-lunar {
  font-size: 36rpx;
  color: #d4af37;
  display: block;
  margin-bottom: 10rpx;
}

.time-hour {
  font-size: 48rpx;
  color: #ffffff;
  display: block;
}

/* 结果展示 */
.result-stage {
  padding: 40rpx 0;
}

.result-content {
  text-align: center;
}

.result-title {
  font-size: 40rpx;
  color: #d4af37;
  display: block;
  margin-bottom: 40rpx;
}

.gua-display {
  display: flex;
  justify-content: center;
  gap: 60rpx;
  margin-bottom: 40rpx;
}

.gua-item {
  text-align: center;
}

.gua-symbol {
  font-size: 80rpx;
  display: block;
  margin-bottom: 10rpx;
}

.gua-name {
  font-size: 36rpx;
  color: #ffffff;
  display: block;
  margin-bottom: 8rpx;
}

.gua-role {
  font-size: 24rpx;
  color: #888888;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.1);
}

.gua-role.ti {
  color: #d4af37;
  background: rgba(212, 175, 55, 0.2);
}

.result-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
}

.info-item {
  display: block;
  font-size: 28rpx;
  color: #cccccc;
  margin-bottom: 12rpx;
}

.info-item.relation {
  font-size: 32rpx;
  color: #d4af37;
  margin-top: 16rpx;
  margin-bottom: 0;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.action-btn {
  font-size: 32rpx;
  font-weight: bold;
  padding: 28rpx;
  border-radius: 50rpx;
  border: none;
}

.action-btn.primary {
  background: linear-gradient(135deg, #d4af37 0%, #aa8a2e 100%);
  color: #1a1a2e;
}

.action-btn.secondary {
  background: rgba(212, 175, 55, 0.15);
  color: #d4af37;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}
</style>
</template>
