//该文件用于解析token，在前端中对token的时效性进行一个验证 

// 解析token的函数
const parseJwt = (token)=>{
    const base64Url = token.split('.')[1];//从token中提取载荷部分
    // 将base64Url转换为标准base64格式
    const base64 = base64Url.replace(/-/g,'+').replace(/_/g,'/');//（什么意思？）
    // 解码base64，并将其转换为JSON对象
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2) 
    ).join(''));

    // 返回解析后的JSON对象
    return JSON.parse(jsonPayload);
}

// 检查token是否过期的函数
const isTokenExpired = (token)=>{
    const decoded = parseJwt(token);//解析token
    const currentTime = Math.floor(Date.now() / 1000);//将当前时间转换为秒
    return decoded.exp < currentTime;//返回token是否过期
}

export {isTokenExpired,parseJwt};