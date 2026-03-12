<script setup>
import { ref } from 'vue';
import {v4 as uuidv4} from 'uuid'//引入随机id库，随机生成id
import Search from '../Search.vue';
import router from '@/router/router';
import useRouterStore from '@/stores/useRouterStore';
defineOptions({
    name:'CommonHeader',
});
import useAppStore from '@/stores/useAppStore';
import { storeToRefs } from 'pinia';

const appStore = useAppStore();
const { isMobile } = storeToRefs(appStore);
const {cleanToken} = useRouterStore();

// 加载icons路径
const iconModules = import.meta.glob('@/assets/images/icon/*.svg', { eager: true,query: '?url',import:'default' });
// console.log(iconModules);

// 需要用到的图标名称
const icons = [
    '预约',
    '使用情况',
    '公告',
    // '搜索',
    '失物招领',
    '用户',
    '退出',
    '测试',
];

const routes = {
    '预约': 'venueReservations',
    '使用情况': 'serviceCondition',
    '公告': 'announcement',
    '失物招领': 'lostAndFound',
    '用户': 'subscriber',
    '测试': 'demoTest',
}

// const module =  import.meta.glob("@/views/**/*.vue");//测试用（动态加载views目录下的所有vue文件）



const getIconPath = (iconName)=> {//根据图标返回需要用到的路径
    return iconModules[`/src/assets/images/icon/${iconName}Icon.svg`];
};

let array =  icons.map(iconName=>({
    id:uuidv4(),
    name:iconName,
    svg:getIconPath(iconName),
    // growthFactor:iconName === '搜索'?1.2:1,
}));

const pagesShow = (pageName)=>{
    if(pageName !== '退出'){
        router.push({
            name:routes[pageName]
        });
    }else{
        cleanToken(); 
        router.replace('/login');
        
    }

    // console.log('@@@@commonHeader',module);//测试用
}

</script>

<template>
    <!-- 顶部导航栏组件。-->
    <div class="commonHeader">
        <!-- <h1>顶部导航栏组件</h1> -->
        <div v-for="item in array" :key="item.id">
            <!-- 当前渲染部分：{{ item.id }} -->
            <div 
              class="commonTitle" 
              v-if="item.svg" 
              @click="pagesShow(item.name)">
                <img :src="item.svg" alt="图标" :width="isMobile ? 15 : 30">
                <span>{{ item.name }}</span>
            </div>
            <!-- <div class="commonTitle" v-if="item.name === '搜索'">
                <search></search>
            </div> -->
        </div>
    </div>
</template>

<style lang="css" scoped>

    .commonHeader{
        display: flex;
        /* 
            flex-direction：定义主轴方向 

        */
        flex-direction: row;
        justify-content: space-between;
        /* padding: 0 20px; */
        align-items: center;
        height: 100%;
        width: 100%;
    }
    .commonTitle{
        font-size: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        /* 调整间隙 */
        gap: 5px;
        cursor: pointer;
    }

</style>