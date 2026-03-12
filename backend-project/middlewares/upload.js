const multer = require('multer');
const path = require('path');

// 通过工厂函数来实现动态存储
const createUpload = (folderName)=>{
 
    // 1.创建存储选项storage
    const storage = multer.diskStorage({
        destination:(req,file,cb)=>{
            cb(null,`uploads/${folderName}`);
        },
        filename:(req,file,cb)=>{
            // 1.将multer误读为latin-1的字符串转换为Buffer
            const originalNameBuffer = Buffer.from(file.originalname,'latin1');
            // 2.将Buffer转换为正确的UTF-8字符串
            const originalname = originalNameBuffer.toString('utf-8');
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            // 3.直接使用修改后的作为文件名
            cb(null,uniqueSuffix + '-' + originalname);
        },
    });

// 2.导出半成品multer实例：
return  multer({
        storage,
        limits:{
            fileSize: 100 * 1024 * 1024,//文件上传大小
        },
        fileFilter: (req,file,cb)=>{
            const originalNameBuffer = Buffer.from(file.originalname,'latin1');
            const originalname = originalNameBuffer.toString('utf-8');
            const fileTypes = /jpeg|jpg|png|gif/;
            const extname = fileTypes.test(path.extname(originalname).toLowerCase());
            const mimetype = fileTypes.test(file.mimetype);
            
            if(extname && mimetype){
                return cb(null,true);
            }
            cb(new Error('文件类型不符合，请上传图片文件(jpeg，jpg，png，gif)'));
        },
    });
}

module.exports = {
    uploadLost: createUpload('lostAndFound'),
    uploadAvatar: createUpload('avatar'),
    uploadSiteCategory: createUpload('siteCategory'),
    uploadSiteVenue: createUpload('siteVenue'),
    uploadAdminAvatar: createUpload('adminAvatar'),
}


// 旧方案
// const multer = require('multer');
// const path = require('path');

// // // 通过工厂函数来实现动态存储
// // const createUpload = (folderName)=>{
    
// // }

// // 1.创建存储选项storage
// const storage = multer.diskStorage({
//     destination:(req,file,cb)=>{
//         const {type} = req.body;
//         if(type == 'lostAndFound'){
//             cb(null,'uploads/lostAndFound');
//         }else{
//             cb(null,'uploads/avatar');
//         }
//     },
//     filename:(req,file,cb)=>{
//         // 1.将multer误读为latin-1的字符串转换为Buffer
//         const originalNameBuffer = Buffer.from(file.originalname,'latin1');
//         // 2.将Buffer转换为正确的UTF-8字符串
//         const originalname = originalNameBuffer.toString('utf-8');
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         // 3.直接使用修改后的作为文件名
//         cb(null,uniqueSuffix + '-' + originalname);
//     },
// });

// // 2.创建multer实例：
// const upload = multer({
//     storage,
//     limits:{
//         fileSize: 100 * 1024 * 1024,//文件上传大小
//     },
//     fileFilter: (req,file,cb)=>{
//         const originalNameBuffer = Buffer.from(file.originalname,'latin1');
//         const originalname = originalNameBuffer.toString('utf-8');
//         const fileTypes = /jpeg|jpg|png|gif/;
//         const extname = fileTypes.test(path.extname(originalname).toLowerCase());
//         const mimetype = fileTypes.test(file.mimetype);
        
//         if(extname && mimetype){
//             return cb(null,true);
//         }
//         cb(new Error('文件类型不符合，请上传图片文件(jpeg，jpg，png，gif)'));
//     },
// });


// module.exports = {
//     upload,
// }