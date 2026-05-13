/**
 * 生成 XLS 模板并下载
 */
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export function downloadTemplate() {
  const wb = XLSX.utils.book_new()

  const headers = [['宾客姓名', '宾客性别（男/女）']]
  const sampleData = [
    ['张三', '男'],
    ['李四', '女'],
    ['王五', '男']
  ]

  const wsData = [
    ...headers,
    ...sampleData,
    [],
    ['【填写说明】'],
    ['1. 第一行为表头，请勿修改'],
    ['2. "宾客性别"请填写"男"或"女"'],
    ['3. 每行代表一位宾客，将自动生成对应的邀请函'],
    ['4. 保存文件后在上传页面选择该文件']
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // 设置列宽
  ws['!cols'] = [
    { wch: 20 },
    { wch: 20 }
  ]

  XLSX.utils.book_append_sheet(wb, ws, '宾客名单')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, '宾客名单模板.xlsx')
}

/**
 * 读取 XLS 文件，返回宾客列表
 * @param {File} file
 * @returns {Array<{guestName: string, guestGender: string}>}
 */
export function readGuestList(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 })

        const guests = []
        for (let i = 1; i < json.length; i++) {
          const row = json[i]
          if (!row || !row[0]) continue
          const name = String(row[0]).trim()
          const genderRaw = String(row[1] || '').trim()
          if (!name) continue
          const gender = genderRaw === '女' ? 'female' : 'male'
          guests.push({ guestName: name, guestGender: gender })
        }

        if (guests.length === 0) {
          reject(new Error('未读取到有效宾客数据，请检查文件格式'))
          return
        }
        resolve(guests)
      } catch (err) {
        reject(new Error('文件解析失败：' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}
