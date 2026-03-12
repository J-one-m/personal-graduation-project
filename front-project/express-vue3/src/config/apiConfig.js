
// 项目路由配置
export const apiConfig = {
    // 1.普通用户部分
    login:'/user/login',
    userRegister:'/user/register',
    announcement:'/user/announcement',
    userInfoModify:'/user/userInfoModify',
    updateUserData:'/user/updateUser',
    updateUserPassword:'/user/updateUserPassword',
    userRecord:'/user/userRecord',
    getLostData:'/user/getLostPropertyData',
    insertLostData:'/user/insertLostPropertyData',
    getVenueInfo:'/user/getVenueInfo',
    insertVenueRecords:'/user/insertVenueRecords',
    getBespeakCode:'/user/getBespeakCode',
    cancelReservation:'/user/cancelReservation',
    addParticipants:'/user/addParticipants',
    updateTimeSlot:'/user/updateTimeSlot',
    getServiceCondition:'/user/getServiceCondition',
    insertUserPlan:'/user/insertUserPlan',
    getUserPlan:'/user/getUserPlan',
    changePlanStatus:'/user/updatePlanStatus',
    deleteUserPlan:'/user/deleteUserPlan',
    alternateReservation:'/user/alternateReservation',
    bespeakByAlternateCode:'/user/bespeakByAlternateCode',
    getUserAlternateRecord:'/user/getUserAlternateRecord',
    getCandidateCode:'/user/getCandidateCode',
    cancelPendingReservation:'/user/cancelPendingReservation',
    storagePicture:'/user/storagePicture',

    // 2.管理员部分
    addNewCategory:'/admin/addNewCategory',
    addNewPlace:'/admin/addNewPlace',
    approveLostInfo:'/admin/approveLostInfo',
    checkAffiche:'/admin/checkAffiche',
    deleteLostProperty:'/admin/deleteLostProperty',
    deleteUser:'/admin/deleteUser',
    getAllUserInfo:'/admin/getAllUserInfo',
    getLostPropertyList:'/admin/getLostPropertyList',
    getPendingReviewInfo:'/admin/getPendingReviewInfo',
    getPlaceCategoryInfo:'/admin/getPlaceCategoryInfo',
    getPlaceUseInfo:'/admin/getPlaceUseInfo',
    issueAffiche:'/admin/issueAffiche',
    rejectLostInfo:'/admin/rejectLostInfo',
    
    updateLostStatus:'/admin/updateLostStatus',
    updateUserInfo:'/admin/updateUserInfo',
    uploadCategoryUrl: '/admin/uploadCategory',
    uploadAdminAvatar: '/admin/uploadAdminAvatar',
    updatePlaceStatus: '/admin/updatePlaceStatus',
    insertNewPlace: '/admin/insertNewPlace',
    uploadVenueUrl: '/admin/uploadVenue',
    savePlaceConfig: '/admin/savePlaceConfig',
    modifyAdminInfo: '/admin/modifyAdminInfo',
    modifyAdminPassword: '/admin/modifyAdminPassword',
    
}

export const apiBaseUrl = 'http://localhost:3000/appV1';
// export const apiBaseUrl = 'http://10.160.114.118:3000/appV1';//用这个局域网下的其它设备也能够访问到
export const timeOut = 10000;//设置请求超时
