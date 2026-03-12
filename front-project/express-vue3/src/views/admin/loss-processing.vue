<script setup>
/* 
  1、查看所有物品信息
  2、可以选择性查看已找回以及未找回的物品（包括按时间以及搜索）
  3、可以删除（现阶段建议软删除：数据库层面保留，仅仅是不呈现而已）
*/
import { ref,reactive,computed,onUnmounted, onMounted,watch } from 'vue';
import { IconDelete, IconSearch } from '@/config/adminIcons';
import axiosInstance from '@/api/axios';
import { apiConfig } from '@/config/apiConfig';
import { ElMessage, ElMessageBox } from 'element-plus';

// 1. 模拟原始数据（实际应从 API 获取）
// const allItems = ref([
//   { id: 1, issuer: '小明', resName: '蓝色遮阳伞', resInfo: '蓝色遮阳伞', date: '2026-02-10', lostLocation: '食堂', status: 0, isDeleted: false },
//   { id: 2, issuer: '小明', resName: '学生证 - 王小明', resInfo:'学生证 - 王小明', date: '2026-02-12', lostLocation: '图书馆', status: 1, isDeleted: false },
//   { id: 3, issuer: '小王', resName: 'iPhone 15 Pro', resInfo: 'iPhone 15 Pro', date: '2026-02-14', lostLocation: '操场', status: 0, isDeleted: false },
//   { id: 4, issuer: '小李', resName: '银色钥匙扣', resInfo: '银色钥匙扣', date: '2026-02-15', lostLocation: '教学楼A栋', status: 0, isDeleted: false },
//   { id: 5, issuer: '小明', resName: '蓝色遮阳伞', resInfo: '蓝色遮阳伞', date: '2026-02-10', lostLocation: '食堂', status: 0, isDeleted: false },
//   { id: 6, issuer: '小明', resName: '学生证 - 王小明', resInfo:'学生证 - 王小明', date: '2026-02-12', lostLocation: '图书馆', status: 1, isDeleted: false },
//   { id: 7, issuer: '小王', resName: 'iPhone 15 Pro', resInfo: 'iPhone 15 Pro', date: '2026-02-14', lostLocation: '操场', status: 0, isDeleted: false },
//   { id: 8, issuer: '小李', resName: '银色钥匙扣', resInfo: '银色钥匙扣', date: '2026-02-15', lostLocation: '教学楼A栋', status: 0, isDeleted: false },
//   { id: 9, issuer: '小明', resName: '蓝色遮阳伞', resInfo: '蓝色遮阳伞', date: '2026-02-10', lostLocation: '食堂', status: 0, isDeleted: false },
//   { id: 10, issuer: '小明', resName: '学生证 - 王小明', resInfo:'学生证 - 王小明', date: '2026-02-12', lostLocation: '图书馆', status: 1, isDeleted: false },
//   { id: 11, issuer: '小王', resName: 'iPhone 15 Pro', resInfo: 'iPhone 15 Pro', date: '2026-02-14', lostLocation: '操场', status: 0, isDeleted: false },
//   { id: 12, issuer: '小李', resName: '银色钥匙扣', resInfo: '银色钥匙扣', date: '2026-02-15', lostLocation: '教学楼A栋', status: 0, isDeleted: false },
//   { id: 13, issuer: '小明', resName: '蓝色遮阳伞', resInfo: '蓝色遮阳伞', date: '2026-02-10', lostLocation: '食堂', status: 0, isDeleted: false },
//   { id: 14, issuer: '小明', resName: '学生证 - 王小明', resInfo:'学生证 - 王小明', date: '2026-02-12', lostLocation: '图书馆', status: 1, isDeleted: false },
//   { id: 15, issuer: '小王', resName: 'iPhone 15 Pro', resInfo: 'iPhone 15 Pro', date: '2026-02-14', lostLocation: '操场', status: 0, isDeleted: false },
//   { id: 16, issuer: '小李', resName: '银色钥匙扣', resInfo: '银色钥匙扣', date: '2026-02-15', lostLocation: '教学楼A栋', status: 0, isDeleted: false },
// ]);
const allItems = ref([]);

const loading = ref(false);
const hasMoreData = ref(true);
const isMobile = ref(false);
// 检查是否为移动端
const checkMobile = ()=>{
  isMobile.value = window.innerWidth <= 768;
}
const searchQuery = ref('');//筛选条件
const statusFilter = ref('all');//定义呈现数据的状态，all表示全部显示，0表示显示未找到，1表示显示已找到
const totalNum = ref(0);//存放总数据个数
// 定义总页数
const totalPages = computed(()=>{
  return Math.ceil(totalNum.value / pageSize.value);
});
// 定义分页状态
const currentPage = ref(1);
// const count = ref(21);//定义每次请求的数据条数
const pageSize = ref(7);//每页大小
const batchSize = ref(21);// 每次向后端请求的“一捆”数据量
// 判断是否是所有数据的最后一页
const isAtLastPage = computed(() => {
  return currentPage.value === totalPages.value;
});
// 当前数据的索引（用于像后端请求数据用）
// const currentOffset = computed(()=>{
//   return (currentPage.value - 1) * pageSize.value ;
// });



// // 过滤后的数据
// const filteredItems = computed(()=>{
//   return allItems.value.filter((item,index)=>{
//     // 排除掉已删除的（后续与后端对接时可以在后端直接过滤掉）
//     if(item.isDeleted === true) return false;
//     // 根据呈现状态筛选数据
//     const matchStatus = statusFilter.value === 'all' || item.status.toString() === statusFilter.value;
//     // 根据搜索框关键词筛选数据，注意：在js中如何字符串都包含空字符串！！！
//     const matchQuery = item.resName.includes(searchQuery.value.trim()) || item.lostLocation.includes(searchQuery.value.trim());

//     return matchStatus && matchQuery;
//   });
// });


// 最终呈现的数据（切片）
const displayData = computed(()=>{
  // 关键：这里需要对batchSize取模，找到当前页在当前 allItems 里的相对位置
  const localIndex = ((currentPage.value - 1) % (batchSize.value / pageSize.value)) * pageSize.value;
  return allItems.value.slice(localIndex, localIndex + pageSize.value);
});
// 软删除
const handleSoftDelete = async(id)=>{
  try{
    await ElMessageBox.confirm('确定要删除该条信息吗？','操作确认',{
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    });

    const {code,msg} = await axiosInstance.patch(apiConfig.deleteLostProperty,{
      id,
    });

    if(code === 200){
    ElMessage.success(msg);
    
    // 核心优化：判断是否是当前页最后一条数据
    const isLastItemOnPage = displayData.value.length === 1;
    if (isLastItemOnPage && currentPage.value > 1) {
      currentPage.value--; // 自动跳回上一页，watch 会触发 loadLostPropertyList
    } else {
      loadLostPropertyList();
    }
  }
  }catch(error){

  }
}
// 更改状态
const toggleStatus = async(row)=>{
  try{
    const actionText = Number(row.is_revert) === 0 ? '标为已找回' : '撤销找回状态';

    await ElMessageBox.confirm(`确定要将该物品${actionText}吗？`, '操作确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });

      // 发起请求
      // 状态取反操作
      const newStatus = Number(row.is_revert) ? 0 : 1 ;
      
      const {code,msg} = await axiosInstance.patch(apiConfig.updateLostStatus,{
        id:row.property_id,
        isRevert:newStatus,
      });

      if(code === 200){
        ElMessage.success(msg || '状态更新成功');

        
        row.is_revert = newStatus;//优化体验：本地直接修改数据，无需全量刷新
        if (statusFilter.value !== 'all') {
          loadLostPropertyList();
        }
      }
  }catch(error){
    if (error !== 'cancel') {
      console.error('更新状态失败:', error);
      ElMessage.error(msg || '系统繁忙，请稍后再试');
    }
  }
};

// 请求失物数据
const loadLostPropertyList = async()=>{

  if (loading.value) return; // 如果正在加载，不重复触发
  const batchIndex = Math.floor((currentPage.value - 1) / (batchSize.value / pageSize.value));
  const backendOffset = batchIndex * batchSize.value;

  loading.value = true;
  try{
    const {msg,data,code,hasMore,total} = await axiosInstance.get(apiConfig.getLostPropertyList,{
      params:{
        offset: backendOffset,
        count: batchSize.value,
        keyWords: searchQuery.value,
        isRevert: statusFilter.value,
      }
    });

    allItems.value = data;
    totalNum.value = total;
    hasMoreData.value = hasMore; // 记录是否还有下一捆
  }catch(error){

  }finally{
    loading.value = false;
  }
  console.log('@@@loss-processing.vue',allItems.value);//inputTest
}

// 搜索监听防抖操作
let timer = null;
watch(searchQuery, () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    currentPage.value = 1;
    loadLostPropertyList();
  }, 500); 
});

// 状态切换不需要防抖，单独监听
watch(statusFilter, () => {
  currentPage.value = 1;
  loadLostPropertyList();
});

// 监听页码变化
watch(currentPage, (newPage, oldPage) => {
  const itemsPerPageBatch = batchSize.value / pageSize.value; // 每批包含多少页 (21/7 = 3)
  
  // 判断新页码是否跨越了批次边界
  const newBatch = Math.ceil(newPage / itemsPerPageBatch);
  const oldBatch = Math.ceil(oldPage / itemsPerPageBatch);

  if (newBatch !== oldBatch) {
    loadLostPropertyList();
  }
});

onMounted(()=>{

  loadLostPropertyList();

  checkMobile();
  // 监听浏览器的resize事件（窗口变化）
  window.addEventListener('resize',checkMobile);
});
onUnmounted(()=>{
  window.removeEventListener('resize',checkMobile);
});
</script>


<template>
  <div class="lost-manager-container">
    <div class="control-panel"> 
      <el-input 
        type="search"
        placeholder="搜索名称或地点..."
        v-model="searchQuery"
        class="search-input"
      >
        <template #prefix><el-icon><IconSearch /></el-icon></template>
      </el-input>
      <el-radio-group v-model="statusFilter">
        <el-radio-button label="全部" value="all"></el-radio-button>
        <el-radio-button label="寻找中" value="0"></el-radio-button>
        <el-radio-button label="已找回" value="1"></el-radio-button>
      </el-radio-group>
    </div>


    <el-table 
      v-loading="loading"
      :data="displayData" 
      class="lost-table"
      :border="true"
      row-key="property_id"
    >
      <template #empty>
        <el-empty :description="searchQuery ? '没有找到相关物品' : '暂无数据'" />
      </template>
      <el-table-column align="center" prop="publisher_name" label="发布人" fixed="left" width="100"></el-table-column>
      <el-table-column align="center" prop="pubdate" label="发布时间" width="110"></el-table-column>
      <el-table-column align="center" prop="property_name" label="物品名称"></el-table-column>
      <el-table-column align="center" prop="property_describe" label="物品信息"></el-table-column>
      <el-table-column align="center" prop="losePlace" label="遗失地点"></el-table-column>
      <el-table-column align="center" label="是否找回" width="120">  
        <template #default="{row}">
          <el-tag :type="Number(row.is_revert) === 1 ? 'success' : 'danger'" size="default" style="width: 80px">
            {{Number(row.is_revert) === 1 ? '已找回':'未找回'}}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="管理操作" fixed="right">
        <template #default="{row}">
          <div class="button-container">
            <el-button @click="toggleStatus(row)" size="small" :type="Number(row.is_revert) === 1 ? 'success' : 'info'">{{ Number(row.is_revert) === 1 ? '撤销找回' : '标为找回' }}</el-button>
            <el-button @click="handleSoftDelete(row.property_id)"  size="small" type="danger" :icon="IconDelete">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="footer-info">
      <span>{{ `共找到${displayData.length}条相关线索` }}</span>
      <el-divider v-if="!hasMoreData && isAtLastPage">没有更多数据了</el-divider>
    </div>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"  
        v-model:page-size="pageSize"
        :background="true"
        :page-count= "totalPages"
        :hide-on-single-page="true"
        layout="prev, pager, next, jumper"
        :size="isMobile ? 'small' : 'default'"
      >
      </el-pagination>
    </div>
  </div>
</template>


<style scoped>
.lost-manager-container{
  height: 100%;
  width: 100%;
  background-color: #fff;
  border-radius: 7px;
  padding: 15px 20px 0 20px;
  box-sizing: border-box;
  position: relative;
}
.control-panel{
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}
.search-input{
  max-width: 300px;
}
.lost-table{
  width: 100%;
}
.button-container{
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
}
/* 去掉el-button的默认左边距 */
.button-container :deep(.el-button + .el-button) {
  margin-left: 0 !important;
}

/* 专门调整表头字体加粗或大小 */
:deep(.el-table__header th.el-table__cell) {
  font-size: 15px;
  color: #393838;
}
/* 调整单元格内容的字体大小 */
:deep(.el-table__body td.el-table__cell .cell) {
  font-size: 13px;      /* 这里设置单元格文字大小 */
  color: #606266;      /* 设置文字颜色 */
  line-height: 1.5;    /* 调整行高，让文字不那么拥挤 */
}


.footer-info{
  padding: 0 20px;
  font-size: 13px;
  color: #999;
  text-align: right;
  margin-top: 15px;
  height: 20px;
  /* width: 100%; */
}

.pagination{
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  left: 20px;
  right: 20px;
  bottom: 25px;
  /* width: 100%; */
  height: 40px;
  margin-top: 10px;
  overflow-x: auto;
  white-space: nowrap;/* 强制不换行 */
  -webkit-overflow-scrolling: touch; /* 优化移动端滚动流畅度 */
}


@media screen and (max-width: 768px){
  .pagination {
    justify-content: flex-start; /* 移动端靠左展示，方便滑动 */
    padding-bottom: 5px;        /* 留出一点手感空间 */
  }
}

</style>
