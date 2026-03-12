const changeStatus = (status)=>{

    switch(status){
        case 'pending': return '待使用';
        break;
        case 'in_progress': return '使用中';
        break;
        case 'completed': return '已完成';
        break;
        case 'cancelled': return '已取消';
        break;
        case 'expired': return '已过期';
        break;
    }
}


module.exports = changeStatus;