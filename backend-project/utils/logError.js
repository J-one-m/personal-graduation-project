// 日志函数：用于输出错误信息

function logError(error,location){
    console.error({
        time: new Date().toLocaleString(),
        where: location,
        stack: error.stack,
        message: error.message,
    });
};

module.exports = logError;