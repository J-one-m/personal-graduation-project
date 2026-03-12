const crypto = require('crypto');

// 1. 获取密钥：建议在 .env 中设置 SECRET_KEY=你的四个中文字符&&
const RAW_KEY = process.env.SECRET_KEY || 'default_key_16bit'; 

/**
 * 2. 密钥预处理：
 * 无论你输入的 SECRET_KEY 是什么，通过 MD5 都能强制生成一个 16 字节的 Buffer。
 * 这样可以完美适配 AES-128 算法。
 */
const SECRET_KEY = crypto.createHash('md5').update(RAW_KEY).digest();
const ALGORITHM = 'aes-128-ecb';

/**
 * 加密函数：将 ID 组合加密为简短的字符串
 */
function encrypt(text) {
    // ECB 模式不需要 IV，所以这里传 null
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, null);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // 去掉 Base64 填充符 '='，进一步美化字符串长度
    return encrypted.replace(/=/g, '');
}

/**
 * 解密函数：将邀请码还原为原始 ID 组合
 */
function decrypt(hash) {
    if (!hash) throw new Error('邀请码不能为空');

    // 补齐 Base64 缺失的 '=' 填充符
    const addPadding = (str) => str + '='.repeat((4 - str.length % 4) % 4);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, null);
    
    let decrypted = decipher.update(addPadding(hash), 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

module.exports = { encrypt, decrypt };