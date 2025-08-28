// 云函数：保存游戏数据
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const collection = db.collection('gameData');

exports.main = async (event, context) => {
  const { key, data } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    // 查找是否已存在该用户的数据
    const existingData = await collection.where({
      _openid: OPENID,
      key: key
    }).get();

    if (existingData.data.length > 0) {
      // 更新现有数据
      const result = await collection.doc(existingData.data[0]._id).update({
        data: {
          data: data,
          updateTime: new Date()
        }
      });
      
      return {
        success: true,
        action: 'update',
        result: result
      };
    } else {
      // 创建新数据
      const result = await collection.add({
        data: {
          _openid: OPENID,
          key: key,
          data: data,
          createTime: new Date(),
          updateTime: new Date()
        }
      });
      
      return {
        success: true,
        action: 'create',
        result: result
      };
    }
  } catch (error) {
    console.error('保存游戏数据失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};