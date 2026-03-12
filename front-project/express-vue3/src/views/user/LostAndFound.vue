<script setup>
import { ref,reactive, computed, onMounted, watch } from 'vue';
import {v4 as uuidv4} from 'uuid';
import Overlay from '@/components/Overlay.vue';
import axiosInstance from '@/api/axios';
import { apiConfig } from '@/config/apiConfig';
import useRouterStore from '@/stores/useRouterStore';
import { IconSearch } from '@/config/adminIcons';
defineOptions({
    name:'LostAndFound',
})
import useAppStore from '@/stores/useAppStore';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';

let searchTimer = null;
const appStore = useAppStore();
const {isMobile} = storeToRefs(appStore);
const {state} = useRouterStore();
const date = new Date();
const isOverlayShow = ref(false);
// const infoPage = ref(8);//页数
const infoContent = 6;//每页最大显示数
const currentPage = ref(1);//当前页，默认为1
const filterWords = ref('');//搜索关键词
const filterType = ref('0');//过滤类型
const targetPageNum = ref(1);//目标页数
const backendPage = ref(1); // 记录后端请求到第几页了
const hasMoreData = ref(true); // 是否还能继续从服务器加载

const describe = ref('');
const picture = ref('');
const contactWay = ref('');
const losePlace = ref('');
const propertyName = ref('');

const currentFile = ref(null);//用户当前选择的图片文件
const uploadAreaShow = ref(false);
const previewUrl = ref(''); //用于存储图片预览地址
// const lostAndFoundInfo = reactive([
//   {
//     id:uuidv4(),
//     picture:'',//该变量用于存储用户上传的遗失物图片
//     losePlace:'南区操场',//物品遗失地
//     contactWay:'181XXXX1234',//联系方式
//     issuer:'FGJ',//发布人
//     describe:'遗失物品信息描述',//描述
//     time:'2025-10-05-12:34:21',
//   },
//   {
//     id:uuidv4(),
//     losePlace:'南区操场',
//     contactWay:'12',
//     issuer:'qwew',
//     describe:'遗失物品信息描述',
//     time:'2025-10-05-12:34:21',
//   },
//   {
//     id:uuidv4(),
//     losePlace:'南区操场',
//     contactWay:'3211',
//     issuer:'QWEQW',
//     describe:'遗失物品信息描述',
//     time:'2025-10-05-12:34:21',
//   },
//   {
//     id:uuidv4(),
//     losePlace:'南区操场',
//     contactWay:'12312',
//     issuer:'ADMIN',
//     describe:'遗失物品信息描述',
//     time:'2025-10-05-12:34:21',
//   },
//   {
//     id:uuidv4(),
//     losePlace:'南区操场',
//     contactWay:'2412',
//     issuer:'sdcdscd',
//     describe:'遗失物品信息描述',
//     time:'2025-10-05-12:34:21',
//   },
//   {
//     id:uuidv4(),
//     losePlace:'南区操场',
//     contactWay:'12312',
//     issuer:'asdas',
//     describe:'遗失物品信息描述',
//     time:'2025-10-05-12:34:21',
//   },
//   {
//     id:uuidv4(),
//     losePlace:'南区操场',
//     contactWay:'13123',
//     issuer:'tom',
//     describe:'遗失物品信息描述',
//     time:'2025-10-05-12:34:21',
//   },
//   {
//     id:uuidv4(),
//     losePlace:'南区操场',
//     contactWay:'13123',
//     issuer:'tom',
//     describe:'遗失物品信息描述',
//     time:'2025-10-05-12:34:21',
//   },
//   {
//     id:uuidv4(),
//     losePlace:'南区操场',
//     contactWay:'13123',
//     issuer:'tom',
//     describe:'遗失物品信息描述',
//     time:'2025-10-05-12:34:21',
//   },
//   {
//     id:uuidv4(),
//     losePlace:'南区操场',
//     contactWay:'13123',
//     issuer:'tom',
//     describe:'遗失物品信息描述',
//     time:'2025-10-05-12:34:21',
//   },
//   {
//     id:uuidv4(),
//     losePlace:'南区操场',
//     contactWay:'13123',
//     issuer:'tom',
//     describe:'遗失物品信息描述',
//     time:'2025-10-05-12:34:21',
//   },
//   {
//     id:uuidv4(),
//     losePlace:'南区操场',
//     contactWay:'13123',
//     issuer:'tom',
//     describe:'遗失物品信息描述',
//     time:'2025-10-05-12:34:21',
//   },
//   {
//     id:uuidv4(),
//     losePlace:'南区操场',
//     contactWay:'13123',
//     issuer:'tom',
//     describe:'遗失物品信息描述',
//     time:'2025-10-05-12:34:21',
//   },
// ]);
// 总页数
const lostAndFoundInfo = reactive([]);
const totalPages = computed(()=>{
  return Math.ceil(lostAndFoundInfo.length / infoContent);
});
// 获取失物招领信息
const getLostAndFoundInfo = async(isRefresh = false)=>{
  // const {data} = await axiosInstance.get(apiConfig.getLostData);
  // console.log('@lostAndFound.vue',data);
  // lostAndFoundInfo.splice(0,lostAndFoundInfo.length,...data);
  
  // 如果是由于搜索/筛选触发的请求，需要重置所有状态
  if (isRefresh) {
    backendPage.value = 1;      // 后端页码归一
    hasMoreData.value = true;   // 恢复加载许可
    lostAndFoundInfo.length = 0; // 清空本地旧数组
    currentPage.value = 1;      // 前端显示回到第一页
  }
  
  if (!hasMoreData.value) return;

  try {
    const res = await axiosInstance.get(apiConfig.getLostData, {
      params: { 
        page: backendPage.value,
        // 新增发送给后端的参数
        keyword: filterWords.value, 
        type: filterType.value      
      }
    });

    if (res.code === 200) {
      const newData = res.data;
      
      
      // 将新获取的24条数据追加到现有数组中
      lostAndFoundInfo.push(...newData);
      
      // 更新分页状态
      hasMoreData.value = res.hasMore;
      if (hasMoreData.value) {
        backendPage.value++;
      }
    }
  } catch (error) {
    console.error('获取数据失败', error);
  }
};

// 返回当前页码所需的数据数组
const pagesInfoList = computed(()=>{
  const startIndex = (currentPage.value - 1) * 6;
  const endIndex = startIndex + 6;
  return lostAndFoundInfo.slice(startIndex,endIndex);
});

// 返回导航
const pagesIconShow = computed(()=>{
  if(totalPages.value > 8){
    return [1,2,3,4,'ellipsis',totalPages.value-1,totalPages.value];
  }else{
    return totalPages.value;
  }
});

// const getCurrentPage = (value)=>{
//   currentPage.value = value;
// }
// 当用户点击分页导航，且发现当前本地数据不够显示下一页时，触发请求
const getCurrentPage = async (value) => {
  currentPage.value = value;
  
  // 计算当前页需要的最大索引
  const neededIndex = value * infoContent;
  
  // 如果本地数据量不足以支撑目标页展示，且服务器还有数据，则递归请求
  if (lostAndFoundInfo.length < neededIndex && hasMoreData.value) {
    await getLostAndFoundInfo();
  }
};

const changePage = (num)=>{
  const newPage = currentPage.value + num;
  if(newPage >= 1 && newPage <= totalPages.value){
    currentPage.value = newPage;
  }
}
// 重置相关信息
const resetInfo = ()=>{
  describe.value = '';
  contactWay.value = '';
  losePlace.value = '';
  currentFile.value = null;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value); // 释放内存
  previewUrl.value = '';
};
const addLostInfo = async()=>{
  try{
    // 确保发布的启事是正确的
    if(!describe.value.trim() || !contactWay.value.trim() || !losePlace.value.trim() || !currentFile.value){
      console.log('请完善相关信息！',!describe.value.trim());
      return;
    }
    // 此处需要重构：为了将失物文本与图片等信息在一次请求中就发送到后端（完成状态：未完成）
    const formData = new FormData();
    // 添加文本字段
    // formData.append('id',state.userInfo.id);
    formData.append('pubdate',formatDate(date));
    formData.append('contactWay',contactWay.value);
    formData.append('describe',describe.value);
    formData.append('losePlace',losePlace.value);
    formData.append('propertyName',propertyName.value);
    // formData.append('type','lostAndFound');//指定存储位置
    // 添加文件字段
    formData.append('picture',currentFile.value);

    // console.log('发布成功！@',formData,state.userInfo.id);

    const {data, msg, code} = await axiosInstance.post(apiConfig.insertLostData,formData);
    if(code === 200){
      ElMessage.success(msg || '发布成功！');
      isOverlayShow.value = false;
      console.log('发布成功！',data);//后续使用自定义弹窗组件实现。
      // console.log('@@@lostAndFound：',resultTest);//测试用
      resetInfo();  // 添加成功后置空相关信息

      getLostAndFoundInfo();//发布成功后执行该方法获取失物信息
    }
  }catch(error){
    // console.error('插入失败！',error);
  }
};

const cancelPublish = ()=>{
  isOverlayShow.value = false;
}

// 时间格式化函数（后续需要封装成工具函数，使用次数大于2）（也不是必须的，因为数据库中会自动创建时间）
const formatDate = (date)=>{
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = date.getHours();
    const minute = date.getMinutes();
    return `${y}-${m.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}-${h.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`;
}; 

const onFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    currentFile.value = file;
    // 创建一个本地临时预览地址
    previewUrl.value = URL.createObjectURL(file);
  }
};


// 监听搜索词和下拉框变化
watch([filterWords, filterType], ([newWords, newType], [oldWords, oldType]) => {
  // 如果是下拉框变化，立即触发（体验更好）
  if (newType !== oldType) {
    getLostAndFoundInfo(true);
    return;
  }

  // 如果是文字输入，需等待
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    getLostAndFoundInfo(true);
  }, 500);
});


onMounted(()=>{

  getLostAndFoundInfo();

  // console.log('@@@lostAndFound：');//测试用
});

</script>

<template>
    <!-- <h1>失物招领</h1> -->
    <div class="lost-found-container">
      
      <div class="filter-container">
        <el-input 
          type="search"
          placeholder="搜索名称或地点..."
          :clearable="false"
          v-model="filterWords"
          size="default"
          class="filter-input"
        >
          <template #prefix>
            <el-icon><IconSearch /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="filterType"
          placeholder="查看方式"
          class="filter-select"
        >
          <el-option label="已归还" value="1" />
          <el-option label="未归还" value="0" />
        </el-select>
      </div>



      
      <div class="info-show">
        <div 
          v-for="item in pagesInfoList" 
          :key="item.property_id" 
          class="info-content"
        >
          <div class="img-info">
            <img 
              :src="item.property_image" 
              alt="物品图片"
            >

            <div class="text-area">
              <p class="issuer">发布人：<span>{{ item.username }}</span></p>
              <p class="time">发布时间：{{ item.pubdate }}</p>
              <p class="place">遗失地：{{ item.losePlace }}</p>
              <p class="contact">联系方式：<span>{{ item.contact_way }}</span></p>
            </div>
          </div>

          <div class="describe">
            <p><span class="label">详情描述: </span> {{ item.property_describe }}</p>
          </div>
        </div>
      </div>





      <!-- 导航区 -->
      <div class="lost-found-nav">
        <div class="nav-left">
          <button type="button" class="publish-btn" @click="isOverlayShow = true">
            <span class="plus">+</span> 发布启事
          </button>
        </div>

        <div class="nav-right">
          <div class="page-arrow" :class="{ disabled: currentPage === 1 }" @click="changePage(-1)">
            <svg viewBox="0 0 1024 1024" width="20" height="120"><path d="M671.2 160.5l-339 339c-6.2 6.2-6.2 16.4 0 22.6l339 339c6.2 6.2 16.4 6.2 22.6 0s6.2-16.4 0-22.6L367.3 511l326.5-327.9c6.2-6.2 6.2-16.4 0-22.6s-16.4-6.2-22.6 0z" fill="currentColor"/></svg>
          </div>

          <div class="page-numbers">
            <div 
              v-for="num in pagesIconShow" 
              :key="num" 
              class="page-item"
              :class="{ active: currentPage === num, ellipsis: num === 'ellipsis' }"
              @click="num !== 'ellipsis' && getCurrentPage(num)"
            >
              <span v-if="num === 'ellipsis'">...</span>
              <span v-else>{{ num }}</span>
            </div>
          </div>

          <div class="page-arrow" :class="{ disabled: currentPage === totalPages }" @click="changePage(1)">
            <svg viewBox="0 0 1024 1024" width="20" height="20"><path d="M352.8 160.5l339 339c6.2 6.2 6.2 16.4 0 22.6l-339 339c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6L656.7 511 330.2 183.1c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0z" fill="currentColor"/></svg>
          </div>

          <div class="skip-section">
            <span class="skip-label">前往</span>
            <input type="number" v-model.number="targetPageNum" class="skip-input" />
            <button class="skip-confirm" @click="getCurrentPage(targetPageNum)">GO</button>
          </div>
        </div>
      </div>

    </div>




    <Overlay v-if="isOverlayShow" :isShow="isOverlayShow">
      <div class="publish-card">
        <div class="card-header">
          <h2>发布寻物/招领启事</h2>
          <div class="close-icon" @click="cancelPublish">
            <svg viewBox="0 0 1024 1024" width="24" height="24">
              <path d="M512 456.64L801.376 167.264a39.136 39.136 0 1 1 55.36 55.36L567.36 512l289.376 289.376a39.136 39.136 0 1 1-55.36 55.36L512 567.36 222.624 856.736a39.136 39.136 0 1 1-55.36-55.36L456.64 512 167.264 222.624a39.136 39.136 0 1 1 55.36-55.36L512 456.64z" fill="#666"/>
            </svg>
          </div>
        </div>

        <div class="card-body">
          <div class="form-group">
            <label>联系方式</label>
            <input type="text" placeholder="手机号、微信号等" v-model="contactWay">
          </div>
          
          <div class="form-group">
            <label>遗失地点</label>
            <input type="text" placeholder="例如：南区操场、2号教学楼" v-model="losePlace">
          </div>

          <div class="form-group">
            <label>遗失物品名称</label>
            <input type="text" placeholder="例如：小米17、羽毛球拍" v-model="propertyName">
          </div>

          <div class="form-group">
            <label>详情描述</label>
            <textarea placeholder="请简要描述物品特征（颜色、型号等）" v-model="describe"></textarea>
          </div>

          <div class="upload-section">
            <label>物品图片</label>
            <div class="upload-box" :class="{ 'has-file': currentFile }" @click="$refs.fileInput.click()">
              <input type="file" ref="fileInput" hidden @change="onFileChange" accept="image/*">
              
              <div v-if="!currentFile" class="upload-placeholder">
                <span class="upload-icon">+</span>
                <p>点击选择图片</p>
              </div>
              
              <div v-else class="upload-preview">
                <img :src="previewUrl" alt="预览">
                <div class="change-hint">点击更换图片</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <button class="btn-cancel" @click="cancelPublish">取消</button>
          <button class="btn-confirm" @click="addLostInfo">确认发布</button>
        </div>
      </div>
    </Overlay>
</template>

<style scoped>

.lost-found-container{
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* background-color: lightcyan; */
  height: 100%;
  width: 100%;
  background-image: url('../../assets/images/background-img/PC可爱小白-小白-温馨.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  overflow-y: auto;
}
.filter-container{
  box-sizing: border-box;
    height: 50px;
    width: 100%;
    /* background-color: aqua; */
    backdrop-filter: blur(10px) saturate(180%);
    background-color: rgba(255, 255, 255, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 10px 0px 20px 5px rgba(255, 255, 255, 0.3);;
    display: flex;
    gap: 20px;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    padding-right: 20px;
}
.filter-input{
  width: 210px;
}
.filter-select{
  width: 100px;
}







.info-show{
  display: grid;
  grid-template-columns: repeat(auto-fill,minmax(400px,1fr));
  overflow-y: auto;
  align-items: center;
  justify-items: center;
  height: 85%;
  row-gap: 20px;
}
/* --- 卡片本体：增强质感 --- */
.info-content {
  width: 360px;
  min-height: 180px;
  /* 磨砂玻璃效果，适应你的温馨背景图 */
  background-color: rgba(255, 255, 255, 0.4); 
  backdrop-filter: blur(8px);
  /* 细微的阴影让卡片浮现出来 */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  padding: 12px;
  box-sizing: border-box; /* 确保 padding 不撑大卡片 */
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  transition: transform 0.2s ease;
}

/* 鼠标悬停时的微小互动 */
.info-content:hover {
  background-color: rgba(255, 255, 255, 0.55);
  border-color: #008c8c;
}

/* --- 上部区域：左图右文 --- */
.img-info {
  display: flex;
  height: 110px; /* 稍微压缩高度，给底部留空间 */
  gap: 12px;
}

.img-info img {
  width: 110px;
  height: 110px;
  object-fit: cover;
  border-radius: 8px; /* 给图片圆角 */
  flex-shrink: 0;
}

/* --- 上部文字区域：开启垂直滚动 --- */
.text-area {
  display: flex;
  flex-direction: column;
  gap: 4px; /* 使用 gap 代替 space-between，让内容紧凑 */
  flex: 1;
  overflow-y: auto; /* 核心：开启垂直滚动条 */
  padding-right: 4px; /* 给滚动条留点空间 */
  max-height: 110px;
}

/* 修改现有的滚动条代码 */
.text-area::-webkit-scrollbar,
.describe::-webkit-scrollbar {
  width: 4px; /* 极细，不占位 */
}

.text-area::-webkit-scrollbar-thumb,
.describe::-webkit-scrollbar-thumb {
  background: rgba(0, 140, 140, 0.15); /* 使用你主题的青色，降低透明度 */
  border-radius: 10px;
}

.text-area::-webkit-scrollbar-track,
.describe::-webkit-scrollbar-track {
  background: transparent; /* 背景透明 */
}

.text-area p {
  margin: 0;
  font-size: 12px;
  color: #555;
  white-space: normal; /* 允许换行 */
  word-break: break-all; /* 强制长字符换行 */
  overflow: visible; /* 取消隐藏 */
  text-overflow: clip; /* 取消省略号 */
}

/* --- 下部描述区域：开启垂直滚动 --- */
.describe {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
  height: 50px; /* 给描述区域一个固定高度，防止无限撑大 */
  overflow-y: auto; /* 核心：开启垂直滚动条 */
}

.describe p {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.5;
  /* 取消原有的多行省略逻辑 */
  display: block; 
  -webkit-line-clamp: unset; 
  line-clamp: unset;
  overflow: visible;
  text-align: justify;
}

/* 描述区域滚动条样式 */
.describe::-webkit-scrollbar {
  width: 4px;
}
.describe::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.describe .label {
  font-weight: bold;
  color: #008c8c;
  margin-right: 4px;
}







.lost-found-nav {
  height: 50px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  
  /* 核心滑动属性 */
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap; 
  gap: 20px;
  
  /* 性能优化：平滑滚动 */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* 提升 iOS 滑动流畅度 */
  scrollbar-width: none; 
}
.lost-found-nav::-webkit-scrollbar {
  display: none;
}
.nav-left {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
/* --- 左侧：发布按钮 --- */
.publish-btn {
  height: 32px; /* 略小于父容器 50px */
  padding: 0 15px;
  flex-shrink: 0; /* 绝对不能被压缩 */
  background: linear-gradient(135deg, #008c8c, #00b3b3);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
}
.publish-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 140, 140, 0.4);
  filter: brightness(1.1);
}

.publish-btn .plus {
  font-size: 18px;
}

/* --- 右侧：分页控制 --- */
.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0; /* 关键：禁止右侧内容被压缩，确保能触发滑动 */
}

.page-numbers {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.page-item {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
  border: 1px solid rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.page-item:hover:not(.ellipsis) {
  background: #008c8c;
  color: white;
}

.page-item.active {
  background: #008c8c;
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 10px rgba(0, 140, 140, 0.2);
}

.page-item.ellipsis {
  cursor: default;
  background: transparent;
  border: none;
}

.page-arrow {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #002f2f;
  transition: opacity 0.3s;
}

.page-arrow.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* --- 跳转部分 --- */
.skip-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 10px;
  padding-left: 15px;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
}

.skip-label {
  font-size: 13px;
  color: #666;
}

.skip-input {
  width: 45px;
  height: 30px;
  text-align: center;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
  outline: none;
}

/* 隐藏 number 输入框的箭头 */
.skip-input::-webkit-inner-spin-button {
  display: none;
}

.skip-confirm {
  background: #333;
  color: white;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}




/* --- 发布卡片容器 --- */
.publish-card {
  width: 90%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.4);
  z-index: 1000;
}

/* --- 头部 --- */
.card-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header h2 {
  font-size: 1.2rem;
  color: #333;
  margin: 0;
}

.close-icon {
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
}
.close-icon:hover {
  transform: rotate(90deg);
}

/* --- 表单主体 --- */
.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label, .upload-section label {
  font-size: 0.85rem;
  font-weight: bold;
  color: #666;
  padding-left: 4px;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.5);
  outline: none;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.form-group input:focus, .form-group textarea:focus {
  border-color: #008c8c;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(0, 140, 140, 0.1);
}

.form-group textarea {
  height: 80px;
  resize: none;
}

/* --- 图片上传区域 --- */
.upload-box {
  width: 100%;
  height: 140px;
  border: 2px dashed rgba(0, 140, 140, 0.3);
  border-radius: 12px;
  margin-top: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.3s;
  position: relative;
  background: rgba(0, 140, 140, 0.02);
}

.upload-box:hover {
  border-color: #008c8c;
  background: rgba(0, 140, 140, 0.05);
}

.upload-placeholder {
  text-align: center;
  color: #999;
}

.upload-icon {
  font-size: 24px;
  display: block;
}

.upload-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.upload-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.change-hint {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 11px;
  text-align: center;
  padding: 4px 0;
}

/* --- 底部按钮 --- */
.card-footer {
  padding: 15px 20px 20px;
  display: flex;
  gap: 12px;
}

.card-footer button {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #f0f0f0;
  color: #666;
}
.btn-cancel:hover {
  background: #e5e5e5;
}

.btn-confirm {
  background: linear-gradient(135deg, #008c8c, #00b3b3);
  color: white;
}
.btn-confirm:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 140, 140, 0.3);
}


@media (max-width:768px){

  .lost-found-container{
    background: url('../../assets/images/background-img/Mobile可爱小白-小白-温馨.png');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
  }

  .filter-container{
    justify-content: flex-start;
    padding-right: 0;
    padding-left: 20px;
  }

  .lost-found-nav {
    justify-content: flex-start;
    padding: 0 15px;
    /* 移动端可以增加一点滚动阴影提示用户可以滑动 */
    background: linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4));
  }
  .publish-btn {
    padding: 0 10px;
    font-size: 13px;
  }
  .skip-section {
    padding-right: 15px; /* 增加末尾间距，防止滑动到底部太挤 */
  }


  .publish-card {
    width: 95%;
    border-radius: 15px;
  }
  .upload-box {
    height: 110px;
  }
  
}
</style>
