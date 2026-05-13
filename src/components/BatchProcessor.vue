<script setup>
import { ref, computed, watch } from 'vue'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import WeddingInvitation from './WeddingInvitation.vue'
import { downloadTemplate, readGuestList } from '../utils/xlsTemplate.js'

const emit = defineEmits(['back'])

// ===== 共享设置 =====
const settings = ref({
  groomName: '',
  brideName: '',
  weddingDate: '',
  weddingTime: '',
  venue: '',
  style: 'photo-elegant',
  couplePhoto: ''
})

const fileInput = ref(null)

const handlePhoto = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { settings.value.couplePhoto = ev.target.result }
  reader.readAsDataURL(file)
}

const removePhoto = () => {
  settings.value.couplePhoto = ''
  if (fileInput.value) fileInput.value.value = ''
}

const triggerUpload = () => fileInput.value?.click()

// ===== XLS 上传与预览 =====
const guests = ref([])
const fileName = ref('')
const isProcessing = ref(false)
const processingProgress = ref(0)

const handleFileUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  fileName.value = file.name
  try {
    guests.value = await readGuestList(file)
  } catch (err) {
    alert(err.message)
    guests.value = []
    fileName.value = ''
  }
}

const clearGuests = () => {
  guests.value = []
  fileName.value = ''
}

const totalGuests = computed(() => guests.value.length)

// ===== 构建传递给 WeddingInvitation 的 form 数据 =====
const currentGuestIndex = ref(0)
const currentGuest = computed(() => guests.value[currentGuestIndex.value] || null)

const previewForm = computed(() => {
  const g = currentGuest.value
  return {
    groomName: settings.value.groomName,
    brideName: settings.value.brideName,
    guestName: g ? g.guestName : '预览',
    guestGender: g ? g.guestGender : 'male',
    weddingDate: settings.value.weddingDate,
    weddingTime: settings.value.weddingTime,
    venue: settings.value.venue,
    style: settings.value.style,
    couplePhoto: settings.value.couplePhoto
  }
})

// ===== 批量处理 =====
const cardRef = ref(null)
const invitationComp = ref(null)  // WeddingInvitation 组件引用

const startBatch = async () => {
  if (!settings.value.groomName.trim() || !settings.value.brideName.trim()) {
    alert('请填写新郎和新娘姓名')
    return
  }
  if (guests.value.length === 0) {
    alert('请先上传宾客名单')
    return
  }

  isProcessing.value = true
  processingProgress.value = 0
  const zip = new JSZip()
  const total = guests.value.length

  for (let i = 0; i < total; i++) {
    currentGuestIndex.value = i
    await nextFrame()
    await nextFrame()

    try {
      const el = invitationComp.value?.invitationRef
      if (!el) continue

      // 调用 WeddingInvitation 暴露的统一渲染方法
      const canvas = await invitationComp.value.renderToCanvas(el, settings.value.style)
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      const guest = guests.value[i]
      const title = guest.guestGender === 'male' ? '先生' : '女士'
      zip.file(`婚礼邀请函-${guest.guestName}${title}.png`, blob)
    } catch (err) {
      console.error(`生成 ${guests.value[i].guestName} 的邀请函失败`, err)
    }

    processingProgress.value = Math.round(((i + 1) / total) * 100)
  }

  currentGuestIndex.value = 0

  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    saveAs(zipBlob, `婚礼邀请函批量生成_${settings.value.groomName}_${settings.value.brideName}.zip`)
    alert(`批量生成完成！共成功生成 ${total} 张邀请函。`)
  } catch (err) {
    alert('打包下载失败：' + err.message)
  } finally {
    isProcessing.value = false
    processingProgress.value = 0
  }
}

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))
</script>

<template>
  <div class="batch-page">
    <div class="batch-header">
      <button class="top-btn back-btn" @click="emit('back')">← 返回首页</button>
      <button class="top-btn template-btn" @click="downloadTemplate">📥 下载模板</button>
    </div>

    <div class="batch-layout">
      <!-- 左侧：设置区 -->
      <div class="batch-settings">
        <div class="settings-card">
          <h3 class="settings-title">📋 共享信息设置</h3>

          <div class="form-row">
            <div class="form-group">
              <label>新郎姓名 <span class="required">*</span></label>
              <input v-model="settings.groomName" placeholder="请输入新郎姓名" class="batch-input" />
            </div>
            <div class="form-group">
              <label>新娘姓名 <span class="required">*</span></label>
              <input v-model="settings.brideName" placeholder="请输入新娘姓名" class="batch-input" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>婚礼日期</label>
              <input v-model="settings.weddingDate" type="date" class="batch-input" />
            </div>
            <div class="form-group">
              <label>婚礼时间</label>
              <input v-model="settings.weddingTime" type="time" class="batch-input" />
            </div>
          </div>

          <div class="form-group full">
            <label>婚礼地点</label>
            <input v-model="settings.venue" placeholder="请输入婚礼举办地点" class="batch-input" />
          </div>

          <div class="form-group full">
            <label>邀请函风格</label>
            <div class="style-tabs">
              <label v-for="s in [
                { value: 'photo-elegant', label: '照片主视觉', icon: '📷' },
                { value: 'fresh-nature', label: '森系小清新', icon: '🌿' },
                { value: 'classic', label: '经典中国风', icon: '🏮' },
                { value: 'romantic', label: '浪漫花卉', icon: '🌸' },
                { value: 'elegant', label: '简约优雅', icon: '✨' },
                { value: 'chinoiserie', label: '水墨丹青', icon: '🖌️' }
              ]" :key="s.value" class="style-tab" :class="{ active: settings.style === s.value }">
                <input type="radio" v-model="settings.style" :value="s.value" />
                <span>{{ s.icon }} {{ s.label }}</span>
              </label>
            </div>
          </div>

          <div class="form-group full">
            <label>新人合照</label>
            <input ref="fileInput" type="file" accept="image/*" @change="handlePhoto" class="hidden-file" />
            <div v-if="!settings.couplePhoto" class="photo-upload" @click="triggerUpload">
              <span>📷 点击上传合照</span>
            </div>
            <div v-else class="photo-preview-row">
              <img :src="settings.couplePhoto" class="photo-thumb" />
              <button class="small-btn" @click="triggerUpload">更换</button>
              <button class="small-btn danger" @click="removePhoto">移除</button>
            </div>
          </div>

          <!-- 宾客 XLS 上传 -->
          <div class="form-group full">
            <label>宾客名单（XLS） <span class="required">*</span></label>
            <div v-if="!guests.length" class="xls-upload" @click="$refs.xlsInput.click()">
              <span>📄 点击上传 XLS 文件</span>
            </div>
            <div v-else class="xls-info">
              <span>✅ {{ fileName }}（共 {{ totalGuests }} 位宾客）</span>
              <button class="small-btn" @click="clearGuests">清空</button>
            </div>
            <input ref="xlsInput" type="file" accept=".xlsx,.xls" @change="handleFileUpload" class="hidden-file" />
          </div>

          <button class="batch-start-btn" :disabled="isProcessing || !guests.length" @click="startBatch">
            {{ isProcessing ? `⏳ 生成中 ${processingProgress}%` : '🚀 批量生成并下载' }}
          </button>
          <div v-if="isProcessing" class="progress-bar-wrap">
            <div class="progress-bar" :style="{ width: processingProgress + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览区 - 直接复用 WeddingInvitation -->
      <div class="batch-preview">
        <h3 class="preview-title">👁️ 预览效果</h3>
        <div class="preview-note">显示第一位宾客的效果，实际生成每位宾客不同</div>
        <div class="preview-card-wrap">
          <div class="preview-card" ref="cardRef">
            <WeddingInvitation ref="invitationComp" :form="previewForm" :hideActions="true" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.batch-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 30%, #fbcfe8 60%, #f9a8d4 100%);
  padding: 20px;
}

.batch-header {
  display: flex;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto 20px;
}

.top-btn {
  padding: 10px 22px;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: 'Noto Serif SC', serif;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.back-btn { background: rgba(255,255,255,0.85); color: #9f1239; border: 1.5px solid rgba(244,114,182,0.3); }
.back-btn:hover { background: white; }

.template-btn { background: linear-gradient(135deg, #ec4899, #f472b6); color: white; }
.template-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(236,72,153,0.3); }

.batch-layout {
  display: flex;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  align-items: flex-start;
}

.batch-settings { flex: 1; min-width: 0; }
.batch-preview { width: 540px; flex-shrink: 0; }

.settings-card {
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 8px 32px rgba(159,18,57,0.08);
  border: 1px solid rgba(244,114,182,0.15);
}

.settings-title {
  font-size: 1.2rem;
  color: #9f1239;
  margin-bottom: 20px;
  font-weight: 600;
}

.form-row { display: flex; gap: 14px; margin-bottom: 14px; }
.form-group { flex: 1; margin-bottom: 12px; }
.form-group.full { width: 100%; }
.form-group label { display: block; font-size: 0.85rem; color: #6b2140; margin-bottom: 5px; font-weight: 500; }
.required { color: #e11d48; }

.batch-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid rgba(244,114,182,0.25);
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'Noto Serif SC', serif;
  color: #4a2c2a;
  background: rgba(255,255,255,0.6);
  transition: all 0.3s ease;
  outline: none;
  box-sizing: border-box;
}
.batch-input:focus { border-color: #f472b6; box-shadow: 0 0 0 3px rgba(244,114,182,0.12); background: white; }
.batch-input::placeholder { color: #d1a0b0; }

.hidden-file { display: none; }

.photo-upload, .xls-upload {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border: 2px dashed rgba(244,114,182,0.3);
  border-radius: 10px;
  cursor: pointer;
  color: #9f1239;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  background: rgba(255,255,255,0.4);
}
.photo-upload:hover, .xls-upload:hover { border-color: #ec4899; background: rgba(236,72,153,0.05); }

.photo-preview-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.photo-thumb { width: 80px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(244,114,182,0.2); }

.xls-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(236,72,153,0.06);
  border: 1px solid rgba(236,72,153,0.15);
  border-radius: 8px;
  font-size: 0.85rem;
  color: #6b2140;
}

.small-btn {
  padding: 4px 14px;
  border: 1.5px solid rgba(244,114,182,0.3);
  border-radius: 6px;
  font-size: 0.8rem;
  font-family: 'Noto Serif SC', serif;
  cursor: pointer;
  background: white;
  color: #6b2140;
  transition: all 0.2s ease;
}
.small-btn:hover { border-color: #ec4899; background: rgba(236,72,153,0.06); }
.small-btn.danger:hover { border-color: #e11d48; color: #e11d48; }

.style-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.style-tab {
  padding: 6px 14px;
  border: 1.5px solid rgba(244,114,182,0.25);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.82rem;
  color: #6b2140;
  transition: all 0.2s ease;
  background: rgba(255,255,255,0.4);
}
.style-tab input { display: none; }
.style-tab:hover { border-color: #f472b6; }
.style-tab.active { border-color: #ec4899; background: rgba(236,72,153,0.08); color: #9f1239; font-weight: 600; }

.batch-start-btn {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  background: linear-gradient(135deg, #ec4899, #f472b6);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-family: 'Noto Serif SC', serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 2px;
}
.batch-start-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(236,72,153,0.35); }
.batch-start-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.progress-bar-wrap {
  width: 100%;
  height: 6px;
  background: rgba(244,114,182,0.15);
  border-radius: 3px;
  margin-top: 10px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ec4899, #f472b6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 预览区 */
.preview-title {
  font-size: 1.1rem;
  color: #9f1239;
  margin-bottom: 4px;
  font-weight: 600;
}
.preview-note {
  font-size: 0.8rem;
  color: #be185d;
  opacity: 0.7;
  margin-bottom: 12px;
}
.preview-card-wrap {
  display: flex;
  justify-content: center;
}
.preview-card {
  width: 520px;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.1);
  background: #ffffff;
  position: relative;
}

@media (max-width: 860px) {
  .batch-layout { flex-direction: column; }
  .batch-preview { width: 100%; }
  .preview-card { width: 100%; max-width: 520px; margin: 0 auto; }
}
</style>
