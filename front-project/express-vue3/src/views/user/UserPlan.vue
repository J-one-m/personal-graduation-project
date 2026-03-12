<script setup>
defineOptions({
    name:'UserPlan',
});
import { computed,onMounted,ref,watch } from 'vue';
import { useRoute } from 'vue-router';
import CheckBox from '@/components/CheckBox.vue';
import Calendar from '@/components/Calendar.vue';
import axiosInstance from '@/api/axios';
import { apiConfig } from '@/config/apiConfig';
import useRouterStore from '@/stores/useRouterStore';
import useAppStore from '@/stores/useAppStore';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';


const {state} = useRouterStore();
const route = useRoute();
const appStore = useAppStore();
const {isMobile} = storeToRefs(appStore); //判断当前是否为移动端
// 判断当前用户是否添加计划（并且成功执行，若是则发送请求更新计划框）
const isAddPlan = ref(0);

const planRefreshKey = ref(0); // 核心：刷新触发器
const mobileInput = ref('');
// let id = ref(1);//将id默认为1
// id.value = parseInt(route.query.id);//这部分代码有问题：应用通过路由导航到同一个组件（例如从/userplan?id=1导航到/userplan?id=2），
// 组件并不会被销毁后重建。在这种情况下，route.query.id的值虽然变了，但上面那行赋值语句不会再次执行，所以id的值将保持不变。
// 应该用computed来解决

const id = computed(()=>{
    return parseInt(route.query.id);
})
const planType = computed(()=>{
    switch(id.value){
        case 1:
            return 'daily';
        case 3:
            return 'monthly';
        case 4:
            return 'yearly';
    }
});



const planHeight = computed(()=>{
    switch(id.value){
        case 1:
            return{
                daily:'80%',
                // weekly:'10%',
                moon:'8%',
                annual:'8%',
        };
        // case 2:
        //     return{
        //         daily:'10%',
        //         weekly:'50%',
        //         moon:'10%',
        //         annual:'10%',
        // };
        case 3:
            return{
                daily:'5%',
                // weekly:'10%',
                moon:'85%',
                annual:'5%',
        };
        case 4:
            return{
                daily:'8%',
                // weekly:'10%',
                moon:'8%',
                annual:'80%',
        };
    }
});

const selectedCalendarDate = ref('');//用于接收子组件传过来的时间
const planContents = ref({
    // 1:[],
    // 2:[],
    // 3:[],
    // 4:[],
    1:{},
    // 结构：{'2025-10-04':['计划1：篮球两小时','计划2：跑步半小时']}
    // 应修改为：{'2025-10-04':[{planId:1,'计划1：篮球两小时'}，{planId:2,'计划2：跑步半小时'}]}
    3:{},
    4:{},
});
// const tempPlanContent = ref('');//中间变量，用于传递计划
// 是否允许添加，现阶段写死，待日历部分完成后再修改
const allowAdd = computed(()=>{
    return true;
});
// 是否完成，默认为false
const isFinish = ref(false);
// 默认为0
const number = ref(0);
const year = computed(()=>{
    return Number(selectedCalendarDate.value.split('-')[0]);
});
const month = computed(()=>{
    return Number(selectedCalendarDate.value.split('-')[1]);
});
const planDateObj = computed(()=>{
    if(id.value == 1){
        return  {
            planMonth : null,
            planYear : null,
        };
    }
    if(id.value == 3){
        return  {
            planMonth : month.value,
            planYear : year.value,
        };
    };
    if(id.value == 4){
        return {
            planMonth : null,
            planYear : year.value,
        };
        
    };
});
// 添加计划
const addPlan = async(value) => {
    if(!allowAdd.value) return alert('已超出修改时限');
    
    const newPlans = (value || '').trim();
    if (newPlans.length > 0) {
        try {
            const {code, msg} = await axiosInstance.post(apiConfig.insertUserPlan, {
                planType: planType.value,
                planDate: selectedCalendarDate.value,
                planDetail: newPlans,
                planMonth: planDateObj.value.planMonth,
                planYear: planDateObj.value.planYear,
            });
            if(code === 200){
                ElMessage.success(msg || '添加成功！');
                // 成功后，只需改变 key，watch 会自动干活
                planRefreshKey.value++; 
            };
        } catch(error) {
            console.error('写入失败', error);
        }
    }
};


const handleMobileAdd = () => {
    if (mobileInput.value.trim()) {
        addPlan(mobileInput.value);
        mobileInput.value = ''; // 添加后清空
    }
}

const handleDateSelect =(date)=>{
    selectedCalendarDate.value = date;//更新时间
    
    console.log('@@@UserPlan 接收到日期选择:', date);
}

// dateInfoShow为随用户点击日历中具体日期时动态更新
const dateInfoShow = computed(()=>{
    // const date = selectedCalendarDate.value;
    // const allDailyPlans = planContents.value[1];
    // // 取得选中日期对应的计划数组，如果不存在则为空数组
    // const plansArray = allDailyPlans[date] || [];
    // return plansArray;
    //根据id值来返回需要的数据
    if(id.value === 1){
        return planContents.value[1][selectedCalendarDate.value] || [];
    }else if(id.value === 3){
        return planContents.value[3][`${year.value}+${month.value}`] || [];
    }else if(id.value === 4){
        return planContents.value[4][`${year.value}`] || [];
    }
});

/* const planDelete = (planId)=>{
    // 在前端即时更改计划框显示信息
    if(id.value === 1){
        const currentPlans = planContents.value[1][selectedCalendarDate.value] || [];
        planContents.value[1][selectedCalendarDate.value] = currentPlans.filter((item)=>{
            return item.planId !== planId;
        });
    }else if(id.value === 3){
        const currentPlans = planContents.value[1][selectedCalendarDate.value] || [];
        planContents.value[1][selectedCalendarDate.value] = currentPlans.filter((item)=>{
            return  item.planId !== planId;
        });
    }else if(id.value === 4){
        const currentPlans = planContents.value[1][selectedCalendarDate.value] || [];
        planContents.value[1][selectedCalendarDate.value] = currentPlans.filter((item)=>{
            return item.planId !== planId;
        });
    }

    // console.log('@userPlan.vue -> 当前触发计划信息：',planId);
}; */

// 删除回调：不再手动操作复杂的 filter，直接让 watch 重新请求
const planDelete = () => {
    planRefreshKey.value++; 
};


/* // 同步更改计划状态
const planStatusChange = (planId)=>{
    if(id.value === 1){
        
    }else if(id.value === 3){

    }else if(id.value === 4){

    }
    console.log('@userPlan.vue -> 当前触发计划信息：',planId);
};
 */
// 状态改变回调
const planStatusChange = () => {
    planRefreshKey.value++;
};


// 用户添加计划后同步更新计划框中的内容，建议采用请求的形式吧
const syncUpdatePlans = ()=>{

};

/* // 当该值发生变化时，向后端发送请求计划数据（根据用户选择的日期以及当前计划的类型）
watch([selectedCalendarDate,id,isAddPlan],async(newValue)=>{

    planContents.value[1] = {};
    planContents.value[3] = {};
    planContents.value[4] = {};

    const data = await axiosInstance.get(apiConfig.getUserPlan,{
        params:{
            // userId:state.userInfo.id,
            planType:planType.value,
            planDate:selectedCalendarDate.value,
            planMonth:planDateObj.value.planMonth,
            planYear:planDateObj.value.planYear,
        }
    });
    // console.log('@',data);
    // 整理数据
    data.data.forEach((item)=>{
        if(item.plan_type === 'daily'){

            if(!planContents.value[1][item.plan_date.split('T')[0]]){
                planContents.value[1][item.plan_date.split('T')[0]] = [];//初始化
            }
            planContents.value[1][item.plan_date.split('T')[0]].push({
                planId: item.plan_id,
                planDetail: item.plan_detail,
            });

        }else if(item.plan_type === 'monthly'){
            if(!planContents.value[3][`${item.plan_year}+${item.plan_month}`]){
                planContents.value[3][`${item.plan_year}+${item.plan_month}`] = [];
            }
            planContents.value[3][`${item.plan_year}+${item.plan_month}`].push({
                planId: item.plan_id,
                planDetail: item.plan_detail,
            });
        
        }else{
            if(!planContents.value[4][`${item.plan_year}`]){
                planContents.value[4][`${item.plan_year}`] = [];
            }
            planContents.value[4][`${item.plan_year}`].push({
                planId: item.plan_id,
                planDetail: item.plan_detail,
            });
        }
    });
    // console.log('@userPlan.vue////',planContents.value);
}); */

// 核心 Watch：监听日期、切换类型、以及手动触发的 Key
watch([selectedCalendarDate, id, planRefreshKey], async() => {
    // 初始化数据结构
    planContents.value = { 1: {}, 3: {}, 4: {} };

    try {
        const res = await axiosInstance.get(apiConfig.getUserPlan, {
            params: {
                planType: planType.value,
                planDate: selectedCalendarDate.value,
                planMonth: planDateObj.value.planMonth,
                planYear: planDateObj.value.planYear,
            }
        });

        // 整理后端数据
        res.data.forEach((item) => {
            const detail = {
                planId: item.plan_id,
                planDetail: item.plan_detail,
                isFinished: item.complete_status // 确保后端返回了此状态字段
            };

            if (item.plan_type === 'daily') {
                const date = item.plan_date.split('T')[0];
                if (!planContents.value[1][date]) planContents.value[1][date] = [];
                planContents.value[1][date].push(detail);
            } else if (item.plan_type === 'monthly') {
                const key = `${item.plan_year}+${item.plan_month}`;
                if (!planContents.value[3][key]) planContents.value[3][key] = [];
                planContents.value[3][key].push(detail);
            } else if (item.plan_type === 'yearly') {
                const key = `${item.plan_year}`;
                if (!planContents.value[4][key]) planContents.value[4][key] = [];
                planContents.value[4][key].push(detail);
            }
        });
    } catch (error) {
        console.error('获取计划列表失败', error);
    }
}, { immediate: true });

onMounted(async()=>{
    // try{
    //     // 无用，数据的获取已经在watch中存在。
    //     const data = await axiosInstance.get(apiConfig.getUserPlan,{
    //         params:{
    //             userId:state.userInfo.id,
    //             planType:planType.value,
    //             planDate:selectedCalendarDate.value,
    //             planMonth:planDateObj.value.planMonth,
    //             planYear:planDateObj.value.planYear,
    //         }
    //     });

    //     // console.log('@@UserPlan.vue',data);

    // }catch(error){
    //     console.error('错误位置：userPlan.vue',error);
    // }
});


</script>

<template>

    <div class="plan">
        <!-- 用于展示三/四个计划框：分别是日、周、月、年计划 -->
        <!-- 去除周（过于麻烦） -->
        <div class="planningBox">
            <div class="dailyPlan plan-card" :class="{ 'is-active': id === 1 }" :style="{ height: planHeight.daily }">
                <div class="card-header">
                    <span class="dot"></span>
                    <h1>日计划</h1>
                    <span v-if="id === 1" class="date-tag">{{ selectedCalendarDate }}</span>
                </div>
                <div class="card-body">
                    <CheckBox @plan-delete="planDelete" @plan-status-change="planStatusChange"
                        class="checkComp" :id="1" :planDescription="id === 1 ? dateInfoShow : []" :currentId="id">
                    </CheckBox>
                </div>
                <div v-if="isMobile && id === 1" class="inline-add-box">
                    <input v-model="mobileInput" placeholder="输入新计划..." @keyup.enter="handleMobileAdd" />
                    <button @click="handleMobileAdd">添加</button>
                </div>
            </div>

            <div class="moonPlan plan-card" :class="{ 'is-active': id === 3 }" :style="{ height: planHeight.moon }">
                <div class="card-header">
                    <span class="dot"></span>
                    <h1>月计划</h1>
                    <span v-if="id === 3" class="date-tag">{{ year }}年{{ month }}月</span>
                </div>
                <div class="card-body">
                    <CheckBox @plan-delete="planDelete" @plan-status-change="planStatusChange"
                        class="checkComp" :id="3" :planDescription="id === 3 ? dateInfoShow : []" :currentId="id">
                    </CheckBox>
                </div>
                <div v-if="isMobile && id === 3" class="inline-add-box">
                    <input v-model="mobileInput" placeholder="本月目标..." @keyup.enter="handleMobileAdd" />
                    <button @click="handleMobileAdd">添加</button>
                </div>
            </div>

            <div class="annualPlan plan-card" :class="{ 'is-active': id === 4 }" :style="{ height: planHeight.annual }">
                <div class="card-header">
                    <span class="dot"></span>
                    <h1>年计划</h1>
                    <span v-if="id === 4" class="date-tag">{{ year }}年</span>
                </div>
                <div class="card-body">
                    <CheckBox @plan-delete="planDelete" @plan-status-change="planStatusChange"
                        class="checkComp" :id="4" :planDescription="id === 4 ? dateInfoShow : []" :currentId="id">
                    </CheckBox>
                </div>
                <div v-if="isMobile && id === 4" class="inline-add-box">
                    <input v-model="mobileInput" placeholder="年度展望..." @keyup.enter="handleMobileAdd" />
                    <button @click="handleMobileAdd">添加</button>
                </div>
            </div>
        </div>
        <!-- 用于展示日历以及计划添加操作区 -->
        <div class="calendar">
            <Calendar :addPlan="addPlan"  :planType="planType" @date-selected='handleDateSelect' @sync-update-plans="syncUpdatePlans"></Calendar>
        </div>
    </div>
</template>

<style scoped>
/* --- 基础容器布局 --- */
 .plan {
    display: flex;
    gap: 20px;
    flex-direction: row;
    height: 100%;
    justify-content: space-evenly;
    padding: 20px;
    box-sizing: border-box;
    /* background-color: #f5f7fa; 建议给个浅底色衬托卡片 */
}

/* --- 计划卡片容器 (核心部分) --- */
.planningBox {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 15px; /* 卡片之间的间距 */
    min-width: 300px;
    max-width: 350px;
    /* height: 100%; */
    transition: all 0.4s ease;
    justify-content: space-between;
}

/* --- 通用卡片样式 --- */
.planningBox > div {
    position: relative;
    border-radius: 20px;
    padding: 10px 15px 7px 15px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1); /* 丝滑的推开效果 */
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.3);
    /* overflow: auto; */
}

/* --- 列表承载区 --- */
.card-body {
    flex: 1;          /* 自动撑满标题和输入框之间的所有剩余空间 */
    overflow-y: auto; /* 只有这里产生滚动条 */
    margin-bottom: 2px;
    display: flex;
    flex-direction: column;
}

/* --- 各种类型的配色方案 --- */
.dailyPlan { background: linear-gradient(135deg, rgba(224, 247, 250,0.4) 0%, rgba(178, 235, 242,0.9) 100%); color: #006064; }
.moonPlan { background: linear-gradient(135deg, rgba(232, 245, 233,0.4) 0%, rgba(200, 230, 201,0.9) 100%); color: #1b5e20; }
.annualPlan { background: linear-gradient(135deg, rgba(227, 242, 253,0.4) 0%, rgba(187, 222, 251,0.9) 100%); color: #0d47a1; }


/* --- 标题样式 --- */
/* .card-header{
    display: flex;
    flex-direction: column;
    justify-content: center;
} */
.planningBox div > h1 {
    margin: 0 0 7px 0;
    line-height: 15px;
    font-size: 15px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

/* 为标题添加一个小装饰点 */
.planningBox div > h1::before {
    content: '';
    width: 4px;
    height: 16px;
    background-color: currentColor;
    border-radius: 2px;
}

/* --- CheckBox 组件承载区 --- */
.checkComp {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 8px;
    /* 这里的 scrollbar 隐藏或美化 */
}

.checkComp::-webkit-scrollbar {
    width: 4px;
}
.checkComp::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

/* --- 移动端内嵌输入框 (重点丰富部分) --- */
.inline-add-box {
    
    display: flex;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    padding: 5px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    margin-top: auto;
    animation: fadeIn 0.4s ease;
    flex-shrink: 0;     
}

.inline-add-box input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 8px 12px;
    outline: none;
    font-size: 12px;
    color: #333;
}

.inline-add-box button {
    background-color: #2ebf91;
    color: white;
    border: none;
    padding: 0 15px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.3s;
}

.inline-add-box button:active {
    background-color: #249a75;
    transform: scale(0.95);
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* --- 日历部分 --- */
.calendar {
    /* box-sizing: border-box; */
    flex: 0.5;
    min-width: 330px;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
}

/* --- 移动端适配 (保持你的布局逻辑，增强卡片感) --- */
@media (max-width: 768px) {
    .plan {
        padding: 10px;
        flex-direction: column-reverse;
        justify-content: flex-end;
        align-items: center;
        gap: 15px;
    }

    .planningBox {
        width: 100%;
        max-width: 100%;
        /* flex: 1; */
        gap: 10px;
        overflow: auto;
    }

    /* 当卡片被激活 (id匹配) 时的特殊样式 */
    .planningBox > div {
        /* 非激活卡片在移动端会有较小的最小高度，保证不被挤消失 */
        min-height: 60px; 
        flex-shrink: 0;
    }

    /* 增强“展开”时的视觉冲击力 */
    .planningBox div[style*="height: 50%"],
    .planningBox div[style*="height: 50%"] {
        border: 2px solid rgba(46, 191, 145, 0.5);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        background: #ffffff; /* 展开时变白，提高阅读清晰度 */
    }

    .calendar {
        min-width: 100%;
        width: 100%;
        flex: 0; /* 日历在上方高度由内容决定 */
        margin-bottom: 10px;
    }
}
</style>