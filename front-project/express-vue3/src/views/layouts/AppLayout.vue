<script setup>
import CommonHeader from '@/components/user/CommonHeader.vue';
import CommonFooter from '@/components/user/CommonFooter.vue';
// import useAppStore from '@/stores/useAppStore';
// import { storeToRefs } from 'pinia';

defineOptions({
    name:'AppLayout',
});
// const appStore = useAppStore();
// const { isMobile } = storeToRefs(appStore);



</script>
<template>
    <!-- 项目的顶层布局文件，包含顶部导航和页脚，并包裹<router-view>。-->
    <div class="appLayout">
        <header>
            <CommonHeader></CommonHeader>
        </header>


        <main>

            <router-view></router-view>
           
        </main>


        <footer>
            <CommonFooter></CommonFooter>
        </footer>
    </div>


</template>   

<style scoped>
.appLayout{
    height: 100vh;
    /* background-color: antiquewhite; */
    display: grid;
    grid-template-columns: 100%;
    overflow: hidden;
    /* 定义区域名称 */
    grid-template-areas: 
        "header"
        "main"
        "footer";
    grid-template-rows: 70px minmax(0, 1fr) 30px;
}
header{
    padding: 0 20px;
    background-color: #FFFFFF;
    grid-area: header;
}
main{
    grid-area: main;
    width: 100%;
    height: 100%;
}
footer{
    grid-area: footer;
    height: 30px;
    min-width: 0;
    width: 100%;
    /* background-color: rgb(18, 17, 17); */
}

@media (max-width: 768px){
    .appLayout{
        grid-template-areas:
            "main"
            "header";
        grid-template-rows: minmax(0, 1fr) 70px;
    }
    footer {
        display: none; /* 确保元素不占据任何空间 */
    }
}
</style>