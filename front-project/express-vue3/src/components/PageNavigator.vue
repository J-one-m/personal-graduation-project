<script setup>
import { ref,computed, onMounted, onUnmounted, watch, } from 'vue';

// 需要传入的参数：用户页数增减的函数changePage
// 总页数：totalPages
const props =  defineProps(['totalPages']);
const emit = defineEmits(['pageChange']);
const isShow = ref(false);
const currentPage = ref(1);
const pagesNum = ref(null);

const ellipsisShow = computed(()=>{//根据页数返回需要渲染的页数导航栏状态
    if(props.totalPages > 8){
        return [1,2,3,4,5,'ellipsis',props.totalPages-1,props.totalPages];
    }else{
        return props.totalPages
    }
});

const changePages = (num)=>{
    const newPage = currentPage.value + num
    if( newPage >= 1 && newPage <= props.totalPages){//判断是否越界
        // venuePageChange(newPage);//待定
        currentPage.value = newPage;
    }else{
        currentPage.value;//待定
    }
    console.log('@PageNavigation.vue',currentPage.value);
};
const handleEnter = ()=>{
    // NaN仍会被判定为number，且NaN之间不会相等，对于parseInt而言，若字符串以数字开头，则从头转换，直到不是数字，若不是以数字开头，则返回NaN。eg：if(parseInt(pagesNum.value) === 'number')
    const pageNumber = parseInt(pagesNum.value);
    if(!isNaN(pageNumber) && pageNumber > 0 && pageNumber <= props.totalPages){
        currentPage.value = pageNumber;//待定
    }else{
        // 后续完善时不建议用
        alert('输入非法或者页码不存在');
    }
};
const getCurrentPage = (num)=>{
    currentPage.value = num;
    console.log('@PageNavigation.vue',num);
};
const inputPage = ()=>{
    isShow.value = true;
};
const handleClickOutside = (()=>{
    isShow.value = false;
    pagesNum.value = null;
});

watch(currentPage,(newValue)=>{
    emit('pageChange',newValue);
});

onMounted(()=>{
    document.addEventListener('click',handleClickOutside);
});
onUnmounted(()=>{
    document.removeEventListener('click',handleClickOutside);
});

</script>

<template>
  <div class="nav-container">
    
    <div class="icon-navigation" @click="currentPage > 1 && changePages(-1)">
      <span class="span-style" :class="{ 'disabled': currentPage === 1 }">
        <svg class="icon" viewBox="0 0 1024 1024" width="16" height="16">
          <path 
            d="M224 480h640c9.344 0 17.024 3.008 23.04 8.96 5.952 6.016 8.96 13.696 8.96 23.04a31.168 31.168 0 0 1-8.96 23.04 31.168 31.168 0 0 1-23.04 8.96h-640a31.168 31.168 0 0 1-23.04-8.96A31.168 31.168 0 0 1 192 512c0-9.344 3.008-17.024 8.96-23.04a31.168 31.168 0 0 1 23.04-8.96z m12.992 32l265.984 264.96c6.016 6.72 9.024 14.4 9.024 23.04a30.72 30.72 0 0 1-9.536 22.464A30.72 30.72 0 0 1 480 832a33.408 33.408 0 0 1-23.04-8.96l-288-288A33.408 33.408 0 0 1 160 512c0-8.64 3.008-16.32 8.96-23.04l288-288A33.408 33.408 0 0 1 480 192a30.72 30.72 0 0 1 22.464 9.472A30.72 30.72 0 0 1 512 224a33.408 33.408 0 0 1-8.96 23.04L236.928 512z" 
            fill="currentColor"
          ></path>
        </svg>
      </span>
    </div>

    <div 
      v-for="num in ellipsisShow" 
      :key="num" 
      class="icon-navigation" 
      @click="num !== 'ellipsis' && getCurrentPage(num)"
    >
      <span 
        v-if="num === 'ellipsis'" 
        class="span-style ellipsis-span" 
        @click.stop="inputPage" 
        :class="{'is-input': isShow}"
      >
        <template v-if="!isShow">
          <svg class="icon" viewBox="0 0 1024 1024" width="16" height="16">
            <path d="M176 416c32 0.64 58.496 11.52 79.488 32.512 20.992 20.992 31.808 47.488 32.512 79.488-0.64 32-11.52 58.496-32.512 79.488-20.992 20.992-47.488 31.808-79.488 32.512-32-0.64-58.496-11.52-79.488-32.512C75.52 586.496 64.704 560 64 528c0.64-32 11.52-58.496 32.512-79.488 20.992-20.992 47.488-31.808 79.488-32.512zM512 416c32 0.64 58.496 11.52 79.488 32.512 20.992 20.992 31.808 47.488 32.512 79.488-0.64 32-11.52 58.496-32.512 79.488C570.496 628.48 544 639.296 512 640c-32-0.64-58.496-11.52-79.488-32.512-20.992-20.992-31.808-47.488-32.512-79.488 0.64-32 11.52-58.496 32.512-79.488C453.504 427.52 480 416.704 512 416z m336 0c32 0.64 58.496 11.52 79.488 32.512 20.992 20.992 31.808 47.488 32.512 79.488-0.64 32-11.52 58.496-32.512 79.488-20.992 20.992-47.488 31.808-79.488 32.512-32-0.64-58.496-11.52-79.488-32.512-20.992-20.992-31.808-47.488-32.512-79.488 0.64-32 11.52-58.496 32.512-79.488 20.992-20.992 47.488-31.808 79.488-32.512z" 
                  fill="currentColor"></path>
          </svg>
        </template>
        <input 
          v-else 
          v-model="pagesNum"
          class="display-change" 
          placeholder="跳转" 
          @click.stop 
          @keyup.enter="handleEnter"
        />
      </span>
      
      <span 
        v-else 
        class="get-span span-style" 
        :class="{ 'active': currentPage === num }"
      >
        {{ num }}
      </span>
    </div>

    <div class="icon-navigation" @click="currentPage < totalPages && changePages(1)">
      <span class="span-style" :class="{ 'disabled': currentPage === totalPages }">
        <svg class="icon" viewBox="0 0 1024 1024" width="16" height="16">
          <path 
            d="M755.008 480H160a31.168 31.168 0 0 0-23.04 8.96A31.168 31.168 0 0 0 128 512c0 9.344 3.008 17.024 8.96 23.04 6.016 5.952 13.696 8.96 23.04 8.96h595.008L520.96 776.96a33.408 33.408 0 0 0-8.96 23.04c0 8.64 3.2 16.128 9.536 22.464A30.72 30.72 0 0 0 544 832a33.408 33.408 0 0 0 23.04-8.96l288-288A33.408 33.408 0 0 0 864 512a33.408 33.408 0 0 0-8.96-23.04l-288-288A33.408 33.408 0 0 0 544 192a30.72 30.72 0 0 0-22.464 9.472A30.72 30.72 0 0 0 512 224c0 8.64 3.008 16.32 8.96 23.04l234.048 232.96z" 
            fill="currentColor"
          ></path>
        </svg>
      </span>
    </div>
    
  </div>
</template>

<style scoped>
.nav-container {
    width: 100%;
    height: 50px;
    display: flex;
    justify-content: flex-end; /* 靠右对齐 */
    align-items: center;
    column-gap: 8px; /* 减小间距，让组件更紧凑 */
    padding-right: 10px;
    user-select: none; /* 防止文字被选中 */
}

/* 基础圆形按钮样式 */
.span-style {
    color: #606266;
    background-color: #ffffff;
    border: 1px solid #dcdfe6;
    border-radius: 8px; /* 改为圆角矩形更现代，或 50% 保持圆形 */
    height: 32px;
    width: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 鼠标悬浮效果 */
.icon-navigation:hover .span-style:not(.disabled) {
    color: #409eff;
    border-color: #c6e2ff;
    background-color: #ecf5ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(64, 158, 255, 0.2);
}
/* 基础箭头颜色 */
.icon-navigation .span-style svg {
    fill: #909399; /* 默认中性灰 */
    transition: all 0.3s ease;
}

/* 悬浮时变色 - 使用你定义的灰蓝色系 */
.icon-navigation:not(:has(.disabled)):hover .span-style svg {
    fill: #7b8db2; /* 悬浮时变为深蓝灰色 */
}

/* 禁用状态的样式 (第一页时的左箭头，最后一页时的右箭头) */
.disabled {
    cursor: not-allowed !important; /* 鼠标样式变为禁用 */
    opacity: 0.4; /* 变透明 */
    background-color: #f5f7fa !important; /* 背景变浅灰 */
    border-color: #e4e7ed !important;
    transform: none !important; /* 取消悬浮位移 */
    box-shadow: none !important; /* 取消阴影 */
}

.disabled svg {
    fill: #c0c4cc !important; /* 箭头颜色变极淡 */
}

/* 激活状态（当前页） */
.active {
    color: #ffffff !important;
    background: linear-gradient(135deg, #9bb0d9 0%, #7b8db2 100%) !important;
    border-color: transparent !important;
    box-shadow: 0 4px 10px rgba(123, 141, 178, 0.4) !important;
}

/* 左右箭头的 SVG 颜色处理 */
.icon-navigation svg {
    fill: #909399; /* 默认灰色 */
    transition: fill 0.3s;
}
.icon-navigation:hover svg {
    fill: #409eff;
}
.active svg {
    fill: #ffffff;
}

/* 省略号/输入框容器 */
.ellipsis-span {
    position: relative;
    cursor: pointer;
}

.is-input {
    width: 70px !important; /* 展开后的宽度 */
    background-color: #f5f7fa !important;
    border-style: dashed;
}

/* 输入框内部样式优化 */
.is-input > input {
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    text-align: center;
    color: #409eff;
    font-weight: bold;
    font-size: 13px;
}

.is-input > input::placeholder {
    font-size: 10px;
    color: #a8abb2;
    font-weight: normal;
}

.is-input > input:focus {
    outline: none;
}

/* 进场动画 - 让切换页码时有一点灵动感 */
.get-span {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}

/* 针对移动端的适配优化 */
@media (max-width: 768px) {
    .nav-container {
        /* justify-content: center; 移动端居中 */
        column-gap: 5px;
    }
    .span-style {
        height: 28px;
        width: 28px;
        font-size: 12px;
    }
}
</style>