<template>
  <view class="container">
    <!-- 选择牌阵 -->
    <view class="stage stage-select" v-if="stage === 'select'">
      <view class="header">
        <text class="title">🔮 塔罗占卜</text>
        <text class="subtitle">选择你的占卜方式</text>
      </view>
      
      <view class="spread-options">
        <view class="spread-card" @click="selectSpread('single')">
          <text class="spread-icon">🎴</text>
          <text class="spread-name">单牌占卜</text>
          <text class="spread-desc">抽取一张牌，适合简单问题</text>
        </view>
        
        <view class="spread-card" @click="selectSpread('three')">
          <text class="spread-icon">🃏🃏🃏</text>
          <text class="spread-name">三牌阵</text>
          <text class="spread-desc">过去 · 现在 · 未来</text>
        </view>
      </view>
    </view>
    
    <!-- 输入问题 -->
    <view class="stage stage-question" v-else-if="stage === 'question'">
      <view class="header">
        <text class="title">✨ 冥想你的问题</text>
        <text class="subtitle">让心灵与牌产生连接</text>
      </view>
      
      <view class="question-input">
        <textarea 
          v-model="question"
          placeholder="在心中默念你的问题...（可留空）"
          maxlength="200"
        />
      </view>
      
      <view class="action-buttons">
        <button class="btn-secondary" @click="stage = 'select'">返回</button>
        <button class="btn-primary" @click="startShuffle">开始洗牌</button>
      </view>
    </view>
    
    <!-- 洗牌动画 -->
    <view class="stage stage-shuffle" v-else-if="stage === 'shuffle'">
      <view class="header">
        <text class="title">🌀 洗牌中...</text>
        <text class="subtitle">静心等待，感受牌的能量</text>
      </view>
      
      <view class="shuffle-area">
        <view 
          class="shuffle-card" 
          v-for="i in 7" 
          :key="i"
          :class="{ shuffling: isShuffling }"
          :style="{ animationDelay: `${i * 0.1}s` }"
        >
          <view class="card-back">
            <text class="card-star">✦</text>
          </view>
        </view>
      </view>
      
      <button class="btn-primary" @click="goToSelect" v-if="!isShuffling">选牌</button>
    </view>
    
    <!-- 选牌 -->
    <view class="stage stage-pick" v-else-if="stage === 'pick'">
      <view class="header">
        <text class="title">🎴 选择你的牌</text>
        <text class="subtitle">{{ pickHint }}</text>
      </view>
      
      <view class="pick-area">
        <view 
          class="pick-card"
          v-for="(card, index) in deckDisplay"
          :key="index"
          :class="{ picked: pickedIndices.includes(index), hovering: hoveringIndex === index }"
          @click="pickCard(index)"
          @mouseenter="hoveringIndex = index"
          @mouseleave="hoveringIndex = -1"
        >
          <view class="card-back">
            <text class="card-star">✦</text>
          </view>
        </view>
      </view>
      
      <view class="picked-count" v-if="pickedIndices.length > 0">
        已选择 {{ pickedIndices.length }} / {{ needCount }} 张
      </view>
    </view>
    
    <!-- 翻牌结果 -->
    <view class="stage stage-reveal" v-else-if="stage === 'reveal'">
      <view class="header">
        <text class="title">✨ 塔罗启示</text>
        <text class="subtitle">{{ spreadType === 'single' ? '单牌占卜' : '过去 · 现在 · 未来' }}</text>
      </view>
      
      <view class="reveal-cards">
        <view 
          class="reveal-card"
          v-for="(drawn, index) in drawnCards"
          :key="index"
          :class="{ revealed: revealedIndices.includes(index), reversed: drawn.isReversed }"
          @click="revealCard(index)"
        >
          <!-- 牌背 -->
          <view class="card-back" v-if="!revealedIndices.includes(index)">
            <text class="card-star">✦</text>
            <text class="position-label" v-if="drawn.position">{{ drawn.position }}</text>
          </view>
          
          <!-- 牌面 -->
          <view class="card-front" v-else>
            <text class="card-position" v-if="drawn.position">{{ drawn.position }}</text>
            <text class="card-emoji">{{ drawn.card.emoji }}</text>
            <text class="card-name">{{ drawn.card.chineseName }}</text>
            <text class="card-orientation">{{ drawn.isReversed ? '逆位' : '正位' }}</text>
            <view class="card-keywords">
              <text class="keyword" v-for="kw in drawn.card.keywords.slice(0, 2)" :key="kw">{{ kw }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="action-buttons" v-if="allRevealed">
        <button class="btn-primary" @click="viewInterpretation">🐕 请小狗解牌</button>
        <button class="btn-secondary" @click="resetReading">再占一次</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { majorArcana, type TarotCard, type DrawnCard } from '@/utils/tarot'

type Stage = 'select' | 'question' | 'shuffle' | 'pick' | 'reveal'
type SpreadType = 'single' | 'three'

const stage = ref<Stage>('select')
const spreadType = ref<SpreadType>('single')
const question = ref('')
const isShuffling = ref(false)
const drawnCards = ref<DrawnCard[]>([])
const revealedIndices = ref<number[]>([])
const pickedIndices = ref<number[]>([])
const hoveringIndex = ref(-1)

// 洗好的牌堆（每个位置对应一张牌+正逆位）
const shuffledDeck = ref<DrawnCard[]>([])

// 牌堆显示数量
const deckSize = 12
const deckDisplay = computed(() => Array(deckSize).fill(0))

// 需要选的牌数
const needCount = computed(() => spreadType.value === 'single' ? 1 : 3)

// 选牌提示
const pickHint = computed(() => {
  const remaining = needCount.value - pickedIndices.value.length
  if (remaining <= 0) return '点击牌查看结果'
  return `选择 ${remaining} 张牌`
})

// 是否全部翻开
const allRevealed = computed(() => revealedIndices.value.length === drawnCards.value.length)

// 选择牌阵
const selectSpread = (type: SpreadType) => {
  spreadType.value = type
  stage.value = 'question'
}

// Fisher-Yates 洗牌
const shuffleDeck = () => {
  const deck = [...majorArcana]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  // 生成展示用的牌堆（取前 deckSize 张，每张随机正逆位）
  shuffledDeck.value = deck.slice(0, deckSize).map(card => ({
    card,
    isReversed: Math.random() < 0.5
  }))
}

// 开始洗牌
const startShuffle = () => {
  stage.value = 'shuffle'
  isShuffling.value = true
  
  // 洗牌
  shuffleDeck()
  
  // 洗牌动画 2 秒
  setTimeout(() => {
    isShuffling.value = false
  }, 2000)
}

// 进入选牌
const goToSelect = () => {
  pickedIndices.value = []
  drawnCards.value = []
  stage.value = 'pick'
}

// 三牌阵位置名称
const positionNames = ['过去', '现在', '未来']

// 选牌 - 用户点哪个位置就是那张牌
const pickCard = (index: number) => {
  if (pickedIndices.value.includes(index)) return
  if (pickedIndices.value.length >= needCount.value) return
  
  pickedIndices.value.push(index)
  
  // 把选的牌加入结果
  const picked = shuffledDeck.value[index]
  const position = spreadType.value === 'three' ? positionNames[drawnCards.value.length] : undefined
  drawnCards.value.push({
    ...picked,
    position
  })
  
  // 选够了就进入翻牌阶段
  if (pickedIndices.value.length === needCount.value) {
    setTimeout(() => {
      revealedIndices.value = []
      stage.value = 'reveal'
    }, 500)
  }
}

// 翻牌
const revealCard = (index: number) => {
  if (!revealedIndices.value.includes(index)) {
    revealedIndices.value.push(index)
  }
}

// 查看解读
const viewInterpretation = () => {
  // 构建参数
  const cardsParam = drawnCards.value.map(d => ({
    id: d.card.id,
    name: d.card.chineseName,
    isReversed: d.isReversed,
    position: d.position || ''
  }))
  
  uni.navigateTo({
    url: `/pages/tarot-result/tarot-result?cards=${encodeURIComponent(JSON.stringify(cardsParam))}&question=${encodeURIComponent(question.value)}&spreadType=${spreadType.value}`
  })
}

// 重新开始
const resetReading = () => {
  stage.value = 'select'
  question.value = ''
  drawnCards.value = []
  revealedIndices.value = []
  pickedIndices.value = []
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a0a2e 0%, #16213e 50%, #0f0f1a 100%);
  padding: 40rpx;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.title {
  font-size: 48rpx;
  color: #e0c3fc;
  font-weight: bold;
  display: block;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #8b7fa8;
}

/* 牌阵选择 */
.spread-options {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.spread-card {
  background: linear-gradient(135deg, #2d1b4e 0%, #1f1035 100%);
  border: 2rpx solid rgba(224, 195, 252, 0.2);
  border-radius: 24rpx;
  padding: 40rpx;
  text-align: center;
  transition: all 0.3s;
}

.spread-card:active {
  transform: scale(0.98);
  border-color: rgba(224, 195, 252, 0.5);
}

.spread-icon {
  font-size: 60rpx;
  display: block;
  margin-bottom: 20rpx;
}

.spread-name {
  font-size: 36rpx;
  color: #e0c3fc;
  font-weight: bold;
  display: block;
  margin-bottom: 12rpx;
}

.spread-desc {
  font-size: 26rpx;
  color: #8b7fa8;
}

/* 问题输入 */
.question-input textarea {
  width: 100%;
  height: 200rpx;
  background: rgba(45, 27, 78, 0.6);
  border: 2rpx solid rgba(224, 195, 252, 0.2);
  border-radius: 20rpx;
  padding: 24rpx;
  color: #e0c3fc;
  font-size: 28rpx;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
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

/* 洗牌动画 */
.shuffle-area {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
  position: relative;
}

.shuffle-card {
  width: 120rpx;
  height: 180rpx;
  position: absolute;
  transition: all 0.5s ease;
}

.shuffle-card.shuffling {
  animation: shuffle 0.6s ease-in-out infinite alternate;
}

@keyframes shuffle {
  0% {
    transform: translateX(-100rpx) rotate(-15deg);
  }
  100% {
    transform: translateX(100rpx) rotate(15deg);
  }
}

.shuffle-card:nth-child(1) { animation-delay: 0s; }
.shuffle-card:nth-child(2) { animation-delay: 0.1s; }
.shuffle-card:nth-child(3) { animation-delay: 0.2s; }
.shuffle-card:nth-child(4) { animation-delay: 0.3s; }
.shuffle-card:nth-child(5) { animation-delay: 0.4s; }
.shuffle-card:nth-child(6) { animation-delay: 0.5s; }
.shuffle-card:nth-child(7) { animation-delay: 0.6s; }

/* 牌背 */
.card-back {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #2d1b4e 0%, #1f1035 100%);
  border: 2rpx solid rgba(224, 195, 252, 0.3);
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.card-star {
  font-size: 40rpx;
  color: #9d4edd;
}

/* 选牌区 */
.pick-area {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20rpx;
  padding: 20rpx;
}

.pick-card {
  width: 140rpx;
  height: 200rpx;
  transition: all 0.3s;
}

.pick-card.hovering {
  transform: translateY(-20rpx);
}

.pick-card.picked {
  opacity: 0.3;
  transform: scale(0.9);
}

.picked-count {
  text-align: center;
  color: #e0c3fc;
  font-size: 28rpx;
  margin-top: 40rpx;
}

/* 翻牌结果 */
.reveal-cards {
  display: flex;
  justify-content: center;
  gap: 30rpx;
  flex-wrap: wrap;
}

.reveal-card {
  width: 200rpx;
  height: 300rpx;
  perspective: 1000rpx;
  cursor: pointer;
}

.reveal-card .card-back,
.reveal-card .card-front {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
  transition: transform 0.6s;
  backface-visibility: hidden;
}

.reveal-card.revealed .card-back {
  display: none;
}

.reveal-card .card-front {
  background: linear-gradient(135deg, #3d2b5e 0%, #2a1b45 100%);
  border: 2rpx solid rgba(224, 195, 252, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16rpx;
}

.reveal-card.reversed .card-front {
  transform: rotate(180deg);
}

.reveal-card.reversed .card-front .card-position,
.reveal-card.reversed .card-front .card-emoji,
.reveal-card.reversed .card-front .card-name,
.reveal-card.reversed .card-front .card-orientation,
.reveal-card.reversed .card-front .card-keywords {
  transform: rotate(180deg);
}

.card-position {
  font-size: 22rpx;
  color: #9d4edd;
  margin-bottom: 8rpx;
}

.card-emoji {
  font-size: 60rpx;
  margin-bottom: 12rpx;
}

.card-name {
  font-size: 28rpx;
  color: #e0c3fc;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.card-orientation {
  font-size: 22rpx;
  color: #ffcc00;
  margin-bottom: 12rpx;
}

.card-keywords {
  display: flex;
  gap: 8rpx;
}

.keyword {
  font-size: 20rpx;
  color: #8b7fa8;
  background: rgba(157, 78, 221, 0.2);
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.position-label {
  font-size: 20rpx;
  color: #9d4edd;
  margin-top: 8rpx;
}
</style>
</template>
