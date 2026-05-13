<script setup>
import { ref } from 'vue'
import WeddingForm from './components/WeddingForm.vue'
import WeddingInvitation from './components/WeddingInvitation.vue'
import BatchProcessor from './components/BatchProcessor.vue'

// 页面模式: 'home' | 'single' | 'batch'
const currentMode = ref('home')

const form = ref({
  groomName: '',
  brideName: '',
  guestName: '',
  guestGender: 'male',
  weddingDate: '',
  weddingTime: '',
  venue: '',
  style: 'photo-elegant',
  couplePhoto: ''
})

const generateInvitation = () => {
  if (!form.value.guestName.trim()) {
    alert('请输入宾客姓名')
    return
  }
  currentMode.value = 'single'
}

const goBack = () => {
  currentMode.value = 'home'
}

const goBatch = () => {
  currentMode.value = 'batch'
}
</script>

<template>
  <div class="app-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="petal petal-1"></div>
      <div class="petal petal-2"></div>
      <div class="petal petal-3"></div>
      <div class="petal petal-4"></div>
      <div class="petal petal-5"></div>
      <div class="petal petal-6"></div>
      <div class="petal petal-7"></div>
      <div class="petal petal-8"></div>
    </div>

    <transition name="fade" mode="out-in">
      <!-- 首页 -->
      <div v-if="currentMode === 'home'" key="home" class="form-page">
        <div class="page-header">
          <div class="header-deco">✦</div>
          <h1 class="page-title">婚礼邀请函生成器</h1>
          <p class="page-subtitle">为您定制专属的婚礼邀请</p>
          <div class="header-deco">✦</div>
        </div>
        <WeddingForm :form="form" @generate="generateInvitation" />
        <div class="batch-entry">
          <button class="batch-entry-btn" @click="goBatch">
            📦 批量生成
          </button>
        </div>
      </div>

      <!-- 单张邀请 -->
      <div v-else-if="currentMode === 'single'" key="single" class="invitation-page">
        <WeddingInvitation :form="form" @back="goBack" />
      </div>

      <!-- 批量生成 -->
      <BatchProcessor v-else-if="currentMode === 'batch'" key="batch" @back="goBack" />
    </transition>
  </div>
</template>

<style scoped>
.app-container {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

/* 飘落花瓣背景 */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.petal {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50% 0 50% 50%;
  opacity: 0.3;
  animation: falling linear infinite;
}

.petal-1 { background: #f9a8d4; left: 10%; animation-duration: 12s; animation-delay: 0s; top: -20px; }
.petal-2 { background: #f472b6; left: 25%; animation-duration: 15s; animation-delay: 2s; top: -20px; width: 10px; height: 10px; }
.petal-3 { background: #ec4899; left: 40%; animation-duration: 10s; animation-delay: 4s; top: -20px; width: 14px; height: 14px; }
.petal-4 { background: #f9a8d4; left: 55%; animation-duration: 14s; animation-delay: 1s; top: -20px; }
.petal-5 { background: #f472b6; left: 70%; animation-duration: 11s; animation-delay: 3s; top: -20px; width: 8px; height: 8px; }
.petal-6 { background: #ec4899; left: 85%; animation-duration: 13s; animation-delay: 5s; top: -20px; width: 11px; height: 11px; }
.petal-7 { background: #fbb6ce; left: 15%; animation-duration: 16s; animation-delay: 6s; top: -20px; width: 9px; height: 9px; }
.petal-8 { background: #f9a8d4; left: 60%; animation-duration: 9s; animation-delay: 7s; top: -20px; width: 13px; height: 13px; }

@keyframes falling {
  0% {
    transform: translateY(-20px) rotate(0deg) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(100vh) rotate(720deg) translateX(100px);
    opacity: 0;
  }
}

.form-page,
.invitation-page {
  position: relative;
  z-index: 1;
}

.page-header {
  text-align: center;
  padding: 40px 20px 20px;
}

.page-title {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 2.8rem;
  color: #9f1239;
  margin: 10px 0;
  letter-spacing: 4px;
  text-shadow: 1px 1px 2px rgba(159, 18, 57, 0.1);
}

.page-subtitle {
  font-size: 1rem;
  color: #be185d;
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.header-deco {
  color: #f472b6;
  font-size: 1.2rem;
  letter-spacing: 8px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
}

/* 批量入口 */
.batch-entry {
  text-align: center;
  margin: 20px auto 40px;
  max-width: 700px;
}

.batch-entry-btn {
  padding: 12px 36px;
  background: linear-gradient(135deg, #8B5CF6, #A78BFA);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.05rem;
  font-family: 'Noto Serif SC', serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 3px;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.25);
}

.batch-entry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.35);
}
</style>
