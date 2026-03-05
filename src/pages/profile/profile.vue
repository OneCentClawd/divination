<template>
  <view class="container">
    <!-- 未登录状态 -->
    <view class="login-card" v-if="!isLoggedIn">
      <text class="login-title">登录后可保存您的资料</text>
      <text class="login-desc">用于计算专属今日运势</text>
      <button class="login-btn" @click="handleLogin">微信一键登录</button>
    </view>
    
    <!-- 已登录状态 -->
    <view class="profile-card" v-else>
      <view class="profile-header">
        <image class="avatar" :src="userInfo.avatarUrl || '/static/default-avatar.png'" mode="aspectFill" />
        <view class="profile-name">
          <text class="nickname">{{ userInfo.nickname || '易卦用户' }}</text>
          <text class="profile-status" v-if="isProfileComplete">资料已完善</text>
          <text class="profile-status incomplete" v-else>请完善资料</text>
        </view>
      </view>
    </view>
    
    <!-- 资料表单 -->
    <view class="form-card" v-if="isLoggedIn">
      <view class="form-title">生辰八字</view>
      
      <view class="form-item">
        <text class="form-label">出生日期</text>
        <picker mode="date" :value="birthDate" @change="onBirthDateChange">
          <view class="form-value">
            <text>{{ birthDate || '请选择' }}</text>
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="form-label">出生时辰</text>
        <picker :range="hourOptions" :range-key="'label'" @change="onBirthHourChange">
          <view class="form-value">
            <text>{{ selectedHourLabel || '请选择' }}</text>
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="form-label">性别</text>
        <picker :range="genderOptions" @change="onGenderChange">
          <view class="form-value">
            <text>{{ genderOptions[userInfo.gender] || '请选择' }}</text>
            <text class="arrow">›</text>
          </view>
        </picker>
      </view>
    </view>
    
    <!-- 定位 -->
    <view class="form-card" v-if="isLoggedIn">
      <view class="form-title">所在位置</view>
      
      <view class="form-item" @click="getLocation">
        <text class="form-label">当前位置</text>
        <view class="form-value">
          <text>{{ locationText || '点击获取' }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>
    
    <!-- 保存按钮 -->
    <button class="save-btn" @click="saveProfile" v-if="isLoggedIn">保存资料</button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const isLoggedIn = ref(false)
const userInfo = ref<any>({})
const isMounted = ref(false)

const birthDate = ref('')
const genderOptions = ['未知', '男', '女']
const hourOptions = [
  { label: '子时 (23:00-01:00)', value: 0 },
  { label: '丑时 (01:00-03:00)', value: 1 },
  { label: '寅时 (03:00-05:00)', value: 2 },
  { label: '卯时 (05:00-07:00)', value: 3 },
  { label: '辰时 (07:00-09:00)', value: 4 },
  { label: '巳时 (09:00-11:00)', value: 5 },
  { label: '午时 (11:00-13:00)', value: 6 },
  { label: '未时 (13:00-15:00)', value: 7 },
  { label: '申时 (15:00-17:00)', value: 8 },
  { label: '酉时 (17:00-19:00)', value: 9 },
  { label: '戌时 (19:00-21:00)', value: 10 },
  { label: '亥时 (21:00-23:00)', value: 11 }
]

const selectedHourLabel = computed(() => {
  if (userInfo.value.birthHour !== undefined && userInfo.value.birthHour !== null) {
    return hourOptions[userInfo.value.birthHour]?.label
  }
  return ''
})

const locationText = computed(() => {
  // 优先用 locationDisplay（手动选择的地点名）
  if (userInfo.value.locationDisplay) {
    return userInfo.value.locationDisplay
  }
  // 其次用省市
  if (userInfo.value.province || userInfo.value.city) {
    const parts = [userInfo.value.province, userInfo.value.city].filter(Boolean)
    return parts.join(' ')
  }
  return ''
})

const isProfileComplete = computed(() => {
  return userInfo.value.birthYear && userInfo.value.birthMonth && 
         userInfo.value.birthDay && userInfo.value.gender
})

// 微信登录
const handleLogin = async () => {
  console.log('[登录] 开始登录流程')
  try {
    const loginRes = await uni.login({ provider: 'weixin' })
    const code = loginRes.code
    console.log('[登录] 获取到 code:', code)
    
    if (!code) {
      console.log('[登录] code 为空')
      uni.showToast({ title: '获取登录凭证失败', icon: 'none' })
      return
    }
    
    console.log('[登录] 发送登录请求...')
    const res = await uni.request({
      url: 'https://lonely.centralus.cloudapp.azure.com/api/divination/user/login',
      method: 'POST',
      data: { code }
    })
    
    console.log('[登录] 响应 statusCode:', res.statusCode)
    console.log('[登录] 响应 data:', JSON.stringify(res.data))
    
    if ((res.data as any).success) {
      const token = (res.data as any).token
      userInfo.value = (res.data as any).user
      isLoggedIn.value = true
      console.log('[登录] 登录成功, token:', token?.substring(0, 20) + '...')
      
      // 保存 token 和用户信息
      uni.setStorageSync('divination_token', token)
      uni.setStorageSync('divination_user', userInfo.value)
      
      // 更新生日显示
      if (userInfo.value.birthYear) {
        birthDate.value = `${userInfo.value.birthYear}-${String(userInfo.value.birthMonth).padStart(2, '0')}-${String(userInfo.value.birthDay).padStart(2, '0')}`
      }
    } else {
      console.log('[登录] 登录失败:', (res.data as any).error)
      uni.showToast({ title: (res.data as any).error || '登录失败', icon: 'none' })
    }
  } catch (e) {
    console.error('[登录] 异常:', e)
    uni.showToast({ title: '登录失败', icon: 'none' })
  }
}

// 选择出生日期
const onBirthDateChange = (e: any) => {
  birthDate.value = e.detail.value
  const parts = e.detail.value.split('-')
  userInfo.value.birthYear = parseInt(parts[0])
  userInfo.value.birthMonth = parseInt(parts[1])
  userInfo.value.birthDay = parseInt(parts[2])
}

// 选择出生时辰
const onBirthHourChange = (e: any) => {
  const index = parseInt(e.detail.value)
  // 直接存时辰序号 0-11（子丑寅卯辰巳午未申酉戌亥）
  userInfo.value.birthHour = index
}

// 选择性别
const onGenderChange = (e: any) => {
  userInfo.value.gender = parseInt(e.detail.value)
}

// 获取定位 - 直接让用户选择位置
const getLocation = () => {
  chooseLocationManually()
}

// 手动选择位置
const chooseLocationManually = () => {
  uni.chooseLocation({
    success: async (res) => {
      userInfo.value.latitude = res.latitude
      userInfo.value.longitude = res.longitude
      
      // 用于显示的地址文本（只显示地点名，简短）
      const displayText = res.name || res.address || '已定位'
      userInfo.value.locationDisplay = displayText
      
      // 调后端获取真实省市（用于运势计算，不等待）
      handleLocationSuccess(res.latitude, res.longitude)
      
      uni.showToast({ title: '定位成功', icon: 'success' })
    },
    fail: () => {
      uni.showToast({ title: '取消选择', icon: 'none' })
    }
  })
}

// 处理定位成功
const handleLocationSuccess = async (lat: number, lng: number) => {
  userInfo.value.latitude = lat
  userInfo.value.longitude = lng
  
  // 设置默认显示
  userInfo.value.province = '已定位'
  userInfo.value.city = ''
  userInfo.value.locationDisplay = `${lat.toFixed(2)}, ${lng.toFixed(2)}`
  
  // 尝试调用后端逆地理编码
  try {
    const geoRes = await uni.request({
      url: `https://lonely.centralus.cloudapp.azure.com/api/divination/geocode?lat=${lat}&lng=${lng}`,
      timeout: 5000
    })
    if ((geoRes.data as any).success) {
      const province = (geoRes.data as any).province || ''
      const city = (geoRes.data as any).city || ''
      userInfo.value.province = province || '已定位'
      userInfo.value.city = city
      if (province || city) {
        userInfo.value.locationDisplay = [province, city].filter(Boolean).join(' ')
      }
    }
  } catch (e) {
    console.error('逆地理编码失败:', e)
  }
  
  uni.showToast({ title: '定位成功', icon: 'success' })
}

// 保存资料
const saveProfile = async () => {
  try {
    const token = uni.getStorageSync('divination_token')
    const res = await uni.request({
      url: 'https://lonely.centralus.cloudapp.azure.com/api/divination/user/profile',
      method: 'POST',
      header: { 'Authorization': `Bearer ${token}` },
      data: userInfo.value
    })
    
    if ((res.data as any).success) {
      uni.setStorageSync('divination_user', (res.data as any).user)
      uni.showToast({ title: '保存成功', icon: 'success' })
    } else {
      uni.showToast({ title: '保存失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '网络错误', icon: 'none' })
  }
}

// 计算两点距离（公里）
const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// 是否已经询问过位置更新
const hasAskedLocationUpdate = ref(false)

// 自动尝试模糊定位
const tryAutoLocation = () => {
  // @ts-ignore
  wx.getFuzzyLocation({
    type: 'gcj02',
    success: async (res: any) => {
      const newLat = res.latitude
      const newLng = res.longitude
      const oldLat = userInfo.value.latitude
      const oldLng = userInfo.value.longitude
      
      // 情况1：用户没有位置信息，直接覆盖
      if (!oldLat || !oldLng) {
        userInfo.value.latitude = newLat
        userInfo.value.longitude = newLng
        await handleLocationSuccess(newLat, newLng)
        return
      }
      
      // 情况2：用户有位置信息，检查距离差异
      const distance = calcDistance(oldLat, oldLng, newLat, newLng)
      
      // 距离超过 50 公里认为是"很远"
      if (distance > 50 && !hasAskedLocationUpdate.value) {
        hasAskedLocationUpdate.value = true
        uni.showModal({
          title: '位置变化',
          content: `检测到您当前位置距离上次相差约 ${Math.round(distance)} 公里，是否更新？`,
          confirmText: '更新位置',
          cancelText: '保持原位置',
          success: async (modalRes) => {
            if (modalRes.confirm) {
              userInfo.value.latitude = newLat
              userInfo.value.longitude = newLng
              await handleLocationSuccess(newLat, newLng)
              uni.showToast({ title: '位置已更新', icon: 'success' })
            }
          }
        })
      }
    },
    fail: () => {
      // 自动定位失败，不做处理
    }
  })
}

// 检查登录状态
const checkLoginStatus = async () => {
  console.log('[checkLogin] 检查登录状态')
  const savedToken = uni.getStorageSync('divination_token')
  const savedUser = uni.getStorageSync('divination_user')
  console.log('[checkLogin] savedToken:', savedToken ? savedToken.substring(0, 20) + '...' : 'null')
  
  if (savedToken) {
    // 验证 token 是否有效
    console.log('[checkLogin] 验证 token...')
    try {
      const res = await uni.request({
        url: 'https://lonely.centralus.cloudapp.azure.com/api/divination/user/profile',
        method: 'GET',
        header: { 'Authorization': `Bearer ${savedToken}` }
      })
      
      console.log('[checkLogin] 验证响应 statusCode:', res.statusCode)
      console.log('[checkLogin] 验证响应 data:', JSON.stringify(res.data))
      
      if (res.statusCode === 200 && (res.data as any).success) {
        // token 有效
        console.log('[checkLogin] token 有效')
        userInfo.value = (res.data as any).user || savedUser || {}
        isLoggedIn.value = true
        
        // 更新本地缓存
        uni.setStorageSync('divination_user', userInfo.value)
        
        if (userInfo.value.birthYear) {
          birthDate.value = `${userInfo.value.birthYear}-${String(userInfo.value.birthMonth).padStart(2, '0')}-${String(userInfo.value.birthDay).padStart(2, '0')}`
        }
        
        // 尝试自动定位
        tryAutoLocation()
      } else {
        // token 无效，清除登录状态
        console.log('[checkLogin] token 无效，清除登录状态')
        uni.removeStorageSync('divination_token')
        uni.removeStorageSync('divination_user')
        isLoggedIn.value = false
      }
    } catch (e) {
      console.error('[checkLogin] 验证 token 异常:', e)
      // 网络错误时先用本地数据，不清除登录状态
      userInfo.value = savedUser || {}
      isLoggedIn.value = true
      
      if (userInfo.value.birthYear) {
        birthDate.value = `${userInfo.value.birthYear}-${String(userInfo.value.birthMonth).padStart(2, '0')}-${String(userInfo.value.birthDay).padStart(2, '0')}`
      }
    }
  } else {
    console.log('[checkLogin] 无 token，显示登录按钮')
    isLoggedIn.value = false
  }
}

onMounted(() => {
  console.log('[onMounted] 组件挂载')
  isMounted.value = true
  checkLoginStatus()
})

onShow(() => {
  console.log('[onShow] 页面显示, isMounted:', isMounted.value)
  // 只有挂载后才执行，避免首次渲染前调用
  if (isMounted.value) {
    checkLoginStatus()
  }
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
  padding: 30rpx;
}

.login-card {
  background: linear-gradient(135deg, #2d2d44 0%, #1f1f35 100%);
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  text-align: center;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}

.login-title {
  font-size: 36rpx;
  color: #ffffff;
  display: block;
  margin-bottom: 16rpx;
}

.login-desc {
  font-size: 26rpx;
  color: #888888;
  display: block;
  margin-bottom: 40rpx;
}

.login-btn {
  background: linear-gradient(135deg, #d4af37 0%, #aa8a2e 100%);
  color: #1a1a2e;
  font-size: 30rpx;
  font-weight: bold;
  padding: 24rpx 80rpx;
  border-radius: 50rpx;
  border: none;
}

.profile-card {
  background: linear-gradient(135deg, #2d2d44 0%, #1f1f35 100%);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  border: 2rpx solid #d4af37;
}

.profile-name {
  flex: 1;
}

.nickname {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: bold;
  display: block;
}

.profile-status {
  font-size: 24rpx;
  color: #4CAF50;
}

.profile-status.incomplete {
  color: #ff9800;
}

.form-card {
  background: linear-gradient(135deg, #2d2d44 0%, #1f1f35 100%);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}

.form-title {
  font-size: 28rpx;
  color: #d4af37;
  margin-bottom: 24rpx;
  font-weight: bold;
}

.form-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  font-size: 28rpx;
  color: #ffffff;
}

.form-value {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #888888;
  font-size: 28rpx;
}

.arrow {
  color: #666666;
  font-size: 32rpx;
}

.save-btn {
  background: linear-gradient(135deg, #d4af37 0%, #aa8a2e 100%);
  color: #1a1a2e;
  font-size: 30rpx;
  font-weight: bold;
  padding: 24rpx;
  border-radius: 50rpx;
  border: none;
  margin-top: 20rpx;
}
</style>
