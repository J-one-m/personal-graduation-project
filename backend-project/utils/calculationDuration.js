
// 将预约的起止时间的间隔换算为时长
const calculationDuration = (start,end)=>{
    const startAyy = start.split(':');
    const endAyy = end.split(':');
    
    startAyy.forEach((item,index) => {
        startAyy[index] = parseInt(item);
    });
    endAyy.forEach((item,index)=>{
        endAyy[index] = parseInt(item);
    });

    let duration = endAyy[0]*60 + endAyy[1] - (startAyy[0]*60 + startAyy[1]);

    if(Math.floor(duration/60) === 0){
        duration = `${duration%60}分钟`;
    }else{
        duration = `${Math.floor(duration/60)}小时${duration%60}分钟`;
    };
    // console.log(duration);
    return duration;
};
module.exports = calculationDuration;