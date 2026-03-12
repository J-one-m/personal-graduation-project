<script setup>
import AdminAside from '@/components/admin/AdminAside.vue';
import AdminHeader from '@/components/admin/AdminHeader.vue';
defineOptions({
    name:'AdminLayout',
});
// 对于elementplus中的图标可以使用插件实现自动导入，也可以在main.js中全局注册
import { ArrowDown,IconSetting,IconBox,IconPromotion,IconUser,IconMenu,OfficeBuilding,Expand,Fold,IconDelete} from '@/config/adminIcons';
import { ref,onMounted,onUnmounted } from 'vue';
import useAppStore from '@/stores/useAppStore';
import { storeToRefs } from 'pinia';
import { ElMessageBox,ElMessage } from 'element-plus';
import useRouterStore from '@/stores/useRouterStore';
import { useRouter } from 'vue-router';

const router = useRouter();
const routerStore = useRouterStore();
const {state} = storeToRefs(routerStore)
const appStore = useAppStore();
const {isMobile} = storeToRefs(appStore);//使用storeToRefs保证在解构后的响应式

const isCollapse = ref(false);//默认展开
// const handleOpen = (key, keyPath) => {
//   console.log(key, keyPath)
// }
// const handleClose = (key, keyPath) => {
//   console.log(key, keyPath)
// }

// 执行登出逻辑
const handleLogout = async()=>{
    ElMessageBox.confirm('您确定要退出系统吗？', '提示',{
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        // 1. 调用 store 中的清理逻辑（清理 token, userInfo, menuList 等）
        await routerStore.cleanToken(); 
        
        // 2. 提示用户
        ElMessage.success('已安全退出！');
        
        // 3. 跳转到登录页
        // 使用 replace 防止用户通过浏览器后退键回到管理界面
        router.replace('/login');
    }).catch(() => {
        // 取消退出
    });
};
const handleSelect = (index) => {
  if (index === 'logout') {
    // 拦截退出登录
    handleLogout();
  }
};
const handleCommand = (command) => {
    if (command === 'logout') {
        handleLogout();
    } else if (command === 'profile') {
        router.push('/adminLayout/adminSetting');
    }
};
</script>
<template>
    <!-- 管理员后台的核心布局组件，它定义了所有后台页面的共享框架。-->
    <!-- 后台的主布局文件 -->
    <!-- 以下采用elementPlus对管理员界面部分进行快速搭建 -->
    <div class="adminLayout">
        <el-container style="height: 100%;background-color: antiquewhite;">
            <el-aside class='admin-aside'>
                <div class="aside-logo" :class="{ 'is-collapsed': isCollapse }">
                    <div class="logo-icon-wrapper">
                        <!-- src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"  -->
                        <el-avatar 
                            :class="['logo-unit', { 'unit-active': isCollapse }]"
                            :size="50" 
                            :src="state.userInfo.user_image"
                        />
                        <el-icon 
                            :class="['logo-unit', { 'unit-active': !isCollapse }]" 
                            color="#fff" 
                            :size="isMobile ? 22 : 28"
                        >
                            <IconMenu />
                        </el-icon>
                    </div>
                    
                    <transition name="el-zoom-in-center">
                        <span v-show="!isCollapse" class="logo-text">管理员界面</span>
                    </transition>
                </div>

                <!-- 
                下面代码中的$route.path
                    $route.path 和 route.path 之间的区别主要在于作用域和访问方式。
                    访问位置,            写法,           是否需要额外代码
                    <template>,         $route.path,    不需要。Vue 内部自动代理。
                    <template>,         route.path,     需要。必须在 script 中定义了 const route = useRoute()。
                    <script setup>,     route.path,      需要。通过 useRoute() 获取。
                    <script setup>,     $route.path,     报错。JS 作用域中没有这个全局变量。
                -->
                <el-menu
                    router
                    :default-active="$route.path"
                    class="el-menu-vertical-demo"
                    :collapse="isCollapse"
                    :collapse-transition="true"
                    @select="handleSelect"
                >
                    <!-- @open="handleOpen"
                    @close="handleClose" -->
                    <el-sub-menu index="admin-user">
                        <template #title>
                            <el-icon :size="isMobile ? 12 : 20"><IconUser /></el-icon>
                            <span>用户</span>
                        </template>
                        <!-- 使用index跳转 -->
                        <el-menu-item index="/adminLayout/userManage">
                            <!-- 使用elementplus自带的路由跳转，就不使用下面的原生方式了 -->
                            <!-- <router-link :to="{name:'userManage'}">用户管理</router-link> -->
                            用户管理
                        </el-menu-item>
                        <el-menu-item index="createUsers" :route="{path:'/adminLayout/createUsers'}">
                            用户创建
                        </el-menu-item>
                    </el-sub-menu>
                    <!-- 
                        对于有子项的则使用el-sub-menu标签，表示点击展开后还有子项
                        而对于没有子项的则使用el-menu-item标签
                        其中的<template #title>用于指示最外层容器的所要显示的名字其中#title为具名插槽的简写形式（v-slot:title）
                        
                        而对于el-menu-item-group：用于包裹el-menu-item们并以一个带名字的灰色分割线来区分。
                            
                        
                        el-sub-menu 内部的结构拆解如下：
                            插槽类型	写法	                             作用
                            具名插槽	<template #title>	                 定义门面。决定了菜单在没拉开时长什么样（名字、图标）。
                            默认插槽	任何不在 template #title 里的内容	  定义内容。决定了菜单拉开（展开）后里面装的是什么。
                    
                        el-menu中，index永远是必填的，它有两个作用：
                        1、身份标识：它是每个菜单项的“唯一身份证”。Element Plus 靠它来判断哪一个菜单该高亮（激活）。
                        2、默认跳转路径：当你开启了 :router="true" 且没有配置 route 属性时，点击菜单会直接跳转到 index 所写的字符串地址。
                    -->
                    <el-sub-menu index="place-manage">
                        <template #title>
                            <el-icon :size="isMobile ? 12 : 20"><OfficeBuilding /></el-icon>
                            <span>场地</span>
                        </template>
                        <el-menu-item index="placeManage" :route="{path:'/adminLayout/placeManage'}">场地管理</el-menu-item>
                        <el-menu-item index="placeServiceCondition" :route="{path:'/adminLayout/placeServiceCondition'}">使用情况</el-menu-item>
                    </el-sub-menu>
                    <el-sub-menu index="affiche">
                        <template #title>
                            <el-icon :size="isMobile ? 12 : 20"><IconPromotion /></el-icon>
                            <span>公告</span>
                        </template>
                        <el-menu-item index="checkAffiche" :route="{path:'/adminLayout/checkAffiche'}">查看公告</el-menu-item>
                        <el-menu-item index="issueAffiche" :route="{path:'/adminLayout/issueAffiche'}">发布公告</el-menu-item>
                    </el-sub-menu>
                    <el-sub-menu index="lostArticle">
                        <template #title>
                            <el-icon :size="isMobile ? 12 : 20"><IconBox /></el-icon>
                            <span>失物</span>
                        </template>
                        <el-menu-item index="publishReview" :route="{path:'/adminLayout/publishReview'}">发布审核</el-menu-item>
                        <el-menu-item index="lossProcessing" :route="{path:'/adminLayout/lossProcessing'}">失物处理</el-menu-item>
                    </el-sub-menu>
                    <el-menu-item index="profile" :route="{path:'/adminLayout/adminSetting'}">
                        <el-icon :size="isMobile ? 12 : 20"><IconSetting /></el-icon>
                        <template #title>设置</template>
                    </el-menu-item>
                    <el-menu-item index="logout" :route="{ path: $route.path }" class="logout-item">
                        <el-icon :size="isMobile ? 12 : 20"><IconDelete /></el-icon>
                        <template #title>退出登录</template>
                    </el-menu-item>
                </el-menu>

            </el-aside>
            
            <el-container>
                <el-header class="admin-header">
                    <div class="header-title">
                        <div style="cursor: pointer;" @click="isCollapse = !isCollapse">
                            <el-icon  v-if="isCollapse" :size="isMobile ? 15 : 30"><Expand /></el-icon>
                            <el-icon  v-else :size="isMobile ? 15 : 30"><Fold /></el-icon>
                        </div>
                        
                        <div id="navigation-container"></div>

                        <div v-if="!isMobile" class="avatar-container">
                            <el-dropdown trigger="click" @command="handleCommand" class="header-dropdown">
                                <div class="avatar-wrapper">
                                    <el-avatar 
                                      :size="50" 
                                      :src="state.userInfo.user_image" 
                                      class="user-avatar"
                                    />
                                    <div class="user-info-vertical">
                                        <span class="user-nickname">系统管理员</span>
                                        <el-icon class="arrow-icon-down"><ArrowDown /></el-icon>
                                    </div>
                                </div>

                                <template #dropdown>
                                    <el-dropdown-menu class="admin-dropdown-menu">
                                        <el-dropdown-item command="profile">
                                            <el-icon><IconUser /></el-icon>个人中心
                                        </el-dropdown-item>
                                        <el-dropdown-item divided command="logout" class="logout-btn">
                                            <el-icon><IconDelete /></el-icon>退出登录
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </div> 
                    </div>
                    
                </el-header>
                <el-main class="admin-main">
                    <!-- 定义路由出口 -->
                    <router-view></router-view>
                </el-main>
            </el-container>
        </el-container>
    </div>

</template>

<style scoped>
.adminLayout {
    width: 100%;
    height: 100%;
}

.admin-aside {
    background-color: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 200px !important; 
    transition: width 0.35s cubic-bezier(0.645, 0.045, 0.355, 1);
}

/* 当菜单折叠时，同步修改Aside 的宽度 */
.admin-aside:has(.el-menu--collapse) {
    width: 64px !important;
}

/* 菜单(Menu)样式修正 */
.el-menu {
    border-right: none;
    /* 让菜单始终撑满Aside的当前宽度，而不是自己控制宽度 */
    width: 100% !important; 
    /* 禁用Element Plus自带的生硬动画，统一由Aside 控制 */
    transition: none !important; 
}

/* 确保折叠状态下的内部图标居中 */
.el-menu--collapse {
    width: 64px !important;
}

/* 消除文字淡入淡出的生硬感 */
.el-menu-vertical-demo:not(.el-menu--collapse) span {
    opacity: 1;
    transition: opacity 0.3s;
}

/* Logo 区域同步 */
.aside-logo {
    height: 75px;
    display: flex;
    align-items: center;
    padding-left: 16px; /* 稍微缩减padding以适配更多情况 */
    box-sizing: border-box;
    width: 100%; /* 始终跟随 Aside 宽度 */
    background-color: lightblue;
    overflow: hidden;
    white-space: nowrap; /* 禁止换行 */
    /* 同步Aside的曲线 */
    transition: padding 0.35s cubic-bezier(0.645, 0.045, 0.355, 1);
}

/* Logo折叠状态下的内边距调整 */
.aside-logo.is-collapsed {
    padding-left: 0;
    justify-content: center;
}

.logo-icon-wrapper {
    width: 32px;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    flex-shrink: 0;
}

/* 图标切换动画逻辑 */
.logo-unit {
    position: absolute;
    transition: all 0.35s cubic-bezier(0.645, 0.045, 0.355, 1);
    opacity: 0;
}
.unit-active {
    opacity: 1 !important;
    transform: scale(1) rotate(0deg) !important;
}

.logo-text {
    margin-left: 12px;
    font-weight: bold;
    color: #fff;
    /* 这里的动画由el-zoom-in-center处理，或由Aside裁剪 */
}

/* 顶部Header与其他 */
.admin-header {
    background-color: aqua;
    height: 75px;
}
.header-title {
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

#navigation-container {
    flex: 1;
    margin: 0 20px 0 25px;
    display: flex;
    align-items: center;
}
/* --- 个人中心垂直容器 --- */
.avatar-container {
    height: 100%;
    display: flex;
    align-items: center;
    padding-right: 20px;
}

.avatar-wrapper {
    display: flex;
    flex-direction: column; /* 纵向排列核心 */
    align-items: center;
    justify-content: center;
    padding: 4px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    gap: 2px; /* 头像和文字的间距 */
}

/* 悬停效果：背景微变并轻微上浮 */
.avatar-wrapper:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}

/* 头像增加白色边框，提升在彩色背景（aqua）下的亮度 */
.user-avatar {
    border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.avatar-wrapper:hover .user-avatar {
    transform: scale(1.05);
}

/* 昵称样式优化 */
.user-info-vertical {
    display: flex;
    align-items: center;
    gap: 2px;
}

.user-nickname {
    font-size: 10px;
    font-weight: 600;
    color: #333;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 小箭头样式 */
.arrow-icon-down {
    font-size: 10px;
    color: #666;
    transition: transform 0.3s;
}

/* 菜单展开时箭头旋转 */
.el-dropdown-selfdefine[aria-expanded="true"] .arrow-icon-down {
    transform: rotate(180deg);
}

/* --- 下拉菜单美化 (需要 deep 穿透) --- */
:deep(.admin-dropdown-menu) {
    margin-top: 10px !important;
    border: none !important;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
}

:deep(.el-dropdown-menu__item) {
    font-size: 13px;
    padding: 10px 20px;
    gap: 10px;
}

:deep(.logout-btn) {
    color: #f56c6c !important;
}

:deep(.logout-btn:hover) {
    background-color: #fef0f0 !important;
    font-weight: bold;
}




/* 响应式与修复 */
@media (max-width: 768px) {
    .admin-aside {
        width: 140px !important;
    }
    .admin-aside:has(.el-menu--collapse) {
        width: 64px !important;
    }
    .aside-logo {
        height: 50px;
    }
    .admin-header {
        height: 50px;
    }
}
</style>