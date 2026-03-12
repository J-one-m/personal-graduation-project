<script setup>
import {ref,onMounted,onUnmounted} from 'vue'
const container = ref(null);
const canvas = ref(null);
const radius = 2;// 定义点的半径
const gap = 10;//定义采样间隙
const particles = [];//存放采样后的粒子实例

onMounted(()=>{

    if(container.value && canvas.value){
        const cvs = canvas.value;
        cvs.width = container.value.clientWidth * devicePixelRatio;
        cvs.height = container.value.clientHeight * devicePixelRatio;

        // 设置上下文
        const ctx = cvs.getContext('2d');
        ctx.fillStyle = 'black'
        ctx.fillRect(0,0,cvs.width,cvs.height);

        // 定义粒子类
        class Particle{
            constructor(targetX,targetY){
                this.radius = radius;
                this.x = getRandomNum(0,cvs.width - this.radius);//x、y为点的坐标
                this.y = getRandomNum(0,cvs.height - this.radius);
                // 粒子原本的位置（例如文字或者图片粒子化后的坐标）
                this.targetX = targetX;
                this.targetY = targetY;
                this.speed = 0.05;//定义粒子移动系数
            }

            draw(){
                ctx.beginPath();
                ctx.arc(this.targetX, this.targetY, this.radius, 0, 2 * Math.PI );
                ctx.fillStyle = '#fff';
                ctx.fill();
            }

            // 更新粒子位置
            update(){
                
            };

        }


        // 绘制文字
        ctx.fillStyle = '#fff';
        // ctx.font = '270px "Roboto Mono"';
        ctx.font = 'bold 280px "Roboto Mono"';
        ctx.textAlign = 'center';// 定义文字对齐方式
        ctx.textBaseline = 'middle';// 设置文字对齐基线位置（垂直方向）
        ctx.fillText('南风未央',cvs.width / 2, cvs.height / 2);

        const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
        const p = imgData.data;

        for(let y = 0; y < cvs.height; y += gap){
            for(let x = 0; x <cvs.width; x += gap){
                const pIndex = (y * cvs.width + x) * 4;
                const r = p[pIndex];
                const g = p[pIndex + 1];
                const b = p[pIndex + 2];
                const a = p[pIndex + 3];
                // 因为设置的字体颜色为#fff其rgb的值都是一样的，故而判断其中一个即可
                if(r > 128){
                    particles.push(new Particle(x,y));
                }
            }
        }

        // 清空重绘
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        particles.forEach((item)=>{
            item.draw();
        });

        console.log('@@@Demo',particles);

    }

});

onUnmounted(()=>{


});

// 定义获取随机整数的函数
const getRandomNum = (min,max)=>{
    return Math.floor(Math.random() * (max - min) + min);
};

</script>

<template>
<div class="canvas-container" ref="container">
    <canvas id="canvas" ref="canvas"></canvas>
</div>
</template>


<style scoped>
.canvas-container{
    height: 100%;
    width: 100%;
    position: relative;
    background-color: aqua;
    /* overflow: hidden; */
}
#canvas{
    display: block;
    position: absolute;
    left: 0;
    top:0;
    width: 100%;
    height: 100%;
}


</style>