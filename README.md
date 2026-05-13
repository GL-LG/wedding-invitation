<div align="center">

# 💒 婚礼邀请函生成器 · Wedding Invitation Generator

一款精美的在线婚礼电子邀请函生成工具，支持**单人定制**与**Excel 批量生成**，内置 6 种国风/现代风格模板，一键导出高清 PNG 图片。

[在线预览](https://your-demo-url.com) · [功能特性](#-功能特性) · [快速开始](#-快速开始) · [使用指南](#-使用指南)

</div>

---

## ✨ 功能特性

### 🎨 六种精美风格

| 风格                   | 预览              | 特点                                 |
| ---------------------- | ----------------- | ------------------------------------ |
| 🌿**森系小清新** | `fresh-nature`  | 绿色自然基调，清新文艺               |
| 📷**照片主视觉** | `photo-elegant` | 以大尺寸新人合照为主体，欧式花纹装饰 |
| 🏮**经典中国风** | `classic`       | 大红底色，传统喜庆氛围               |
| 🌸**浪漫花卉**   | `romantic`      | 粉色系花卉装饰，温馨浪漫             |
| ✨**简约优雅**   | `elegant`       | 米白底色，极简线条设计               |
| 🖌️**水墨丹青** | `chinoiserie`   | 宣纸底纹，水墨国画意境               |

### 📸 核心功能

- **单人定制** — 填写新人信息、宾客姓名、时间地点，实时预览邀请函
- **新人合照上传** — 支持上传婚纱照/合影嵌入邀请函
- **批量生成** — 上传 Excel 宾客名单（.xlsx），一键生成全部邀请函并打包下载（ZIP）
- **农历转换** — 公历自动转农历日期 + 天干地支纪年，契合传统习俗
- **高清导出** — 基于 `html2canvas` 以 3 倍缩放导出 PNG，印刷级画质
- **Excel 模板下载** — 提供标准化模板，按格式填写即可批量导入

### 📄 邀请函内容

- 新人姓名（新郎/新娘）
- 宾客尊称 + 性别称谓
- 婚礼日期（公历 + 农历 + 干支）
- 婚礼时间与地点
- 个性化邀请文案
- 自定义合照展示

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm / yarn / pnpm

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/GL-LG/wedding-invitation.git
cd wedding-invitation

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 本地预览构建结果
npm run preview
```

### 命令说明

| 命令                | 用途                                                   |
| ------------------- | ------------------------------------------------------ |
| `npm run dev`     | 启动 Vite 开发服务器（默认 `http://localhost:5173`） |
| `npm run build`   | 构建生产版本到 `dist/` 目录                          |
| `npm run preview` | 本地预览构建结果                                       |

---

## 📖 使用指南

### 单人生成

1. 在首页表单中填写新人信息（新郎/新娘姓名、婚礼日期、时间、地点）
2. 选择邀请函风格
3. 可选上传新人合照
4. 输入宾客姓名并选择性别
5. 点击 **「生成邀请函」** 进入预览
6. 点击 **「保存图片」** 导出为高清 PNG

### 批量生成

1. 在首页点击 **「📦 批量生成」** 按钮
2. 填写共同的婚礼设置（新人信息、日期、地点、风格、合照）
3. 点击 **「下载 Excel 模板」**，按模板格式填写宾客名单
4. 上传填写好的 `.xlsx` 文件，预览宾客列表
5. 点击 **「开始批量生成」**，系统为每位宾客生成单独的邀请函
6. 生成完成后点击 **「打包下载」**，所有图片以 ZIP 格式下载

---

## 🛠️ 技术栈

| 技术                                                              | 用途                         |
| ----------------------------------------------------------------- | ---------------------------- |
| [Vue 3](https://vuejs.org/) （Composition API + `<script setup>`） | 前端框架                     |
| [Vite](https://vite.dev/)                                            | 构建工具                     |
| [html2canvas](https://html2canvas.hertzen.com/)                      | DOM 转图片导出               |
| [JSZip](https://stuk.github.io/jszip/)                               | 批量打包下载                 |
| [xlsx](https://sheetjs.com/)                                         | Excel 模板生成与宾客名单解析 |
| [file-saver](https://github.com/eligrey/FileSaver.js/)               | 文件下载                     |
| [lunar-javascript](https://www.npmjs.com/package/lunar-javascript)   | 公历转农历                   |

---

## 📁 项目结构

```
wedding-invitation/
├── public/                  # 静态资源
├── src/
│   ├── assets/              # 图片、图标等资源
│   ├── components/
│   │   ├── WeddingForm.vue      # 表单组件（单人模式）
│   │   ├── WeddingInvitation.vue  # 邀请函渲染组件（6种风格）
│   │   └── BatchProcessor.vue   # 批量生成组件
│   ├── utils/
│   │   ├── lunar.js             # 农历转换工具（自主实现，含1900-2100年数据）
│   │   └── xlsTemplate.js       # Excel 模板生成与解析
│   ├── App.vue              # 根组件（页面路由控制）
│   ├── main.js              # 应用入口
│   └── style.css            # 全局样式
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支：`git checkout -b feat/your-feature`
3. 提交修改：`git commit -m 'feat: add some feature'`
4. 推送分支：`git push origin feat/your-feature`
5. 提交 Pull Request

---

## 📄 开源许可

本项目基于 [MIT License](LICENSE) 开源，欢迎自由使用和修改。

---

<div align="center">
Made with ❤️ for every happy couple
</div>
