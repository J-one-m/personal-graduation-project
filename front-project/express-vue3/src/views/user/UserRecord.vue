<script setup>
import {reactive,onMounted,ref, computed,onUnmounted, watch} from 'vue' 
import {v4 as uuidv4} from 'uuid'
import useRouterStore from '@/stores/useRouterStore';
import axiosInstance from '@/api/axios';
import { apiConfig } from '@/config/apiConfig';
defineOptions({
    name:'UserRecord',
});

const {state} = useRouterStore();
// 此处后面用后端返回的数据代替，或者由后端返回记录数据、分页数、单页最大显示记录数等数据
const recordInfo = reactive([]);
// 随机数据
// for (let i = 0; i < 118; i++) {
//     recordInfo.push({
//         id: uuidv4(),
//         appointmentTime: `2025-09-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
//         duration: `${Math.floor(Math.random() * 3) + 1}h`,
//         address: `北区体育馆${Math.random() > 0.5 ? '一层' : '二层'}`,
//         project: ['羽毛球', '乒乓球', '篮球', '游泳', '健身', '排球', '搏击', '街舞', '跳绳', '足球','网球'][Math.floor(Math.random() * 10)],
//     });
// }
/* 
    pageSize：单页最大记录数
    currentPage：当前页
    totalPages：总页数
    paginate：标页数 --> paginateList：当前页标所呈现的数据列表
*/
const nativePageNum = ref(null);
const cancelButton = ref(true);//取消按钮状态
const bespeakCode = ref(true);//查看邀请码按钮状态
const pageSize = 6;//每页显示数据条数
const currentPage = ref(1);
const isShow = ref(false);
const pagesNum = ref(null);
const totalPages = ref(null);
const invitationCode = ref(null);
const isCodeShow = ref(false);
// const totalPages = computed(()=>{
//     return Math.ceil(recordInfo.length / pageSize);
// });

// 返回当前页码所需渲染的数据列表
const paginateList = computed(()=>{
    const startIndex = (currentPage.value - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return recordInfo.slice(startIndex,endIndex);
});

// 判断是否显示省略符号
const pagesIconShow = computed(()=>{
    if (!totalPages.value) return [];
    if(totalPages.value > 8){//ellipsis：省略
        return [1,2,3,4,5,'ellipsis',totalPages.value-1,totalPages.value];
    }else{
        return totalPages.value;
    }
});


const getCurrentPage = (num)=>{
    currentPage.value = num;
    // console.log(num);
}
const prevPage = ()=>{//后退
    if(currentPage.value > 1){
        currentPage.value--;
    }
};
const nextPage = ()=>{//前进
    if(currentPage.value < totalPages.value){
        currentPage.value++;
    }
};
const inputPage = ()=>{
    isShow.value = !isShow.value;
};
const handleEnter = ()=>{
    // NaN仍会被判定为number，且NaN之间不会相等，对于parseInt而言，若字符串以数字开头，则从头转换，直到不是数字，若不是以数字开头，则返回NaN。eg：if(parseInt(pagesNum.value) === 'number')
    const pageNumber = parseInt(pagesNum.value);
    if(!isNaN(pageNumber) && pageNumber > 0 && pageNumber <= totalPages.value){
        currentPage.value = pageNumber;
        console.log(pageNumber);
    }else{
        // 后续完善时不建议用
        alert('输入非法或者页码不存在');
    }
};

const handleClickOutside = ()=>{
    isShow.value = false;
    pagesNum.value = null;
};

const requestUserRecords = async(num)=>{
    const userRecordData = await axiosInstance(apiConfig.userRecord,{
        params:{
            account:state.userInfo.account,
            userId:state.userInfo.id,
            pageSize,
            nativeMaxPageNum:num,
        },
    });
    const {dataChunk,totalPageNum} = userRecordData.data;

    console.log('@',dataChunk);
    if(dataChunk && dataChunk.length >= 0){
        // Object.assign(recordInfo,dataChunk);//为了代码复用，用下面这种形式更好。
        // recordInfo.push(...dataChunk);
        // 清空并替换数据，避免重复
        recordInfo.splice(0, recordInfo.length, ...dataChunk);
        totalPages.value = totalPageNum;
    }
};

const getBespeakCode = async(timeSlotId)=>{//查看邀请码
    isCodeShow.value = true;
    try{
        const {data} = await axiosInstance.get(apiConfig.getBespeakCode,{
            params:{
                id:timeSlotId,
                userId:state.userInfo.id,
            },
        });
        console.log('@userRecord',data);
        if(data && data.length > 0){
            invitationCode.value = data[0].invitation_code;
            
        }else{
            console.log('无邀请码！');//后续用弹窗提示用户
        };
        // console.log('@userRecord');
    }catch(error){
        console.error(error);
    }
};

// 取消预约函数
const cancelReservation = async (userId, timeSlotId) => {
    try {
        const data = await axiosInstance.patch(apiConfig.cancelReservation, {
            userId,
            timeSlotId,
        });
        if (data.code === 200) {
            // 重新请求当前页数据
            await requestUserRecords(currentPage.value);
        }
    } catch(error) {
        console.error('取消失败！', error);
    }
};
const clickQuit = ()=>{
    
};

// 监视currentPage的变化，若跳转的页数大于本地数据的长度则向后端请求数据。
watch(currentPage,async(newValue)=>{
    // 开始修改
    const localMaxPage = Math.ceil(recordInfo.length / pageSize);
    if (newValue > localMaxPage) {
        // 请求新数据
        await requestUserRecords(newValue);
    }
});

onMounted(()=>{
    // 当页数大于8时将其中的第六个span元素设为‘...’，且点击可以实现页数跳转。但不建议直接操作DOM元素，推荐使用计算属性来实现。
    // let span = document.getElementsByClassName('backgroundColor')
    // if(span.length >= 10 ){
    //     span[6].style.backgroundColor = 'transparent';
    // }
    
    document.addEventListener('click',handleClickOutside);
    requestUserRecords(currentPage.value);
    // console.log('@userRecord',userRecordData.data);//测试
});

onUnmounted(()=>{
    // 在组件卸载时解除事件监听
    document.removeEventListener('click',handleClickOutside);
});

</script>

<template>
    <div class="record-container">
        <table class="record-table">
            <caption>预约记录</caption>
            <thead>
                <tr>
                    <th style="width: 160px;box-sizing: border-box;">预约时间</th>
                    <th>地址</th>
                    <th>人数</th>
                    <th>具体项</th>
                    <th>身份</th>
                    <th>状态</th> 
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <!-- 其中的recordInfo由后端提供，此处数据仅供参考 -->
                <tr v-for="item in paginateList" :key="item.id">
                    <td>
                        <div class="td-time">
                            <span>{{ item.reservation_date }}</span>
                            <span>时长：{{ item.duration }}</span>
                        </div>
                    </td>
                    <td>{{ item.reservation_address }}</td>
                    <td>{{ item.reservation_number }}</td>
                    <td>{{ item.reservation_item }}</td>
                    <td>
                        <div class="reservation-status">
                            <!-- 
                                此处应该根据后端返回的数据来判断当前用户的身份，
                                然后根据确认的身份来决定是否循环渲染 
                            -->
                            <div>{{ item.role == 'creator' ? '创建者' : '受邀者' }}</div>    
                        </div>
                    </td>
                    <td>{{ item.status }}</td>
                    <td>
                        <div class="td-button">
                            <!-- 此处item.id为时段id -->
                            <button @click="cancelReservation(state.userInfo.id,item.id)">取消预约</button>
                            <button @click="getBespeakCode(item.id)">查看邀请码</button>
                        </div>    
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="navigation-bar"> 
            <div class="icon-navigation" @click="prevPage">
                <span class="backgroundColor">
                    <svg t="1758722551081" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3367" width="16" height="16">
                        <path d="M224 480h640c9.344 0 17.024 3.008 23.04 8.96 5.952 6.016 8.96 13.696 8.96 23.04a31.168 31.168 0 0 1-8.96 23.04 31.168 31.168 0 0 1-23.04 8.96h-640a31.168 31.168 0 0 1-23.04-8.96A31.168 31.168 0 0 1 192 512c0-9.344 3.008-17.024 8.96-23.04a31.168 31.168 0 0 1 23.04-8.96z m12.992 32l265.984 264.96c6.016 6.72 9.024 14.4 9.024 23.04a30.72 30.72 0 0 1-9.536 22.464A30.72 30.72 0 0 1 480 832a33.408 33.408 0 0 1-23.04-8.96l-288-288A33.408 33.408 0 0 1 160 512c0-8.64 3.008-16.32 8.96-23.04l288-288A33.408 33.408 0 0 1 480 192a30.72 30.72 0 0 1 22.464 9.472A30.72 30.72 0 0 1 512 224a33.408 33.408 0 0 1-8.96 23.04L236.928 512z" 
                            fill="#f5f5f5" p-id="3368"></path>
                    </svg>
                </span>
            </div>

            <div v-for="num in pagesIconShow" :key="num" class="icon-navigation" @click="getCurrentPage(num)">
                <!-- 当总页数totalPages大于8时，以省略号的形式折叠导航栏 -->
                <!-- 通过stop修饰符来阻止事件冒泡，避免在点击时触发getCurrentPage函数，第二种解决方法是将getCurrentPage函数放在非数字页码中。但推荐用修饰符来解决 -->
                <span v-if="num === 'ellipsis'" @click.stop="inputPage" class="backgroundColor" :class="{'is-transparent':isShow}">
                    <svg v-if="!isShow" t="1758784847283" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3699" width="16" height="16">
                        <path d="M176 416c32 0.64 58.496 11.52 79.488 32.512 20.992 20.992 31.808 47.488 32.512 79.488-0.64 32-11.52 58.496-32.512 79.488-20.992 20.992-47.488 31.808-79.488 32.512-32-0.64-58.496-11.52-79.488-32.512C75.52 586.496 64.704 560 64 528c0.64-32 11.52-58.496 32.512-79.488 20.992-20.992 47.488-31.808 79.488-32.512zM512 416c32 0.64 58.496 11.52 79.488 32.512 20.992 20.992 31.808 47.488 32.512 79.488-0.64 32-11.52 58.496-32.512 79.488C570.496 628.48 544 639.296 512 640c-32-0.64-58.496-11.52-79.488-32.512-20.992-20.992-31.808-47.488-32.512-79.488 0.64-32 11.52-58.496 32.512-79.488C453.504 427.52 480 416.704 512 416z m336 0c32 0.64 58.496 11.52 79.488 32.512 20.992 20.992 31.808 47.488 32.512 79.488-0.64 32-11.52 58.496-32.512 79.488-20.992 20.992-47.488 31.808-79.488 32.512-32-0.64-58.496-11.52-79.488-32.512-20.992-20.992-31.808-47.488-32.512-79.488 0.64-32 11.52-58.496 32.512-79.488 20.992-20.992 47.488-31.808 79.488-32.512z" 
                        fill="#f5f5f5" p-id="3700"></path>
                    </svg>

                    <input v-else :class="{'display-change' : isShow}" placeholder="跳转页数" 
                        v-model="pagesNum"
                        @click.stop
                        @keyup.enter="handleEnter"
                    ></input>
                </span>
                <span v-else class="get-span backgroundColor">{{ num }}</span>
            </div>

            <div class="icon-navigation" @click="nextPage">
                <span class="backgroundColor">
                    <svg t="1758722961500" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3533" width="16" height="16">
                        <path d="M755.008 480H160a31.168 31.168 0 0 0-23.04 8.96A31.168 31.168 0 0 0 128 512c0 9.344 3.008 17.024 8.96 23.04 6.016 5.952 13.696 8.96 23.04 8.96h595.008L520.96 776.96a33.408 33.408 0 0 0-8.96 23.04c0 8.64 3.2 16.128 9.536 22.464A30.72 30.72 0 0 0 544 832a33.408 33.408 0 0 0 23.04-8.96l288-288A33.408 33.408 0 0 0 864 512a33.408 33.408 0 0 0-8.96-23.04l-288-288A33.408 33.408 0 0 0 544 192a30.72 30.72 0 0 0-22.464 9.472A30.72 30.72 0 0 0 512 224c0 8.64 3.008 16.32 8.96 23.04l234.048 232.96z" 
                            fill="#f5f5f5" p-id="3534">
                        </path>
                    </svg>
                </span>
            </div>
        </div>
        <!-- v-if="false" -->
        <div class="venue-info" v-if="isCodeShow">
            <div>
                <span>邀请码：{{ invitationCode }}</span>
                <div class="venue-button">
                    <button type="button" @click="getIdArrAndCode">复制邀请码</button>
                    <button type="button" @click="isCodeShow = false ;invitationCode = null;"> 退出</button>
                </div>
            </div>
        </div>
    </div>

</template>

<style scoped>
.record-container{
    background-color: antiquewhite;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    overflow-x: hidden;
    position: relative;
}
.record-table{
    width: 80%;
    height: 60%;
    margin-top: 15px;
    margin-bottom: 25px;
    border-collapse: collapse;
    /* border-spacing: 10px; */
}
caption{
    margin-bottom: 15px;
    font-size: 25px;
    font-weight: 600;
}
table,th,td{
    border: 2px solid lightblue;
}
th{
    font-size: 18px;
    font-weight: 500;
    padding: 10px;
}
td{
    min-width: 50px;
    font-size: 12px;
    font-weight: 500;
    padding: 6px 10px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    overflow: auto;
}

tbody>tr:hover{
    background-color: #f5f5f5;
}
.td-time{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 6px;
}
.reservation-status{
    padding-top: 6px;
    min-width: 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-height: 60px;
    
}
.td-button{
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 7px;
    align-items: center;
}
.td-button button{
    font-size: 10px;
}
.td-button button:hover{
    cursor: pointer;
}

.navigation-bar{
    width: 80%;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    gap: 3%;
}

.icon-navigation:hover{
    cursor: pointer;
}
.backgroundColor{
    color: aqua;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: black;
    display: flex;
    justify-content: center;
    align-items: center;
}
.is-transparent{
    background-color: transparent;
    margin: 0 10px;
}
.is-transparent>input{
    font-size: 12px;
}
.is-transparent>input:focus{
    outline: none;
    background-color: transparent;
    border: none;
}

.display-change{
    width: 50px;
}

.venue-info{
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: rgba(0,0,0,0.4);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center; 
}
.venue-info>div{
    width: 50%;
    height: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center; 
    background-color: rgba(245, 245, 245,0.7);
    gap: 40px;
}
.venue-info span{
    width: 200px;   
    text-align: center;
}
.venue-button{
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 8%;
}
.venue-button button:hover{
    cursor:pointer;
}

</style>