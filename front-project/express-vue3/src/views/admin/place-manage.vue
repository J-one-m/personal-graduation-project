<script setup>
import { IconMenu,IconGrid,IconClose,IconSearch,Edit,IconSetting,IconPlus } from '@/config/adminIcons';
import { ref,onMounted,onUnmounted, watch, computed, reactive } from 'vue';
import { useRoute } from 'vue-router';
import useAppStore from '@/stores/useAppStore';
import { storeToRefs } from 'pinia';
import axiosInstance from '@/api/axios';
import { apiBaseUrl, apiConfig } from '@/config/apiConfig';
import { ElMessage } from 'element-plus';

const route = useRoute();
const appStore = useAppStore();
// 1.状态管理
const {isMobile} = storeToRefs(appStore);
const isMounted = ref(false);
const dialogVisible = ref(false);//控制对话框的可见性（场地管理部分）
const activeTab = ref('status');//控制标签页的切换
const activeCategoryId = ref(0);//记录场地分类中是否被选中，现在用数字代替
const isShowDialogAddNew = ref(false);//添加场地信息弹窗的显现与否
const activeTabAddPlace = ref('category');//添加场地部分控制标签页的切换
let timer = '';
let debounceTimer = null;
// const isLoading = ref(false);//效果体验并不好

// 2.数据定义
const keyWords = ref('');//场地搜索关键字
const categoryData = ref([]);//场地分类数据
const tagNavList = reactive([]);//tag切换标签
const currentPlaceInfo = ref([]);//存储场地信息

// 正在编辑的场地数据(用于回显和提交)
const editingPlace = reactive({
    id: null,
    venue_name: '',
    venue_address: '',
    venue_image: '',
    max_num: 1,
    status: 1, // 1-正常, 0-维修
});

const currentCategory = reactive({
    id:0,
});//当前选中的分类

// 新分类表单
const newCategoryForm = reactive({
    name:'',
    icon_mark:'',
});
// 新增场地表单
const newPlaceForm = reactive({
    venue_name:'',
    venue_image:'',
    venue_address:'',
    category_id:null,
    max_num:4,//承载上限
});

const displayTags = computed(() => {
    const limit = isMobile.value ? 1 : 5;
    // 返回最后加入的 N 个标签
    return tagNavList.slice(-limit);
})

// 示例图片
const url = 'https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg';
// 动态控制进度条的颜色
const customColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 },
]

// 3.方法定义
const selectCategory = (item)=>{

    // 0是总览，不进入tagNavList
    if (item === 0) {
        activeCategoryId.value = 0;
        currentCategory.id = 0;
        return;
    }

    // 判断是否存在
    const existingIndex = tagNavList.findIndex(tag => tag.id === item.id);
    
    if (existingIndex === -1) {
        // --- 核心逻辑：控制数量 ---
        const limit = isMobile.value ? 1 : 5; // 移动端 1 个，PC 端 5 个
        
        if (tagNavList.length >= limit) {
            tagNavList.shift(); // 移除最早添加的一个
        }
        
        tagNavList.push(item);
    }
    
    // 更新当前选中状态
    activeCategoryId.value = item.id;
    Object.assign(currentCategory, item);
}

// 获取场地分类信息
const getPlaceCategoryData = async()=>{
    
    try{
        const { data, code, msg} = await axiosInstance.get(apiConfig.getPlaceCategoryInfo);

        if(code === 200){
            categoryData.value = data;
        }
        console.log('@place-manage.vue',data);
    }catch(error){

    }
};

// 添加新类别
const addNewCategory = async()=>{
    
    // if(true) return;

    if(!newCategoryForm.name){
        return ElMessage.error('请填写分类名称！');
    }

    const { code, msg} = await axiosInstance.post(apiConfig.addNewCategory,{
        name: newCategoryForm.name,
        icon_mark: newCategoryForm.icon_mark,
    });

    if(code === 200){
        isShowDialogAddNew.value = false
        ElMessage.success(msg);
        getPlaceCategoryData();
    }

    // console.log('@place-manage.vue',newCategoryForm);
}
// 添加新的场地
const addNewPlace = async()=>{

    try{
        const {code, msg} = await axiosInstance.post(apiConfig.insertNewPlace,{
            venue_name: newPlaceForm.venue_name,
            venue_image: newPlaceForm.venue_image,
            venue_address: newPlaceForm.venue_address,
            category_id: newPlaceForm.category_id,
            max_num: newPlaceForm.max_num,
        });

        if(code === 200){

            ElMessage.success(msg);
            // 1.关闭弹窗
            isShowDialogAddNew.value = false;
            // 2.重置表单（防止下次打开还有数据）
            resetPlaceForm();
            // 3.重载数据
            loadPlaceUseInfo();
        }
    }catch(error){

    }
    console.log('@place-manage.vue',newPlaceForm);
}

// 删除选中的标签
const deleteSeletedTag = (id)=>{
    const index = tagNavList.findIndex(item => item.id === id);

    if(index != -1){
        tagNavList.splice(index,1);
    }
    console.log(tagNavList);
};

// 拿到上传成功后的图标地址（通用）
const handleUploadSuccess = (response,type)=>{
    if(response.code === 200){
        if (type === 'category') {
            newCategoryForm.icon_mark = response.data;
        } else if (type === 'venue') {
            newPlaceForm.venue_image = response.data;
        }
        ElMessage.success('图片上传成功！');
    }else{
        ElMessage.error(response.msg || '上传失败，后端逻辑错误！');
    }
}
// 上传图片前检查图片格式
const beforeUpload = ()=>{

}

const isPlaceManage = computed(()=>{
    return route.name !== 'placeManage';
});

// 判断是否为图片链接
const isImgUrl = (path) => {
    if (!path) return false;
    return path.includes('/') || path.startsWith('http') || path.startsWith('data:');
};

// 开启轮询的函数
const startPolling = () => {
    if (timer) return; // 防止重复开启
    loadPlaceUseInfo(); // 先立即执行一次
    timer = setInterval(() => {
        loadPlaceUseInfo();
    }, 60000);//现阶段一分钟
    console.log('✅ 轮询已开启');
};
// 停止轮询的函数
const stopPolling = () => {
    if (timer) {
        clearInterval(timer);
        timer = null;
        console.log('🛑 轮询已暂停');
    }
};

// 处理页面可见性变化的逻辑
const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
        startPolling();
    } else {
        stopPolling();
    }
};

// 加载场地使用信息
const loadPlaceUseInfo = async(id)=>{
    try{
        // const {data,code}
        const { code, msg, data} = await axiosInstance.post(apiConfig.getPlaceUseInfo,{
            id:currentCategory.id,
            keyWords:keyWords.value,
        });

        if(code === 200){
            currentPlaceInfo.value = data;
        };
        console.log('@place-manage.vue',data);
    }catch(error){

    }  
};

// 处理进度条百分比
const calculatePercentage = (item) => {
    // 获取总容量（根据当前分类判断）
    const total = Number(currentCategory.id) === 0 ? Number(item.total_capacity) : Number(item.capacity);
    const current = Number(item.current_load) || 0;

    // 严谨判断：如果总容量不存在或为0，直接返回0，防止出现 NaN
    if (!total || total === 0) return 0;

    // 计算百分比并乘 100
    let percent = Math.floor((current / total) * 100);

    // 确保在 0-100 范围内
    return Math.min(Math.max(percent, 0), 100);
};

// 重置表单的函数
const resetPlaceForm = () => {
    Object.assign(newPlaceForm, {
        venue_name: '',
        venue_image: '',
        venue_address: '',
        // 保持当前选中的分类，如果是“总览”则设为 null
        category_id: currentCategory.id !== 0 ? currentCategory.id : null, 
        max_num: 4,
    });
};

// 打开管理/设置弹窗
const openManageDialog = (item, tab) => {
    // 将当前卡片的数据深度克隆到编辑表单中，避免直接修改列表数据
    Object.assign(editingPlace, {
        id: item.id,
        venue_name: item.venue_name,
        venue_address: item.venue_address,
        venue_image: item.venue_image,
        max_num: item.capacity || item.max_num,
        is_open: item.is_open,
    });
    activeTab.value = tab;
    dialogVisible.value = true;
};

// 提交状态更新(管理页)
const updatePlaceStatus = async()=>{
    try{
        const { code, msg } = await axiosInstance.patch(apiConfig.updatePlaceStatus, {
            id: editingPlace.id,
            status: editingPlace.is_open,
        });
        if (code === 200) {
            ElMessage.success(msg);
            dialogVisible.value = false;
            loadPlaceUseInfo(); // 刷新列表
        };
    }catch(error){
        console.error(error);
    }
};
// 提交属性配置（设置页）
const savePlaceConfig = async()=>{
    try{
        const { code, msg } = await axiosInstance.patch(apiConfig.savePlaceConfig, {
            id:editingPlace.id,
            venue_name:editingPlace.venue_name,
            venue_address:editingPlace.venue_address,
            max_num:editingPlace.max_num,
            venue_image:editingPlace.venue_image,
        });
        if (code === 200) {
            ElMessage.success(msg);
            dialogVisible.value = false;
            loadPlaceUseInfo(); // 刷新列表
        }
    }catch(error){
        console.error(error);
    }
}

// 监听弹窗打开，自动填充分类
watch(isShowDialogAddNew, (newVal) => {
    if (newVal) {
        // 如果当前选中的不是“总览(0)”，则新增场地时默认归属当前分类
        if (currentCategory.id !== 0) {
            newPlaceForm.category_id = currentCategory.id;
        }
        // 如果是总览模式，可以重置表单
        else {
            resetPlaceForm();
        }
    }
});
// 监听搜索关键字变化
watch(keyWords, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        loadPlaceUseInfo();
    }, 500); // 用户停止输入 500ms 后再触发搜索
});
watch(currentCategory,()=>{
    keyWords.value = '';
    loadPlaceUseInfo();
});

onMounted(()=>{
    isMounted.value = true;

    getPlaceCategoryData();

    // 挂载的时候立即请求一次
    // 管理员部分采用轮询的方式获取场地的实时信息（用户部分则准备采用websocket）
    // 1. 初次挂载时启动
    startPolling();
    
    // 2. 监听浏览器标签页切换
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
});
onUnmounted(()=>{
    // 3. 清除定时器
    stopPolling();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>


<template>
<div class="place-manage-container">
    <teleport v-if="isMounted" to='#navigation-container' :disabled="isPlaceManage">
        <!-- <div  style="color: black;">
            我是内容。我在 placeManage 页面时会飞到 Header，在其他页面会待在父组件里。
        </div> -->
        <el-popover
          trigger="hover"
          placement="bottom-start"
          width="300"
        >
          <template #reference>
            <div class="grid-trigger">
              <el-icon :size="isMobile ? 15 : 30"><IconMenu /></el-icon>
              <span style="color: black;">场地分类</span>
            </div>
          </template>

          <!-- <template #default>默认插槽可以不写 -->
          <template #default>
            <div class="grid-menu">
                <div 
                  class="grid-item" 
                  :class="{active:activeCategoryId === 0}"
                  @click="selectCategory(0)"

                >
                    <div class="icon-box all">
                        <el-icon size="35"><IconGrid /></el-icon>
                    </div>
                    <span>按分类总览</span>
                </div>

                <div v-for="item in categoryData" :key="item.name"
                  class="grid-item"
                  :class="{active:activeCategoryId === item.id}"
                  @click.stop="selectCategory(item)"
                >
                    <div class="icon-box cat">
                        <el-image 
                          v-if="isImgUrl(item.icon_mark) && item.icon_mark" 
                          :src="item.icon_mark" 
                          class="category-icon-img"
                          fit="contain"
                        >
                            <template #error>
                                <el-icon><IconGrid /></el-icon>
                            </template>
                        </el-image>
                    </div>
                    <span>{{ item.name }}</span>
                </div>
                <div 
                  class="grid-item"
                  @click="isShowDialogAddNew = !isShowDialogAddNew"
                >
                    <span>添加</span>
                </div>
            </div>
          </template>
        </el-popover>

        <div class="tag-nav">
          <!-- 移动设备最多显示两个 -->
          <div 
            @click="Object.assign(currentCategory,{id:0,name:''});" 
            class="nav-tab" 
            :class="{'tag-active':currentCategory.id === 0}"
          >
            <span>分类总览</span>
            <!-- <el-icon v-if="'all' === 'all'" color="#00aeff"><IconClose /></el-icon> -->
          </div>
          <div 
            v-for="item in displayTags" 
            :key="item.id"
            class="nav-tab" 
            :class="{'tag-active':currentCategory.id === item.id}"
            @click="Object.assign(currentCategory,item);"
          >
            <span>{{ item.name}}</span>
            <el-icon @click="deleteSeletedTag(item.id)" v-if="'all' === 'all'" color="#00aeff"><IconClose /></el-icon>
          </div>
        </div>
    </teleport>


    <div class="tool-bar">
      <span class="current-cat">{{ currentCategory.id === 0 ? '分类总览' : currentCategory.name }}</span>
      <span class="total-count">共找到{{ currentPlaceInfo.length }}条相关数据</span>
      <div class="search-container">
        <el-input
          class="search-input"
          :prefix-icon = "IconSearch"
          placeholder="全局收搜索场地或地点..."
          v-model="keyWords"
          :clearable="true"
          @keyup.enter="loadPlaceUseInfo"
        >

        </el-input>
      </div>  
    </div>

    <div class="card-list-wrapper">
        <el-scrollbar>
            <div class="place-card-contanier">
                <div 
                  v-for="item in currentPlaceInfo" 
                  class="card-item"
                  :key="item.category_id"
                >
                <!-- 图片暂时不换，因为还没有 -->
                    <el-image
                    :src="item.venue_image"
                    class="card-image"
                    fit="cover"
                    >
                    </el-image>
                    <div class="place-info">
                        <div>
                            <!-- 当以分类总览时，则无需显示，否则显示 -->
                            <span class="place-name-info">
                                {{ Number(currentCategory.id) === 0 ? item.category_name : item.venue_name  }}
                                <span>{{ Number(currentCategory.id) !== 0 ? item.venue_address : `共有${item.total_venues}个场地` }}</span>
                                <!-- <span v-if="Number(currentCategory.id) !== 0">{{ item.venue_address }}</span> -->
                            </span>
                            
                            <span v-if="Number(currentCategory.id) !== 0">{{ Number(item.current_load) !== 0 ? '占用' : '空闲' }}</span>
                        </div>
                        <div class="usage-meta">
                            <span>实时负荷（人数）</span>
                            <span>
                                {{ item.current_load }}
                                /
                                {{ Number(currentCategory.id) === 0 ? item.total_capacity : item.capacity }}
                            </span>
                        </div>
                        <el-progress :percentage="calculatePercentage(item)"  :color="customColors"/>
                    </div>
                    <div v-if="Number(currentCategory.id) !== 0" class="place-operate">
                        <el-button type="primary" plain :icon="Edit" @click="openManageDialog(item, 'status')">管理</el-button>
                        <el-button type="primary" plain :icon="IconSetting" @click="openManageDialog(item, 'configInfo')">设置</el-button>
                    </div>
                    <div class="category-tag">
                        <span>所属类别：{{ item.category_name }}</span>
                    </div>
                </div>
            </div>
        </el-scrollbar>
    </div>
</div>

<!-- 场地管理部分 -->
<el-dialog v-model="dialogVisible" title="场地精细化管理" width="480px" destroy-on-close>
  <el-tabs v-model="activeTab">
    <el-tab-pane 
      label="实时状态" 
      name="status"
    >
      <el-form label-position="top">
        <el-form-item label="当前场地">
            <el-tag type="info">{{ editingPlace.venue_name }}</el-tag>
        </el-form-item>
        <el-form-item label="运营状态">
            <el-radio-group v-model="editingPlace.is_open">
            <el-radio-button :value="1">正常开放</el-radio-button>
            <el-radio-button :value="0">停用/维修</el-radio-button>
            </el-radio-group>
        </el-form-item>
        <el-button @click="updatePlaceStatus" type="primary" class="w-full mt-4">更新状态</el-button>
      </el-form>
    </el-tab-pane>
    <el-tab-pane label="属性配置" name="configInfo">
        <el-form label-width="80px" class="">
            <el-form-item label="场地名称"><el-input v-model="editingPlace.venue_name" /></el-form-item>
            <el-form-item label="场地地址"><el-input v-model="editingPlace.venue_address" /></el-form-item>
            <el-form-item label="承载上限"><el-input-number v-model="editingPlace.max_num" :min="1"/></el-form-item>
            <el-form-item label="修改图片">
                <el-upload
                    class="venue-uploader"
                    style="height: 100px; width: 100%;"
                    :action="apiBaseUrl + apiConfig.uploadVenueUrl"
                    :show-file-list="false"
                    :on-success="(res) => editingPlace.venue_image = res.data"
                    name="siteVenue" 
                >
                    <img v-if="editingPlace.venue_image" :src="editingPlace.venue_image" class="venue-preview" style="height: 100px;"/>
                    <el-icon v-else><IconPlus /></el-icon>
                </el-upload>
            </el-form-item>
            <el-button @click="savePlaceConfig" type="warning" class="w-full mt-4">保存配置</el-button>
          </el-form>
    </el-tab-pane>
  </el-tabs>
</el-dialog>

<el-dialog
  v-model="isShowDialogAddNew"
  :width="isMobile ? 400 : 500"
  title="场地及类别的增添"
  destroy-on-close
>
    <el-tabs v-model="activeTabAddPlace">
        <el-tab-pane
          name="category"
          label="场地类别"
        >
            <div class="">
                <el-form :model="newCategoryForm" label-width="80px" class="">
                    <el-form-item label="类别名称"><el-input v-model="newCategoryForm.name"/></el-form-item>
                    <el-form-item label="类别图标">
                        <el-upload
                          class="avatar-uploader"
                          :action="apiBaseUrl + apiConfig.uploadCategoryUrl" 
                          :show-file-list="false"
                          :on-success="(res) => handleUploadSuccess(res, 'category')"
                          :before-upload="beforeUpload"
                          name="siteCategory"
                        >
                            <img v-if="newCategoryForm.icon_mark" :src="newCategoryForm.icon_mark" class="avatar-preview" />
                            <el-icon v-else class="avatar-uploader-icon"><IconPlus /></el-icon>
                        </el-upload>
                        <div class="upload-tip">建议尺寸 64x64，支持 PNG/SVG</div>
                    </el-form-item>
                </el-form>
                <el-button @click="addNewCategory" type="primary" class="w-full mt-4">添加场地类别</el-button>
            </div>
        </el-tab-pane>

        <el-tab-pane
          name="placeInfo"
          label="场地"
        >
            <div class="">
                <el-form :model="newPlaceForm" label-width="100px" class="">
                    <el-form-item label="场地名称">
                        <el-input v-model="newPlaceForm.venue_name" placeholder="请输入场地名称（如：羽毛球1号场地）"></el-input>
                    </el-form-item>
                    <el-form-item label="所属类别" required>
                        <el-select v-model="newPlaceForm.category_id" placeholder="请选择场地类别" style="width: 100%">
                            <el-option
                                v-for="item in categoryData"
                                :key="item.id"
                                :label="item.name"
                                :value="item.id"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="场地地址" placeholder="如：体育馆二楼东侧">
                        <el-input v-model="newPlaceForm.venue_address"></el-input>
                    </el-form-item>
                    <el-form-item label="承载上限">
                        <el-input-number v-model="newPlaceForm.max_num" :min="1" :max="1000" />
                        <span style="margin-left: 10px; color: #909399;">人</span>
                    </el-form-item>
                    <el-form-item label="场地预览图片">
                        <el-upload
                            class="venue-uploader"
                            :action="apiBaseUrl + apiConfig.uploadVenueUrl"
                            :show-file-list="false"
                            :on-success="(res) => handleUploadSuccess(res, 'venue')"
                            name="siteVenue" 
                        >
                            <img v-if="newPlaceForm.venue_image" :src="newPlaceForm.venue_image" class="venue-preview" />
                            <el-icon v-else class="avatar-uploader-icon"><IconPlus /></el-icon>
                        </el-upload>
                        <div class="upload-tip">建议上传实地照片，展示场地环境</div>
                    </el-form-item>
                    <el-button @click="addNewPlace" type="warning" class="w-full mt-4">确认添加</el-button>
                </el-form>
            </div>
        </el-tab-pane>
    </el-tabs>
</el-dialog>


</template>


<style scoped>
.place-manage-container{
    height: 100%;
    width: 100%;
    background-color: #f6f8fb;
    border-radius: 8px;
    padding: 8px 10px;
    box-sizing: border-box;

    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.grid-trigger{
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    height: 40px;
    border-radius: 7px;
    padding: 0 10px;
    background-color: lightblue;

    flex-shrink: 0;
    white-space: nowrap;
}
.grid-trigger:hover{
    cursor: pointer;
}
.grid-menu{
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
    align-content: center;
    row-gap: 10px;
    justify-items: center;
}
.grid-item{
    border-radius: 7px;
    height: 90px;
    width: 75px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    cursor: pointer;
    transition: all 0.3s ease; /* 添加平滑动画 */
    border: 1px solid transparent; /* 避免悬停时抖动 */
    /* background-color: aqua; */
}
.grid-item.active{
    background-color: #dfeeff;
}
.grid-item:hover{
    background-color: #f0f7ff;
    color: #409eff;
    transform: translateY(-2px);
}
.grid-item:hover .icon-box{
    border-color: #409eff;
    background-color: #ffffff;
}



.icon-box{
    height: 50px;
    width: 50px;
    box-sizing: border-box;
    border: 2px solid greenyellow;
    border-radius: 5px;
}
.icon-box.all{
    display: flex;
    justify-content: space-around;
    gap: 5px;
    align-items: center;
}
.icon-box.cat {
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden; /* 防止图片溢出容器 */
    background-color: #fff; /* 给予白色底色，防止透明PNG看不清 */
}
.category-icon-img {
    width: 35px;   /* 保持和 el-icon 的 size 一致 */
    height: 35px;
    padding: 2px;  /* 留出一点呼吸空间 */
}   


.tag-nav{
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0; /* 防止导航栏被挤压 */
}
.nav-tab{
    padding: 0 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    box-sizing: border-box;
    border: 2px solid #00aeff;
    border-radius: 7px;
    /* width: 70px; */
    height: 40px;
    background-color: aquamarine;
    cursor: pointer;
}
.nav-tab>span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis; /* 文字过长显示省略号 */
    max-width: 80px; 
}
.nav-tab.tag-active{
    background-color: #f0f7ff;
}

.tool-bar{
    width: 100%;
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    column-gap: 15px;
    align-items: center;
    border-radius: 8px;
    /* background-color: #00aeff; */
}
.current-cat{
    font-size: 20px;
    color: black;
}
.total-count{
    font-size: 12px;
    color: #909399;
    padding: 2px 8px;
    background-color: #dfeeff;
    border-radius: 8px;
}
.search-container{
    flex: 1;
    height: 100%;
    /* background-color: #00aeff; */
    display: flex;
    justify-content: flex-end;
    align-items: center;
}
.search-input{
    width: 240px;
}


.card-list-wrapper {
    flex: 1;
    overflow: hidden;
    margin-top: 20px;
}
.place-card-contanier{
    margin-top: 20px;
    background-color: #4479c9;
    width: 100%;
    /* height: 75%; */
    display: grid;
    grid-template-columns: repeat(auto-fill,minmax(300px,1fr));
    row-gap: 20px;
    column-gap: 20px;
    align-content: center;

    /* box-sizing: border-box; */
    overflow: auto;
}
.card-item{
    box-sizing: border-box;
    border-radius: 8px;
    height: 320px;
    /* max-width: 300px; */
    background-color: lightblue;
    position: relative;
    overflow: hidden;
}
.card-image{
    height: 190px;
    width: 100%;
}
.place-info{
    display: flex;
    flex-direction: column;
}
.place-info>div{
    padding: 3px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.place-name-info{
    font-size: 16px;
    color: black;
}
.place-name-info + span{
    text-align: center;    /* 水平居中 */
    line-height: 1.5;

    border-radius: 10px;
    padding: 0 10px;
    color: #F76C6C;
    font-size: 12px;
    background-color: #FEF0F0;
}
.usage-meta{
    margin-top: 10px;
}
.place-operate{
    display: flex;
    justify-content: space-around;
    /* margin-top: 20px; */
}
.category-tag{
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: rgb(0, 95, 205);
    color: #dfeeff;
    padding: 2px 10px;
    line-height: 1.5;
    letter-spacing: 1.5px;
    border-radius: 8px;
}


.w-full { width: 100%; }
.mt-4 { margin-top: 16px; }



:deep(.el-progress__text){
    display: flex;
    justify-content: flex-end;
}



/* 上传部分 */

/* 上传组件基础样式 */

.el-form-item{
    align-items: center;
}
.upload-tip{
    margin-left: 10px;
}
.avatar-uploader, .venue-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: border-color 0.3s;
}

.avatar-uploader:hover, .venue-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

/* 预览图自适应 */
.avatar-preview {
  width: 160px;
  height: 160px;
  object-fit: contain;
}

.venue-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.2;
}

.venue-uploader {
    width: 100%; /* 场地图片可以比分类图标宽一些 */
    height: 150px;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}
.venue-preview {
    width: 100%;
    height: 100%;
    object-fit: cover; /* 保证图片铺满容器且不缩放变形 */
}

.w-full {
  width: 100%;
}

.mt-4 {
  margin-top: 16px;
}


@media (max-width:768px){

    .grid-trigger>span{
        font-size: 11px;
    }
    .grid-item>span{
        font-size: 11px;
    }

    .nav-tab>span{
        font-size: 11px;
    }



    .search-container{
        justify-content: flex-start;
    }




    /* 分类图标上传部分 */
    .avatar-uploader, .venue-uploader{
        width: 100px;
        height: 100px;
    }

    .avatar-preview {
        width: 70px;
        height: 70px;
        object-fit: contain;
    }
}
</style>