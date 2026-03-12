// utils/beforeAvatarUpload.js
/**
 * 校验图片信息
 * @param {File} rawFile - 原始文件对象
 * @param {Array} allowedTypes - 可选：允许的类型，默认常用三种
 * @param {Number} maxSizeMB - 可选：最大限制MB，默认2MB
 * @returns { {valid: boolean, msg: string} } - 返回校验结果和错误信息
 */
const checkPictureInfo = (rawFile, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'], maxSizeMB = 2) => {
    if (!allowedTypes.includes(rawFile.type)) {
        return { valid: false, msg: '图片格式不正确（仅支持 JPG/PNG）' };
    }
    if (rawFile.size / 1024 / 1024 > maxSizeMB) {
        return { valid: false, msg: `图片大小不能超过 ${maxSizeMB}MB!` };
    }
    return { valid: true, msg: '' };
}

export default checkPictureInfo;