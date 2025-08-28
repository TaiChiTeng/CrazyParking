// 云函数：清除游戏数据
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
    // 删除用户的游戏数据
    const result = await collection.where({
      _openid: OPENID,
      key: key
    }).remove();

    return {
      success: true,
      removed: result.stats.removed,
      message: `成功删除 ${result.stats.removed} 条记录`
    };
  } catch (error) {
    console.error('清除游戏数据失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};