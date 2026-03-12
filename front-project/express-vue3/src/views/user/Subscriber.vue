<script setup>
defineOptions({
    name:'Subscriber',
});
import useRouterStore from '@/stores/useRouterStore';
import { computed,ref } from 'vue';
import { RouterLink,RouterView } from 'vue-router';
import useAppStore from '@/stores/useAppStore';
import { storeToRefs } from 'pinia';



const {state} = useRouterStore();
const appStore = useAppStore();
const {isMobile} = storeToRefs(appStore);

let isCollapsed = ref(false);
let toggleName = ref('折叠');
const mobileInfoContainerIsFold = ref(false);//控制走马灯视口折叠
// 对应的切换函数
const toggleMobileFold = () => {
    mobileInfoContainerIsFold.value = !mobileInfoContainerIsFold.value;
};

// 侧边栏宽度计算
const computedWidth = computed(()=>{
    return {
        'width': isCollapsed.value ? '80px' : '200px', // 收起时 80px 足够放头像
    };
});

const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
    toggleName.value = isCollapsed.value ? '展开' : '折叠';
};

const userInfo = computed(()=>state.userInfo.username || '未登录');



const scrollContainer = ref(null);
const activeIndex = ref(0);

// 处理横向滑动监听
const handleScroll = (event) => {
    const scrollLeft = event.target.scrollLeft;
    const width = event.target.clientWidth; // 获取当前视口宽度
    activeIndex.value = Math.round(scrollLeft / width);
};

// 点击圆点跳转
const scrollToArea = (index) => {
    if (!scrollContainer.value) return;
    const width = scrollContainer.value.clientWidth;
    scrollContainer.value.scrollTo({
        left: index * width,
        behavior: 'smooth'
    });
};



</script>

<template>
    <div v-if="!isMobile" class="subscriber-container">
        <div  
          class="subscriber-info-container" 
          :style="computedWidth"
        >
            <!-- 用户信息导航区 -->
            <div class="head-area">
                <div class="info-area1">
                    <img :src="state.userInfo.user_image" alt="用户头像" style="width: 100px;border-radius: 50%;">                
                    <span class="user-name-text">{{ userInfo }}</span>
                </div>
                <div class="info-area2">
                    <!-- 此处除开账号，其它选择性展示 -->
                    <span>账号：{{ state.userInfo.account }}</span>
                    <span>性别：{{ state.userInfo.gender }}</span>                
                    <span>年龄：{{ state.userInfo.age }}</span>
                    <span style="white-space: nowrap;">邮箱：{{ state.userInfo.mailbox }}</span>
                    <span>信誉分：{{ state.userInfo.credit_score }}</span>
                    <span>住址：{{ state.userInfo.address }}</span>
                    
                    <span>
                        <router-link to="/userInfoModify">修改资料</router-link>
                    </span>
                    <!-- <span v-show="!isMobile" @click="toggleCollapse">{{ toggleName }}</span> -->
                </div>
                <div class="toggle-btn-wrapper" v-if="!isMobile" @click="toggleCollapse">
                    <span class="toggle-icon">{{ isCollapsed ? '▶' : '◀' }}</span>
                    <span class="toggle-text">{{ toggleName }}</span>
                </div>
            </div>


            <div class="main-area">
                <h1>制定计划：</h1>
                <div>
                    <!-- 根据选择的计划类型，动态渲染 -->
                    <div><router-link :to="{path:'/userPlan',query:{id:1}}">日计划</router-link></div>
                    <!-- 有周，复杂度会上升很多，考虑的东西也多，且因为时间等因素故而去掉，此处不加以实现 -->
                    <!-- <div><router-link :to="{path:'/userPlan',query:{id:2}}">周计划</router-link></div> -->
                    <div><router-link :to="{path:'/userPlan',query:{id:3}}">月计划</router-link></div>
                    <div><router-link :to="{path:'/userPlan',query:{id:4}}">年计划</router-link></div>
                </div>
            </div>


            <div class="footer-area">
                <h1>记录：</h1>
                <div>
                    <div><router-link to="/userRecord">预约记录</router-link></div>
                    <div><router-link to="/candidateRecord">候补记录</router-link></div>
                    <div><router-link to="/lostAndFoundInfo">个人失物招领管理</router-link></div>
                </div>
            </div>
            
        </div>
        <div class="info-show">
            <router-view></router-view>
        </div>
    </div>




    
    <!-- 移动端布局 -->
    <!-- 屎山代码：只能弄两套布局了 -->
<div v-else class="mobile-subscriber-container">
    <div class="mobile-info-show">
        <router-view></router-view>
    </div>

    <div class="carousel-dot" v-show="!mobileInfoContainerIsFold">
        <span 
            v-for="(val, index) in 3" 
            :key="index"
            :class="{ active: activeIndex === index }"
            @click="scrollToArea(index)"
        ></span>
    </div>


    <div class="mobile-info-wrapper">
        <div 
            class="mobile-subscriber-info-container" 
            :class="{ 'is-folded': mobileInfoContainerIsFold }"
            ref="scrollContainer"
            @scroll="handleScroll"
        >
            <div class="area-container">
                <div class="mobile-head-area mobile-area-card">
                    <div class="mobile-info-area1">
                        <img :src="state.userInfo.user_image" alt="用户头像">
                        <span class="user-name">{{ userInfo }}</span>
                    </div>
                    <div class="mobile-info-area2">
                        <span>账号：{{ state.userInfo.account }}</span>
                        <span>性别：{{ state.userInfo.gender }}</span>                
                        <span>年龄：{{ state.userInfo.age }}</span>
                        <span style="white-space: nowrap;">邮箱：{{ state.userInfo.mailbox }}</span>
                        <span>信誉分：{{ state.userInfo.credit_score }}</span>
                        <span>住址：{{ state.userInfo.address }}</span>
                        <span><router-link to="/userInfoModify" class="modify-link">修改资料</router-link></span>
                    </div>
                </div>

                <div class="mobile-main-area mobile-area-card">
                    <h1 class="area-title">制定计划</h1>
                    <div class="mobile-btn-group">
                        <router-link :to="{path:'/userPlan',query:{id:1}}">日计划</router-link>
                        <router-link :to="{path:'/userPlan',query:{id:3}}">月计划</router-link>
                        <router-link :to="{path:'/userPlan',query:{id:4}}">年计划</router-link>
                    </div>
                </div>

                <div class="mobile-footer-area mobile-area-card">
                    <h1 class="area-title">记录查询</h1>
                    <div class="mobile-btn-group">
                        <router-link to="/userRecord">预约记录</router-link>
                        <router-link to="/candidateRecord">候补记录</router-link>
                        <router-link to="/lostAndFoundInfo">失物管理</router-link>
                    </div>
                </div>
            </div>

            <div class="mobile-fold-trigger" @click="toggleMobileFold">
                <span>{{ mobileInfoContainerIsFold ? '展开 ↑' : '收起 ↓' }}</span>
            </div>
        </div>
    </div>
    
</div> 
</template>

<style scoped>
.subscriber-container {
    height: 100%;
    width: 100%;
    /* 移除 min-width: 1100px，改为 max-width 配合 margin 居中 */
    max-width: 100vw; 
    background-image: url('../../assets/images/background-img/PC山庄木屋树木.png');
    background-size: cover;
    background-position: center;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 20px;
    padding: 10px;
    box-sizing: border-box;
    overflow: hidden; /* 禁止外层出现滚动条 */
}

/* 2. 侧边栏容器：支持平滑折叠 */
.subscriber-info-container {
    height: 90%;
    background: rgba(255, 255, 255, 0.25) !important;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    /* transition 必须包含 width */
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s;
    color: #2c3e50;
    padding: 10px 15px 20px 15px;
    position: relative;
    overflow: hidden; /* 折叠时隐藏溢出文字 */
}

/* 3. 头部头像区 */
.head-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    /* gap: 10px; */
    padding-bottom: 10px;
    border-bottom: 1px dashed rgba(78, 245, 162, 0.6);
    flex-shrink: 0;
}

.info-area1 {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.info-area1 img {
    /* 移除行内样式干扰，由 CSS 控制 */
    width: 60px !important; 
    height: 60px !important;
    border-radius: 50%;
    border: 3px solid #fff;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    transition: transform 0.3s;
}

.user-name-text {
    margin-top: 10px;
    font-weight: bold;
    white-space: nowrap;
    transition: opacity 0.3s;
}

/* 4. 信息与操作区：控制折叠隐藏 */
.info-area2, .main-area, .footer-area {
    width: 100%;
    transition: opacity 0.3s, transform 0.3s;
}

.info-area2 {
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 15px 0;
}

.main-area h1, .footer-area h1 {
    font-size: 15px;
    margin: 15px 0 10px 0;
    white-space: nowrap;
}

.main-area > div, .footer-area > div {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

/* 按钮样式 */
.main-area div div, .footer-area div div {
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(78, 245, 162, 0.3);
    border-radius: 20px;
    padding: 0; /* 重点：外层 div 不设 padding */
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    overflow: hidden; /* 保证圆角剪裁内部链接 */
}
.main-area div div a, .footer-area div div a {
    display: block;   /* 变成块元素 */
    width: 100%;      /* 宽度撑满 */
    height: 100%;     /* 高度撑满 */
    padding: 6px 12px; /* 把原来的间距写在这里 */
    box-sizing: border-box;
    color: inherit;
    text-decoration: none;
}

.main-area div div:hover {
    background: #4ef5a2;
    transform: translateY(-2px);
}

/* 5. 重点：折叠状态下的显示控制 */
/* 当 width 被 script 设置为 80px 时：
   隐藏所有文字内容，只保留头像和展开按钮
*/
.subscriber-info-container[style*="width: 80px"] .info-area2,
.subscriber-info-container[style*="width: 80px"] .user-name-text,
.subscriber-info-container[style*="width: 80px"] .main-area,
.subscriber-info-container[style*="width: 80px"] .footer-area {
    opacity: 0;
    pointer-events: none; /* 防止点击到隐藏的按钮 */
    transform: translateX(-20px);
}

/* 6. 展开/折叠按钮固定在底部 */
.toggle-btn-wrapper {
    margin-top: auto; /* 推到底部 */
    padding: 10px 0;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    background: rgba(78, 245, 162, 0.1);
    border-radius: 8px;
    transition: background 0.2s;
}

.toggle-btn-wrapper:hover {
    background: rgba(78, 245, 162, 0.3);
}

.toggle-icon {
    font-size: 12px;
}

.toggle-text {
    margin-left: 8px;
    font-size: 14px;
    font-weight: bold;
}

/* 折叠时隐藏按钮文字，只留图标 */
.subscriber-info-container[style*="width: 80px"] .toggle-text {
    display: none;
}

/* 7. 右侧展示区 */
.info-show {
    height: 90%;
    flex: 1; /* 占据剩余所有空间 */
    max-width: 1000px;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    padding: 25px;
    box-sizing: border-box;
    overflow-y: auto;
}

/* 链接重置 */
a {
    color: inherit;
    text-decoration: none;
}






/* 移动端适配 */
@media (max-width:768px){

}

/* 1. 移动端主容器：背景图铺满，整体 Flex 纵向布局 */
.mobile-subscriber-container {
    box-sizing: border-box;
    background-image: url('../../assets/images/background-img/Mobile山庄-木屋-树木.png');
    background-size: cover;
    background-position: center;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px 15px;
    gap: 10px;
}

/* 顶部路由内容区 */
.mobile-info-show {
    flex: 1; 
    background-color: rgba(240, 248, 255, 0.3);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    /* padding: 15px; */
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* 轮播圆点 */
.carousel-dot {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 5px 0;
    /* 隐藏 */
    transition: opacity 0.3s;
}
.carousel-dot span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transition: all 0.3s ease;
}
.carousel-dot span.active {
    background: #59fdab;
    transform: scale(1.3);
}

.mobile-info-wrapper {
    position: relative; 
    width: 100%;
    /* 这里的 height 会跟随内部滚动容器的变化 */
}
/* 走马灯滑动视口 */
.mobile-subscriber-info-container {
    width: 100%;
    height: 160px; /* 固定下方信息栏高度 */
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    border-radius: 12px;

    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.mobile-subscriber-info-container::-webkit-scrollbar {
    display: none;
}
/* 折叠状态样式 */
.mobile-subscriber-info-container.is-folded {
    height: 40px; /* 仅保留触发条的高度 */
    background-color: rgba(255, 255, 255, 0.9);
}
/* 折叠触发条 */
.mobile-fold-trigger {
    width: 50px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 13px;
    font-weight: bold;
    color: #239672;
    background: rgba(255, 255, 255, 0.5);
    border-bottom: 1px solid rgba(0,0,0,0.05);
    cursor: pointer;
    /* z-index: 10; */
    position: absolute;
    top: 0;
    right: 0;
}
/* 折叠时隐藏内容容器 */
.is-folded .area-container {
    opacity: 0;
    pointer-events: none;
    transform: translateY(40px);
    transition: all 0.3s;
}

/* 走马灯长容器 */
.area-container {
    display: flex;
    width: 300%; /* 三个板块 */
    height: 100%;
    transition: all 0.3s;
}

/* 基础块定义：仅控制尺寸，不强制 Flex 布局 */
.mobile-area-card {
    flex: 0 0 33.333%;
    width: 100%;
    height: 100%;
    scroll-snap-align: start; 
    background-color: rgba(255, 255, 255, 0.65);
    box-sizing: border-box;
    padding: 15px;
}

.mobile-head-area {
    display: flex;             /* 显式声明 Flex */
    flex-direction: row;       /* 强制水平 */
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
}

.mobile-info-area1 {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 5px;
}
.mobile-info-area1 img {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    border: 2px solid #59fdab;
    object-fit: cover;
}
.user-name {
    font-size: 14px;
    font-weight: bold;
    color: #434343;
}

.mobile-info-area2 {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-left: 15px;
    border-left: 1px solid rgba(0,0,0,0.1);
}
.mobile-info-area2 span {
    font-size: 12px;
    color: #484848;
    white-space: nowrap;
}
.mobile-info-area2 span:last-child{
    width: 100%;
}


.mobile-main-area {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
}

.mobile-footer-area {
    display: flex;
    flex-direction: column; 
    justify-content: flex-start;
    align-items: flex-start;
}





.area-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 5px;
    color: #2c3e50;
}

/* 按钮组网格布局 (计划和记录板块共用) */
.mobile-btn-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 平分三列 */
    gap: 8px;
    width: 100%;
}

.mobile-btn-group a {
    background: #ffffff;
    padding: 5px 2px;
    text-align: center;
    border-radius: 8px;
    font-size: 11px;
    color: #333;
    text-decoration: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    border: 1px solid rgba(0,0,0,0.03);
}

/* 特殊链接样式 */
.modify-link {
    color: #376ca0;
    font-weight: bold;
    font-size: 12px;
    margin-top: 5px;
}
</style>


<!-- 

@media (max-width: 768px) {
    .subscriber-container {

        box-sizing: border-box;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center; /* 确保子元素在容器内水平居中对齐 */
        min-width: 0;
        gap: 15px;
        padding: 30px 10px 20px 10px;
        background-image: url('../../assets/images/background-img/Mobile山庄-木屋-树木.png');
    }

    .subscriber-info-container {
        /* 1. 强制宽度与 info-show 一致（覆盖 :style） */
        width: 100% !important; 
        max-width: none;
        height: auto;
        min-height: 250px;
        
        /* 2. 布局：改为单行横向网格 */
        display: grid;
        /* 定义 3 列，每列固定 280px 宽度以触发容器滚动 */
        grid-template-columns: repeat(3, 280px); 
        grid-template-rows: 1fr;
        grid-template-areas: "head main footer";
        
        /* 3. 开启横向滚动 */
        overflow-x: auto; 
        overflow-y: hidden;
        justify-content: flex-start;
        
        /* 4. 滚动优化 */
        scroll-snap-type: x mandatory; 
        -webkit-overflow-scrolling: touch;
        gap: 0; /* 间距由子元素的 padding 控制更稳妥 */
        padding: 15px;
        box-sizing: border-box;
        position: relative;
    }

    /* 隐藏移动端滚动条（可选，让界面更整洁） */
    .subscriber-info-container::-webkit-scrollbar {
        display: none;
    }

    /* 5. 确保三个区域在滚动时保持固定宽度 */
    .head-area, .main-area, .footer-area {
        grid-row: 1;
        width: 280px; 
        box-sizing: border-box;
        padding: 0 15px;
        border-bottom: none;
        scroll-snap-align: center;
    }

    .head-area { 
        grid-area: head; 
        border-right: 2px solid rgb(78, 245, 162);
    }
    .main-area { 
        grid-area: main; 
        border-right: 2px solid rgb(78, 245, 162);
        margin-top: 0; /* 重置 PC 端的 margin */
    }
    .footer-area { 
        grid-area: footer; 
        margin-top: 0; 
    }

.carousel-dot {
    position: sticky; /* 改为 sticky 或是确保在滚动容器内不随内容滚走 */
    left: 0;
    right: 0;
    bottom: 20px;
    margin: 0 auto;
    width: 80px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    z-index: 20;
    /* 增加一个微弱的背景阴影，确保在不同背景图下都能看清点 */
    background: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}
.carousel-dot span {
    height: 8px;
    width: 8px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.4);
    transition: all 0.3s ease;
    cursor: pointer;
    border: 1px solid rgba(0, 0, 0, 0.1);
}
/* 当前激活圆点的样式 */
.carousel-dot span.active {
    background-color: rgb(89, 253, 171); /* 使用你主题里的绿色 */
    transform: scale(1.3);     /* 稍微放大一点点 */
    box-shadow: 0 0 8px rgba(78, 245, 162, 0.6);
}




    .info-show {
        width: 100% !important; 
        margin-top: -5px;
        flex: 1;
        overflow: auto;
    }
}

-->