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

const isLoggedIn = ref(false)
const userInfo = ref<any>({})

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
  if (userInfo.value.province && userInfo.value.city) {
    return `${userInfo.value.province} ${userInfo.value.city}`
  }
  return ''
})

const isProfileComplete = computed(() => {
  return userInfo.value.birthYear && userInfo.value.birthMonth && 
         userInfo.value.birthDay && userInfo.value.gender
})

// 微信登录
const handleLogin = async () => {
  try {
    const loginRes = await uni.login({ provider: 'weixin' })
    const code = loginRes.code
    
    const res = await uni.request({
      url: 'https://lonely.centralus.cloudapp.azure.com/api/divination/user/login',
      method: 'POST',
      data: { code }
    })
    
    if ((res.data as any).success) {
      const token = (res.data as any).token
      userInfo.value = (res.data as any).user
      isLoggedIn.value = true
      
      // 保存 token 和用户信息
      uni.setStorageSync('divination_token', token)
      uni.setStorageSync('divination_user', userInfo.value)
      
      // 更新生日显示
      if (userInfo.value.birthYear) {
        birthDate.value = `${userInfo.value.birthYear}-${String(userInfo.value.birthMonth).padStart(2, '0')}-${String(userInfo.value.birthDay).padStart(2, '0')}`
      }
    } else {
      uni.showToast({ title: '登录失败', icon: 'none' })
    }
  } catch (e) {
    console.error('登录失败:', e)
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

// 获取定位（使用模糊定位，无需用户授权）
const getLocation = async () => {
  try {
    // 使用 wx.getFuzzyLocation 获取模糊定位
    // @ts-ignore
    wx.getFuzzyLocation({
      type: 'gcj02',
      success: async (res: any) => {
        userInfo.value.latitude = res.latitude
        userInfo.value.longitude = res.longitude
        
        // 调用后端逆地理编码
        try {
          const geoRes = await uni.request({
            url: `https://lonely.centralus.cloudapp.azure.com/api/divination/geocode?lat=${res.latitude}&lng=${res.longitude}`
          })
          if ((geoRes.data as any).success) {
            userInfo.value.province = (geoRes.data as any).province
            userInfo.value.city = (geoRes.data as any).city
          }
        } catch (e) {
          userInfo.value.province = '已定位'
          userInfo.value.city = ''
        }
        
        uni.showToast({ title: '定位成功', icon: 'success' })
      },
      fail: (err: any) => {
        console.error('定位失败:', err)
        // 如果是模糊定位不可用，尝试普通定位
        uni.getLocation({
          type: 'gcj02',
          success: async (res) => {
            userInfo.value.latitude = res.latitude
            userInfo.value.longitude = res.longitude
            
            try {
              const geoRes = await uni.request({
                url: `https://lonely.centralus.cloudapp.azure.com/api/divination/geocode?lat=${res.latitude}&lng=${res.longitude}`
              })
              if ((geoRes.data as any).success) {
                userInfo.value.province = (geoRes.data as any).province
                userInfo.value.city = (geoRes.data as any).city
              }
            } catch (e) {
              userInfo.value.province = '已定位'
              userInfo.value.city = ''
            }
            
            uni.showToast({ title: '定位成功', icon: 'success' })
          },
          fail: (err2) => {
            console.error('普通定位也失败:', err2)
            uni.showToast({ title: '请在设置中开启位置权限', icon: 'none' })
          }
        })
      }
    })
  } catch (e) {
    console.error('定位异常:', e)
    uni.showToast({ title: '定位失败', icon: 'none' })
  }
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

// 检查登录状态
onMounted(() => {
  const savedToken = uni.getStorageSync('divination_token')
  const savedUser = uni.getStorageSync('divination_user')
  
  if (savedToken) {
    userInfo.value = savedUser || {}
    isLoggedIn.value = true
    
    if (userInfo.value.birthYear) {
      birthDate.value = `${userInfo.value.birthYear}-${String(userInfo.value.birthMonth).padStart(2, '0')}-${String(userInfo.value.birthDay).padStart(2, '0')}`
    }
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
