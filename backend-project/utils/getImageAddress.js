
const path = require('path');

const getImageAddress = (req,fileBasePath)=>{
    const baseUrl = `${req.protocol}://${req.get('host')}/`;
    //文件在服务器中的路径
    // const filePath = path.join(fileBasePath,req.file.filename);
    // 将所有反斜杠 \ 替换为正斜杠 /
    const filePath = path.join(fileBasePath, req.file.filename).replace(/\\/g, '/');
    const fullUrl = baseUrl +filePath;
    // 返回完整的图片地址
    return fullUrl;
}

module.exports = getImageAddress;