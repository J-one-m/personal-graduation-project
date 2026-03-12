<template>
    
    <div class="notFound">
        <h1>404 - 页面未找到</h1>
        <p>抱歉，您要访问的页面不存在。</p>
    </div>

</template>

<script setup>

    defineOptions({
        name:'404',
    })

</script>

<style scoped>
    .notFound {
        font-size: 50px;
        background-image: url('../assets/images/notFound.jpg');
        background-size: cover; /* 使背景图覆盖整个区域 */
        background-position: center; /* 居中显示背景图 */
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        /* 使 div 高度为视口高度 */
        height: 100vh; 
        color: white; /* 设置文本颜色 */
        text-align: center; /* 文本居中 */
}

</style>