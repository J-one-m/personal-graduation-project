const fs = require('fs');
const path = require('path');
const userModle = require('../models/userModle');

const TASK_LOG_PATH = path.join(__dirname, 'task-log.json');
const TASK_NAME = 'daily_venue_schedule';

// 初始化任务日志文件
function initTaskLog() {
  if (!fs.existsSync(TASK_LOG_PATH)) {
    fs.writeFileSync(TASK_LOG_PATH, JSON.stringify({}));
  }
}

// 读取任务日志
function readTaskLog() {
  try {
    return JSON.parse(fs.readFileSync(TASK_LOG_PATH, 'utf-8'));
  } catch (error) {
    console.error('读取任务日志失败:', error);
    return {};
  }
}

// 更新任务日志
function updateTaskLog(date, status) {
  const log = readTaskLog();
  log[date] = { status, timestamp: new Date().toISOString() };
  fs.writeFileSync(TASK_LOG_PATH, JSON.stringify(log, null, 2));
}

// 补偿执行未完成的任务
async function compensateMissedTasks() {
  const today = new Date();
  const log = readTaskLog();
  const todayStart = new Date().setHours(0,0,0,0); // 今天0点的时间戳
  
  // 检查过去3天（包括今天）的任务状态
  for (let i = 0; i < 3; i++) { // 从0开始，包含今天
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    // 如果当天任务没有执行记录或执行失败
    if (!log[dateStr] || log[dateStr].status !== 'completed') {
      console.log(`补偿执行 ${dateStr} 的任务`);
      
      try {
        const data = await userModle.getVenueId();
        for (const item of data) {
          // 为每个场馆创建未来3天的日程
          for (let j = 0; j < 3; j++) {
            const targetDate = new Date(checkDate);
            targetDate.setDate(targetDate.getDate() + j);
            
            // 只创建未来日期（避免创建过去日期）
            if (targetDate.getTime() >= todayStart) {
              await userModle.createSchedule(item.id, targetDate.toISOString().split('T')[0]);
            }
          }
        }
        updateTaskLog(dateStr, 'completed');
        console.log(`补偿执行 ${dateStr} 成功`);
      } catch (error) {
        console.error(`补偿执行 ${dateStr} 失败:`, error);
        updateTaskLog(dateStr, 'failed');
      }
    }
  }
}

// 每日定时任务（创建未来3天的日程）
async function runDailyTask() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`开始执行 ${today} 的定时任务`);
  
  try {
    const data = await userModle.getVenueId();
    for (const item of data) {
      // 为每个场馆创建未来3天的日程
      for (let i = 0; i < 3; i++) {
        let date = new Date();
        date.setDate(date.getDate() + i);
        await userModle.createSchedule(item.id, date.toISOString().split('T')[0]);
      }
    }
    updateTaskLog(today, 'completed');
    console.log(`完成 ${today} 的定时任务`);
  } catch (error) {
    console.error(`执行 ${today} 任务失败:`, error);
    updateTaskLog(today, 'failed');
  }
}

// 完整的任务执行入口
async function executeFullTask() {
  console.log('开始执行完整任务流程...');
  
  // 1. 先执行补偿机制（检查过去3天包括今天的遗漏）
  await compensateMissedTasks();
  
  // 2. 再执行当天的正常任务（确保今天的任务记录）
  await runDailyTask();
  
  console.log('完整任务流程执行完毕');
}

module.exports = {
  initTaskLog,
  compensateMissedTasks,
  runDailyTask,
  executeFullTask  // 新增完整执行入口
};