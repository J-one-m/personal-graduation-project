<script setup>
import axiosInstance from '@/api/axios';
import { apiConfig } from '@/config/apiConfig';
import { computed } from 'vue';

const props = defineProps(['id', 'currentId', 'planDescription']);
const emit = defineEmits(['plan-delete', 'plan-status-change']);

const isActive = computed(() => props.id === props.currentId);

// 改变状态：请求成功后通知父组件
const changePlanStatus = async (planId) => {
    try {
        await axiosInstance.patch(apiConfig.changePlanStatus, { planId });
        // 成功后通知父组件刷新或局部更新
        emit('plan-status-change', planId);
    } catch (error) {
        console.error('更新失败：', error);
    }
};

// 删除计划：请求成功后通知父组件
const removeUserPlan = async (planId) => {
    try {
        await axiosInstance.delete(apiConfig.deleteUserPlan, {
            params: { planId }
        });
        // 关键：只有请求成功才 emit，触发父组件重新拉取数据
        emit('plan-delete', planId);
    } catch (error) {
        console.error('删除失败：', error);
    }
};
</script>

<template>
  <div class="check-box" v-if="isActive">
    <div class="plan-item" v-for="item in props.planDescription" :key="item.planId">
      <div 
        class="action-btn finish-btn" 
        :class="{ 'is-completed': item.isFinished }" 
        @click.stop="changePlanStatus(item.planId)"
      >
        <svg viewBox="0 0 1024 1024" width="18" height="18">
          <path d="M407.04 707.008L195.904 496a29.824 29.824 0 0 0-30.976-8 29.76 29.76 0 0 0-22.528 22.464 32.128 32.128 0 0 0 8.512 31.488l256 256 512-512a32.448 32.448 0 0 0-1.536-45.504 30.272 30.272 0 0 0-21.952-9.472 32.832 32.832 0 0 0-22.528 8.96l-465.92 467.072z" fill="currentColor"></path>
        </svg>
      </div>

      <span class="plan-text" :class="{ 'text-completed': item.isFinished }">
        {{ item.planDetail }}
      </span>

      <div class="action-btn delete-btn" @click.stop="removeUserPlan(item.planId)">
        <svg viewBox="0 0 1024 1024" width="16" height="16">
          <path d="M214.784 168.96a30.464 30.464 0 0 0-43.2 0 30.72 30.72 0 0 0 0 43.392l297.152 298.24L168.96 811.52a30.72 30.72 0 0 0 0 43.328 30.4 30.4 0 0 0 43.136 0L512 554.048l299.968 301.056a30.4 30.4 0 0 0 43.136 0 30.72 30.72 0 0 0 0-43.392L555.136 510.592l296.704-297.856a30.72 30.72 0 0 0 0-43.328 30.464 30.464 0 0 0-43.136 0L511.936 467.2 214.784 168.96z" fill="currentColor"></path>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.check-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
}

/* 单条计划容器 */
.plan-item {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: row;
  align-items: flex-start; /* 允许文字多行时对齐顶部 */
  gap: 10px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.plan-item:hover {
  background: rgba(255, 255, 255, 0.7);
  transform: translateX(4px);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 按钮通用样式 */
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-top: -2px; /* 修正与文字的行高对齐 */
}

/* 完成按钮样式 */
.finish-btn {
  color: #909399;
  border: 1.5px solid #dcdfe6;
}

.finish-btn:hover {
  background-color: #f0f9eb;
  color: #67c23a;
  border-color: #67c23a;
}

/* 已完成状态的按钮 */
.finish-btn.is-completed {
  background-color: #67c23a;
  color: #ffffff;
  border-color: #67c23a;
}

/* 文字内容样式 */
.plan-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.4;
  color: #303133;
  word-break: break-all;
  white-space: pre-wrap; /* 保留空格换行 */
  transition: all 0.3s;
}

/* 已完成的文字效果 */
.text-completed {
  color: #c0c4cc;
  text-decoration: line-through;
}

/* 删除按钮样式 */
.delete-btn {
  color: #909399;
  opacity: 0; /* 默认隐藏，hover显示 */
}

.plan-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background-color: #fef0f0;
  color: #f56c6c;
}

/* 移动端适配：删除按钮直接显示，避免hover失效 */
@media (max-width: 768px) {
  .delete-btn {
    opacity: 0.6;
  }
  .plan-item:active {
    background: rgba(255, 255, 255, 0.8);
  }
  .plan-text {
    font-size: 14px;
  }
}
</style>