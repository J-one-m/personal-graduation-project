// 将前端传过来的时段转换为时间
const computingTime = (period)=>{
    const hour = Math.floor(period/60) + 7;//7为场馆开启时间
    const minute = period%60;

    return hour.toString().padStart(2,'0')+':'+minute.toString().padStart(2,'0')+':00';
}
// computingTime(70);
module.exports = computingTime;