<script setup>
/* 
  代办事项：
    1.公告发布时间显示问题（已完成）
    2.公告标题的放置
    3.编辑以及删除功能的实现
*/


import { ref,onMounted, watch } from 'vue'
import { Top,IconLoading,Edit,IconDelete,ArrowDownBold,ArrowUpBold } from '@/config/adminIcons';
import axiosInstance from '@/api/axios';
import { apiConfig } from '@/config/apiConfig';

// 获取格式化日期字符串的函数 (YYYY-MM-DD)
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const end = new Date();
const start = new Date();
// 设置为 30 天前
start.setDate(start.getDate() - 30);
// 默认选择一个月内的时间范围
const value1 = ref([formatDate(start), formatDate(end)]);

// 1.定义状态变量
const loading = ref(false);//判断是否加载数据
const noMore = ref(false);//判断是否还有数据可供加载
const isTooltipDisabled = ref(false);//点击展开以及收起箭头时隐藏提示框

// 2.定义数据变量
const scrollBarRef = ref(null); // 获取滚动组件实例
let scrollOffset = ref(0);//滚动条滚动的距离
const displayedData = ref([]);//展示的数据
const limit = 10; // 每页条数

const loadMore = async (isAppend = false) => {
  if (loading.value || (isAppend && noMore.value)) return;
  loading.value = true;

  const offset = isAppend ? displayedData.value.length : 0;
  try {
    const response = await axiosInstance.get(apiConfig.checkAffiche, {
      params: { start: value1.value[0], end: value1.value[1], offset, limit }
    });

    const { data, hasMore } = response;

    // --- 关键点：将原始数据映射为带有 UI 状态的数据 ---
    const newData = data.map(item => ({
      ...item,          // 保留后端传来的 affiche_content, affiche_id 等
      isExpanded: false // 注入前端专用的状态属性
    }));

    if (isAppend) {
      displayedData.value = [...displayedData.value, ...newData];
    } else {
      displayedData.value = newData;
    }

    noMore.value = !hasMore;
  } catch (error) {
    console.error("加载失败", error);
  } finally {
    loading.value = false;
  }
};

const handleScroll = ({scrollTop})=>{
    scrollOffset.value = scrollTop;
};


// 回到顶部
const backToTop = ()=>{
    if(scrollOffset.value){
        scrollBarRef.value.setScrollTop(0);
    }
    
};

// 编辑按钮
const editAffiche = ()=>{

  console.log("@check-affiche.vue",'点击编辑公告');
}
// 删除按钮
const deleteAffiche = ()=>{

  console.log("@check-affiche.vue",'点击编辑公告');
}
// 收起与展开
const toggleExpand = (item)=>{
  isTooltipDisabled.value = true;
  // 直接修改当前点击项的状态
  item.isExpanded = !item.isExpanded;

  setTimeout(()=>{
    isTooltipDisabled.value = false;
  },500);//定时时间与展开动画的时间一致
};


const loadData = async()=>{
  // 重置状态
  noMore.value = false;
  // 使用 loadMore 函数加载第一页数据（不是追加模式）
  await loadMore(false);
}

onMounted(async()=>{
  loadData();
});


watch(()=> [...value1.value],(newVal)=>{
  if (newVal[0] && newVal[1]) {
    loadData();
  }
});
</script>


<template>
<!-- <h1>查看公告</h1> -->
<!-- 此处还可能需要做防抖处理，待后续解决 -->
<div class="demo-datetime-picker">
    <div class="block">
      <span class="demonstration">选择起止时间</span>
      <el-date-picker
        v-model="value1"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        format="YYYY-MM-DD"       value-format="YYYY-MM-DD"
      />
    </div>

    <div class="scrollbar-container">
      <el-scrollbar 
        @end-reached="loadMore" 
        @scroll="handleScroll"
        ref="scrollBarRef"
        :distance="40"
    >
        <div
            class="affiche-container"
            :class="{'is-expanded': item.isExpanded}"
            v-for="item in displayedData" :key="item.affiche_id" 
        >
          <span class="time-span">{{ new Date(item.pubdate).toLocaleString() }}</span>
          <div class="scrollbar-demo-item">
            <div class="content-wrapper">
              <h3 class="affiche-title">{{ item.affiche_title }}</h3>
              <p>{{ item.affiche_content }}</p>
            </div>
            <div class="button-container">
              <el-tooltip 
                content="编辑"
                placement="left"
                effect="light"
              >
                <el-button @click="editAffiche" :icon="Edit"></el-button>
              </el-tooltip>

              <el-tooltip
                content="删除"
                placement="left"
                effect="light"
              >
                <el-button @click="deleteAffiche" :icon="IconDelete"></el-button>
              </el-tooltip>
            </div>
          </div>
          <div @click="toggleExpand(item)" class="arrow-container">
            <!-- 使用css可以用但图标实现一样的效果 -->
            <el-tooltip 
              :content="item.isExpanded ? '收起' : '展开'"
              placement="top"
              effect="light"
              :disabled="isTooltipDisabled"
            >
              <el-icon v-if="item.isExpanded"><ArrowUpBold /></el-icon>
              <el-icon v-else><ArrowDownBold /></el-icon>
            </el-tooltip>
          </div>
        </div>

        <div class="scrollbar-bottom">
          <div v-if="loading">
            <el-icon size="20" class="is-loading"><IconLoading /></el-icon>
            <span>加载中......</span>
          </div>
          <div v-if="noMore">没有更多数据了</div>
        </div>
      </el-scrollbar>
    </div>
    
    
</div>

<div @click="backToTop" v-show="scrollOffset" class="back-top">
    <el-icon size="30" color="#008c8c"><Top /></el-icon>
</div>


</template>


<style scoped>
    
.demo-datetime-picker {
  width: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.block {
  text-align: center;
  border-right: solid 1px var(--el-border-color);
  min-width: 300px;
  flex-shrink: 0;
  margin-bottom: 25px;
}

.block:last-child {
  border-right: none;
}

.block .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 10px;
}


.scrollbar-container{
    flex-grow: 1;
    min-height: 0;
}
:deep(.el-scrollbar) {
  height: 100%; 
}

.affiche-container{
  position: relative;
    display: flex;
    box-sizing: border-box;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    height: 120px;
    margin-bottom: 20px;
    overflow: hidden;
    margin-bottom: 20px;
    border-bottom: 1px solid #eee;
    /* padding-bottom: 20px; */
    transition: height 0.5s ease;
}
/* 展开后的高度样式 */
.affiche-container.is-expanded{
  height: 500px;

}
.time-span{
    box-sizing: border-box;
    height: 15px;
    margin-bottom: 10px;
}
.scrollbar-demo-item {
  box-sizing: border-box;
  display: flex;
  flex-grow: 1;
  width: 100%;
  align-items: stretch;
  justify-content: center;
  min-height: 50px;
  height: auto;
  padding-bottom: 20px;
  border-radius: 4px;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  overflow: hidden;
}
.scrollbar-demo-item p{
  text-align: left;
  line-height: 1.6;
  padding: 5px 10px;
  margin-top: 5px;
  /* 设置文字缩进 */
  text-indent: 2em;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  text-overflow: ellipsis;
  /* padding-bottom: 20px; */
  overflow-y: hidden;
  transition: all 0.3s ease;
}

.content-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column; /* 纵向排列标题和内容 */
  overflow: hidden; /* 防止内容溢出 */
}
.affiche-title {
  text-align: center;      /* 行内居中 */
  margin: 10px 0 5px 0;    /* 调整上下间距 */
  font-size: 1.1rem;       /* 比正文略大 */
  color: var(--el-color-primary); /* 使用 Element Plus 主色调 */
  font-weight: bold;
  flex-shrink: 0;          /* 标题不压缩 */
}


/* 展开状态逻辑 */
.is-expanded .content-wrapper {
  height: 100%;
}
.is-expanded .scrollbar-demo-item{
  /* 展开后改为顶部对齐，方便阅读 */
  align-items: flex-start;
}
.is-expanded .scrollbar-demo-item p{
  display: block;
  -webkit-line-clamp: initial;
  line-clamp: inherit;
  /* 撑满父容器高度、开启纵向滚动条、给滚动条留点空间 */
  height: 100%;
  overflow-y: auto;
  padding-right: 5px;
}
/* 自定义滚动条样式 */
.is-expanded .scrollbar-demo-item p::-webkit-scrollbar{
  width: 6px;
}
.is-expanded .scrollbar-demo-item p::-webkit-scrollbar-thumb{
  background-color: var(--el-color-primary-light-5);
  border-radius: 10px;
}

.button-container{
  flex-grow: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  height: 100%;
  width: auto;
  margin-right: 5px;
}
.button-container .el-button {
  margin-left: 0 !important; 
  padding: 8px;
}
.arrow-container{
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 30px;
  height: 30px;
  /* background-color: antiquewhite; */
  position: absolute;
  bottom: 0;
}
.arrow-container:hover{
  cursor: pointer;
}



.scrollbar-bottom{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}
.scrollbar-bottom .el-icon{
  margin-right: 8px;
  vertical-align: middle;
}
@keyframes rotating{
  from{
    transform: rotate(0deg);
  }
  to{
    transform: rotate(360deg);
  }
}
.is-loading{
  animation: rotating 2s linear infinite;
}



.back-top{
    height: 35px;
    width: 35px;
    /* transform: translateY(-50%); */
    display: flex;
    border-radius: 50%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color:cadetblue;
    position: fixed;
    right: 20px;
    bottom: 40%;
}
.back-top:hover{
    cursor: pointer;
}



@media (max-width: 768px) {
  .block {
    flex: 100%;
    border-right: none;
    border-bottom: solid 1px var(--el-border-color);
  }

  .block:last-child {
    border-bottom: none;
  }

  :deep(.el-date-editor.el-input) {
    width: 100%;
  }

  :deep(.el-date-editor.el-input__wrapper) {
    width: 100%;
    max-width: 300px;
  }
}
</style>