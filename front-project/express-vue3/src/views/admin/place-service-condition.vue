<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Location, User, Picture, PieChart, 
  Edit, Search, Menu, Close, Grid, ArrowRight,
  Setting, Warning, Collection, Basketball, Reading
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRoute } from 'vue-router';

const route = useRoute();
const isPlaceServiceCondition = computed(()=>{
    return route.name !== 'placeServiceCondition';
});

// --- 1. 数据定义 (增加图标字段) ---
const venueData = ref([
  {
    id: 'cat1', label: '羽毛球类', icon: 'Basketball', // 借用图标
    locations: [
      {
        id: 'loc1', name: '校体育馆 1F',
        items: [
          { id: 101, name: '羽毛球 01', status: 1, currentUser: 4, maxUser: 4, image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400', detail: '专业塑胶地板' },
          { id: 102, name: '羽毛球 02', status: 0, currentUser: 0, maxUser: 4, image: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=400', detail: '木地板' }
        ]
      }
    ]
  },
  {
    id: 'cat2', label: '自习室类', icon: 'Reading',
    locations: [
      {
        id: 'loc3', name: '图书馆 4F',
        items: [
          { id: 401, name: '静音室 A', status: 1, currentUser: 12, maxUser: 30, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400', detail: '独立插座' }
        ]
      }
    ]
  }
]);

// --- 2. 状态管理 ---
const ALL_NODE = { id: 'all', label: '全部分类', icon: 'Grid' };
const activeCategory = ref(ALL_NODE);
const searchQuery = ref('');
const selectedTags = ref([ ALL_NODE ]);

const dialogVisible = ref(false);
const activeTab = ref('status'); 
const editingItem = ref({});

// --- 3. 核心逻辑 ---

// 选择类别 (九宫格点击)
const selectCategory = (cat) => {
  activeCategory.value = cat;
  // 维护标签
  if (!selectedTags.value.find(t => t.id === cat.id)) {
    selectedTags.value.push(cat);
    if (selectedTags.value.length > 4) selectedTags.value.splice(1, 1);
  }
};

const removeTag = (e, index) => {
  e.stopPropagation();
  if (selectedTags.value[index].id === 'all') return;
  const isRemovingActive = activeCategory.value.id === selectedTags.value[index].id;
  selectedTags.value.splice(index, 1);
  if (isRemovingActive) activeCategory.value = selectedTags.value[0];
};

// 数据展平逻辑：根据选中类别提取场地
const displayItems = computed(() => {
  let source = [];
  
  if (activeCategory.value.id === 'all') {
    // 全局：遍历所有类 -> 所有位置 -> 所有场地
    venueData.value.forEach(cat => {
      cat.locations.forEach(loc => {
        loc.items.forEach(item => source.push({ ...item, categoryLabel: cat.label, locationName: loc.name }));
      });
    });
  } else {
    // 按类：仅遍历选中类下的所有位置 -> 所有场地
    const targetCat = venueData.value.find(c => c.id === activeCategory.value.id);
    if (targetCat) {
      targetCat.locations.forEach(loc => {
        loc.items.forEach(item => source.push({ ...item, categoryLabel: targetCat.label, locationName: loc.name }));
      });
    }
  }

  return source.filter(i => i.name.includes(searchQuery.value) || i.locationName.includes(searchQuery.value));
});

// 管理保存
const handleSave = () => {
  venueData.value.forEach(cat => {
    cat.locations.forEach(loc => {
      const idx = loc.items.findIndex(i => i.id === editingItem.value.id);
      if (idx !== -1) {
        if (editingItem.value.status !== 2) editingItem.value.status = editingItem.value.currentUser > 0 ? 1 : 0;
        loc.items[idx] = { ...editingItem.value };
      }
    });
  });
  dialogVisible.value = false;
  ElMessage.success('更新成功');
};

// onMounted(()=>{
//     console.log('@placeServiceCondition.vue',route.name)
// });
const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
  // 此时父组件已挂载，#navigation-container 必定存在
});
</script>

<template>
  <div class="admin-workspace">
    <header class="workspace-header">
      <div class="header-left">
        <div class="logo"><el-icon><Collection /></el-icon> <span>场地资源智管</span></div>
        
        <el-popover placement="bottom-start" :width="320" trigger="hover" popper-class="grid-menu-popper">
          <template #reference>
            <div class="grid-trigger">
              <el-icon><Menu /></el-icon>
              <span>业务分类</span>
            </div>
          </template>
          
          <div class="grid-menu">
            <div class="grid-item" @click="selectCategory(ALL_NODE)" :class="{active: activeCategory.id === 'all'}">
              <div class="icon-box all"><el-icon><Grid /></el-icon></div>
              <span>全部分类</span>
            </div>
            <div v-for="cat in venueData" :key="cat.id" 
              class="grid-item" @click="selectCategory(cat)" :class="{active: activeCategory.id === cat.id}"
            >
              <div class="icon-box cat">
                <el-icon><component :is="cat.icon" /></el-icon>
              </div>
              <span>{{ cat.label }}</span>
            </div>
          </div>
        </el-popover>

        <div class="tag-nav">
          <div v-for="(tag, i) in selectedTags" :key="tag.id" 
               class="nav-tab" :class="{active: activeCategory.id === tag.id}" @click="activeCategory = tag">
            <span>{{ tag.label }}</span>
            <el-icon v-if="tag.id !== 'all'" @click="removeTag($event, i)"><Close /></el-icon>
          </div>
        </div>
      </div>
    </header>

    <div class="toolbar">
      <div class="stat-info">
        <span class="current-cat">{{ activeCategory.label }}</span>
        <span class="total-count">共 {{ displayItems.length }} 个资源点</span>
      </div>
      <el-input v-model="searchQuery" placeholder="全局搜索场地或地点..." :prefix-icon="Search" clearable class="search-box" />
    </div>

    <div class="main-content">
      <div class="venue-grid">
        <el-card v-for="item in displayItems" :key="item.id" class="venue-card" :body-style="{ padding: '0px' }">
          <div class="card-img-wrapper">
            <el-image :src="item.image" fit="cover" />
            <div class="loc-tag">{{ item.locationName }}</div>
            <div class="type-tag" v-if="activeCategory.id === 'all'">{{ item.categoryLabel }}</div>
          </div>
          
          <div class="card-info">
            <div class="title-row">
              <span class="v-name">{{ item.name }}</span>
              <el-tag :type="item.status === 0 ? 'success' : (item.status === 1 ? 'danger' : 'info')" size="small" round>
                {{ item.status === 0 ? '空闲' : (item.status === 1 ? '占用' : '维护') }}
              </el-tag>
            </div>
            
            <div class="usage-row">
              <div class="usage-meta">
                <span>实时负荷</span>
                <span>{{ item.currentUser }}/{{ item.maxUser }}</span>
              </div>
              <el-progress :percentage="(item.currentUser/item.maxUser)*100" 
                           :status="item.status === 2 ? 'exception' : (item.currentUser >= item.maxUser ? 'warning' : '')" 
                           :stroke-width="6" :show-text="false" />
            </div>

            <div class="card-foot">
              <el-button-group class="w-full">
                <el-button type="primary" plain :icon="Edit" @click="editingItem = {...item}; dialogVisible=true; activeTab='status'">管理</el-button>
                <el-button type="primary" :icon="Setting" @click="editingItem = {...item}; dialogVisible=true; activeTab='info'"></el-button>
              </el-button-group>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="场地精细化管理" width="480px" destroy-on-close>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="实时状态" name="status">
          <el-form label-position="top" class="p-4">
            <el-form-item label="当前人数">
              <el-input-number v-model="editingItem.currentUser" :min="0" :max="editingItem.maxUser" class="w-full" />
            </el-form-item>
            <el-form-item label="运营状态">
              <el-radio-group v-model="editingItem.status">
                <el-radio-button :label="0">正常开放</el-radio-button>
                <el-radio-button :label="2">停用/维修</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-button type="primary" class="w-full mt-4" @click="handleSave">更新状态</el-button>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="属性配置" name="info">
          <el-form label-width="80px" class="p-4">
            <el-form-item label="场地名称"><el-input v-model="editingItem.name" /></el-form-item>
            <el-form-item label="承载上限"><el-input-number v-model="editingItem.maxUser" :min="1"/></el-form-item>
            <el-form-item label="图片地址"><el-input v-model="editingItem.image" /></el-form-item>
            <el-form-item label="场地描述"><el-input v-model="editingItem.detail" type="textarea" /></el-form-item>
            <el-button type="warning" class="w-full mt-4" @click="handleSave">保存配置</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
  <teleport v-if="isMounted" to='#navigation-container' :disabled="isPlaceServiceCondition">
    <div class="content">
        我是内容。我在 placeServiceCondition 页面时会飞到 Header，在其他页面会待在父组件里。
    </div>
  </teleport>
</template>

<style scoped>
.content{
    color: white;
}
.admin-workspace { background: #f6f8fb; min-height: 100vh; }

/* 头部样式 */
.workspace-header {
  height: 64px; background: #fff; display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 100;
}
.header-left { display: flex; align-items: center; gap: 24px; }
.logo { display: flex; align-items: center; gap: 8px; font-weight: bold; color: #409eff; font-size: 18px; }

/* 九宫格触发器 */
.grid-trigger {
  display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 16px;
  background: #f0f7ff; color: #409eff; border-radius: 8px; font-size: 14px; font-weight: 500;
  transition: 0.3s;
}
.grid-trigger:hover { background: #409eff; color: #fff; }

/* 九宫格菜单样式 */
.grid-menu {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 10px;
}
.grid-item {
  display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer;
  padding: 12px; border-radius: 12px; transition: 0.3s;
}
.grid-item:hover { background: #f5f7fa; transform: translateY(-2px); }
.grid-item.active { background: #ecf5ff; }
.grid-item.active span { color: #409eff; font-weight: bold; }

.icon-box {
  width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center;
  justify-content: center; font-size: 24px; color: #fff;
}
.icon-box.all { background: linear-gradient(135deg, #606266, #303133); }
.icon-box.cat { background: linear-gradient(135deg, #409eff, #79bbff); }

/* 标签导航 */
.tag-nav { display: flex; gap: 8px; }
.nav-tab {
  height: 34px; padding: 0 12px; background: #fff; border: 1px solid #dcdfe6; border-radius: 6px;
  display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #606266;
}
.nav-tab.active { border-color: #409eff; color: #409eff; background: #ecf5ff; font-weight: 500; }

/* 工具栏 */
.toolbar { max-width: 1200px; margin: 24px auto; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; }
.current-cat { font-size: 20px; font-weight: bold; color: #303133; margin-right: 12px; }
.total-count { font-size: 12px; color: #909399; background: #fff; padding: 2px 8px; border-radius: 10px; border: 1px solid #e4e7ed; }
.search-box { width: 300px; }

/* 场地网格 */
.main-content { max-width: 1200px; margin: 0 auto; padding: 0 20px 40px; }
.venue-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
.venue-card { border-radius: 16px; border: none; overflow: hidden; transition: 0.3s; }
.venue-card:hover { transform: translateY(-6px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); }

.card-img-wrapper { position: relative; height: 170px; }
.loc-tag { position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.6); color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; backdrop-filter: blur(4px); }
.type-tag { position: absolute; top: 12px; right: 12px; background: #409eff; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; }

.card-info { padding: 16px; }
.title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.v-name { font-weight: bold; font-size: 16px; color: #303133; }

.usage-row { margin-bottom: 20px; }
.usage-meta { display: flex; justify-content: space-between; font-size: 12px; color: #606266; margin-bottom: 6px; }

.w-full { width: 100%; }
.mt-4 { margin-top: 16px; }
</style>