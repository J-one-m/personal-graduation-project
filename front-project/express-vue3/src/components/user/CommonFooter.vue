<template>
    <!-- 底部页脚组件。-->
    <div class="footer">
        <span>Designed by XXX，指导教师：XXX</span>
    </div>

</template>

<script setup>

defineOptions({
    name:'CommonFooter',
});

</script>

<style scoped>
.footer {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px; /* 稍微缩小字号显得更精致 */
    font-weight: 300;
    color: rgba(255, 255, 255, 0.9);
    overflow: hidden;
    position: relative;
    letter-spacing: 2px;
    
    /* 1. 更加丰富的多重渐变背景 */
    background: 
        /* 增加一层极细的斜纹理 */
        repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 10px),
        /* 主撞色渐变 */
        linear-gradient(110deg, #161b22 60%, #21262d 60%);
    
    /* 2. 顶部增加一条发光的“能量线” */
    border-top: 1px solid rgba(66, 184, 131, 0.4);
    box-shadow: inset 0 1px 10px rgba(66, 184, 131, 0.1);
}

.footer span {
    position: relative;
    z-index: 2;
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
}

/* 3. 在文字前加一个动态的小绿点（状态指示器） */
.footer span::before {
    content: "";
    width: 6px;
    height: 6px;
    background: #42b883;
    border-radius: 50%;
    margin-right: 12px;
    box-shadow: 0 0 8px #42b883;
    animation: blink 2s infinite;
}

/* 4. 修改后的装饰性斜条纹：增加流光效果 */
.footer::after {
    content: "";
    position: absolute;
    right: 5%;
    width: 150px;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(66, 184, 131, 0.2), transparent);
    transform: skewX(-25deg);
    animation: scan 4s linear infinite;
}

/* 5. 额外的左侧装饰块，增加平衡感 */
.footer::before {
    content: "SYSTEM READY";
    position: absolute;
    left: 20px;
    font-size: 10px;
    color: rgba(66, 184, 131, 0.4);
    font-family: monospace;
}

/* 动画定义 */
@keyframes blink {
    0%, 100% { opacity: 0.5; transform: scale(0.9); }
    50% { opacity: 1; transform: scale(1.1); }
}

@keyframes scan {
    0% { transform: skewX(-25deg) translateX(300px); }
    100% { transform: skewX(-25deg) translateX(-1000px); }
}
</style>