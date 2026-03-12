const jwt = require('jsonwebtoken');
const config = require('../config/config.js');

function verifyToken(req, res, next) {
    // 兼容大小写：Express 推荐直接访问小写 key
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    
    if (!authHeader) {
        return res.status(401).json({
            code: 401,
            message: 'token不存在，请重新登录！',
        });
    }

    // 2. 确保 split 安全
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ code: 401, message: 'Token格式错误' });
    }
    const token = parts[1];

    try {
        const decoded = jwt.verify(token, config.secretKey);
        
        req.userId = decoded.userId; 
        req.userAccount = decoded.user_account;

        next();
    } catch (error) {
        const status = 401;
        let msg = 'token无效';
        if (error.name === 'TokenExpiredError') {
            msg = 'token过期';
        }
        return res.status(status).json({ code: 401, message: msg });
    }
}

module.exports = verifyToken;