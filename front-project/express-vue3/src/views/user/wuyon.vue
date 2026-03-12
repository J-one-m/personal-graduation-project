<template>
  <div class="custom-calendar">
    <!-- 1. 日历头部：月份切换 + 年份显示 -->
    <div class="calendar-header">
      <button @click="changeMonth(-1)" class="btn">←</button>
      <h3>{{ currentYear }}年{{ currentMonth }}月</h3>
      <button @click="changeMonth(1)" class="btn">→</button>
    </div>

    <!-- 2. 星期表头（可自定义周起始日，此处为“周一到周日”） -->
    <div class="calendar-weekdays">
      <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
    </div>

    <!-- 3. 日期网格（6行7列） -->
    <div class="calendar-days">
      <div
        v-for="(item, index) in dateMatrix"
        :key="index"
        class="calendar-day"
        :class="{
          'prev-month': item.type === 'prev', // 上月占位
          'next-month': item.type === 'next', // 下月占位
          'current-month': item.type === 'current', // 当月日期
          'today': item.isToday, // 今日
          'selected': item.date === selectedDate // 选中日期
        }"
        @click="selectDate(item.date)"
        :disabled="item.type !== 'current'"
      >
        <!-- 特殊日期标记（示例：节假日/事件） -->
        <span class="day-number">{{ item.day }}</span>
        <span v-if="item.isSpecial" class="special-dot"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// -------------------------- 1. 基础状态定义 --------------------------
// 当前选中的日期（格式：YYYY-MM-DD）
const selectedDate = ref('')
// 当前显示的年份和月份（默认取当前系统日期）
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1) // 月份：JS 原生是 0-11，此处转为 1-12
// 星期表头（可调整顺序，如 ['日','一','二',...,'六']）
const weekdays = ref(['一', '二', '三', '四', '五', '六', '日'])
// 特殊日期配置（示例：2024-10-01 为节假日）
const specialDates = ref(['2024-10-01', '2024-10-02'])


// -------------------------- 2. 核心：生成日期矩阵 --------------------------
const dateMatrix = computed(() => {
  const matrix = [] // 最终的 6x7 日期矩阵
  const year = currentYear.value
  const month = currentMonth.value

  // ① 计算当月第一天和最后一天（JS 原生 Date 月份为 0-11，需减 1）
  const firstDayOfMonth = new Date(year, month - 1, 1) // 当月第一天
  const lastDayOfMonth = new Date(year, month, 0) // 当月最后一天（month 传当前月，date 传 0 即上月最后一天）

  // ② 计算需要补充的“上月末尾天数”（比如当月第一天是周三，需补周一、周二）
  const firstDayWeek = firstDayOfMonth.getDay() || 7 // 周几：0=周日，转为 7 方便计算（对应表头“日”）
  const prevMonthDaysCount = firstDayWeek - 1 // 上月需补充的天数（表头从周一开始，所以减 1）

  // ③ 计算需要补充的“下月开头天数”（保证矩阵是 6 行 7 列 = 42 个格子）
  const totalDays = 42 // 6*7
  const currentMonthDaysCount = lastDayOfMonth.getDate() // 当月总天数
  const nextMonthDaysCount = totalDays - (prevMonthDaysCount + currentMonthDaysCount) // 下月需补充的天数

  // ④ 填充“上月末尾日期”到矩阵
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate() // 上月最后一天的日期（如 30）
  for (let i = 0; i < prevMonthDaysCount; i++) {
    const day = prevMonthLastDay - prevMonthDaysCount + 1 + i
    const date = new Date(year, month - 2, day) // 上月日期：month-2 是因为当前 month 已转 1-12，减 2 对应 JS 原生的上月
    matrix.push({
      date: formatDate(date), // 格式化日期：YYYY-MM-DD
      day, // 日期数字（如 29）
      type: 'prev', // 类型：上月占位
      isToday: false, // 是否今日
      isSpecial: false // 是否特殊日期
    })
  }

  // ⑤ 填充“当月日期”到矩阵（核心）
  for (let i = 1; i <= currentMonthDaysCount; i++) {
    const date = new Date(year, month - 1, i)
    const formattedDate = formatDate(date)
    matrix.push({
      date: formattedDate,
      day: i,
      type: 'current', // 类型：当月
      isToday: formattedDate === formatDate(new Date()), // 对比今日
      isSpecial: specialDates.value.includes(formattedDate) // 对比特殊日期
    })
  }

  // ⑥ 填充“下月开头日期”到矩阵
  for (let i = 1; i <= nextMonthDaysCount; i++) {
    const date = new Date(year, month, i)
    matrix.push({
      date: formatDate(date),
      day: i,
      type: 'next', // 类型：下月占位
      isToday: false,
      isSpecial: false
    })
  }

  return matrix
})


// -------------------------- 3. 工具函数 --------------------------
/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} date - 原生 Date 对象
 * @returns {string} 格式化后的日期
 */
const formatDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0') // 月份补 0（如 9 → 09）
  const d = String(date.getDate()).padStart(2, '0') // 日期补 0（如 5 → 05）
  return `${y}-${m}-${d}`
}


// -------------------------- 4. 交互逻辑 --------------------------
/**
 * 切换月份（prev: -1，next: 1）
 * @param {number} step - 步长（-1 上月，1 下月）
 */
const changeMonth = (step) => {
  let newMonth = currentMonth.value + step
  let newYear = currentYear.value

  // 处理月份边界（1 → 12 或 12 → 1）
  if (newMonth < 1) {
    newMonth = 12
    newYear -= 1
  } else if (newMonth > 12) {
    newMonth = 1
    newYear += 1
  }

  currentMonth.value = newMonth
  currentYear.value = newYear
}

/**
 * 选择日期（仅允许选中当月日期）
 * @param {string} date - 格式化后的日期（YYYY-MM-DD）
 */
const selectDate = (date) => {
  // 仅当日期是当月时，才更新选中状态
  const isCurrentMonth = dateMatrix.value.some(item => item.date === date && item.type === 'current')
  if (isCurrentMonth) {
    selectedDate.value = date
    console.log('选中日期：', date) // 可扩展：触发日期选择回调
  }
}
</script>

<style scoped>
.custom-calendar {
  width: 100%;
  max-width: 700px;
  margin: 20px auto;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  font-family: sans-serif;
}

/* 头部样式 */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.btn {
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: background 0.2s;
}
.btn:hover {
  background: #f5f5f5;
}

/* 星期表头样式 */
.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}
.weekday {
  padding: 8px 0;
}

/* 日期网格样式 */
.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.calendar-day {
  aspect-ratio: 1; /* 保证宽高比 1:1，正方形格子 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
}

/* 日期类型样式区分 */
.prev-month, .next-month {
  color: #ccc;
  cursor: not-allowed;
}
.current-month {
  color: #333;
  background: #fff;
  transition: background 0.2s;
}
.current-month:hover {
  background: #f0f7ff;
}

/* 今日样式 */
.today {
  background: #e6f7ff;
  font-weight: 600;
}
.today .day-number {
  color: #1890ff;
}

/* 选中日期样式 */
.selected {
  background: #1890ff !important;
  color: #fff !important;
}

/* 特殊日期标记（小红点） */
.special-dot {
  position: absolute;
  bottom: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff4d4f;
}
</style>