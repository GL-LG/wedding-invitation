<script setup>
import { ref } from 'vue'

const props = defineProps({
  form: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['generate'])

const styles = [
  { value: 'fresh-nature', label: '森系小清新', icon: '🌿' },
  { value: 'photo-elegant', label: '照片主视觉', icon: '📷' },
  { value: 'classic', label: '经典中国风', icon: '🏮' },
  { value: 'romantic', label: '浪漫花卉', icon: '🌸' },
  { value: 'elegant', label: '简约优雅', icon: '✨' },
  { value: 'chinoiserie', label: '水墨丹青', icon: '🖌️' }
]

const fileInput = ref(null)

const handlePhotoUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    alert('请上传图片文件')
    return
  }
  const reader = new FileReader()
  reader.onload = (ev) => {
    props.form.couplePhoto = ev.target.result
  }
  reader.readAsDataURL(file)
}

const removePhoto = () => {
  props.form.couplePhoto = ''
  if (fileInput.value) fileInput.value.value = ''
}

const triggerUpload = () => {
  fileInput.value?.click()
}
</script>

<template>
  <div class="form-container">
    <div class="form-card">
      <!-- 新人信息 -->
      <div class="form-section">
        <div class="section-title">
          <span class="title-icon">💍</span>
          <span>新人信息</span>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>新郎姓名</label>
            <input
              v-model="form.groomName"
              type="text"
              placeholder="请输入新郎姓名"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>新娘姓名</label>
            <input
              v-model="form.brideName"
              type="text"
              placeholder="请输入新娘姓名"
              class="form-input bride-input"
            />
          </div>
        </div>
        <!-- 新人照片上传 -->
        <div class="photo-upload-section">
          <label class="photo-label">📸 新人照片</label>
          <input ref="fileInput" type="file" accept="image/*" @change="handlePhotoUpload" class="hidden-input" />
          <div v-if="!form.couplePhoto" class="photo-upload-area" @click="triggerUpload">
            <span class="upload-icon">📷</span>
            <span class="upload-text">点击上传新人合照</span>
            <span class="upload-hint">支持 JPG、PNG 格式</span>
          </div>
          <div v-else class="photo-preview">
            <img :src="form.couplePhoto" alt="新人合照" class="preview-img" />
            <div class="photo-actions">
              <button class="photo-btn replace-btn" @click="triggerUpload">更换照片</button>
              <button class="photo-btn remove-btn" @click="removePhoto">移除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 宾客信息 -->
      <div class="form-section">
        <div class="section-title">
          <span class="title-icon">💌</span>
          <span>宾客信息</span>
        </div>
        <div class="form-row">
          <div class="form-group flex-1">
            <label>宾客姓名 <span class="required">*</span></label>
            <input
              v-model="form.guestName"
              type="text"
              placeholder="请输入宾客姓名"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>宾客性别</label>
            <div class="gender-select">
              <label class="gender-option" :class="{ active: form.guestGender === 'male' }">
                <input type="radio" v-model="form.guestGender" value="male" />
                <span class="gender-icon">👨</span>
                <span>先生</span>
              </label>
              <label class="gender-option" :class="{ active: form.guestGender === 'female' }">
                <input type="radio" v-model="form.guestGender" value="female" />
                <span class="gender-icon">👩</span>
                <span>女士</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 婚礼信息 -->
      <div class="form-section">
        <div class="section-title">
          <span class="title-icon">💒</span>
          <span>婚礼详情</span>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>婚礼日期</label>
            <input
              v-model="form.weddingDate"
              type="date"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>婚礼时间</label>
            <input
              v-model="form.weddingTime"
              type="time"
              class="form-input"
            />
          </div>
        </div>
        <div class="form-group full-width">
          <label>婚礼地点</label>
          <input
            v-model="form.venue"
            type="text"
            placeholder="请输入婚礼举办地点"
            class="form-input"
          />
        </div>
      </div>

      <!-- 风格选择 -->
      <div class="form-section">
        <div class="section-title">
          <span class="title-icon">🎨</span>
          <span>邀请函风格</span>
        </div>
        <div class="style-grid">
          <label
            v-for="s in styles"
            :key="s.value"
            class="style-card"
            :class="{ active: form.style === s.value }"
          >
            <input type="radio" v-model="form.style" :value="s.value" />
            <span class="style-icon">{{ s.icon }}</span>
            <span class="style-label">{{ s.label }}</span>
          </label>
        </div>
      </div>

      <!-- 生成按钮 -->
      <button class="generate-btn" @click="emit('generate')">
        <span class="btn-icon">✉️</span>
        生成邀请函
      </button>
    </div>
  </div>
</template>

<style scoped>
.form-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

.form-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(159, 18, 57, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(244, 114, 182, 0.2);
}

.form-section {
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px dashed rgba(244, 114, 182, 0.3);
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #9f1239;
  margin-bottom: 16px;
}

.title-icon {
  font-size: 1.3rem;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group {
  flex: 1;
  margin-bottom: 12px;
}

.form-group.full-width {
  width: 100%;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  color: #6b2140;
  margin-bottom: 6px;
  font-weight: 500;
}

.required {
  color: #e11d48;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid rgba(244, 114, 182, 0.3);
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: 'Noto Serif SC', serif;
  color: #4a2c2a;
  background: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
  outline: none;
}

.form-input:focus {
  border-color: #f472b6;
  box-shadow: 0 0 0 3px rgba(244, 114, 182, 0.15);
  background: white;
}

.form-input::placeholder {
  color: #d1a0b0;
}

.bride-input:focus {
  border-color: #ec4899;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.15);
}

/* 性别选择 */
.gender-select {
  display: flex;
  gap: 10px;
}

.gender-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1.5px solid rgba(244, 114, 182, 0.3);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  color: #6b2140;
  background: rgba(255, 255, 255, 0.5);
}

.gender-option input {
  display: none;
}

.gender-option:hover {
  border-color: #f472b6;
}

.gender-option.active {
  border-color: #ec4899;
  background: rgba(236, 72, 153, 0.08);
  color: #9f1239;
  font-weight: 600;
}

.gender-icon {
  font-size: 1.2rem;
}

/* 风格选择 */
.style-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.style-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 1.5px solid rgba(244, 114, 182, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.5);
}

.style-card input {
  display: none;
}

.style-card:hover {
  border-color: #f472b6;
  transform: translateY(-2px);
}

.style-card.active {
  border-color: #ec4899;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(244, 114, 182, 0.12));
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.15);
}

.style-icon {
  font-size: 2rem;
}

.style-label {
  font-size: 0.9rem;
  color: #6b2140;
  font-weight: 500;
}

.style-card.active .style-label {
  color: #9f1239;
  font-weight: 600;
}

/* 生成按钮 */
.generate-btn {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #ec4899, #f472b6, #ec4899);
  background-size: 200% 200%;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.15rem;
  font-family: 'Noto Serif SC', serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: 2px;
  animation: gradientShift 3s ease infinite;
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.35);
}

.generate-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 1.3rem;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@media (max-width: 600px) {
  .form-card {
    padding: 20px 16px;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .style-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 照片上传 */
.hidden-input {
  display: none;
}

.photo-upload-section {
  margin-top: 12px;
}

.photo-label {
  display: block;
  font-size: 0.9rem;
  color: #6b2140;
  margin-bottom: 8px;
  font-weight: 500;
}

.photo-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 28px 20px;
  border: 2px dashed rgba(244, 114, 182, 0.4);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.4);
}

.photo-upload-area:hover {
  border-color: #ec4899;
  background: rgba(236, 72, 153, 0.05);
}

.upload-icon {
  font-size: 2.2rem;
}

.upload-text {
  font-size: 0.95rem;
  color: #9f1239;
  font-weight: 500;
}

.upload-hint {
  font-size: 0.8rem;
  color: #d1a0b0;
}

.photo-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.preview-img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 12px;
  border: 2px solid rgba(244, 114, 182, 0.3);
}

.photo-actions {
  display: flex;
  gap: 10px;
}

.photo-btn {
  padding: 6px 16px;
  border: 1.5px solid rgba(244, 114, 182, 0.3);
  border-radius: 8px;
  font-size: 0.85rem;
  font-family: 'Noto Serif SC', serif;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.7);
  color: #6b2140;
}

.replace-btn:hover {
  border-color: #ec4899;
  background: rgba(236, 72, 153, 0.08);
}

.remove-btn:hover {
  border-color: #e11d48;
  color: #e11d48;
}
</style>
