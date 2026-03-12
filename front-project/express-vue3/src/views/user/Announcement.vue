<script setup>
defineOptions({
    name: 'Announcement',
});
import { computed, onMounted, onUnmounted, reactive, ref, nextTick } from 'vue';
import axiosInstance from '@/api/axios';
import { apiConfig } from '@/config/apiConfig';

// --- 状态与引用 ---
const noticeContainer = ref(null); // 绑定公告容器 ref
const noticeInfo = reactive([]);
const isBackTop = ref(false); // 是否回到顶部
const isLoadMore = ref(false); // 是否加载更多数据
const allLoaded = ref(false); // 是否全部加载完成
let last_id = null; // 设置当前请求页中的最后一个id
const pageSize = 19; // 设置每页最大展示数
const queryPageNum = 18; // 设置查询公告条数
const pageNum = ref(1); // 设置页数，每页最大呈现数据，滚动条触底则加一

// 用户未滑动时所呈现的数据，触底即每次增加
const displayInfo = computed(() => {
    const startIndex = 0;
    const endIndex = pageNum.value * pageSize;
    return noticeInfo.slice(startIndex, endIndex);
});

// --- 逻辑处理 ---
let scrollTimer = null;
const handleScroll = (event) => {
    if (scrollTimer) {
        clearTimeout(scrollTimer);
    }

    scrollTimer = setTimeout(() => {
        const container = event.target; // 获取触发事件的元素对象
        const scrollTop = container.scrollTop; // 获取滚动条滚动的距离
        
        // 滚动超过 200px 显示回到顶部按钮
        isBackTop.value = scrollTop >= 200;
        
        const clientHeight = container.clientHeight; // 获取容器可视部分的高度
        const scrollHeight = container.scrollHeight; // 获取内容区域高度

        // 判断是否即将触底(即距离此时内容底部100px时)，此时预加载数据
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            loadMoreData();
        }
    }, 400);
};

// 加载函数、正式应该是从后端请求数据过来
const loadMoreData = async () => {
    // 本地数据加载完，才决定是否发起请求
    if (isLoadMore.value || allLoaded.value) return;

    // 开启加载状态
    isLoadMore.value = true;

    // 修正加载条显示：确保加载状态出现后容器滚动到底部
    nextTick(() => {
        if (noticeContainer.value) {
            noticeContainer.value.scrollTop = noticeContainer.value.scrollHeight;
        }
    });

    // 逻辑修复：如果本地还有数据没显示完
    if (pageNum.value * pageSize < noticeInfo.length) {
        // 人为延迟 600ms，让用户感知到“正在加载”
        await new Promise(resolve => setTimeout(resolve, 600));
        pageNum.value++;
        isLoadMore.value = false;
        return;
    }
    
    try {
        // 使用 Promise.all 确保请求至少持续 800ms，防止加载动画闪现
        const [response] = await Promise.all([
            axiosInstance.get(apiConfig.announcement, {
                params: { last_id, queryPageNum }, // 对于get请求使用params传递参数
            }),
            new Promise(resolve => setTimeout(resolve, 800))
        ]);

        const { afficheData } = response.data;
        
        // 给新数据添加 isExpanded 属性
        const newData = afficheData.data.map(item => ({
            ...item,
            isExpanded: false 
        }));
        
        if (newData && newData.length > 0) {
            noticeInfo.push(...newData);
            last_id = afficheData.lastCursor;
            
            // 收到新数据后，页数自增以显示新内容
            pageNum.value++; 
        }
        
        if (!afficheData.hasMore || newData.length === 0) {
            allLoaded.value = true;
        }
    } catch (error) {
        console.error('加载失败：', error);
    } finally {
        isLoadMore.value = false; // 确保在 finally 中清除加载状态
    }
};

// 回到顶部功能
const scrollToTop = () => {
    if (noticeContainer.value) {
        noticeContainer.value.scrollTo({
            top: 0, // 最终滚动到的位置
            behavior: 'smooth', // 滚动方式
        });
        isBackTop.value = false;
    }
};

onMounted(async () => {
    if (noticeContainer.value) {
        noticeContainer.value.addEventListener('scroll', handleScroll);
    }
    // 初始加载第一波数据
    await loadMoreData();
});

onUnmounted(() => {
    if (noticeContainer.value) {
        noticeContainer.value.removeEventListener('scroll', handleScroll);
    }
});
</script>

<template>
    <div class="content-container">
        <div class="notice-container" ref="noticeContainer">
            <div 
                class="notice-item" 
                v-for="item in displayInfo" 
                :key="item.affiche_id"
                :class="{ 'is-expanded': item.isExpanded }"
            >
                <div class="notice-header" @click="item.isExpanded = !item.isExpanded">
                    <div class="header-main">
                        <span class="date">{{ item.created_at }}</span>
                        <h3 class="notice-title">{{ item.affiche_title }}</h3>
                    </div>
                    <div class="expand-icon" :class="{ 'rotate': item.isExpanded }">▼</div>
                </div>
                
                <div class="notice-content-wrapper" :class="{ 'is-open': item.isExpanded }">
                    <div class="notice-content-inner">
                        <div class="notice-content">
                            <p>{{ item.affiche_content }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="status-tip loading-box" v-if="isLoadMore">
                <div class="cyber-spinner"></div>
                <span class="loading-text">加载中...</span>
            </div>
            
            <div class="status-tip all-loaded-tip" v-if="allLoaded && !isLoadMore">
                <span class="line"></span>
                <span class="text">已显示全部...</span>
                <span class="line"></span>
            </div>
            
            <div class="bottom-padding"></div>
        </div>

        <Transition name="fade">
            <div class="back-to-top" v-show="isBackTop" @click="scrollToTop">
                <div class="arrow">▲</div>
                <div class="text">TOP</div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.content-container {
    position: relative; /* 为回到顶部按钮提供定位基准 */
    box-sizing: border-box;
    padding: 20px 0;
    height: 100%;
    width: 100%;
    background-repeat: no-repeat;
    background-size: cover;
    background-attachment: fixed;
    background-color: #030808;
    background-image: url('../../assets/images/background-img/PC海琴烟-鬼刀.png');
    background-position: center;
}
.notice-container {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    /* 解决闪现：强制显示透明滚动条轨道，确保宽度计算恒定 */
    overflow-y: scroll;
    scrollbar-gutter: stable;
    box-sizing: border-box;
}

.notice-item {
    flex: 0 0 auto;
    margin-bottom: 30px;
    width: 80%;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.notice-item:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
}

.notice-header {
    padding: 15px 20px;
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-main {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.date {
    font-size: 0.85rem;
    color: #232626;
    margin-bottom: 8px;
    opacity: 0.8;
}

.notice-title {
    font-size: 1.25rem;
    color: #fff;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.expand-icon {
    position: absolute;
    right: 25px;
    top: 50%;
    transform: translateY(-50%);
    transition: transform 0.4s ease;
    font-size: 12px;
    color: #687575;
}

.expand-icon.rotate {
    transform: translateY(-50%) rotate(180deg);
}

.notice-content-wrapper {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.5s ease;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.2);
}

.notice-content-wrapper.is-open {
    grid-template-rows: 1fr;
}

.notice-content-inner {
    min-height: 0; 
}

.notice-content {
    padding: 20px;
    color: #e0f7f7;
    line-height: 1.6;
    letter-spacing: 1.2px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.notice-content p {
    padding: 0 5px;
    text-align: start;
    white-space: pre-wrap; 
    word-wrap: break-word; 
    word-break: break-all;
}

.loading-box {
    background: rgba(0, 0, 0, 0.5);
    padding: 12px 25px;
    border-radius: 50px;
    border: 1px solid rgba(0, 249, 249, 0.4);
    box-shadow: 0 0 20px rgba(0, 249, 249, 0.2);
    margin: 20px 0;
    display: flex;
    align-items: center;
    gap: 15px;
}

.cyber-spinner {
    width: 26px;
    height: 26px;
    border: 4px solid rgba(0, 249, 249, 0.1);
    border-top: 4px solid #00f9f9;
    border-radius: 50%;
    filter: drop-shadow(0 0 5px #00f9f9);
    animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.loading-text {
    color: #00f9f9;
    font-weight: 500;
    animation: breath 1.5s infinite ease-in-out;
}

.all-loaded-tip {
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgba(0, 249, 249, 0.4);
    margin: 20px 0;
}
.all-loaded-tip .line {
    width: 30px;
    height: 1px;
    background: rgba(0, 249, 249, 0.2);
}
.all-loaded-tip .text{
    color: #8fa0a0;
}

.back-to-top {
    position: absolute;
    right: 40px;
    bottom: 60px;
    width: 50px;
    height: 50px;
    background: rgba(0, 249, 249, 0.15);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 249, 249, 0.5);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 100;
}

.back-to-top .arrow { color: #00f9f9; font-size: 14px; }
.back-to-top .text { color: #00f9f9; font-size: 10px; font-weight: bold; }

.fade-enter-active, .fade-leave-active {
    transition: opacity 0.4s, transform 0.4s;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@keyframes breath {
    0%, 100% { opacity: 0.5; transform: scale(0.98); }
    50% { opacity: 1; transform: scale(1); }
}

.bottom-padding {
    height: 60px;
    flex-shrink: 0;
}

.notice-container::-webkit-scrollbar { width: 6px; }
.notice-container::-webkit-scrollbar-thumb {
    background: rgba(0, 249, 249, 0.1);
    border-radius: 10px;
}
.notice-container:hover::-webkit-scrollbar-thumb { background: rgba(0, 249, 249, 0.4); }

@media (max-width: 768px) {
    
    .content-container {
        background-image: url('../../assets/images/background-img/Mobile海琴烟-鬼刀.png');
        background-position: top center;
        background-attachment: scroll; /* 移动端 fixed 有时会有性能抖动 */
    }
    .notice-item { width: 88%; }
    .back-to-top { right: 20px; bottom: 40px; }

}
</style>