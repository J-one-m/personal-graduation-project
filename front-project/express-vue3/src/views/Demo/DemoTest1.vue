<script setup>
import { ref,onMounted,onUnmounted } from 'vue';

const container = ref(null);
const canvas = ref(null);
const radius = ref(3);//定义点的半径
const pointNum = ref(75);//定义页面所需绘制的点数
const maxDis = ref(400);//定义两点之间的最大距离，以实现其连线的虚实变化效果
let interactionPoint = null;//定义鼠标移入移出时生成的作用粒子

const getDomElement = (e)=>{
    console.log('@@@DemoTest.vue',canvas.value,e);
}
const handleGlobalClick = (e)=>{
    // 其中e为事件对象
    console.log('@@@DemoTest.vue',e.clientX,e.clientY);
}


const getRandomNum = (min,max)=>{
    // 返回一个介于min与max之间的整数
    return Math.floor(min + Math.random()*(max - min));
}



// 现在还未实现画布的响应式，需要监听窗口的resize事件，后续实现。
onMounted(()=>{

    if(container.value && canvas.value){

        const cvs = canvas.value;
        // 乘以devicePixelRatio是确保图象不会丢失精度
        cvs.height = container.value.clientHeight * devicePixelRatio;
        cvs.width  = container.value.clientWidth * devicePixelRatio;
        // 使用devicePixelRatio保证精度后，需要进行步骤限制画布的宽高，否则会撑开容器
        cvs.style.width = container.value.clientWidth + 'px';
        cvs.style.height = container.value.clientHeight + 'px';
        const ctx = cvs.getContext('2d');//设置上下文类型
        //给canvas设置背景色，但是使用clearRect()方法后需要重新执行该步骤。
        ctx.fillStyle = 'black';
        ctx.fillRect(0,0,cvs.width,cvs.height);

        
        // 面向对象编程
        // 1.点对象
        class Point{
            constructor(){
                this.r = radius.value;
                // 随机生成点的坐标
                this.x = getRandomNum(this.r,cvs.width - this.r);
                this.y = getRandomNum(this.r,cvs.height - this.r);
                // xy轴方向速度，以及运动的单位时间。并利用之间封装的随机数函数获取随机速度
                this.xSpeed = getRandomNum(-100,100);
                this.ySpeed = getRandomNum(-100,100);
                this.lastDrawTime = null;
            }

            // 定义draw方法用以画圆
            draw(){
                if(this.lastDrawTime){
                    // 计算新的坐标
                    const duration = (Date.now() - this.lastDrawTime) / 1000;//换算成秒
                    let newX = this.x + this.xSpeed * duration;
                    let newY = this.y + this.ySpeed * duration;
                    if(newX > cvs.width + 2 * this.r){
                        newX = cvs.width + this.r;
                        this.xSpeed = -this.xSpeed;   
                    }else if(newX < -2 * this.r){
                        newX = - this.r;
                        this.xSpeed = -this.xSpeed;
                    }
                    if(newY > cvs.height + 2 * this.r){
                        newY = cvs.height + this.r;
                        this.ySpeed = -this.ySpeed;   
                    }else if(newY < -2 * this.r){
                        newY = - this.r;
                        this.ySpeed = -this.ySpeed;
                    }
                    // 更新坐标
                    this.x = newX;
                    this.y = newY;
                }
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgb(200,200,200)';
                ctx.fill();
                this.lastDrawTime = Date.now()
            }
        }

        // 画图
        class Graph{
            constructor(num,maxDis){
                // num用于指定所需创建的数组的长度，并将每一项初始化为0，
                this.points = new Array(num).fill(0).map(()=>{
                    return new Point();//返回一个点对象（包含坐标）
                });
                // 根据距离设置线段透明度
                this.maxDis = maxDis;
            }

            draw(){
                // 利用requestAnimationFrame来实现动态效果
                requestAnimationFrame(()=>{
                    this.draw();
                });
                // 但是在执行下一帧时需要清除画布
                ctx.clearRect(0,0,cvs.width,cvs.height);
                ctx.fillStyle = 'black';
                ctx.fillRect(0,0,cvs.width,cvs.height);

                // // map会返回一个数组，有不必要的性能开销，建议使用for、for···of或者forEach循环。
                // this.points.map(item =>{
                //     item.draw();
                // });
                for(let i = 0; i < this.points.length; i++){
                    const p1 = this.points[i]
                    p1.draw();
                    // 连线操作
                    for(let j = i + 1;j < this.points.length; j++){
                        const p2 = this.points[j];
                        // 定义两点之间的距离d
                        // Math.sqrt（开平方）是非常耗时的计算。
                        // 在高性能粒子系统中，通常比较距离的平方
                        const d = Math.sqrt((p1.x-p2.x) ** 2 + (p1.y - p2.y) ** 2);
                        if(d > maxDis.value){
                            continue ;
                        }
                        ctx.beginPath();
                        ctx.moveTo(p1.x,p1.y);
                        ctx.lineTo(p2.x,p2.y);

                        ctx.strokeStyle = `rgba(200,200,200,${1-d/this.maxDis})`;
                        ctx.stroke();
                    }
                }
            }
        }

        const graph1 = new Graph(pointNum.value,maxDis.value);

        // 监听canvas容器上的鼠标移入事件
        cvs.addEventListener('mouseenter',e =>{

            console.log('@@@',e.x,e.y,e.offsetX,e.offsetY)
            if(!interactionPoint){
                interactionPoint = new Point();//生成点
                // 重新定义点的信息，便于后续实现点随鼠标移动
                interactionPoint.x = e.offsetX * devicePixelRatio;
                interactionPoint.y = e.offsetY * devicePixelRatio;
                interactionPoint.xSpeed = 0;
                interactionPoint.ySpeed = 0;
                graph1.points.push(interactionPoint);
            }
        });

        cvs.addEventListener('mousemove',e =>{
            if(interactionPoint){
                interactionPoint.x = e.offsetX * devicePixelRatio;
                interactionPoint.y = e.offsetY * devicePixelRatio;
                interactionPoint.lastDrawTime = Date.now();
            }
        });

        cvs.addEventListener('mouseleave',e =>{
            if(interactionPoint){
                graph1.points.pop();
                interactionPoint = null;
                
            }
        });

        graph1.draw();

    }





    document.addEventListener('click',handleGlobalClick);    
});

onUnmounted(()=>{
    // 在vue模板中使用@修饰符的事件会在组件销毁时自动清理，但是document不会，所以需要手动卸载
    document.removeEventListener('click',handleGlobalClick);
    // canvas上的事件监听建议手动解除，尽管最终当DOM元素被销毁时，相关的监听器还是会被垃圾回收。
});

</script>

<template>
    <!-- <h1>测试页面！！！</h1> -->
    <div class="canvas-container" ref="container">
        <canvas ref="canvas" id="canvas"></canvas>
        <button @click="getDomElement">播放烟花案例！</button>
    </div>

    

</template>


<style scoped>

.canvas-container{
    position: relative;
    height: 100%;
    width: 100%;
    background-color: lightblue;
    overflow: hidden;
}

#canvas{
    display: block;
    position: absolute;
    left: 0;
    top: 0;
}

button{
    position: absolute;
    /* transform: translate(-50%,-50%); */
    bottom: 0;
    right: 0;

}


h1{
    text-align: center;
    font-size: 25px;
    color: aqua;
}
</style>