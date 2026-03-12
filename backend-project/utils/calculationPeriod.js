// 计算时段
const calculationPeriod = (start,end)=>{
    const startAyy = start.split(':');
    const endAyy = end.split(':');
    
    startAyy.forEach((item,index) => {
        startAyy[index] = parseInt(item);
    });
    endAyy.forEach((item,index)=>{
        endAyy[index] = parseInt(item);
    });

    const startSlot = startAyy[0] * 60 + startAyy[1] - 420;
    const endSlot = endAyy[0] * 60 + endAyy[1] - 420;
    return [startSlot,endSlot];
}
// calculationPeriod('08:00:00','09:20:00');
module.exports = calculationPeriod;