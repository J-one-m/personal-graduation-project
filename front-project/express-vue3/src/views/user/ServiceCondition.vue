<script setup>
defineOptions({
    name:'ServiceCondition',
});
import * as echarts from 'echarts'; 
import { onMounted, ref,onUnmounted, computed, reactive, watch,nextTick } from 'vue';
import { v4 as uuidv4} from 'uuid';
import PageNavigator from '@/components/PageNavigator.vue';
import axiosInstance from '@/api/axios';
import { apiConfig } from '@/config/apiConfig';

// const 
const venueData = reactive([]);
const chartsData = venueData
const servicePages = computed(()=>{
    return Math.ceil(chartsData.length / 4);
});
const currentPage = ref(1);
// 在v-for使用ref时，vue会自动将所有应用收集到这个集合中
const serviceContainer = ref({});//用于容纳echarts图表的容器（使用对象来确保一一匹配，不会发生错位）


// 用于存储所有的 ECharts 实例，方便后续销毁
let chartInstances = [];

const setChartRef = (el,id)=>{
    // 仅在元素存在时设置引用
    if(el){
        serviceContainer.value[id] = el;
    }else{
        // 在元素被移除（如换页销毁）时，清理对其的引用
        delete serviceContainer.value[id];
    }
};

// 定义创建单个图表实例的函数
const createChartInstance = (el,chartConfig)=>{
    console.log('@serviceCondition.vue',chartConfig)
    // 确保容器元素挂载
    if(!el)return;

    const myChart = echarts.init(el);
    chartInstances.push(myChart);//存储实例
    const option = {
        title: {
            text: chartConfig.title,
            top:5,
            textStyle:{
                color:'#000000',
            },
        },
        tooltip: {
            trigger: 'item'
        },
        legend: {
            textStyle:{
                color:'#000000',
            },
            // wdith:'100%',//设置图例组件的宽度
            // height:'100%',//设置高度
            itemGap:10,//设置每一项图例之间的间隔，根据图例的排列方向来定义（即orient），若垂直排列，则设置的效果为图例之间纵向间的间隔距离
            // itemWidth设置单个图例的宽度，与此还有itemHeight设置其高度
            padding:[0,0,0,10],
            orient: 'horizontal',//可取值为horizontal与vertical
            align: 'left',//设置图例标记和文本的对其方式，取值为right、auto等
            bottom:5,
            bottom:'5px',
        },
        series: [{
                name: '访问来源',
                type: 'pie', // 图表类型为饼图
                radius: '40px', // 饼图半径
                center:['50%','50%'],
                // right:-200,//可以利用left、top、以及bottom等值来定义图在容器中的位置
                height:'100%',
                // width:'100%',
                label: {//在series中使用label来控制文字样式
                    show: true, // 显示标签
                    fontSize: 10, // 设置字体大小
                    color: '#000000', // 设置字体颜色
                    position:'outside',
                    formatter: '{b}:{d}%' // 标签格式化，可以显示名称、值和百分比
                },

                labelLine:{//设置标签的视觉引导线配置
                    show:true,
                    length:10,//设置第一段的长度
                    length2:10,//第二段的长度
                },
                
                data: chartConfig.data,
                emphasis: {//设置鼠标表悬停时的效果，类似于hover
                    itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                },
                // 禁用缩放和平移交互
        }],
    };

    myChart.setOption(option);

    // 确保容器元素挂载
    // if(serviceContainer.value){
    //     // 初始化echarts实例
    //     myChart = echarts.init(serviceContainer.value);

    //     const option = {
    //         title: {
    //             text: '示例图表',
    //             top:5,
    //         },
    //         tooltip: {
    //             trigger: 'item'
    //         },
    //         legend: {
    //             // wdith:'100%',//设置图例组件的宽度
    //             // height:'100%',//设置高度
    //             itemGap:10,//设置每一项图例之间的间隔，根据图例的排列方向来定义（即orient），若垂直排列，则设置的效果为图例之间纵向间的间隔距离
    //             // itemWidth设置单个图例的宽度，与此还有itemHeight设置其高度
    //             padding:[0,0,0,10],
    //             orient: 'vertical',//可取值为horizontal与vertical
    //             align: 'left',//设置图例标记和文本的对其方式，取值为right、auto等
    //             right:5,
    //             bottom:'5px',
    //         },
    //         series: [
    //             {
    //             name: '访问来源',
    //             type: 'pie', // 图表类型为饼图
    //             radius: '50px', // 饼图半径
    //             center:['50%','50%'],
    //             right:80,//可以利用left、top、以及bottom等值来定义图在容器中的位置
    //             height:'100%',
    //             // width:'100%',
    //             label: {//在series中使用label来控制文字样式
    //                 show: true, // 显示标签
    //                 fontSize: 12, // 设置字体大小
    //                 color: '#333', // 设置字体颜色
    //                 formatter: '{b}:({d}%)' // 标签格式化，可以显示名称、值和百分比
    //             },
    //             labelLine:{//设置标签的视觉引导线配置
    //                 show:true,
    //                 length:10,//设置第一段的长度
    //                 length2:30,//第二段的长度
    //             },
                
    //             data: [
    //                 { value: 335, name: '直接访问' },
    //                 { value: 310, name: '邮件营销' },
    //                 { value: 234, name: '联盟广告' },
    //                 { value: 135, name: '视频广告' },
    //                 { value: 1548, name: '搜索引擎' }
    //             ],
    //             emphasis: {//设置鼠标表悬停时的效果，类似于hover
    //                 itemStyle: {
    //                 shadowBlur: 10,
    //                 shadowOffsetX: 0,
    //                 shadowColor: 'rgba(0, 0, 0, 0.5)'
    //                 }
    //             }
    //             }
    //         ]
    //     };
    //     // // 配置图表选项
    //     // const option = {

    //     // }
    //     myChart.setOption(option);
    // };
};

const chartDataList = computed(()=>{
    const startIndex = (currentPage.value - 1) * 4;
    const endIndex = startIndex + 4;
    return chartsData.slice(startIndex,endIndex);
});

const servicePagesChange = (value)=>{
    currentPage.value = value;
}

const destroyChartInstances = ()=>{
    chartInstances.forEach((chart)=>{
        chart.dispose();// 销毁 ECharts 实例，释放内存
    });
    chartInstances = [];//重新赋值，断开对原有实例的引用链接
    serviceContainer.value = {};//在换页前，清空DOM引用映射
};

const initializeCharts = ()=>{//图表初始化函数
    const list = chartDataList.value; // 获取当前页数据

    // Object.keys()用于将对象中的键，返回为一个数组
    if(Object.keys(serviceContainer.value).length === list.length){
        list.forEach((dataItem)=>{
            // 通过ID确保数据找到正确的DOM容器
            const el = serviceContainer.value[dataItem.id];
            if(el){
                createChartInstance(el,dataItem);
            }
        });
    } else {
        // 此处可以添加重绘操作，多次任无果后提示错误。
        console.warn('DOM refs not ready or mismatched with data list.');
    }
}

watch(currentPage,()=>{
    destroyChartInstances();
    nextTick(() => {
        // 3. 在新的 DOM 元素上初始化图表
        initializeCharts();
    });
},{immediate:false});

onMounted(async()=>{//组件挂载时，调用对应函数初始化echarts实例
    // if(serviceContainer.value && serviceContainer.value.length > 0){
    //     serviceContainer.value.forEach((item,index)=>{
    //         createChartInstance(item,chartsData[index]);
    //     });
    // }
    const {data} = await axiosInstance.get(apiConfig.getServiceCondition,{});
    data.forEach((item)=>{
        venueData.push({
            id:uuidv4(),
            title:item.category,
            data:[
                {
                    value:item.freeNum,
                    name:'空闲场地',
                },
                {
                    value:item.using,
                    name:'使用中',
                },
            ],
        });
    });

    console.log('@serviceCondition.vue',data,venueData);
    if(venueData.length > 0){
        // 使用 nextTick 确保 Vue 已经渲染了包含 chartDataList 数据的 v-for 循环，
        // 从而 setChartRef 已经完成了 DOM 引用收集。
        await nextTick();
        initializeCharts();
    }
});

onUnmounted(()=>{//组件销毁时，销毁echarts实例
    destroyChartInstances();
});

</script>

<template>
    <!-- 
        修改点：使用函数式ref，将DOM元素映射到serviceContainer对象中，
        键为item.id，确保数据和DOM的精准匹配。
    -->
    <!-- <h1>使用情况</h1> -->
    <div class="service-condition">
        <div class="service-container" v-for="item in chartDataList" :key="item.id" >
            <div class="scene-img">
                <img src="../../assets/images/background-img/树林车站.png" alt="">
                <span>额定人数：10人</span>
                <span>开放时间：全周</span>
                <span>地点：北区体育馆一层</span>
            </div>

            <!-- 
                若不是响应式ref，其会在v-for整个循环结束后才收集元素到serviceContainer数组中，
                此时元素顺序不是与数据一一对应的
            <div ref="serviceContainer" class="service-info">
            </div>
            -->
            <div :ref="(el)=>{setChartRef(el,item.id)}" class="service-info">
            </div>

            <!-- 遮罩层，用于显示当前区域的可用状态。与预约区域中的应当共用一个变量 -->
            <div class="maintenance-overlay" v-if="false">
                <span>维护中...</span>
            </div>
        </div>
        
        <PageNavigator class="service-nav" :totalPages="servicePages" @page-change="servicePagesChange"></PageNavigator>
    </div>
</template>

<style scoped>
.service-condition{
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr 50px;
    justify-items: center;
    align-items: center;
    gap: 20px;
    width: 100%;
    min-width: 600px;
    height: 100%;
    /* background-color: aliceblue; */
    overflow: auto;
    background-image: url('../../assets/images/background-img/夏日海边日系插画.png');
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
}

.service-container{
    width: 520px;
    height: 270px;
    background-color: rgba(255, 255, 255, 0.4);
    /* background-color: transparent; */
    backdrop-filter: blur(5px);
    display: flex;
    position: relative;
    border-radius: 10px;
}
.scene-img{
    /* background-color: bisque; */
    box-sizing: border-box;
    margin-left: 5px;
    width: 45%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    text-align: center;
    color: black;
}
.scene-img>img{
    width: 100%;
}

.service-info{
    /* background-color: azure; */
    box-sizing: border-box;
    width: 55%;
    height: 100%;
}


.maintenance-overlay{
    position: absolute;
    background-color: rgba(0,0,0,0.6);
    color: aliceblue;
    height: 100%;
    width: 100%;
    font-size: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.service-nav{
    grid-row: 3;
    grid-column: 1 / -1;
}
</style>