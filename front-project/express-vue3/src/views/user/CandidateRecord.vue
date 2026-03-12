<script setup>
defineOptions({
    name:'CandidateRecord',
});
import axiosInstance from '@/api/axios';
import PageNavigator from '@/components/PageNavigator.vue';
import { apiConfig } from '@/config/apiConfig';
import {ref,reactive,computed, onMounted} from 'vue'
import useRouterStore from '@/stores/useRouterStore';


const {state} = useRouterStore();
const date = new Date();
const codeShow = ref(false);

const candidateData = reactive([]);
const currentPage = ref(1);
const currentCode = ref(null);//候补码
const maxPageSize = 5;
const totalPages = computed(()=>{
    return Math.ceil(candidateData.length / maxPageSize);
});
const currentDataList = computed(()=>{
    const startIndex = (currentPage.value - 1) * maxPageSize;
    const endIndex = startIndex + maxPageSize;
    return candidateData.slice(startIndex,endIndex);
});



const checkCode = async(id)=>{//获取候补码
    
    codeShow.value = true;

    try{
        const {data} = await axiosInstance.get(apiConfig.getCandidateCode,{
            params:{
                userId: state.userInfo.id,
                waitlistTeamId: id,
            },
        });
        currentCode.value = data;
        // console.log('@candidateRecord.vue',data);
    }catch(error){
        console.error({
            time: date.toLocaleString(),
            stack: error.stack,
            where: 'candidateRecord.vue@checkCode',
        });
    }
}

const cancelPendingReservation = (id)=>{//取消候补预约
    try{
        

        console.log('@candidateRecord.vue',id);
    }catch(error){
        console.error({
            time: date.toLocaleString(),
            stack: error.stack,
            where: 'candidateRecord.vue@cancelPendingReservation',
        });
    }
};


const candidatePagesChange = (value)=>{
    currentPage.value = value;
}
onMounted(async()=>{//页面挂载时向后端请求数据并将其渲染到页面上
    try{
        const data = await axiosInstance.get(apiConfig.getUserAlternateRecord,{
            params:{
                userId: state.userInfo.id,
            },
        });

        Object.assign(candidateData,data.data);

        // console.log('@candidateRecord.vue',currentDataList.value,totalPages.value);
    }catch(error){
        console.error({
            time: date.toLocaleString(),
            stack: error.stack,
            where: 'candidateRecord.vue@onMounted',
        });
    }


});

</script>

<template>
    <!-- <h1>候补记录</h1> -->
    <div class="candidate-container">
        <div class="table-container">
            <table class="candidate-table">
                <caption>候补记录</caption>
                <thead>
                    <tr>
                        <th>候补时间</th>
                        <th>候补人数</th>
                        <th>候补项目</th>
                        <th>地址</th>
                        <th>身份</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in currentDataList" :key="item.waitlistTeamId">
                        <td>
                            {{ item.waitlistDate }}
                        </td>
                        <td>
                            {{ item.waitlistParticipants }}
                        </td>
                        <td>
                            {{ item.venueName }}
                        </td>
                        <td>
                            {{ item.venueAddress }}
                        </td>
                        <td>
                            {{ item.userRole }}
                        </td>
                        <td>
                            {{ item.waitlistStatus }}
                        </td>
                        <td>
                            <div class="candidate-button">
                                <button @click="cancelPendingReservation(item.waitlistTeamId)" type="button">取消</button>
                                <button @click="checkCode(item.waitlistTeamId)" type="button">查看</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div style="width: 100%;margin-right: 20px;">
            <PageNavigator :totalPages="totalPages" @page-change="candidatePagesChange"></PageNavigator>
        </div>

        <div class="candidate-code" v-if="codeShow">
            <div class="code-operate">
                <span>候补码：{{ currentCode }}</span>

                <div>
                    <button @click.stop="">复制候补码</button>
                    <button @click.stop="codeShow = false;currentCode = null;">取消</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.candidate-container{
    height: 100%;
    min-height: 500px;
    background-color: rgba(236, 197, 147,0.4);
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    /* gap: 50px; */
    align-items: center;
    overflow-x: hidden;
    overflow-y: hidden;
    position: relative;
}
.table-container{
    height: auto;
    min-height: 450px;
    width: 85%;
}
.candidate-table{
    width: 100%;
    /* height: 100%; */
    height: auto;
    border-collapse: collapse;
}
caption{
    margin-bottom: 15px;
    font-size: 25px;
    font-weight: 600;
}
table,th,td{
    border: 2px,solid,lightblue;
}
tbody tr{
    height: 70px;
}
th{
    font-size: 18px;
    font-weight: 500;
    padding: 10px;
}
td{
    min-width: 45px;
    font-size: 12px;
    font-weight: 500;
    padding: 6px 10px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    overflow: auto;
}
thead>tr>th:nth-child(1),
thead>tr>th:nth-child(2),
thead>tr>th:nth-child(3)
{
    min-width: 72px;
}
tbody>tr:hover{
    background-color: #f5f5f5;
}


.candidate-button{
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
    gap: 5px;
}

.candidate-button>button{
    font-size: 10px;
    width: 50px;
}


.candidate-code{
    background-color: rgba(0, 0, 0,0.4);
    height: 100%;
    width: 100%;
    position: absolute;
}

.code-operate{
    border-radius: 7px;
    width: 50%;
    height: 30%;
    min-width: 300px;
    min-height: 200px;
    background-color: rgba(245, 245, 245,0.7);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
}
.code-operate>div{
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
}
.code-operate button{
    width: 100px;
}
</style>