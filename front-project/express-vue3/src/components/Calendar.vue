<script setup>
import { computed, onMounted, ref, defineEmits, watch } from 'vue';
import useAppStore from '@/stores/useAppStore';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';

const appStore = useAppStore();
const { isMobile } = storeToRefs(appStore);

const tempValue = ref('');
const props = defineProps(['addPlan', 'planType']);
const emit = defineEmits(['date-selected', 'sync-update-plans']);

const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

// 格式化日期
const formatDate = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
};

const currentDate = new Date();
const currentYear = ref(currentDate.getFullYear());
const currentMonth = ref(currentDate.getMonth() + 1);
const selectedDate = ref(formatDate(currentDate));

// 生成年份选项（当前年份前后10年）
const yearRange = computed(() => {
    const years = [];
    for (let i = currentYear.value - 10; i <= currentYear.value + 10; i++) {
        years.push(i);
    }
    return years;
});

const handleAddPlan = () => {
    tempValue.value = tempValue.value.replace(/\n/g, '');
    if(!tempValue.va1){
        ElMessage.warning('计划信息不允许为空！');
    }
    props.addPlan(tempValue.value);
    tempValue.value = '';
};

// 按钮切换月份
const changeMonth = (step) => {
    let newM = currentMonth.value + step;
    if (newM < 1) {
        currentYear.value--;
        currentMonth.value = 12;
    } else if (newM > 12) {
        currentYear.value++;
        currentMonth.value = 1;
    } else {
        currentMonth.value = newM;
    }
};

// 监听年月手动修改，触发父组件日期更新（可选：默认选中该月1号）
watch([currentYear, currentMonth], () => {
    // 如果需要手动切换年月后立即刷新数据，可以在这里调用 emit
});

const dateMatrix = computed(() => {
    const matrix = [];
    const currentMonthDay = new Date(currentYear.value, currentMonth.value, 0).getDate();
    const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1).getDay();

    let frontSpace = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < frontSpace; i++) {
        matrix.push({ day: '', empty: true });
    }
    for (let j = 1; j <= currentMonthDay; j++) {
        const date = new Date(currentYear.value, currentMonth.value - 1, j);
        const dateStr = formatDate(date);
        matrix.push({
            date: dateStr,
            day: j,
            empty: false,
            'is-today': dateStr === formatDate(new Date()),
        });
    }
    while (matrix.length < 42) {
        matrix.push({ day: '', empty: true });
    }
    return matrix;
});

const selectDate = (date) => {
    if (!date) return;
    selectedDate.value = date;
    emit('date-selected', selectedDate.value);
};

onMounted(() => {
    emit('date-selected', selectedDate.value);
});
</script>
<template>
    <div class="select-date">
        <div class="calendar-head">
            <button class="nav-btn" @click="changeMonth(-1)">
                <svg viewBox="0 0 1024 1024" width="16" height="16"><path d="M669.6 849.6c8.8 8 22.4 7.2 30.4-1.6s7.2-22.4-1.6-30.4l-304-273.6 304-273.6c8.8-8 9.6-21.6 1.6-30.4s-21.6-9.6-30.4-1.6l-320 288c-4.8 4-7.2 9.6-7.2 16s2.4 12 7.2 16l320 288z" fill="#fff"></path></svg>
            </button>

            <div class="custom-selectors">
                <select v-model="currentYear" class="date-select year-select">
                    <option v-for="y in yearRange" :key="y" :value="y">{{ y }}年</option>
                </select>
                <select v-model="currentMonth" class="date-select month-select">
                    <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                </select>
            </div>

            <button class="nav-btn" @click="changeMonth(1)">
                <svg viewBox="0 0 1024 1024" width="16" height="16"><path d="M354.4 849.6l320-288c4.8-4 7.2-9.6 7.2-16s-2.4-12-7.2-16l-320-288c-8.8-8-22.4-7.2-30.4 1.6s-7.2 22.4 1.6 30.4l304 273.6-304 273.6c-8.8 8-9.6 21.6-1.6 30.4 4 4.8 10.4 7.2 16 7.2 5.6 0 11.2-2.4 15.2-7.2z" fill="#fff"></path></svg>
            </button>
        </div>

        <div class="calendar-main">
            <span v-for="title in weekdays" :key="title" class="weekday-label">{{ title }}</span>
            <div 
                v-for="(item, index) in dateMatrix" 
                :key="index"
                :class="['date-cell', { 
                    'selected': item.date === selectedDate, 
                    'empty': item.empty, 
                    'is-today': item['is-today'] 
                }]"
                @click="selectDate(item.date)"
            >
                {{ item.day }}
            </div>
        </div>
    </div>

    <div v-if="!isMobile" class="add-plan">
        <!-- <div class="addArea"> -->
            <textarea v-model="tempValue" placeholder="记录当下的计划..."></textarea>
        <!-- </div> -->
        <div class="addButton">
            <button type="button" @click="handleAddPlan">添加</button>
        </div>
    </div>
</template>

<style scoped>
/* 1. 父容器毛玻璃效果 */
.select-date {
    flex: 1;

    background: rgba(255, 255, 255, 0.2); /* 半透明白 */
    backdrop-filter: blur(12px); /* 毛玻璃核心 */
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    padding: 15px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
}

/* 2. 头部选择器样式 */
.calendar-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.custom-selectors {
    display: flex;
    gap: 18px;
}

.date-select {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 8px;
    color: #fff;
    padding: 2px 4px;
    font-size: 15px;
    font-weight: 600;
    outline: none;
    cursor: pointer;
    appearance: none; /* 去掉默认箭头 */
    text-align: center;
}

.date-select option {
    background: #2ebf91; /* 下拉菜单背景 */
    color: #fff;
}

.nav-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: background 0.3s;
}
.nav-btn:hover { background: rgba(255, 255, 255, 0.5); }

/* 3. 日历网格样式 */
.calendar-main {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    flex: 1;
    gap: 5px;
    align-items: center;
}

.weekday-label {
    text-align: center;
    color: rgba(255, 255, 255, 0.9);
    font-size: 12px;
    font-weight: bold;
    padding-bottom: 2px;
}

.date-cell{
    aspect-ratio: 1; /* 保持正方形 */
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 10px;
    font-weight: 550;
    font-size: 12px;
    color: rgba(57, 50, 50,0.77);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.date-cell:not(.empty):hover {
    background: rgba(255, 255, 255, 0.3);
}

/* 选中状态 */
.selected {
    background: #fff !important;
    color: #2ebf91 !important;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: scale(1.1);
}

/* 今天状态 */
.is-today {
    border: 2px solid #fff;
    box-sizing: border-box;
}

.empty { cursor: default; }

/* 4. 下方添加区域样式 */
.add-plan {
    height: 25%;
    margin-top: 15px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(12px);
    border-radius: 15px;
    display: flex;
    justify-content: space-between;
    /* align-items: center; */
    padding: 15px;
    gap: 15px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    /* box-sizing: border-box; */
}

textarea {
    flex: 1;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 10px;
    resize: none;
    outline: none;
    font-size: 14px;
    transition: border-color 0.3s;
    background-color: rgba(255, 255, 255,0.3);
}
textarea:focus { border-color: #2ebf91; }

.addButton{
    display: flex;
    flex-direction: column;
    justify-content: center;
}
.addButton button {
    padding: 7px 20px;
    background: linear-gradient(135deg, #2ebf91, #8360c3);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-weight: bold;
    cursor: pointer;
}

/* 移动端微调 */
@media (max-width: 768px) {
    .select-date { height: auto; min-height: 380px; }
    .date-cell { font-size: 13px; }
}
</style>