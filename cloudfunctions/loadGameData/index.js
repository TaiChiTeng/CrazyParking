// 云函数：读取游戏数据
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const collection = db.collection('gameData');

exports.main = async (event, context) => {
  const { key } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    // 查找用户的游戏数据
    const result = await collection.where({
      _openid: OPENID,
      key: key
    }).orderBy('updateTime', 'desc').limit(1).get();

    if (result.data.length > 0) {
      return {
        success: true,
        data: result.data[0].data,
        updateTime: result.data[0].updateTime
      };
    } else {
      return {
        success: true,
        data: null,
        message: '未找到存档数据'
      };
    }
  } catch (error) {
    console.error('读取游戏数据失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};