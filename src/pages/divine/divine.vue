<template>
  <view class="container">
    <!-- 仪式引导阶段 -->
    <view class="ritual-stage" v-if="stage === 'ritual'">
      <view class="ritual-content">
        <text class="ritual-icon">🧘</text>
        <text class="ritual-title">静心冥想</text>
        <text class="ritual-text">请闭上眼睛，深呼吸三次</text>
        <text class="ritual-text">放空思想，专注于您的问题</text>
        
        <view class="breath-circle" :class="{ breathing: isBreathing }"></view>
        
        <text class="breath-hint">{{ breathHint }}</text>
        
        <view class="question-input" v-if="showQuestion">
          <text class="question-label">心中所问（可选）</text>
          <textarea 
            class="question-textarea" 
            v-model="question" 
            placeholder="在心中默念您的问题..."
            maxlength="100"
          />
        </view>
        
        <button class="start-btn" @click="startDivine" v-if="canStart">
          开始起卦
        </button>
      </view>
    </view>
    
    <!-- 摇卦阶段 -->
    <view class="divine-stage" v-if="stage === 'divine'">
      <view class="yao-display">
        <view 
          v-for="(yao, index) in yaoResults" 
          :key="index" 
          class="yao-line"
          :class="{ 
            'yao-yang': yao.type === 'yang' || yao.type === 'yang-change',
            'yao-yin': yao.type === 'yin' || yao.type === 'yin-change',
            'yao-change': yao.type === 'yang-change' || yao.type === 'yin-change',
            'yao-empty': !yao.type
          }"
        >
          <view v-if="yao.type === 'yin' || yao.type === 'yin-change'" class="yin-line">
            <view class="yin-part"></view>
            <view class="yin-gap"></view>
            <view class="yin-part"></view>
          </view>
          <view v-else-if="yao.type" class="yang-line"></view>
          <view v-else class="empty-line"></view>
          <text class="yao-label">{{ getYaoLabel(index) }}</text>
        </view>
      </view>
      
      <view class="coins-container">
        <view class="coin" v-for="(coin, index) in coins" :key="index" :class="{ flipping: isFlipping }">
          <view class="coin-face" :class="coin.face">
            {{ coin.face === 'yang' ? '乾' : '坤' }}
          </view>
        </view>
      </view>
      
      <text class="divine-hint">{{ divineHint }}</text>
      <text class="current-yao">第 {{ currentYao }} 爻</text>
      
      <button class="shake-btn" @click="shakeCoin" :disabled="isFlipping">
        {{ isFlipping ? '卦象生成中...' : '摇卦' }}
      </button>
    </view>
    
    <!-- 完成提示 -->
    <view class="complete-stage" v-if="stage === 'complete'">
      <text class="complete-icon">✨</text>
      <text class="complete-text">卦象已成</text>
      <button class="view-result-btn" @click="viewResult">查看卦象解读</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type Stage = 'ritual' | 'divine' | 'complete'
type YaoType = 'yang' | 'yin' | 'yang-change' | 'yin-change' | ''

interface YaoResult {
  type: YaoType
  value: number
}

interface CoinState {
  face: 'yang' | 'yin'
}

const stage = ref<Stage>('ritual')
const question = ref('')
const isBreathing = ref(false)
const breathHint = ref('准备开始...')
const showQuestion = ref(false)
const canStart = ref(false)

const currentYao = ref(1)
const yaoResults = ref<YaoResult[]>([
  { type: '', value: 0 },
  { type: '', value: 0 },
  { type: '', value: 0 },
  { type: '', value: 0 },
  { type: '', value: 0 },
  { type: '', value: 0 }
])
const coins = ref<CoinState[]>([
  { face: 'yang' },
  { face: 'yang' },
  { face: 'yang' }
])
const isFlipping = ref(false)
const divineHint = ref('点击下方按钮摇卦')

// 呼吸引导
const startBreathing = () => {
  isBreathing.value = true
  let count = 0
  const breathCycle = () => {
    if (count < 3) {
      breathHint.value = '吸气...'
      setTimeout(() => {
        breathHint.value = '呼气...'
        setTimeout(() => {
          count++
          if (count < 3) {
            breathCycle()
          } else {
            breathHint.value = '心神已定'
            isBreathing.value = false
            showQuestion.value = true
            setTimeout(() => {
              canStart.value = true
            }, 500)
          }
        }, 2000)
      }, 2000)
    }
  }
  breathCycle()
}

// 开始起卦
const startDivine = () => {
  stage.value = 'divine'
}

// 摇铜钱
const shakeCoin = () => {
  if (isFlipping.value || currentYao.value > 6) return
  
  isFlipping.value = true
  divineHint.value = '铜钱翻转中...'
  
  // 震动反馈
  uni.vibrateShort({ type: 'medium' })
  
  // 模拟铜钱翻转动画
  let flipCount = 0
  const flipInterval = setInterval(() => {
    coins.value = coins.value.map(() => ({
      face: Math.random() > 0.5 ? 'yang' : 'yin'
    }))
    flipCount++
    if (flipCount > 8) {
      clearInterval(flipInterval)
      
      // 计算结果：3个铜钱的正反面
      // 正面(乾)=3分，反面(坤)=2分
      // 6=老阴(变爻), 7=少阳, 8=少阴, 9=老阳(变爻)
      const finalCoins = coins.value.map(() => ({
        face: Math.random() > 0.5 ? 'yang' : 'yin' as 'yang' | 'yin'
      }))
      coins.value = finalCoins
      
      const sum = finalCoins.reduce((acc, coin) => acc + (coin.face === 'yang' ? 3 : 2), 0)
      
      let yaoType: YaoType
      switch (sum) {
        case 6: yaoType = 'yin-change'; break  // 老阴，变爻
        case 7: yaoType = 'yang'; break        // 少阳
        case 8: yaoType = 'yin'; break         // 少阴
        case 9: yaoType = 'yang-change'; break // 老阳，变爻
        default: yaoType = 'yang'
      }
      
      yaoResults.value[currentYao.value - 1] = { type: yaoType, value: sum }
      
      const yaoNames = ['初', '二', '三', '四', '五', '上']
      divineHint.value = `${yaoNames[currentYao.value - 1]}爻：${getYaoName(yaoType)}`
      
      isFlipping.value = false
      
      if (currentYao.value < 6) {
        currentYao.value++
        setTimeout(() => {
          divineHint.value = '点击下方按钮摇卦'
        }, 1500)
      } else {
        // 完成
        setTimeout(() => {
          stage.value = 'complete'
        }, 1500)
      }
    }
  }, 150)
}

const getYaoName = (type: YaoType): string => {
  switch (type) {
    case 'yang': return '少阳 ⚊'
    case 'yin': return '少阴 ⚋'
    case 'yang-change': return '老阳 ⚊→⚋ (变爻)'
    case 'yin-change': return '老阴 ⚋→⚊ (变爻)'
    default: return ''
  }
}

const getYaoLabel = (index: number): string => {
  const labels = ['初', '二', '三', '四', '五', '上']
  return labels[index]
}

const viewResult = () => {
  // 计算卦象并跳转
  const binary = yaoResults.value.map(y => {
    if (y.type === 'yang' || y.type === 'yang-change') return '1'
    return '0'
  }).join('')
  
  const changeBinary = yaoResults.value.map(y => {
    if (y.type === 'yang-change') return '0'  // 阳变阴
    if (y.type === 'yin-change') return '1'   // 阴变阳
    if (y.type === 'yang') return '1'
    return '0'
  }).join('')
  
  const hasChange = yaoResults.value.some(y => y.type === 'yang-change' || y.type === 'yin-change')
  
  // 保存原始数据
  const lines = yaoResults.value.map(y => y.value)
  
  uni.navigateTo({
    url: `/pages/result/result?binary=${binary}&changeBinary=${changeBinary}&hasChange=${hasChange}&question=${encodeURIComponent(question.value)}&lines=${lines.join(',')}`
  })
}

// 页面加载时开始呼吸引导
setTimeout(() => {
  startBreathing()
}, 500)
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 仪式引导阶段 */
.ritual-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.ritual-content {
  text-align: center;
  width: 100%;
}

.ritual-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 30rpx;
}

.ritual-title {
  font-size: 40rpx;
  color: #d4af37;
  font-weight: bold;
  display: block;
  margin-bottom: 20rpx;
}

.ritual-text {
  font-size: 28rpx;
  color: #a0a0a0;
  display: block;
  margin-bottom: 12rpx;
}

.breath-circle {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%);
  margin: 60rpx auto;
  transition: transform 2s ease-in-out;
}

.breath-circle.breathing {
  animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.3); opacity: 1; }
}

.breath-hint {
  font-size: 32rpx;
  color: #d4af37;
  display: block;
  margin-bottom: 40rpx;
}

.question-input {
  margin: 40rpx 0;
}

.question-label {
  font-size: 26rpx;
  color: #888888;
  display: block;
  margin-bottom: 16rpx;
}

.question-textarea {
  width: 100%;
  height: 150rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  border-radius: 16rpx;
  padding: 20rpx;
  color: #ffffff;
  font-size: 28rpx;
}

.start-btn {
  background: linear-gradient(135deg, #d4af37 0%, #aa8a2e 100%);
  color: #1a1a2e;
  font-size: 32rpx;
  font-weight: bold;
  padding: 24rpx 80rpx;
  border-radius: 50rpx;
  border: none;
  margin-top: 40rpx;
}

/* 摇卦阶段 */
.divine-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.yao-display {
  display: flex;
  flex-direction: column-reverse;
  gap: 16rpx;
  margin: 40rpx 0;
}

.yao-line {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.yang-line {
  width: 200rpx;
  height: 20rpx;
  background: #d4af37;
  border-radius: 4rpx;
}

.yin-line {
  display: flex;
  width: 200rpx;
  justify-content: space-between;
}

.yin-part {
  width: 80rpx;
  height: 20rpx;
  background: #d4af37;
  border-radius: 4rpx;
}

.yin-gap {
  width: 40rpx;
}

.empty-line {
  width: 200rpx;
  height: 20rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4rpx;
}

.yao-change .yang-line,
.yao-change .yin-part {
  background: #ff6b6b;
}

.yao-label {
  font-size: 24rpx;
  color: #888888;
  width: 40rpx;
}

.coins-container {
  display: flex;
  gap: 30rpx;
  margin: 40rpx 0;
}

.coin {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #d4af37 0%, #aa8a2e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(212, 175, 55, 0.4);
}

.coin.flipping {
  animation: flip 0.2s ease-in-out infinite;
}

@keyframes flip {
  0%, 100% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg); }
}

.coin-face {
  font-size: 36rpx;
  color: #1a1a2e;
  font-weight: bold;
}

.coin-face.yin {
  background: #2d2d44;
  color: #d4af37;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.divine-hint {
  font-size: 28rpx;
  color: #a0a0a0;
  margin-bottom: 16rpx;
}

.current-yao {
  font-size: 32rpx;
  color: #d4af37;
  margin-bottom: 40rpx;
}

.shake-btn {
  background: linear-gradient(135deg, #d4af37 0%, #aa8a2e 100%);
  color: #1a1a2e;
  font-size: 36rpx;
  font-weight: bold;
  padding: 30rpx 100rpx;
  border-radius: 50rpx;
  border: none;
}

.shake-btn:disabled {
  opacity: 0.6;
}

/* 完成阶段 */
.complete-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.complete-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.complete-text {
  font-size: 40rpx;
  color: #d4af37;
  margin-bottom: 60rpx;
}

.view-result-btn {
  background: linear-gradient(135deg, #d4af37 0%, #aa8a2e 100%);
  color: #1a1a2e;
  font-size: 32rpx;
  font-weight: bold;
  padding: 24rpx 80rpx;
  border-radius: 50rpx;
  border: none;
}
</style>
