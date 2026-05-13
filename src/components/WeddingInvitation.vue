<script setup>
import { computed, ref } from 'vue'
import html2canvas from 'html2canvas'
import { solarToLunar } from '../utils/lunar.js'

const props = defineProps({
  form: {
    type: Object,
    required: true
  },
  hideActions: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['back'])

const guestTitle = computed(() => {
  return props.form.guestGender === 'male' ? '先生' : '女士'
})

const numToChinese = (n) => {
  if (isNaN(n)) return ''
  const chars = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
  // 处理年份（4位数）：逐位转换，如 2026 → 二〇二六
  if (n >= 1000) {
    return String(n).split('').map(d => chars[parseInt(d)]).join('')
  }
  if (n === 10) return '十'
  if (n < 10) return chars[n]
  if (n < 20) return '十' + (n % 10 === 0 ? '' : chars[n % 10])
  return chars[Math.floor(n / 10)] + '十' + (n % 10 === 0 ? '' : chars[n % 10])
}

const lunarInfo = computed(() => {
  if (!props.form.weddingDate) return null
  try {
    const parts = props.form.weddingDate.split('-')
    const y = parseInt(parts[0])
    const m = parseInt(parts[1])
    const d = parseInt(parts[2])
    return solarToLunar(y, m, d)
  } catch (e) {
    console.error('农历转换失败', e)
    return null
  }
})

const formattedDate = computed(() => {
  if (!props.form.weddingDate) return '二〇二六年 吉日'
  // 解析 YYYY-MM-DD 格式，避免 new Date() 的 UTC 时区偏移
  const parts = props.form.weddingDate.split('-')
  const y = parseInt(parts[0])
  const m = parseInt(parts[1])
  const d = parseInt(parts[2])
  return `${numToChinese(y)}年${numToChinese(m)}月${numToChinese(d)}日`
})

const lunarDateDisplay = computed(() => {
  if (!lunarInfo.value) return '吉日良辰'
  return `农历${lunarInfo.value.monthInChinese}月${lunarInfo.value.dayInChinese}`
})

const lunarGanZhi = computed(() => {
  if (!lunarInfo.value) return ''
  return `${lunarInfo.value.yearInGanZhi}年 ${lunarInfo.value.monthInGanZhi}月 ${lunarInfo.value.dayInGanZhi}日`
})

const formattedTime = computed(() => {
  return props.form.weddingTime || '吉时'
})

const hasPhoto = computed(() => !!props.form.couplePhoto)

const invitationRef = ref(null)
const isExporting = ref(false)

// 共享的 html2canvas 渲染修复逻辑（单张 & 批量统一调用）
const renderToCanvas = async (element, style) => {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready
  }
  await new Promise(r => setTimeout(r, 300))

  const styleBgMap = {
    'chinoiserie': '#ede5d8',
    'classic': '#a01010',
    'romantic': '#ffe4e9',
    'elegant': '#fafafa',
    'photo-elegant': '#f5efe6',
    'fresh-nature': '#fffaf5',
  }
  const bgColor = styleBgMap[style] || '#ffffff'

  return html2canvas(element, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: bgColor,
    logging: false,
    onclone: (_doc, clonedEl) => {
      // 1. 停止所有动画
      clonedEl.style.animation = 'none'
      clonedEl.querySelectorAll('*').forEach(el => {
        el.style.animation = 'none'
        el.style.transition = 'none'
      })

      // 2. 修复渐变背景 -> 用中间色实色替代
      const bgFixMap = [
        ['.chinoiserie-invitation', '#ede5d8'],
        ['.classic-invitation', '#a01010'],
        ['.romantic-invitation', '#ffe4e9'],
        ['.lunar-highlight', 'rgba(255,215,0,0.12)'],
        ['.lunar-card', 'rgba(236,72,153,0.09)'],
        ['.elegant-line', '#d4c4c4'],
        ['.export-btn', '#ec4899'],
      ]
      bgFixMap.forEach(([sel, color]) => {
        const el = clonedEl.querySelector(sel)
        if (el) el.style.background = color
      })

      // 3. 去掉 filter（html2canvas 不支持）
      clonedEl.querySelectorAll('.ch-photo .couple-photo, .elegant-photo .couple-photo').forEach(el => {
        el.style.filter = 'none'
      })

      // 4. 强制所有文字元素不透明 + 显式 color
      const textSelectors = 'h1, h2, h3, h4, h5, h6, p, span, a, div, li, td, th, label'
      clonedEl.querySelectorAll(textSelectors).forEach(el => {
        const cs = window.getComputedStyle(el)
        if (parseFloat(cs.opacity) < 1) {
          el.style.opacity = '1'
        }
        if (cs.color && cs.color !== 'rgba(0, 0, 0, 0)' && cs.color !== 'transparent') {
          el.style.color = cs.color
        }
      })

      // 5. 修复 shadow
      const shadowFixes = [
        ['.classic-title', 'textShadow', '2px 2px 4px rgba(0,0,0,0.3)'],
        ['.guest-hl', 'textShadow', '0 0 10px rgba(255,215,0,0.5)'],
        ['.lunar-main', 'textShadow', '1px 1px 3px rgba(0,0,0,0.2)'],
        ['.classic-photo .couple-photo', 'boxShadow', '0 4px 16px rgba(0,0,0,0.3)'],
        ['.romantic-photo .couple-photo', 'boxShadow', '0 6px 20px rgba(190,24,93,0.15)'],
        ['.ch-photo .couple-photo', 'boxShadow', '2px 2px 8px rgba(61,43,31,0.1)'],
      ]
      shadowFixes.forEach(([sel, prop, val]) => {
        const el = clonedEl.querySelector(sel)
        if (el) el.style[prop] = val
      })

      // 6. 浮动花停止动画
      clonedEl.querySelectorAll('.flower-float').forEach(el => {
        el.style.animation = 'none'
        el.style.transform = 'none'
      })
    }
  })
}

const exportImage = async () => {
  if (!invitationRef.value) return
  isExporting.value = true
  try {
    const canvas = await renderToCanvas(invitationRef.value, props.form.style)
    const link = document.createElement('a')
    link.download = `婚礼邀请函-${props.form.guestName}${guestTitle.value}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
  } catch (e) {
    console.error('导出失败', e)
    alert('导出失败，请重试')
  } finally {
    isExporting.value = false
  }
}

defineExpose({ invitationRef, renderToCanvas })
</script>

<template>
  <div class="invitation-page">
    <div class="action-bar" v-if="!hideActions">
      <button class="action-btn back-btn" @click="emit('back')">
        <span>←</span> 返回编辑
      </button>
      <button class="action-btn export-btn" @click="exportImage" :disabled="isExporting">
        <span>{{ isExporting ? '⏳' : '📥' }}</span>
        {{ isExporting ? '导出中...' : '保存图片' }}
      </button>
    </div>

    <div class="invitation-wrapper">
      <div class="invitation-card" ref="invitationRef">

        <!-- ====== 照片主视觉（参考图风格） ====== -->
        <template v-if="form.style === 'photo-elegant'">
          <div class="photo-elegant-invitation">
            <!-- 顶部照片区域 -->
            <div class="pe-photo-section">
              <img 
                :src="form.couplePhoto || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22><rect fill=%22%23c8d4b8%22 width=%22400%22 height=%22300%22/><text x=%22200%22 y=%22150%22 text-anchor=%22middle%22 fill=%22%237a8a6a%22 font-size=%2220%22>请上传新人合照</text></svg>'" 
                alt="新人合照" 
                class="pe-photo"
              />
            </div>

            <!-- 欧式花纹分隔边框 -->
            <div class="pe-divider">
              <svg class="pe-ornament" viewBox="0 0 400 50" preserveAspectRatio="xMidYMid meet">
                <path d="M0,25 Q20,5 40,25 Q60,45 80,25 Q100,5 120,25 Q140,45 160,25 Q180,5 200,25 Q220,45 240,25 Q260,5 280,25 Q300,45 320,25 Q340,5 360,25 Q380,45 400,25" 
                      fill="none" stroke="#8a9a72" stroke-width="1.5" opacity="0.6"/>
                <path d="M10,25 Q30,10 50,25 Q70,40 90,25 Q110,10 130,25 Q150,40 170,25 Q190,10 210,25 Q230,40 250,25 Q270,10 290,25 Q310,40 330,25 Q350,10 370,25 Q390,40 390,25" 
                      fill="none" stroke="#8a9a72" stroke-width="1" opacity="0.4"/>
                <!-- 左侧卷草纹 -->
                <path d="M0,25 C15,25 20,15 25,20 C30,25 25,35 20,32 C15,29 18,23 22,24 C26,25 24,30 21,28" 
                      fill="none" stroke="#7a8a62" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="12" cy="25" r="3" fill="#7a8a62" opacity="0.5"/>
                <circle cx="8" cy="18" r="2" fill="#8a9a72" opacity="0.4"/>
                <circle cx="8" cy="32" r="2" fill="#8a9a72" opacity="0.4"/>
                <!-- 右侧卷草纹 -->
                <path d="M400,25 C385,25 380,15 375,20 C370,25 375,35 380,32 C385,29 382,23 378,24 C374,25 376,30 379,28" 
                      fill="none" stroke="#7a8a62" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="388" cy="25" r="3" fill="#7a8a62" opacity="0.5"/>
                <circle cx="392" cy="18" r="2" fill="#8a9a72" opacity="0.4"/>
                <circle cx="392" cy="32" r="2" fill="#8a9a72" opacity="0.4"/>
                <!-- 中心装饰 -->
                <path d="M185,25 Q200,8 215,25 Q200,42 185,25Z" fill="none" stroke="#7a8a62" stroke-width="1.2" opacity="0.5"/>
                <path d="M190,25 Q200,14 210,25 Q200,36 190,25Z" fill="none" stroke="#8a9a72" stroke-width="0.8" opacity="0.4"/>
              </svg>
            </div>

            <!-- 内容区域 -->
            <div class="pe-content">
              <!-- 邀请函标题 -->
              <div class="pe-title-wrap">
                <div class="pe-title-deco-top">
                  <span>♡</span>
                  <span class="pe-line-short"></span>
                  <span>♡</span>
                </div>
                <h1 class="pe-title">邀请函</h1>
                <div class="pe-title-sub">INVITATION</div>
                <div class="pe-title-deco-bottom">
                  <span class="pe-line-short"></span>
                  <span>✦</span>
                  <span class="pe-line-short"></span>
                </div>
              </div>

              <!-- 新人名字 -->
              <div class="pe-names">
                <span class="pe-name-label">新郎</span>
                <span class="pe-name">{{ form.groomName || '项嘉羽' }}</span>
                <span class="pe-name-gap"></span>
                <span class="pe-name-label">新娘</span>
                <span class="pe-name">{{ form.brideName || '虞小娅' }}</span>
              </div>

              <!-- 我们结婚啦 -->
              <div class="pe-wedding-text">我们结婚啦</div>

              <!-- 时间地点 -->
              <div class="pe-info-section">
                <div class="pe-info-item">
                  <span class="pe-info-label">时间:</span>
                  <span class="pe-info-value">{{ formattedDate }} {{ formattedTime }}</span>
                </div>
                <div class="pe-info-item" v-if="form.venue">
                  <span class="pe-info-label">地点:</span>
                  <span class="pe-info-value">{{ form.venue }}</span>
                </div>
                <div class="pe-info-item" v-if="lunarInfo">
                  <span class="pe-info-label">农历:</span>
                  <span class="pe-info-value">{{ lunarDateDisplay }}</span>
                </div>
                <div class="pe-info-item pe-ganzhi" v-if="lunarGanZhi">
                  {{ lunarGanZhi }}
                </div>
              </div>

              <!-- 邀请文案 -->
              <div class="pe-message">
                <p>当您看到这份邀请函的时候<br/>您已被我们郑重加入到我们的</p>
                <p class="pe-highlight">INVITATION LIST</p>
                <p>希望我们有幸邀请 {{ form.guestName }}{{ guestTitle }}<br/>见证我们此生最重要的决定</p>
              </div>

              <!-- 真诚邀请段落 -->
              <div class="pe-sincere">
                <p>我们真诚地邀请</p>
                <p>陪伴我们走过许多岁月的</p>
                <p>最重要的亲人 朋友</p>
                <p>一起见证分享我们人生的重要时刻</p>
                <p>请带着您的好心情和好胃口</p>
                <p>来参加我们的婚礼吧</p>
                <p class="pe-note">喝酒不开车 开车不喝酒</p>
                <p class="pe-closing">期待与您相见！</p>
              </div>

              <!-- 底部装饰 -->
              <div class="pe-footer">
                <div class="pe-footer-icons">
                  <span class="pe-f-icon">📍</span>
                  <span class="pe-f-icon">📷</span>
                </div>
                <p class="pe-footer-text">欢迎参加我们的婚礼</p>
              </div>
            </div>
          </div>
        </template>

        <!-- ====== 森系小清新 ====== -->
        <template v-if="form.style === 'fresh-nature'">
          <div class="fn-invitation">
            <div class="fn-card">
              <!-- 1. 顶部新人照片 -->
              <div class="fn-photo-section">
                <img
                  :src="form.couplePhoto || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22><rect fill=%22%23c8d4b8%22 width=%22400%22 height=%22300%22/><text x=%22200%22 y=%22150%22 text-anchor=%22middle%22 fill=%22%237a8a6a%22 font-size=%2220%22>请上传新人合照</text></svg>'"
                  alt="新人婚纱照"
                >
              </div>

              <!-- 2. 欧式花纹分隔栏 -->
              <div class="fn-divider"></div>

              <!-- 3. 标题区域 -->
              <div class="fn-title-section">
                <div class="fn-en-title">WEDDING INVITATION</div>
                <h2 class="fn-cn-title">邀请函</h2>
                <div class="fn-small-heart">♡</div>
              </div>

              <!-- 4. 邀请文案 -->
              <div class="fn-content-section">
                <p>亲爱的 {{ form.guestName }}{{ guestTitle }}：</p>
                <p>承蒙时光厚爱，往后余生，</p>
                <p>愿与您一同分享这份喜悦。</p>
                <p>我们诚挚邀请您出席我们的婚礼，</p>
                <p>见证这一幸福时刻。</p>
              </div>

              <!-- 5. 新人信息 -->
              <div class="fn-couple-info">
                <span class="fn-name">{{ form.groomName || '张先生' }}</span>
                <span class="fn-love-sign">♡</span>
                <span class="fn-name">{{ form.brideName || '李女士' }}</span>
              </div>

              <!-- 6. 婚礼信息 -->
              <div class="fn-wedding-info">
                <div class="fn-info-item">
                  <span>婚礼日期：</span>
                  <span>{{ formattedDate }}</span>
                </div>
                <div class="fn-info-item" v-if="lunarInfo">
                  <span>农历：</span>
                  <span>{{ lunarDateDisplay }}</span>
                </div>
                <div class="fn-info-item fn-ganzhi-item" v-if="lunarGanZhi">
                  <span></span>
                  <span>{{ lunarGanZhi }}</span>
                </div>
                <div class="fn-info-item" v-if="form.venue">
                  <span>婚礼地点：</span>
                  <span>{{ form.venue }}</span>
                </div>
                <div class="fn-info-item">
                  <span>婚礼时间：</span>
                  <span>{{ formattedTime }}</span>
                </div>
              </div>

              <!-- 7. 底部装饰图标 -->
              <div class="fn-footer-icons">
                <div class="fn-icon-circle"></div>
                <div class="fn-icon-circle"></div>
              </div>
            </div>
          </div>
        </template>

        <!-- ====== 经典中国风 ====== -->
        <template v-if="form.style === 'classic'">
          <div class="classic-invitation">
            <div class="classic-border">
              <div class="corner corner-tl"></div>
              <div class="corner corner-tr"></div>
              <div class="corner corner-bl"></div>
              <div class="corner corner-br"></div>

              <div class="classic-header">
                <span class="cloud">☁</span>
                <div class="classic-title-group">
                  <div class="classic-subtitle">谨定于</div>
                  <h1 class="classic-title">喜 结 良 缘</h1>
                  <div class="classic-deco-line">
                    <span>◆</span><span class="line"></span><span>❤</span><span class="line"></span><span>◆</span>
                  </div>
                </div>
                <span class="cloud">☁</span>
              </div>

              <!-- 新人照片 -->
              <div class="photo-area classic-photo" v-if="hasPhoto">
                <img :src="form.couplePhoto" alt="新人合照" class="couple-photo" />
                <div class="photo-frame-deco"></div>
              </div>

              <div class="classic-names">
                <span class="name">{{ form.groomName || '新郎' }}</span>
                <span class="amp">&</span>
                <span class="name">{{ form.brideName || '新娘' }}</span>
              </div>

              <div class="classic-body">
                <p class="classic-greeting">
                  敬邀 <span class="guest-hl">{{ form.guestName }}</span><span class="guest-tl">{{ guestTitle }}</span>
                </p>
                <p class="classic-text">诚邀您拨冗出席<br/>见证我们的幸福时刻</p>
              </div>

              <!-- 农历突出显示 -->
              <div class="classic-date-section">
                <div class="lunar-highlight">
                  <div class="lunar-badge">农历</div>
                  <div class="lunar-main">{{ lunarDateDisplay }}</div>
                  <div class="lunar-ganzhi" v-if="lunarGanZhi">{{ lunarGanZhi }}</div>
                </div>
                <div class="solar-date">{{ formattedDate }}</div>
                <div class="detail-item"><span>🕐</span><span>{{ formattedTime }}</span></div>
                <div class="detail-item" v-if="form.venue"><span>📍</span><span>{{ form.venue }}</span></div>
              </div>

              <div class="classic-footer">✦ 恭候光临 ✦</div>
            </div>
          </div>
        </template>

        <!-- ====== 浪漫花卉 ====== -->
        <template v-if="form.style === 'romantic'">
          <div class="romantic-invitation">
            <div class="flower-deco ftl">🌸</div>
            <div class="flower-deco ftr">🌹</div>
            <div class="flower-deco fbl">🌺</div>
            <div class="flower-deco fbr">🌷</div>
            <div class="flower-float ff1">💮</div>
            <div class="flower-float ff2">🏵️</div>
            <div class="flower-float ff3">🌼</div>

            <div class="romantic-content">
              <div class="rose-divider">🌹💕🌹</div>
              <h1 class="romantic-title">Wedding Invitation</h1>
              <p class="romantic-subtitle">我们要结婚了</p>

              <!-- 新人照片 -->
              <div class="photo-area romantic-photo" v-if="hasPhoto">
                <img :src="form.couplePhoto" alt="新人合照" class="couple-photo" />
              </div>

              <div class="romantic-names">
                <span class="r-name">{{ form.groomName || '新郎' }}</span>
                <span class="r-amp">&</span>
                <span class="r-name">{{ form.brideName || '新娘' }}</span>
              </div>

              <div class="romantic-guest">
                <div class="guest-pill">
                  <span>✿</span>
                  <span class="guest-to">致</span>
                  <span class="guest-hl2">{{ form.guestName }}</span>
                  <span class="guest-tl2">{{ guestTitle }}</span>
                  <span>✿</span>
                </div>
              </div>

              <p class="romantic-msg">在这美好的日子里<br/>期待与您分享我们的喜悦</p>

              <!-- 农历突出显示 -->
              <div class="romantic-date-section">
                <div class="lunar-card">
                  <div class="lunar-label">农历</div>
                  <div class="lunar-big">{{ lunarDateDisplay }}</div>
                  <div class="lunar-sub" v-if="lunarGanZhi">{{ lunarGanZhi }}</div>
                </div>
                <div class="romantic-info">
                  <div class="info-card"><span class="info-label">公历</span><span class="info-value">{{ formattedDate }}</span></div>
                  <div class="info-card"><span class="info-label">时间</span><span class="info-value">{{ formattedTime }}</span></div>
                  <div class="info-card" v-if="form.venue"><span class="info-label">地点</span><span class="info-value">{{ form.venue }}</span></div>
                </div>
              </div>

              <div class="romantic-footer">期待您的到来 💕</div>
            </div>
          </div>
        </template>

        <!-- ====== 简约优雅 ====== -->
        <template v-if="form.style === 'elegant'">
          <div class="elegant-invitation">
            <div class="elegant-line top-line"></div>
            <div class="elegant-line bottom-line"></div>

            <div class="elegant-content">
              <div class="elegant-header">
                <div class="elegant-dot"></div>
                <h1 class="elegant-title">THE WEDDING OF</h1>
                <div class="elegant-dot"></div>
              </div>

              <!-- 新人照片 -->
              <div class="photo-area elegant-photo" v-if="hasPhoto">
                <img :src="form.couplePhoto" alt="新人合照" class="couple-photo" />
              </div>

              <div class="elegant-names">
                <span class="e-name">{{ form.groomName || '新郎' }}</span>
                <span class="e-and">&</span>
                <span class="e-name">{{ form.brideName || '新娘' }}</span>
              </div>

              <div class="elegant-divider"><span>◇</span></div>

              <p class="elegant-guest">诚挚邀请<br/><span class="elegant-hl">{{ form.guestName }}{{ guestTitle }}</span></p>
              <p class="elegant-msg">出席我们的婚礼庆典</p>

              <!-- 农历突出显示 -->
              <div class="elegant-lunar" v-if="lunarInfo">
                <span class="elegant-lunar-label">农历</span>
                <span class="elegant-lunar-main">{{ lunarDateDisplay }}</span>
                <span class="elegant-lunar-gz" v-if="lunarGanZhi">{{ lunarGanZhi }}</span>
              </div>

              <div class="elegant-details">
                <div class="e-detail"><span class="e-val">{{ formattedDate }}</span><span class="e-lbl">DATE</span></div>
                <div class="e-sep">|</div>
                <div class="e-detail"><span class="e-val">{{ formattedTime }}</span><span class="e-lbl">TIME</span></div>
              </div>
              <div class="elegant-venue" v-if="form.venue">
                <span class="e-val">{{ form.venue }}</span><span class="e-lbl">VENUE</span>
              </div>
            </div>
          </div>
        </template>

        <!-- ====== 水墨丹青 ====== -->
        <template v-if="form.style === 'chinoiserie'">
          <div class="chinoiserie-invitation">
            <div class="ink-birds">🕊️🕊️</div>
            <div class="chinoiserie-content">
              <div class="stamp">囍</div>
              <h1 class="ch-title">喜 帖</h1>

              <!-- 新人照片 -->
              <div class="photo-area ch-photo" v-if="hasPhoto">
                <img :src="form.couplePhoto" alt="新人合照" class="couple-photo" />
              </div>

              <div class="ch-name-row">
                <span class="ch-name">{{ form.groomName || '新郎' }}</span>
                <span class="ch-conn">与</span>
                <span class="ch-name">{{ form.brideName || '新娘' }}</span>
              </div>
              <div class="ch-text">
                <p>谨择吉日良辰</p>
                <p>结为连理</p>
                <p class="ch-invite">诚邀 <span class="ch-guest"> {{ form.guestName }} {{guestTitle}} </span></p>
                <p>莅临观礼，共襄盛举</p>
              </div>

              <!-- 农历突出显示 -->
              <div class="ch-lunar-box" v-if="lunarInfo">
                <div class="ch-lunar-title">吉日良辰</div>
                <div class="ch-lunar-date">{{ lunarDateDisplay }}</div>
                <div class="ch-lunar-gz" v-if="lunarGanZhi">{{ lunarGanZhi }}</div>
              </div>

              <div class="ch-details">
                <p>公历：{{ formattedDate }}</p>
                <p>时辰：{{ formattedTime }}</p>
                <p v-if="form.venue">地点：{{ form.venue }}</p>
              </div>
              <div class="ch-footer"><div class="ch-seal">永结同心</div></div>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 照片主视觉风格（参考图） ========== */
.photo-elegant-invitation {
  background: #f5efe6;
  color: #5a6b4c;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.pe-photo-section {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2.2;
  overflow: hidden;
}

.pe-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
  display: block;
}

.pe-photo-icons {
  position: absolute;
  top: 12px;
  right: 14px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.pe-icon {
  color: white;
  font-size: 12px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
  opacity: 0.9;
}

.pe-divider {
  width: 100%;
  padding: 6px 0;
  background: #f5efe6;
  position: relative;
}

.pe-ornament {
  width: 100%;
  height: 50px;
  display: block;
}

.pe-content {
  padding: 24px 28px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* 标题区 */
.pe-title-wrap {
  text-align: center;
  margin-bottom: 18px;
}

.pe-title-deco-top,
.pe-title-deco-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 10px;
  color: #8a9a72;
  margin-bottom: 6px;
}

.pe-line-short {
  width: 30px;
  height: 1px;
  background: #b5c4a0;
  display: inline-block;
}

.pe-title-deco-bottom {
  margin-bottom: 0;
  margin-top: 6px;
}

.pe-title {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 2.6rem;
  color: #5a6b4c;
  letter-spacing: 10px;
  margin: 0;
  line-height: 1.3;
  font-weight: 400;
}

.pe-title-sub {
  font-size: 0.65rem;
  letter-spacing: 6px;
  color: #9aaa84;
  margin-top: 2px;
  text-transform: uppercase;
}

/* 新人名字 */
.pe-names {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.pe-name-label {
  font-size: 0.95rem;
  color: #7a8a62;
  letter-spacing: 2px;
}

.pe-name {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 1.5rem;
  color: #4a5a3c;
  letter-spacing: 3px;
}

.pe-name-gap {
  width: 24px;
}

/* 我们结婚啦 */
.pe-wedding-text {
  font-size: 1.15rem;
  color: #5a6b4c;
  letter-spacing: 4px;
  margin-bottom: 18px;
  font-weight: 600;
}

/* 信息区域 */
.pe-info-section {
  text-align: left;
  width: 100%;
  max-width: 340px;
  margin-bottom: 22px;
  line-height: 1.8;
}

.pe-info-item {
  font-size: 0.92rem;
  color: #5a6b4c;
  letter-spacing: 1px;
}

.pe-info-label {
  color: #7a8a62;
  font-weight: 500;
}

.pe-info-value {
  color: #4a5a3c;
}

.pe-ganzhi {
  font-size: 0.82rem;
  color: #8a9a72;
  margin-top: 4px;
}

/* 邀请文案 */
.pe-message {
  text-align: center;
  margin-bottom: 18px;
  line-height: 1.9;
  font-size: 0.92rem;
  color: #5a6b4c;
  letter-spacing: 0.5px;
}

.pe-highlight {
  font-size: 0.85rem;
  letter-spacing: 3px;
  color: #7a8a62;
  font-style: italic;
  padding: 4px 0;
  font-weight: 500;
}

/* 真诚邀请段落 */
.pe-sincere {
  text-align: center;
  line-height: 1.9;
  font-size: 0.9rem;
  color: #6a7a5c;
  margin-bottom: 20px;
  letter-spacing: 0.5px;
}

.pe-note {
  color: #8a9a72;
  font-size: 0.85rem;
  margin-top: 8px;
}

.pe-closing {
  color: #5a6b4c;
  font-weight: 600;
  margin-top: 6px;
  letter-spacing: 2px;
}

/* 底部 */
.pe-footer {
  text-align: center;
  margin-top: 8px;
}

.pe-footer-icons {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 8px;
}

.pe-f-icon {
  font-size: 20px;
  opacity: 0.45;
}

.pe-footer-text {
  font-size: 0.85rem;
  color: #8a9a72;
  letter-spacing: 2px;
}

/* ========== 森系小清新 ========== */
/* 页面背景 */
.fn-invitation {
  width: 100%;
  background-color: #f8f5f0;
  display: flex;
  justify-content: center;
  padding: 0;
}

/* 邀请函卡片主体 - 竖版比例 */
.fn-card {
  width: 100%;
  background: #fffaf5;
  border-radius: 8px;
  padding: 25px;
  position: relative;
  overflow: hidden;
  border: 1px solid #e8e2d9;
}

/* 背景暗纹（左右玫瑰） */
.fn-card::before {
  content: "";
  position: absolute;
  top: 25%;
  bottom: 25%;
  left: -30px;
  right: -30px;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='60' viewBox='0 0 40 60'><path fill='%23f8ede3' d='M20,10 C25,0 35,5 35,15 C35,25 25,35 20,40 C15,35 5,25 5,15 C5,5 15,0 20,10 Z'/></svg>") no-repeat left center;
  background-size: contain;
  opacity: 0.2;
  z-index: 1;
  pointer-events: none;
}

.fn-card::after {
  content: "";
  position: absolute;
  top: 25%;
  bottom: 25%;
  left: -30px;
  right: -30px;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='60' viewBox='0 0 40 60'><path fill='%23f8ede3' d='M20,10 C25,0 35,5 35,15 C35,25 25,35 20,40 C15,35 5,25 5,15 C5,5 15,0 20,10 Z'/></svg>") no-repeat right center;
  background-size: contain;
  opacity: 0.2;
  z-index: 1;
  pointer-events: none;
}

/* 照片区域 */
.fn-photo-section {
  width: 100%;
  margin-bottom: 15px;
  position: relative;
  z-index: 2;
}

.fn-photo-section img {
  width: 100%;
  height: auto;
  border-radius: 4px;
  object-fit: cover;
  display: block;
}

/* 欧式花纹分隔线 */
.fn-divider {
  width: 100%;
  height: 30px;
  margin: 10px 0;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='20' viewBox='0 0 300 20'><path fill='%23a9b38f' d='M0,10 C50,0 100,20 150,10 C200,0 250,20 300,10' stroke='%23a9b38f' stroke-width='1.5' fill='none'/></svg>") no-repeat center;
  background-size: 100% 100%;
  opacity: 0.7;
  position: relative;
  z-index: 2;
}

/* 标题区域 */
.fn-title-section {
  text-align: center;
  margin: 20px 0;
  color: #7b8669;
  position: relative;
  z-index: 2;
}

.fn-en-title {
  font-size: 13px;
  letter-spacing: 2px;
  margin-bottom: 5px;
}

.fn-cn-title {
  font-size: 28px;
  font-weight: 500;
  margin: 0;
}

.fn-small-heart {
  font-size: 14px;
  color: #a9b38f;
  margin-top: 5px;
}

/* 文案区域 */
.fn-content-section {
  text-align: center;
  color: #666;
  font-size: 15px;
  line-height: 1.8;
  margin: 20px 0;
  position: relative;
  z-index: 2;
}

.fn-content-section p {
  margin: 6px 0;
}

/* 新人名字 */
.fn-couple-info {
  text-align: center;
  font-size: 17px;
  color: #7b8669;
  margin: 25px 0;
  position: relative;
  z-index: 2;
}

.fn-couple-info .fn-name {
  font-weight: 500;
}

.fn-love-sign {
  margin: 0 12px;
  color: #a9b38f;
}

/* 婚礼详情 */
.fn-wedding-info {
  text-align: center;
  color: #555;
  font-size: 14px;
  line-height: 2;
  margin: 20px 0;
  position: relative;
  z-index: 2;
}

.fn-info-item {
  margin: 5px 0;
}

.fn-ganzhi-item {
  font-size: 13px;
  color: #8a9a72;
}

/* 底部圆形图标 */
.fn-footer-icons {
  display: flex;
  justify-content: center;
  gap: 25px;
  margin-top: 35px;
  position: relative;
  z-index: 2;
}

.fn-icon-circle {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: #e8e2d9;
}

/* ========== 原有样式 ========== */
.invitation-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 100vh;
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  z-index: 10;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: 'Noto Serif SC', serif;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.back-btn {
  background: rgba(255, 255, 255, 0.8);
  color: #9f1239;
  border: 1.5px solid rgba(244, 114, 182, 0.3);
}
.back-btn:hover { background: white; border-color: #f472b6; }

.export-btn {
  background: linear-gradient(135deg, #ec4899, #f472b6);
  color: white;
}
.export-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3); }
.export-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

.invitation-wrapper {
  width: 100%;
  max-width: 520px;
}

.invitation-card {
  border-radius: 16px;
  overflow: hidden;
  animation: cardAppear 0.8s ease-out;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
}

@keyframes cardAppear {
  from { opacity: 0; transform: scale(0.92) rotateY(8deg); }
  to { opacity: 1; transform: scale(1) rotateY(0); }
}

/* ========== 通用照片区域 ========== */
.photo-area {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.couple-photo {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
}

/* ========== 经典中国风 ========== */
.classic-invitation {
  background: linear-gradient(180deg, #8b0000 0%, #a01010 30%, #b91c1c 60%, #8b0000 100%);
  color: #ffd700;
  padding: 8px;
}

.classic-border {
  border: 2px solid #ffd700;
  padding: 36px 28px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border-color: #ffd700;
  border-style: solid;
}
.corner-tl { top: 8px; left: 8px; border-width: 3px 0 0 3px; }
.corner-tr { top: 8px; right: 8px; border-width: 3px 3px 0 0; }
.corner-bl { bottom: 8px; left: 8px; border-width: 0 0 3px 3px; }
.corner-br { bottom: 8px; right: 8px; border-width: 0 3px 3px 0; }

.classic-header {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 4px;
}

.cloud { font-size: 2rem; opacity: 0.5; }

.classic-title-group { text-align: center; }
.classic-subtitle { font-size: 0.9rem; opacity: 0.8; margin-bottom: 6px; letter-spacing: 4px; }
.classic-title {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 2.8rem;
  letter-spacing: 8px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 8px;
}
.classic-deco-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.8rem;
  opacity: 0.7;
}
.classic-deco-line .line {
  width: 40px;
  height: 1px;
  background: #ffd700;
  display: inline-block;
}

/* 经典风照片 */
.classic-photo {
  margin: 12px auto;
  position: relative;
}
.classic-photo .couple-photo {
  border: 3px solid #ffd700;
  border-radius: 8px;
  max-width: 85%;
  max-height: 200px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.classic-names { text-align: center; margin: 16px 0; }
.name {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 2.2rem;
  letter-spacing: 4px;
}
.amp { font-size: 1.8rem; margin: 0 12px; opacity: 0.7; }

.classic-body { text-align: center; margin: 8px 0; }
.classic-greeting { font-size: 1.2rem; margin-bottom: 12px; letter-spacing: 2px; }
.guest-hl {
  font-size: 1.4rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}
.guest-tl { opacity: 0.8; margin-left: 4px; }
.classic-text { font-size: 1rem; line-height: 2; opacity: 0.9; letter-spacing: 2px; }

/* 经典风农历区 */
.classic-date-section {
  text-align: center;
  margin: 16px 0 12px;
}

.lunar-highlight {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.08));
  border: 1.5px solid rgba(255, 215, 0, 0.4);
  border-radius: 10px;
  padding: 12px 20px;
  margin-bottom: 12px;
  display: inline-block;
}

.lunar-badge {
  display: inline-block;
  background: #ffd700;
  color: #8b0000;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 4px;
  margin-bottom: 6px;
  letter-spacing: 2px;
}

.lunar-main {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 1.6rem;
  letter-spacing: 3px;
  color: #ffd700;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
}

.lunar-ganzhi {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 4px;
  letter-spacing: 2px;
}

.solar-date {
  font-size: 0.95rem;
  opacity: 0.8;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 1rem;
  letter-spacing: 1px;
}

.classic-footer {
  text-align: center;
  font-size: 1rem;
  letter-spacing: 4px;
  opacity: 0.8;
  margin-top: 8px;
}

/* ========== 浪漫花卉 ========== */
.romantic-invitation {
  background: linear-gradient(180deg, #fff5f7 0%, #ffe4e9 30%, #ffc8d6 70%, #fff0f3 100%);
  color: #6b2140;
  padding: 40px 30px;
  position: relative;
  overflow: hidden;
}

.flower-deco { position: absolute; font-size: 2.5rem; opacity: 0.5; }
.ftl { top: 15px; left: 15px; }
.ftr { top: 15px; right: 15px; }
.fbl { bottom: 15px; left: 15px; }
.fbr { bottom: 15px; right: 15px; }

.flower-float {
  position: absolute;
  opacity: 0.25;
  font-size: 1.5rem;
  animation: floatFlower 6s ease-in-out infinite;
}
.ff1 { top: 20%; right: 10%; animation-delay: 0s; }
.ff2 { top: 45%; left: 5%; animation-delay: 2s; }
.ff3 { bottom: 25%; right: 8%; animation-delay: 4s; }

@keyframes floatFlower {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(15deg); }
}

.romantic-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.rose-divider { font-size: 1.2rem; letter-spacing: 6px; margin-bottom: 16px; }
.romantic-title {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 2.2rem;
  color: #be185d;
  letter-spacing: 4px;
  margin-bottom: 4px;
}
.romantic-subtitle { font-size: 1rem; color: #db2777; opacity: 0.8; letter-spacing: 3px; }

/* 浪漫风照片 */
.romantic-photo {
  margin: 16px auto;
}
.romantic-photo .couple-photo {
  border-radius: 16px;
  max-width: 90%;
  max-height: 200px;
  box-shadow: 0 6px 20px rgba(190, 24, 93, 0.15);
  border: 3px solid rgba(255, 255, 255, 0.8);
}

.romantic-names { margin: 16px 0; display: flex; align-items: center; gap: 12px; }
.r-name {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 2.4rem;
  color: #9f1239;
  letter-spacing: 2px;
}
.r-amp { font-size: 2rem; color: #f472b6; font-style: italic; }

.romantic-guest { margin-bottom: 16px; }
.guest-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: 1.5px solid rgba(236, 72, 153, 0.3);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.5);
}
.guest-to { font-size: 0.9rem; color: #9f1239; }
.guest-hl2 { font-size: 1.3rem; font-weight: 700; color: #9f1239; }
.guest-tl2 { font-size: 0.9rem; color: #be185d; opacity: 0.8; }

.romantic-msg { font-size: 1rem; line-height: 2; color: #6b2140; letter-spacing: 1px; margin-bottom: 16px; }

/* 浪漫风农历区 */
.romantic-date-section {
  width: 100%;
  margin-bottom: 16px;
}

.lunar-card {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(244, 114, 182, 0.08));
  border: 1.5px solid rgba(236, 72, 153, 0.25);
  border-radius: 14px;
  padding: 14px 20px;
  margin-bottom: 14px;
}

.lunar-label {
  display: inline-block;
  background: linear-gradient(135deg, #ec4899, #f472b6);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 12px;
  border-radius: 20px;
  margin-bottom: 6px;
  letter-spacing: 2px;
}

.lunar-big {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 1.8rem;
  color: #9f1239;
  letter-spacing: 3px;
}

.lunar-sub {
  font-size: 0.8rem;
  color: #be185d;
  opacity: 0.7;
  margin-top: 4px;
  letter-spacing: 1px;
}

.romantic-info {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
.info-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(236, 72, 153, 0.15);
}
.info-label { font-size: 0.75rem; color: #db2777; letter-spacing: 2px; margin-bottom: 4px; }
.info-value { font-size: 0.9rem; color: #6b2140; font-weight: 600; }

.romantic-footer { font-size: 1rem; color: #be185d; letter-spacing: 2px; margin-top: 4px; }

/* ========== 简约优雅 ========== */
.elegant-invitation {
  background: #fafafa;
  color: #2d2d2d;
  padding: 50px 40px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.elegant-line {
  position: absolute;
  left: 30px;
  right: 30px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #c9a0a0, transparent);
}
.top-line { top: 25px; }
.bottom-line { bottom: 25px; }

.elegant-content { width: 100%; }

.elegant-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 20px;
}
.elegant-dot { width: 6px; height: 6px; background: #c9a0a0; border-radius: 50%; }
.elegant-title {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 1rem;
  letter-spacing: 6px;
  color: #8b6f6f;
  text-transform: uppercase;
}

/* 简约风照片 */
.elegant-photo {
  margin: 12px auto;
}
.elegant-photo .couple-photo {
  border-radius: 4px;
  max-width: 80%;
  max-height: 200px;
  filter: grayscale(20%);
}

.elegant-names { margin: 16px 0; display: flex; align-items: center; gap: 16px; justify-content: center; }
.e-name { font-family: 'Ma Shan Zheng', cursive; font-size: 2.4rem; color: #3d2d2d; letter-spacing: 2px; }
.e-and { font-size: 1.8rem; color: #c9a0a0; font-style: italic; }

.elegant-divider { margin: 16px 0; color: #c9a0a0; font-size: 1rem; }

.elegant-guest { font-size: 1rem; line-height: 1.8; color: #6b5a5a; margin-bottom: 8px; }
.elegant-hl { font-size: 1.3rem; font-weight: 700; color: #3d2d2d; }
.elegant-msg { font-size: 0.95rem; color: #8b7a7a; margin-bottom: 24px; letter-spacing: 1px; }

/* 简约风农历 */
.elegant-lunar {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  border: 1px solid #d4c4c4;
  border-radius: 6px;
  margin-bottom: 16px;
  background: rgba(201, 160, 160, 0.05);
}

.elegant-lunar-label {
  font-size: 0.7rem;
  color: white;
  background: #8b6f6f;
  padding: 2px 8px;
  border-radius: 3px;
  letter-spacing: 1px;
  font-weight: 600;
}

.elegant-lunar-main {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 1.3rem;
  color: #3d2d2d;
  letter-spacing: 2px;
}

.elegant-lunar-gz {
  font-size: 0.75rem;
  color: #8b7a7a;
  letter-spacing: 1px;
}

.elegant-details { display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 12px; }
.e-detail { display: flex; flex-direction: column; align-items: center; }
.e-val { font-size: 1.1rem; font-weight: 600; color: #3d2d2d; }
.e-lbl { font-size: 0.7rem; color: #8b7a7a; letter-spacing: 3px; margin-top: 2px; }
.e-sep { color: #d4c4c4; font-size: 1.5rem; }

.elegant-venue { display: flex; flex-direction: column; align-items: center; }

/* ========== 水墨丹青 ========== */
.chinoiserie-invitation {
  background: linear-gradient(180deg, #f5f0e8 0%, #ede5d8 50%, #e8ddd0 100%);
  color: #3d2b1f;
  padding: 40px 30px;
  position: relative;
  overflow: hidden;
}

.ink-birds {
  position: absolute;
  top: 20px;
  right: 30px;
  font-size: 1.5rem;
  opacity: 0.3;
}

.chinoiserie-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stamp {
  width: 56px;
  height: 56px;
  border: 3px solid #c0392b;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: #c0392b;
  font-family: 'Ma Shan Zheng', cursive;
  margin-bottom: 16px;
  transform: rotate(-5deg);
  opacity: 0.85;
}

.ch-title {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 2.8rem;
  color: #3d2b1f;
  letter-spacing: 12px;
  margin-bottom: 16px;
}

/* 水墨风照片 */
.ch-photo {
  margin: 12px auto 20px;
}
.ch-photo .couple-photo {
  border-radius: 4px;
  max-width: 92%;
  max-height: 260px;
  border: 2px solid rgba(61, 43, 31, 0.2);
  box-shadow: 2px 2px 8px rgba(61, 43, 31, 0.1);
  filter: sepia(15%);
}

.ch-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.ch-name {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 2.2rem;
  color: #3d2b1f;
  letter-spacing: 4px;
}

.ch-conn {
  font-size: 1.4rem;
  color: #7a6555;
}

.ch-text {
  line-height: 2.2;
  font-size: 1.1rem;
  letter-spacing: 2px;
  margin-bottom: 16px;
}

.ch-invite { margin-top: 4px; }
.ch-guest {
  font-size: 1.3rem;
  font-weight: 700;
  color: #c0392b;
}

/* 水墨风农历 */
.ch-lunar-box {
  background: rgba(192, 57, 43, 0.06);
  border: 1.5px solid rgba(192, 57, 43, 0.2);
  border-radius: 8px;
  padding: 12px 24px;
  margin-bottom: 16px;
  position: relative;
}

.ch-lunar-title {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 1.1rem;
  color: #c0392b;
  letter-spacing: 4px;
  margin-bottom: 4px;
}

.ch-lunar-date {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 1.8rem;
  color: #3d2b1f;
  letter-spacing: 4px;
}

.ch-lunar-gz {
  font-size: 0.8rem;
  color: #7a6555;
  letter-spacing: 2px;
  margin-top: 4px;
}

.ch-details {
  border-top: 1px solid rgba(61, 43, 31, 0.2);
  padding-top: 16px;
  line-height: 2;
  font-size: 0.95rem;
  color: #5a4636;
  letter-spacing: 1px;
  margin-bottom: 20px;
}

.ch-footer { margin-top: 8px; }
.ch-seal {
  display: inline-block;
  padding: 6px 20px;
  border: 2px solid #c0392b;
  border-radius: 4px;
  color: #c0392b;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 1.1rem;
  letter-spacing: 4px;
}

@media (max-width: 560px) {
  .invitation-card {
    border-radius: 12px;
  }
  /* 照片主视觉响应式 */
  .pe-content { padding: 18px 20px 28px; }
  .pe-title { font-size: 2rem; letter-spacing: 6px; }
  .pe-name { font-size: 1.3rem; }
  .pe-wedding-text { font-size: 1rem; letter-spacing: 3px; }
  .pe-info-section { font-size: 0.85rem; }
  .pe-message { font-size: 0.85rem; }
  .pe-sincere { font-size: 0.84rem; }
  .pe-photo-section { aspect-ratio: 3 / 2.5; }
  
  /* 森系小清新响应式 */
  .fn-card { padding: 16px; }
  .fn-cn-title { font-size: 22px; }
  .fn-en-title { font-size: 11px; }
  .fn-content-section { font-size: 13px; }
  .fn-couple-info { font-size: 15px; margin: 18px 0; }
  .fn-wedding-info { font-size: 13px; }
  
  .classic-border { padding: 28px 18px; }
  .classic-title { font-size: 2.2rem; }
  .name { font-size: 1.8rem; }
  .romantic-invitation { padding: 30px 20px; }
  .r-name { font-size: 2rem; }
  .elegant-invitation { padding: 40px 24px; }
  .e-name { font-size: 2rem; }
  .chinoiserie-invitation { padding: 30px 20px; }
  .ch-title { font-size: 2.2rem; }
  .ch-name { font-size: 1.8rem; }
  .couple-photo { max-height: 160px !important; }
}
</style>
