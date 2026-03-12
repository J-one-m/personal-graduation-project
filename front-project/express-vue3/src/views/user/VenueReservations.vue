<script setup>
defineOptions({
    name:'VenueReservations',
});
import PageNavigator from '@/components/PageNavigator.vue';
import { computed, onMounted, onUnmounted, reactive, ref, watch, h } from 'vue';
import { v4 as uuidv4 } from 'uuid' 
import axiosInstance from '@/api/axios';
import { apiConfig } from '@/config/apiConfig';
import useRouterStore from '@/stores/useRouterStore';
import { nanoid } from 'nanoid';//用于邀请码的生成
import useAppStore from '@/stores/useAppStore';
import { storeToRefs } from 'pinia';
import { IconLocation, IconSearch, IconLoading } from '@/config/adminIcons';
import { ElMessage,ElMessageBox } from 'element-plus';

const appStore = useAppStore();
const {isMobile} = storeToRefs(appStore);//判断当前设备是否为移动端

const currentInvitationCode = ref('');//存储从后端获取到的邀请码
const filterWords = ref('');//搜索框过滤词
const isSearching = ref(false); // 搜索状态
let searchTimeout = null; // 防抖定时器

// 控制移动端"使用码预约"弹窗
const mobileCodeDialogVisible = ref(false);
const codeType = ref('invitation'); // 默认为邀请码类型
const inputCode = ref(''); // 统一存储输入的代码
const mobileDrawerVisible = ref(false);
const activeVenue = ref(null); // 记录当前正在操作的场地数据
const activeIndex = ref(-1);   // 记录索引

// 分页参数
const totalItems = ref(0); //存储后端返回的总记录数
const pageNUm = ref(10);   //规定一次性向后端请求的数据条数
const pageSize = 2;//定义但也最大显示数
const currentPage = ref(1);
const backendPage = ref(1); // 记录后端加载到第几页了
const backendLimit = 10;   // 每次向后端要 10 条

// const bespeakNum = ref('');//预约人数
const {state} = useRouterStore();
let reservationCode = null;
let timeSlotId = null;//时段id
//  日期以及用户预约日期下拉框
const date = ref(new Date());
const currentDate = computed(()=>{
    // return date.value.getDate();
    return date.value.toISOString().split('T')[0];
});



const tomorrow = computed(()=>{//明天
    const newDate = new Date(date.value);
    newDate.setDate(newDate.getDate()+1)
    // return newDate.getDate();
    return newDate.toISOString().split('T')[0];
});
const postnatal = computed(()=>{//后天
    const newDate = new Date(date.value);
    newDate.setDate(newDate.getDate()+2)
    // return newDate.getDate();
    return newDate.toISOString().split('T')[0];
});
let currentSelectDate = ref(currentDate.value);


const suggestionShow = ref(false);//用于提示框的显现与否


const inputStatus = ref(false);

const dataArr = reactive([]);//存储所有场地即预约信息


// 判断是否是限制性场地，例如跑道，游泳馆等
const restrictive = ref(true);
// 控制分页
/* const currentDataList = computed(()=>{
    const startIndex = (currentPage.value - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return  dataArr.slice(startIndex,endIndex);
}); */

// 计算属性：基于缓存池 dataArr 进行前端分页展示
const currentDataList = computed(() => {
    const startIndex = (currentPage.value - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return dataArr.slice(startIndex, endIndex);
});
// 计算属性：总页数（基于数据库真实总数）
const venuePages = computed(() => {
    return Math.ceil(totalItems.value / pageSize);
});


/* const venuePages = computed(()=>{
    return Math.ceil(dataArr.length / pageSize);//向上取整
});
 */

const handlePageChange = async (value) => {
    currentPage.value = value; // 更新前端分页组件状态

    // 判断逻辑：
    // 如果（当前页 * 每页2条）超过了（缓存池长度），说明缓存不够用了
    // 并且（缓存池长度）还小于（数据库总数），说明后端还有货
    const neededCount = value * pageSize;
    if (neededCount > dataArr.length && dataArr.length < totalItems.value) {
        backendPage.value++; // 后端页码往后跳
        await loadVenueInfo(true); // 传入 true，执行追加模式
    }
};

// 同一时间函数
const calculationPeriod = (timeH,timeM)=>{
    return timeH * 60 + timeM - 420;
} 


// 移动端点击"进行预约"触发
const handleMobileBespeak = (index, item) => {
    activeVenue.value = item;
    activeIndex.value = index;
    mobileDrawerVisible.value = true;
};
// // 辅助函数：将移动端选择的 "HH:mm" 字符串回填给原始数据结构
// const updateStartTime = (val) => {
//     if (!val) return;
//     const [h, m] = val.split(':').map(Number);
//     activeVenue.value.startTimeH = h;
//     activeVenue.value.startTimeM = m;
// };
// const updateEndTime = (val) => {
//     if (!val) return;
//     const [h, m] = val.split(':').map(Number);
//     activeVenue.value.endTimeH = h;
//     activeVenue.value.endTimeM = m;
// };



// 判断用户选择的时段是否合法，是的话就将其插入时段表中
const insertTimeSlot = (arr,start,end)=>{
    // 检查插入空隙是否足够
    if((end - start) >= 30){
        for(let i=0;i<arr.length-1;i++){
            const leftCondition = ((arr[i].time[1] === start) || (start - arr[i].time[1]) >= 30);
            const rightCondition = ((arr[i+1].time[0] === end) || (arr[i+1].time[0] - end) >= 30);
            if(leftCondition && rightCondition){
                arr.push({
                    id:null,
                    time:[start,end],
                });
                // 插入成功后应当立即对其排序
                arr.sort((a,b) => a.time[0] - b.time[0]);//返回值小于0则a在前，反之在b后

                return true;//若插入成功，则终止循环
            }
        }
        return false;//若插入失败，则返回失败标记
    }else{
        return '预约时长小于最低半小时时限';
    }
};

// 构建时间标注文本的函数（即用户预约的时段显示）
const timeAnnotation = (reserveArr)=>{
    const labelArr = [];
    reserveArr.forEach(item => {
        if((item.time[1] - item.time[0]) >= 30){//去除首尾的无效时间
            const startT = `${7+Math.floor(item.time[0]/60)}:${(item.time[0]%60).toString().padStart(2,'0')}`;
            const endT = `${7+Math.floor(item.time[1]/60)}:${(item.time[1]%60).toString().padStart(2,'0')}`;
            const median = (item.time[0]+item.time[1])/2;//中间值
            labelArr.push({
                id:uuidv4(),
                left:`${(median/840)*100}%`,
                timeArr:[startT,endT],
                waitlist:item.waitlist,//当前候补人数
            });
        }
    });

    return labelArr;
};

// 判断时段表中的哪些时段是已预约的，若是则启用某些样式
const buildTimeSlots = (reserveArr,totalNum)=>{
    const timeInfo = [];
    for(let j=0;j<totalNum;j++){
        let isReserved = false;
        for(const item of reserveArr){
            if(item.time[0] <= j && j <= item.time[1]){
                isReserved = true;
                break;//若落在存在的区间上，则终止循环
            }
        }
        timeInfo.push({
            id:uuidv4(),
            isReserved,
        });
    }

    return  timeInfo;
}





const showSuggestion = ()=>{
    suggestionShow.value = !suggestionShow.value;
    console.log(1)
};
const changeValue = ()=>{
    if(suggestionShow.value){//保证点击空白处该代码仅执行一次
        suggestionShow.value = false;
        // console.log(2);
    }
};





// 预约逻辑
const handleReservation = async(index,item)=>{
    let start = calculationPeriod(item.startTimeH,item.startTimeM);
    let end = calculationPeriod(item.endTimeH,item.endTimeM);

    const result = insertTimeSlot(item.slotArr,start,end);
    let dataIndex = index + (currentPage.value - 1) * 2;
    
    if(result === true){
        try{
            const res = await axiosInstance.post(apiConfig.insertVenueRecords,{
                scheduleId:item.scheduleId,
                startTime:start,
                endTime:end,
                userId:state.userInfo.id,
                maxParticipants:item.bespeakNum,
            });
            
            timeSlotId = res.timeSlotId;
            
            if(res.code === 200){
                // 根据预约人数判断是否需要显示邀请码
                if(res.invitationCode){
                    // 团队预约，显示邀请码弹窗
                    showCodeModal(res.invitationCode, 'invitation');
                }else{
                    // 个人预约，普通提示
                    ElMessage.success(res.msg || '个人预约成功！');
                }

                // 更新本地数据
                const newSlot = dataArr[dataIndex].slotArr.find((slot)=>{
                    return slot.time[0] === start && slot.time[1] === end && slot.id === null;
                });
                if(newSlot){
                    newSlot.id = res.timeSlotId;
                };

                dataArr[dataIndex].timeLabel = timeAnnotation(dataArr[dataIndex].slotArr);
                dataArr[dataIndex].timelineStyle = buildTimeSlots(dataArr[dataIndex].slotArr, 840);
            };
        }catch(error){
            console.error('预约失败:', error);
            ElMessage.error(error.response?.data?.msg || '预约失败');
        }
    }else{
        ElMessage.warning(result || '预约时间无效！');
    }
    
    // 清空表单
    item.bespeakNum = 1;
    item.startTimeH = null;
    item.startTimeM = null;
    item.endTimeH = null;
    item.endTimeM = null;
    item.selectedDate = currentDate.value;
};
const reservation = async(index,item)=>{
    if(!Number.isInteger(item.bespeakNum)){
        ElMessage.warning('输入非法，请重新输入！');
        return ;
    }
    
    // 只有在非移动端（PC端）点击这个纯"预约"按钮时，才弹出这个拦截
    // 或者直接去掉这个拦截，让 handleReservation 自己根据接口返回处理
    if(!isMobile.value && item.bespeakNum >= 2){
        ElMessage.warning('当前人数大于1，请点击"预约并生成邀请码"按钮');
        return ;
    };

    try{
        await handleReservation(index,item);
    }catch(error){
        // console.error('预约失败！',error);
    }
};
//预约并生成邀请码的函数
const invitationCode = async(index,item)=>{
    if(!Number.isInteger(item.bespeakNum)){
        ElMessage.warning('输入非法，请重新输入！');
        // console.log('输入非法，请重新输入！');//后续用弹窗实现
        return ;
    }
    if(item.bespeakNum <= 1){
        ElMessage.warning('当前用户预约人数小于2，还请点击相应按钮预约');
        // console.log('当前用户预约人数小于2，还请点击相应按钮预约');//后续用弹窗实现
        return ;
    };
    // 生成邀请码
    // reservationCode = nanoid(7);
    try{
         await handleReservation(index,item);
    }catch(error){
        console.error('预约失败！',error);
    }
    // 获取时段id并添加进邀请码中，用于被邀者确认邀请

    console.log('@venueReservations.vue@invitationCode',reservationCode);
};



// 候补预约
const alternateReservation = async(index,item)=>{
    const start = calculationPeriod(item.startTimeH,item.startTimeM);
    const end = calculationPeriod(item.endTimeH,item.endTimeM);
    
    // 判断是否存在
    const isExistence = item.slotArr.find((obj)=>{
        if(obj.isBoundary !== true){
            return obj.time[0] === start && obj.time[1] === end;
        }
    });

    if(isExistence){
        const slotInfo = isExistence;
        try{
            const {code, msg, data} = await axiosInstance.post(apiConfig.alternateReservation,{
                userId: state.userInfo.id,
                bespeakNum: item.bespeakNum,
                priority_score: Math.floor((state.userInfo.credit_score * 1000000000 - date.value.getTime()) / 1000),
                slotId: slotInfo.id,
            });
            
            if(code === 200){
                // 判断是否需要显示候补码弹窗
                if(item.bespeakNum > 1 && data && data.waitlistCode){
                    // 显示候补码弹窗
                    showCodeModal(data.waitlistCode, 'alternate');
                    
                    // 清空输入
                    item.bespeakNum = 1;
                    item.startTimeH = null;
                    item.startTimeM = null;
                    item.endTimeH = null;
                    item.endTimeM = null;
                    
                    // 关闭移动端弹窗（如果打开的话）
                    if(mobileDrawerVisible.value){
                        mobileDrawerVisible.value = false;
                    }
                } else {
                    // 个人候补，显示普通提示
                    ElMessage.success(msg || '候补预约成功！');
                }
                
                // 候补成功后应该及时更新前端数据
                // 这里可以调用更新场地信息的函数
                const dataIndex = index + (currentPage.value - 1) * 2;
                await changeCurrentVenueInfo(item.venueId, item.selectedDate, dataIndex);
            } else {
                ElMessage.error(msg || '候补预约失败！');
            }
        }catch(error){
            console.error('候补预约失败:', error);
            ElMessage.error(error.response?.data?.msg || '候补预约失败');
        }      
    }else{
        ElMessage.warning('请输入合理且存在的时段！');
    }
};



//候补码预约
const bespeakByAlternateCode = async(index,item)=>{
    
    // 基础校验
    if (!item.alternateCode) {
        ElMessage.warning('请输入候补码！');
        return;
    }

    item.alternateCodeShow = true;

    try{
        const {code, msg} = await axiosInstance.post(apiConfig.bespeakByAlternateCode,{
            alternateCode: item.alternateCode,
        })
        if(code === 200){
            ElMessage.success(msg || '成功加入候补队伍！');
            item.alternateCodeShow = false; // 关闭输入框
        }
        // console.log('@venueReservations.vue@invitationCode',data);
    }catch(error){
        // 处理后端返回的错误响应
        if (error.response) {
            const { status, data } = error.response;
            
            // 根据后端定义的错误码进行精准提示
            switch (status) {
                case 400:
                    ElMessage.error(data.msg || '参数错误');
                    break;
                case 404:
                    ElMessage.error('该候补队伍已不存在');
                    break;
                case 409:
                    ElMessage.warning('队伍已满，去看看其他时段吧');
                    break;
                case 422:
                    // 候补发起人加入、码不匹配、重复加入等
                    ElMessage.warning(data.msg || '候补码校验失败');
                    break;
                case 500:
                    ElMessage.error('服务器开小差了，请稍后再试');
                    break;
                default:
                    ElMessage.error(data.msg || '操作失败');
            }
        } else {
            ElMessage.error('网络连接异常，请检查网络！');
        }
        // console.error('候补码预约失败:', error);
    }
};

// 处理点击底部"使用码预约"
const handleMobileCodeClick = () => {
    inputCode.value = '';
    mobileCodeDialogVisible.value = true;
};

// 提交代码预约
const submitCodeReservation = async () => {
    if (!inputCode.value.trim()) {
        ElMessage.warning('请输入有效代码');
        return;
    }

    try {
        if (codeType.value === 'invitation') {
            // 邀请码预约
            await useCodeBespeak({ 
                bespeakCode: inputCode.value, 
                codeButtonShow: true 
            });
        } else {
            // 候补码预约
            await bespeakByAlternateCode(null, { 
                alternateCode: inputCode.value,
                alternateCodeShow: true 
            });
        }
        // 只有在成功时才关闭弹窗
        mobileCodeDialogVisible.value = false;
        inputCode.value = ''; // 清空输入
    } catch (error) {
        // 错误已在子函数中处理，这里可以只处理UI相关的错误
        // console.error('预约流程错误:', error);
        // 不关闭弹窗，让用户可以重试
    }
};


//使用邀请码预约函数
const useCodeBespeak = async(item)=>{
    try{
        item.codeButtonShow = true;
        if(!item.bespeakCode || item.bespeakCode.trim() === ''){
            ElMessage.warning('请填写邀请码!');
            return ;
        }
        const {code, msg} = await axiosInstance.patch(apiConfig.addParticipants,{
            bespeakCode:item.bespeakCode,
        });
        if(code === 200){
            ElMessage.success(msg || '恭喜预约成功！');
            item.bespeakCode = null;
        }
    }catch(error){
        console.log('预约失败！',error);
    }
}

// 当用户选择日期时向后端请求对应日期下的时段信息，并将其呈现在页面上
const changeCurrentVenueInfo = async(venueId,scheduleDate,index)=>{
    // 传入用户选择的日期以及场地id，在后端查询当天的预约信息
    // 并将其传递到前端来呈现给用户，后端返回的数据：
    // 该场地当天的时段数组、以及对应日期的日程表
    currentSelectDate.value = scheduleDate;
    
    try{
        const data = await axiosInstance.patch(apiConfig.updateTimeSlot,{
            venueId,
            scheduleDate,
        });
        // 计算当前用户预约场地在dataArr中对应的索引
        const dataIndex = index + (currentPage.value - 1) * pageSize;
        console.log('@venueReservations.vue',venueId,currentPage.value,scheduleDate,data);
        dataArr[dataIndex]['slotArr'] = data.data; 
        dataArr[dataIndex].timeLabel = timeAnnotation(data.data);
        dataArr[dataIndex].timelineStyle = buildTimeSlots(data.data, 840);
        dataArr[dataIndex].scheduleId = data.scheduleId;
    }catch(error){
        console.error({
            errorAddress: 'changeCurrentVenueInfo',
            error,
        });
    }
}

// 移动端统一提交入口
const handleMobileConfirm = async (index, item) => {
    // 1. 基础校验
    if (!Number.isInteger(item.bespeakNum) || item.bespeakNum < 1) {
        ElMessage.warning('请输入有效的预约人数');
        return;
    }
    
    // 2. 时间校验
    if (!item.startTimeH || !item.endTimeH) {
        ElMessage.warning('请选择完整的预约时段');
        return;
    }

    try {
        // 3. 核心逻辑：直接调用 handleReservation
        await handleReservation(index, item);
        
        // 4. 成功后关闭移动端抽屉
        mobileDrawerVisible.value = false;
    } catch (error) {
        console.error('预约失败！', error);
    }
};

// 通用码弹窗（可显示邀请码或候补码）
const showCodeModal = (code, type = 'invitation') => {
  const config = {
    invitation: {
      title: '🎉 团队预约成功',
      message: '您的团队预约已就绪，邀请码如下：',
      codeLabel: '邀请码',
      successMsg: '已复制到剪贴板',
      bgColor: '#f0f7ff',
      borderColor: '#409eff',
      textColor: '#409eff'
    },
    alternate: {
      title: '📋 候补预约成功',
      message: '您的候补预约已就绪，候补码如下：',
      codeLabel: '候补码',
      successMsg: '候补码已复制到剪贴板',
      bgColor: '#f8f0ff',
      borderColor: '#8b5cf6',
      textColor: '#8b5cf6'
    }
  };
  
  const { title, message, successMsg, bgColor, borderColor, textColor } = config[type];

  ElMessageBox({
    title,
    confirmButtonText: '知道了',
    customClass: 'code-modal-box',
    message: h('div', { 
      style: 'display: flex; flex-direction: column; align-items: center; padding: 10px 0;' 
    }, [
      h('p', { 
        style: 'font-size: 14px; color: #606266; margin: 0 0 16px 0; text-align: center;' 
      }, message),
      
      // 码卡片区
      h('div', {
        style: `
          position: relative;
          width: 100%;
          background-color: ${bgColor};
          border: 1.5px dashed ${borderColor};
          border-radius: 8px;
          padding: 20px 10px;
          margin-bottom: 20px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        `
      }, [
        h('div', {
          style: 'font-size: 12px; color: #909399; margin-bottom: 5px;'
        }, type === 'invitation' ? '邀请码' : '候补码'),
        
        h('span', {
          style: `
            font-family: "Courier New", Courier, monospace;
            font-size: 20px;
            color: ${textColor};
            font-weight: 800;
            letter-spacing: 2px;
            word-break: break-all;
            text-align: center;
            user-select: all;
            line-height: 1.5;
          `
        }, code)
      ]),

      // 提示信息
      h('div', {
        style: `
          width: 100%;
          padding: 10px;
          background-color: #f9f9f9;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 12px;
          color: #666;
          line-height: 1.5;
        `
      }, [
        h('p', { style: 'margin: 0 0 5px 0;' }, type === 'invitation' 
          ? '🔐 请妥善保管此邀请码，并分享给您的团队成员'
          : '⏳ 候补码可用于在有人取消预约时，系统自动为您预约'),
        h('p', { style: 'margin: 0;' }, '📱 团队成员可在"使用码预约"中输入此码加入')
      ]),

      // 按钮区
      h('button', {
        class: 'copy-btn',
        style: `
          width: 100%;
          height: 40px;
          background: linear-gradient(90deg, ${borderColor}, ${textColor});
          color: #fff;
          border: none;
          border-radius: 4px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 4px 12px ${borderColor}30;
          transition: all 0.2s ease;
        `,
        onMouseover: (e) => e.target.style.opacity = '0.9',
        onMouseout: (e) => e.target.style.opacity = '1',
        onClick: async () => {
          try {
            await navigator.clipboard.writeText(code);
            ElMessage.success(successMsg);
          } catch (err) {
            // 降级方案：使用 document.execCommand
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            try {
              const success = document.execCommand('copy');
              if (success) {
                ElMessage.success(successMsg);
              } else {
                ElMessage.error('复制失败，请手动选择');
              }
            } catch (copyErr) {
              ElMessage.error('复制失败，请手动选择');
            }
            document.body.removeChild(textArea);
          }
        }
      }, '一键复制')
    ]),
    closeOnClickModal: false,
    showClose: true
  }).catch(() => {
    // 用户点击关闭或取消
  });
};

// 加载场地数据
const loadVenueInfo = async (isAppend = false) => {
    isSearching.value = true;
    try {
        const res = await axiosInstance.get(apiConfig.getVenueInfo, {
            params: {
                scheduleDate: currentSelectDate.value,
                search: filterWords.value,
                page: backendPage.value,
                limit: backendLimit,
            },
        });

        // 假设你配置了拦截器直接返回 body，如果没有，请使用 const { data, code, total } = res.data;
        const { data, code, msg, total } = res;

        if (code === 200) {
            totalItems.value = total; // 更新全局总数

            // 1. 加工新获取的数据
            const processedData = data.map(item => {
                // 注入你原有的时间轴标注和样式逻辑
                return {
                    ...item,
                    timeLabel: timeAnnotation(item.slotArr),
                    timelineStyle: buildTimeSlots(item.slotArr, 840),
                    bespeakNum: 1,
                    startTimeH: null,
                    startTimeM: null,
                    endTimeH: null,
                    endTimeM: null,
                    selectedDate: currentSelectDate.value,
                    codeButtonShow: true,
                    alternateCodeShow: true
                };
            });

            // 2. 执行模式切换
            if (!isAppend) {
                dataArr.length = 0; // 覆盖模式：清空旧缓存
            }
            
            dataArr.push(...processedData); // 追加数据到缓存池

            if (!isAppend) {
                ElMessage.success(msg || '查询成功！');
            }
        }
    } catch (error) {
        console.error('加载失败:', error);
    } finally {
        isSearching.value = false;
    }
};

// 回车键搜索
const handleKeyupEnter = () => {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    // isSearching.value = true;
    loadVenueInfo(true);
}
// 清空搜索
const clearSearch = () => {
    filterWords.value = '';
    loadVenueInfo('');
}


watch(filterWords, (newVal) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        // 搜索属于“重置”操作
        backendPage.value = 1; 
        currentPage.value = 1;
        loadVenueInfo(false); 
    }, 300);
});
watch(currentSelectDate, () => {
    backendPage.value = 1;
    currentPage.value = 1;
    loadVenueInfo(false);
});



onMounted(async ()=>{
    // 在页面挂载时发送请求向后端请求场地信息
    loadVenueInfo();

    document.addEventListener('click',changeValue);
});

onUnmounted(()=>{
    document.removeEventListener('click',changeValue);
    // 清理定时器
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
});

</script>

<template>
    <!-- <h1>场馆预约</h1> -->
    <div class="venue">

        <div class="venue-search-container">
            <el-input 
              type="search" 
              placeholder="请输入场地类别或者场地名称..."
              v-model="filterWords"
              class="filter-input"
              @keyup.enter="handleKeyupEnter"
              @clear="clearSearch"
            >
                <template #prefix>
                    <el-icon><IconSearch /></el-icon>
                </template>
                <!-- 搜索框加载指示器 -->
                <template #suffix>
                    <el-icon v-if="isSearching" class="is-loading">
                        <IconLoading />
                    </el-icon>
                </template>
            </el-input>

            <div class="relevant-data">
                共<span>{{ dataArr.length }}</span>条相关数据
                <!-- <span v-if="isSearching" style="margin-left: 10px; color: #409eff; font-size: 12px;">
                    搜索中...
                </span> -->
            </div>
        </div>


        <!-- 搜索结果为空提示 -->
        <div v-if="filterWords && dataArr.length === 0 && !isSearching" class="no-result">
            <el-empty description="未找到相关场地" :image-size="100">
                <template #description>
                    <p>未找到包含 "<strong>{{ filterWords }}</strong>" 的场地</p>
                    <p style="font-size: 12px; color: #909399; margin-top: 8px;">
                        请尝试其他关键词或清空搜索框查看所有场地
                    </p>
                </template>
                <el-button type="primary" @click="clearSearch" size="small">
                    查看所有场地
                </el-button>
            </el-empty>
        </div>

        <div v-else class="venue-content" 
            v-for="(item,index) in currentDataList" 
            :key="item.venueId"
        >   
            <div v-if="restrictive" >
                <div class="content-top">
                    <div class="img">
                        <img src="../../assets/images/background-img/室内插画治愈.png" alt="">
                    </div>
                    

                    <!-- 预约操作 -->
                    <div v-if="!isMobile" class="detail">
                        <!-- 
                            此处需要判断开始与结束是否合理，例如是否为数字，以及大小是否颠倒
                            以及是否处在7~21这个区间等
                            对于不满足条件的需弹窗告诉用户
                            在一定时限内用户可以取消预约，但仅有一次机会
                        -->
                        <div>
                            预约人数：<input type="number" min="1" v-model="item.bespeakNum" style="margin-right: 20px;">
                            预约日期：<select 
                                        name="" v-model="item.selectedDate"
                                        @change="changeCurrentVenueInfo(item.venueId,item.selectedDate,index)"
                                    >
                                <option disabled value="">请选择日期</option>
                                <option :value="currentDate">{{ Number(currentDate.split('-')[2]) }}</option>
                                <option :value="tomorrow">{{ Number(tomorrow.split('-')[2]) > Number(currentDate.split('-')[2]) ? Number(tomorrow.split('-')[2]) : `下月${tomorrow}号` }}</option>
                                <option :value="postnatal">{{ Number(postnatal.split('-')[2]) > Number(currentDate.split('-')[2]) ? Number(postnatal.split('-')[2]) : `下月${postnatal}号` }}</option>
                            </select>
                        </div>
                        <div>开始：<input type="number" v-model="item.startTimeH">时<input type="number" v-model="item.startTimeM">分</div>
                        <div>结束：<input type="number" v-model="item.endTimeH">时<input type="number" v-model="item.endTimeM">分</div> 
                        <div class="button">
                            <!-- <button type="button" @click="cancelReservation">取消预约</button> -->
                            <button type="button" @click="reservation(index,item)"><span class="button_top">预约</span></button>
                            <button type="button" @click="invitationCode(index,item)"><span class="button_top">预约并生成邀请码</span></button>
                            <button type="button" @click="alternateReservation(index,item)"><span class="button_top">候补预约</span></button>
                            <button v-if="item.alternateCodeShow" type="button" @click.stop="item.alternateCodeShow = false"><span class="button_top">候补码预约</span></button>
                            <div v-else :class="{'div-input' : !item.alternateCodeShow}">
                                <input type="text" v-model="item.alternateCode" placeholder="请输入候补码" style="margin-right: 20px;width: 110px;">
                                <button type="button" @click.stop="bespeakByAlternateCode(index,item)"><span class="button_top">确认</span></button>
                            </div>
                            <!-- 下面邀请码部分会重构（省事） -->
                            <button v-if="item.codeButtonShow" type="button" @click.stop="item.codeButtonShow = false;"><span class="button_top">邀请码预约</span></button>
                            <div v-else @click.stop="" :class="{'div-input':!item.codeButtonShow}">
                                <input type="text" v-model="item.bespeakCode" placeholder="请输入邀请码" style="margin-right: 20px;width: 110px;">
                                <button @click="useCodeBespeak(item)" type="button" ><span class="button_top">确认</span></button>
                            </div>

                        </div>  
                    </div>


                    <!-- 预约操作（手机端） -->
                    <div v-else class="info-title info-title-span">
                        <span>{{ item.venueName }}</span>
                        <span>地址：{{ item.venueAddress }}</span> 
                        <!-- {{ currentYear}}-{{ currentMonth }}-{{ currentDate }}可以替换为如下代码 -->
                        <span>时间：{{ date.toISOString().split('T')[0] }}</span>
                        <el-button 
                            type="primary" 
                            plain 
                            size="small" 
                            class="bespoke-button" 
                            @click="handleMobileBespeak(index, item)"
                        >
                            进行预约
                        </el-button>
                    </div>
                </div>


                
                <div class="content-bottom">

                    <div v-if="!isMobile" class="info-title info-title-span">
                        <span>{{ item.venueName }}</span>
                        <span>地址：{{ item.venueAddress }}</span> 
                        <!-- {{ currentYear}}-{{ currentMonth }}-{{ currentDate }}可以替换为如下代码 -->
                        <span>时间：{{ date.toISOString().split('T')[0] }}</span>
                    </div>
                    
                    <!-- 可用时间呈现部分 -->
                    <div class="info-show">

                        <!-- 坐标框 -->
                        <div> 
                            <span class="y">时段信息</span>
                            <span class="x">时间</span>
                            
                            <div class="timeline-container">
                                <div v-for="slot in item.slotArr" :key="slot.id || nanoid()"
                                    class="slot-block"
                                    :style="{
                                        left: `${(slot.time[0] / 840) * 100}%`,
                                        width: `${((slot.time[1] - slot.time[0]) / 840) * 100}%`
                                    }">
                                </div>

                                <div v-for="time in item.timeLabel" :key="time.id" class="time-label" :style="`left:${time.left};`">
                                    <span>{{ time.timeArr[0] }}</span>
                                    <span>~</span>
                                    <span>{{ time.timeArr[1] }}</span>
                                    <div v-if="time.waitlist" class="number-of-candidates">{{ time.waitlist }}</div>
                                </div>

                                <!-- 刻度线以及刻度时间 -->
                                <div v-for="mark in 15" :key="mark" 
                                    class="scale-mark"
                                    :style="`left:${((mark-1)/14)*100 - 0.05}%`" >
                                    <span>{{ 7+mark-1 }}:00</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    
                    <div class="info-bottom">
                        <div style="background-color: rgba(173, 255, 47,0.75);">空闲</div>
                        <div style="background-color: #c75353;color: aliceblue;">候补队伍数</div>
                        <div style="background-color: rgba(0, 255, 255,0.75);">已预约</div>
                    </div>
                </div>
            </div>
            <!-- <div v-else>
                限制性
            </div> -->
        </div>

        <div>
            <button v-if="isMobile" class="use-code" @click="isMobile ? handleMobileCodeClick() : null">
                使用码预约
            </button>
            <PageNavigator :totalPages="venuePages" @page-change="handlePageChange" class="venue-page-nav"></PageNavigator>
        </div>
    </div>

    
    <el-dialog
        v-model="mobileCodeDialogVisible"
        title="快捷码预约"
        :width="isMobile ? '85%' : '400px'"
        :align-center="true"
        append-to-body
        custom-class="mobile-code-dialog"
    >
        <div class="m-code-box">
            <el-radio-group v-model="codeType" size="default" class="m-code-type">
                <el-radio-button value="invitation">邀请码</el-radio-button>
                <el-radio-button value="alternate">候补码</el-radio-button>
            </el-radio-group>

            <div class="m-input-area">
                <el-input 
                    v-model="inputCode" 
                    :placeholder="codeType === 'invitation' ? '请输入邀请码' : '请输入候补码'"
                    clearable
                >
                </el-input>
                <p class="m-tips">
                    {{ codeType === 'invitation' ? '提示：输入他人分享的邀请码加入预约' : '提示：输入候补码以接替空出的时段' }}
                </p>
            </div>

            <div class="m-footer-btns">
                <button class="m-btn m-btn-primary" @click="submitCodeReservation">
                    立即确认
                </button>
                <button class="m-btn" style="background: #f4f4f5; color: #909399;" @click="mobileCodeDialogVisible = false">
                    取消
                </button>
            </div>
        </div>
    </el-dialog>



    <button class="show-suggestion" @click.stop="showSuggestion">
        <svg t="1760281867198" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1557" 
            :width="isMobile ? '25' : '32'" :height="isMobile ? '25' : '32'"><path d="M535.808 661.504H477.9008l0.0512-11.52-19.0976-366.7968c0-26.0096 21.1968-47.2064 47.2064-47.2064h11.8272c26.0096 0 47.2064 21.1968 47.2064 47.2064v0.512l-19.0464 366.2336 0.1024 11.52-10.3424 0.0512z m-37.7856-20.48h28.0064l18.6368-358.0928a26.75712 26.75712 0 0 0-26.7264-26.4704h-11.8272c-14.6432 0-26.624 11.8784-26.7264 26.4704l18.6368 358.0928zM512 788.6848c-27.136 0-49.2032-22.0672-49.2032-49.2032s22.0672-49.2032 49.2032-49.2032 49.2032 22.0672 49.2032 49.2032c0 27.0848-22.0672 49.2032-49.2032 49.2032z m0-77.9776c-15.872 0-28.7232 12.9024-28.7232 28.7232s12.9024 28.7232 28.7232 28.7232 28.7232-12.9024 28.7232-28.7232-12.8512-28.7232-28.7232-28.7232z" p-id="1558" 
                :fill="isMobile ? 'red' : '#fff'"></path><path d="M512 879.2576c-202.3424 0-366.8992-164.608-366.8992-366.8992 0-202.3424 164.608-366.8992 366.8992-366.8992s366.8992 164.608 366.8992 366.8992-164.5568 366.8992-366.8992 366.8992z m0-713.3696c-191.0272 0-346.4192 155.392-346.4192 346.4192 0 191.0272 155.392 346.4192 346.4192 346.4192s346.4192-155.392 346.4192-346.4192c0-190.976-155.392-346.4192-346.4192-346.4192z" p-id="1559" 
                :fill="isMobile ? 'red' : '#fff'"></path>
        </svg>
        <span v-if="!isMobile">建议</span>
    </button>

    <transition name="fade">
        <div v-if="suggestionShow" class="suggestion-mask" @click="suggestionShow = false"></div>
    </transition>

    <transition name="pop">
        <div v-if="suggestionShow" class="suggestion">
            <p>预约建议</p>
            <ol>
                <li>单次预约时限不得低于 30 分钟，除特别要求的除外</li>
                <li>预约的开始时间应紧随前者的结束时间，若非如此，请保留至少半小时的间隔</li>
                <li>与后者的开始时间相连，或者也保留半小时的间隔</li>
            </ol>
            <div class="suggestion-footer">
                <button @click="suggestionShow = false">我知道了</button>
            </div>
        </div>
    </transition>



    <!-- 移动端预约邀请逻辑 -->
    <el-dialog
        v-model="mobileDrawerVisible"
        title="预约申请"
        :width="isMobile ? '85%' : '400px'"
        :align-center="true"
        :append-to-body="true"
        custom-class="mobile-center-dialog"
    >
        <div v-if="activeVenue" class="m-reservation-box">
            <div class="m-venue-card">
                <span class="m-venue-name">{{ activeVenue.venueName }}</span>
                <span class="m-venue-addr">{{ activeVenue.venueAddress }}</span>
            </div>

            <div class="m-body">
                <div class="m-row">
                    <label>预约日期</label>
                    <el-radio-group v-model="activeVenue.selectedDate" size="small" @change="changeCurrentVenueInfo(activeVenue.venueId, activeVenue.selectedDate, activeIndex)">
                        <el-radio-button :value="currentDate">今天</el-radio-button>
                        <el-radio-button :value="tomorrow">明天</el-radio-button>
                        <el-radio-button :value="postnatal">后天</el-radio-button>
                    </el-radio-group>
                </div>

                <div class="m-row">
                    <label>预约人数</label>
                    <div class="m-input-group">
                        <input type="number" min="1" v-model="activeVenue.bespeakNum" class="m-num-input">
                        <span class="unit">人</span>
                    </div>
                </div>

                <div class="m-row">
                    <label>开始时间</label>
                    <div class="m-time-inputs">
                        <input type="number" v-model="activeVenue.startTimeH" placeholder="07">
                        <span>时</span>
                        <input type="number" v-model="activeVenue.startTimeM" placeholder="00">
                        <span>分</span>
                    </div>
                </div>

                <div class="m-row">
                    <label>结束时间</label>
                    <div class="m-time-inputs">
                        <input type="number" v-model="activeVenue.endTimeH" placeholder="21">
                        <span>时</span>
                        <input type="number" v-model="activeVenue.endTimeM" placeholder="00">
                        <span>分</span>
                    </div>
                </div>
            </div>

            <div class="m-footer-btns">
                <button class="m-btn m-btn-primary" @click="handleMobileConfirm(activeIndex, activeVenue)">
                    {{ activeVenue.bespeakNum > 1 ? '预约并生成邀请码' : '立即确认预约' }}
                </button>
                <button class="m-btn m-btn-orange" @click="alternateReservation(activeIndex, activeVenue)">
                    候补预约
                </button>
            </div>
        </div>
    </el-dialog>


</template>

<style scoped>

.venue{
    height: 100%;
    display: grid;
    background-color: rgba(0, 0, 0, 0.7);
    /* background-image: url('../../assets/images/background-img/树林车站.png'); */
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    grid-template-columns: 1fr;
    justify-items: center;
    align-items: center;
    padding: 10px 15px 0px 15px;
    box-sizing: border-box;
}

.venue-search-container{
    height: 50px;
    width: 100%;
    /* background-color: aliceblue; */
    display: flex;
    justify-content: space-evenly;
    gap: 10px;
    align-items: center;
    /* padding-left: 10px; */
}
.filter-input{
    width: 50%;
}
.filter-input :deep(.el-input__wrapper) {
    background-color: rgb(248, 248, 248,0.2); /* 浅灰色背景 */
    border-radius: 20px;       /* 圆角胶囊形状 */
            /* 去掉默认阴影 */
    /* border: 1px solid #dcdfe6;  */
    box-shadow: inset 0px 0px 0px #cbced1,
              inset -0px -0px 0px #ffffff;
    transition: all 0.3s;
}
.filter-input :deep(.el-input__wrapper):hover {
    
    box-shadow: inset 2px 2px 2px #cbced1,
    inset -2px -2px 2px #ffffff;  
}
/* 修改光标 */
.filter-input :deep(.el-input__wrapper.is-focus) .el-input__inner {
    caret-color: #ffffff;
    color: #c6cddb;
    font-weight: 500;
}
.filter-input :deep(input::-webkit-search-cancel-button) {
    /* 1. 基本样式修改 */
    -webkit-appearance: none; /* 必须先取消原生外观，才能自定义 */
    height: 16px;
    width: 16px;
    
    /* 2. 使用背景图换掉它（例如换成一个蓝色的叉） */
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23409eff'%3e%3cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3e%3c/svg%3e");
    background-size: contain;
    background-repeat: no-repeat;
    
    cursor: pointer;
    margin-right: 5px;
    
    /* 3. 初始透明度设为 0，只有输入文字后才显示（模拟原生逻辑） */
    opacity: 0.6;
    transition: opacity 0.2s;
}

/* 悬浮时变亮 */
.filter-input :deep(input::-webkit-search-cancel-button:hover) {
    opacity: 1;
}


.relevant-data {
    /* 基础布局 */
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 16px;
    background: rgba(255, 255, 255,0.3);
    cursor: default;
    
    /* 边框与圆角 */
    border: 1px solid #e4e7ed;
    border-radius: 14px; /* 胶囊形状 */
    
    /* 字体样式 */
    font-size: 13px;
    color: #cacaca;
    
    /* 关键：交互过渡 */
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    position: relative;
    overflow: hidden;
}
/* 数字样式 */
.relevant-data span {
    color: rgb(64, 255, 77);
    font-weight: 600;
    letter-spacing: 3px;
    margin: 0 4px;
    transition: all 0.2s ease;
    display: inline-block; /* 必须是块级或行内块才能有位移变化 */
}
/* --- 交互动效开始 --- */
/* 1. 整体悬浮效果 */
.relevant-data:hover {
    background-color: #f0f7ff;
    border-color: #409eff;
    color: #606266;
    transform: translateY(-2px); /* 向上轻微浮动 */
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

/* 2. 悬浮时数字放大抖动 */
.relevant-data:hover span {
    transform: scale(1.2);
    color: #3a8ee6;
    text-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
}

/* 3. 简单的扫光动画（可选） */
.relevant-data::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.6),
        transparent
    );
    transition: none;
}
.relevant-data:hover::after {
    left: 100%;
    transition: all 0.6s ease;
}
/* 4. 点击时的反馈 */
.relevant-data:active {
    transform: translateY(0) scale(0.95);
    box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
}


.venue-content{
    /* 不设置宽度为百分百，会出现令人头疼的后代元素撑开祖先元素的情况 */
    /* width: 100%; */
    background-color: rgba(255, 255, 255,0.2);
    backdrop-filter: blur(5px);
    border-radius: 15px;
    box-shadow: 3px 2px 3px rgba(255, 255, 255, 0.3);
    overflow: auto;
    transition: box-shadow 0.9s ease;
    /* margin: 0 0 10px 0; */
}
.venue-content:hover{
    /* transform: translate(-5px,-5px); */
    box-shadow: 5px 4px 5px rgba(255, 255, 255, 0.5);
}
.venue-content>div{
    width: 100%;
    /* height: 100%; */
    /* display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 140px 140px; */
}

.content-top{
    width: 100%;
    height: 140px;
    display: grid;
    grid-template-columns: 300px 1fr;
}
.content-top>div{
    height: 100%;
    width: 100%;
}
.img{
    /* padding-left: 10px; */
    width: 100%;
    height: 100%;
    display: flex;
    /* flex-direction: column; */
    justify-content: center;
    align-items: center;
    overflow: hidden;
}
.img>img{
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    display: block;
}
.detail{
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: flex-start;
    position: relative;
    color: white;
}
.detail input{
    border-radius: 3px;
    width: 50px;
    outline: none;
    border: none;
    background-color: transparent;
    box-shadow: 0px 0px 2px white inset;
    color: rgb(41, 40, 40);
    padding-left: 7px;
    margin: 0 5px;
}
.detail select{
    border-radius: 3px;
    padding-left: 7px;
    background-color: transparent;
    box-shadow: 0px 0px 2px white inset;
}


.button{
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    gap: 10px;
    width: 100%;   
    flex-wrap: wrap;
}

.button button {
  --button_radius: 0.75em;
  --button_color: #e8e8e8;
  --button_outline_color: #464545;
  font-size: 10px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  border-radius: var(--button_radius);
  background: var(--button_outline_color);
}

.button_top {
  display: block;
  box-sizing: border-box;
  border: 2px solid var(--button_outline_color);
  border-radius: var(--button_radius);
  padding: 2px  10px;
  background: var(--button_color);
  color: var(--button_outline_color);
  transform: translateY(-0.2em);
  transition: transform 0.1s ease;
}

button:hover .button_top {
  transform: translateY(-0.33em);
}

button:active .button_top {
  transform: translateY(0);
}






.div-input ::placeholder{
    color: #eaeaea;
    opacity: 0.75;
}

.show-code{
    position: absolute;
    right: 40%;
    transform: translateX(80%);
    top: 0;
    height: 140px;
    width: 200px;
    background-color: rgba(0, 255, 255);
}


.content-bottom{
    width: 100%;
    height: 160px;
}

.info-title{
    height: 20px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 40px;
    color: #eaeaea;
}
.info-show{
    /* display: flex; */
    /* margin-top: 10px; */
    margin-bottom: 10px;
    box-sizing: border-box;
    padding: 15px 25px 0 25px;
    width: 100%;
    height: 90px;
    color: white;
    overflow-x: auto;
    position: relative;
}
.info-show>div{
    height: 50px;
    width: 90%;
    min-width: 600px;
    /* overflow: auto; */
    /* background-color: antiquewhite; */
    position: relative;
    border-left: 2px black solid;
    border-bottom: 2px black solid;
}
.info-show>div::before{
    content: '^';
    position: absolute;
    left: -6.8px;
    top: -5px;
    color: black;
    font-weight: 400;
}
.info-show>div::after{
    content: '>';
    position: absolute;
    color: black;
    right: -3.6px;
    bottom: -8.5px;
    font-weight: 400;
}
.info-show>div>div{
    box-sizing: border-box;
    position: absolute;
    bottom: 0px;
    height: 40px;
    width: 95%;
    display: grid;
    grid-template-columns: repeat(840,1fr);

}

/* 时段容器基底 */
.timeline-container {
    /* min-width: 600px; */
    box-sizing: border-box;
    position: relative;
    bottom: 0px;
    height: 40px;
    width: 95%;
    /* border-radius: 4px; */
    /* 默认背景色：空闲状态的颜色 */
    background-color: rgba(173, 255, 47, 0.75);
    /* 防止圆角处漏色 */
    /* overflow: hidden;  */
}

/* 预约块样式 */
.slot-block {
    position: absolute;
    top: 0;
    height: 100%;
    /* 预约状态的颜色 */
    background-color: rgba(0, 255, 255, 0.75);
    /* 消除可能存在的亚像素空隙 */
    box-shadow: 0 0 0.5px rgba(0, 255, 255, 0.75);
    z-index: 1;
}


.is-reservation{
    background-color: rgba(0, 255, 255,0.75);
}
.y{ 
    top:-10px;
    left: -20px;
    position: absolute;
    font-size: 10px;
    
}
.x{
    position: absolute;
    font-size: 10px;
    bottom: -7px;
    right: -28px;
}
/* 时间标注文本样式 */
.time-label{
    z-index: 2;/* 确保标签和刻度在最上层 */
    height: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: absolute;
    font-size: 9.2px;
    /* 调整字体间距 */
    letter-spacing: -0.5px;
    line-height: 0.9;
    /* 与left配合实现预约时段中居中 */
    transform: translateX(-50%);
    color: black;
}
/* 刻度线 */
.scale-mark{
    z-index: 3;
    pointer-events: none;
    position: absolute;
    /* width: 40px; */
    height: 5px;
    box-sizing: border-box;
    /* background-color: red; */
    bottom: 0;
    border-left: 1px rgb(0, 0, 0) solid;
}
/* 刻度线文本 */
.scale-mark>span{
    /* padding-right: 10px; */
    width: 40px;
    text-align: start;
    bottom: -15px;
    color: rgb(255, 255, 255);
    font-size: 11px;
    position: absolute;
    left: -15px;
    letter-spacing: -0.5px;
}
.number-of-candidates{
    position: absolute;
    top: -20px;
    font-size: 10px;
    /* #08c76e */
    background-color: #c75353;
    width: 18px;
    height: 18px;
    line-height: 18px;
    color: #fff;
    text-align: center;
    border-radius: 2px;
}

.info-bottom{
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    color: rgb(121, 121, 121);
}
.info-bottom>div{
    font-size: 12px;
    margin: 0 30px;
    text-align: center;
    height: 20px;
    width: 75px;
    border-radius: 5px;
}


div:has(>.use-code){
    box-sizing: border-box;
    padding-right: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: flex-end;
    height: 100%;
    width: 100%;
}
.use-code{
    width: 120px;
    padding: 5px 10px; /* 略微增加高度，比例更协调 */
    border-radius: 7px;
    border: 1px solid rgba(255, 255, 255, 0.3); /* 半透明边框增加精致感 */
    
    /* 背景使用微渐变 */
    background: linear-gradient(135deg, #9bb0d9 0%, #8ca1ca 100%);
    color: white;
    
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 1px; /* 响应你之前的间距需求 */
    cursor: pointer;
    
    /* 阴影与过渡 */
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    
    /* 防止移动端点击出现蓝色高亮框 */
    -webkit-tap-highlight-color: transparent;
    outline: none;
}
/* 悬浮效果 (PC端) */
@media (hover: hover) {
    .use-code:hover {
        transform: translateY(-2px); /* 向上微浮 */
        box-shadow: 0 6px 20px rgba(106, 130, 251, 0.4);
        filter: brightness(1.1); /* 整体增亮 */
    }
}
/* 点击反馈 (移动端 & PC共用) */
.use-code:active {
    transform: translateY(1px) scale(0.96); /* 按下的物理感 */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    filter: brightness(0.9);
}

/* .venue-page-nav{
    grid-column: 1 / -1;
    grid-row: 3;
} */
.show-suggestion{
    position: fixed;
    top: 10.5%;
    right: 2%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    color: #fff;
    border: none;
    outline: none;
    background-color: rgba(247, 241, 241,0.2);
    /* box-shadow: 2px 2px 10px rgba(255, 255, 255,0.8); */
    backdrop-filter: blur(7px);
    border-radius: 5px;
    font-size: 12px;
    transition: background-color 0.2s ease,transform 0.2s ease,box-shadow 0.2s ease;

}
.show-suggestion:hover{
    cursor: pointer;
    box-shadow: 4px 4px 20px rgba(255, 255, 255,1);
}
.show-suggestion:active{
    transform: scale(0.9) translateY(0); /* 点击时缩小，有按下去的感觉 */
    background-color: rgba(64, 158, 255, 0.8);
    transition: transform 0.1s; /* 缩短回馈时间 */
}

/* --- 遮罩层 --- */
.suggestion-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
    z-index: 1999;
}
/* --- 提示框升级 --- */
.suggestion {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 85%; /* 移动端自适应 */
    max-width: 380px;
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    z-index: 2000;
    border: none;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}
/* 标题优化 */
.suggestion > p {
    color: #409eff;
    font-size: 18px;
    letter-spacing: 1px; /* 增加字间距 */
    margin-bottom: 16px;
}
/* 列表文字优化 */
.suggestion li {
    line-height: 1.8; /* 增加行高，方便移动端阅读 */
    margin-bottom: 10px;
    letter-spacing: 0.5px;
    color: #5e6d82;
}
/* 底部按钮：增加反馈感 */
.suggestion-footer {
    text-align: right;
    margin-top: 20px;
}
.suggestion-footer button {
    background: #409eff;
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 20px;
    font-size: 14px;
    transition: all 0.3s;
}
.suggestion-footer button:active {
    transform: scale(0.9);
    background: #337ecc;
}
/* --- 动画效果 --- */
/* 遮罩淡入淡出 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 弹窗缩放效果 (Pop) */
.pop-enter-active {
    animation: pop-in 0.4s cubic-bezier(0.26, 1.36, 0.74, 1);
}
.pop-leave-active {
    animation: pop-in 0.3s reverse ease-in;
}
@keyframes pop-in {
    0% { opacity: 0; transform: translate(-50%, -40%) scale(0.8); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}









/* 移动端弹窗整体样式覆盖 */
:deep(.mobile-center-dialog) {
    border-radius: 12px !important;
    padding: 5px;
}

.m-reservation-box {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* 顶部场地卡片 */
.m-venue-card {
    background: #f5f7fa;
    padding: 12px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
}
.m-venue-name {
    font-weight: bold;
    color: #303133;
    font-size: 16px;
}
.m-venue-addr {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
}

/* 行布局 */
.m-row {
    margin-bottom: 12px;
}
.m-row label {
    display: block;
    font-size: 13px;
    color: #606266;
    margin-bottom: 6px;
    font-weight: 500;
}

/* 仿 PC 端的输入框样式优化 */
.m-time-inputs, .m-input-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.m-time-inputs input, .m-num-input {
    width: 60px;
    height: 32px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    text-align: center;
    outline: none;
    font-size: 14px;
}

.m-time-inputs input:focus, .m-num-input:focus {
    border-color: #409eff;
}

/* 按钮样式 */
.m-footer-btns {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
}

.m-btn {
    width: 100%;
    height: 40px;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    transition: opacity 0.2s;
}

.m-btn:active {
    opacity: 0.8;
}

.m-btn-primary {
    background-color: #409eff;
    color: white;
}

.m-btn-orange {
    background-color: #e6a23c;
    color: white;
}

.unit {
    font-size: 14px;
    color: #606266;
}












@media (max-width:768px){
    .venue-search-container{
        justify-content: flex-start;
        flex-direction: row-reverse;
    }

    .venue-content{
        width: 100%;
    }

    .filter-input{
        width: 260px;
    }
    .relevant-data{
        font-size: 12px;
        padding: 0 7px;
    }

    .content-top{
        column-gap: 15px;
        grid-template-columns: 200px 1fr;
        column-gap: 20px;
    }
    .img{
        padding-left: 10px;
    }
    .info-title{
        flex-direction: column;
        justify-content: space-evenly;
        color: #fff;
        gap: 0px;
    }
    .bespoke-button{
        width: 60px;
    }
    .info-show{
        padding-bottom: 10px;
    }




    .show-suggestion{
        width: 25px;
        height: 25px;
        top: 8%;
    }
}
</style>