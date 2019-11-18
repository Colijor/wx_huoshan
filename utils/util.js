const formatTime = date => {
  // const year = date.getFullYear()
  // const month = date.getMonth() + 1
  // const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  // return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
  return [hour, minute].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
//数组去重
function contains(arr, obj) {
  var i = arr.length;
  while (i--) {
    if (arr[i] === obj) {
      return true;
    }
  }
  return false;
}

// 设置缓存有效期时间
/**
     * 获取缓存
     * @param String $key  key
     * @param String $def  若想要无缓存时，返回默认值则get('key','默认值')（支持字符串、json、数组、boolean等等）
     * @return value;
     */
function getStor(key, def = '') {
  const timeout = parseInt(wx.getStorageSync(`${key}__separator__`) || 0);

  // 过期失效
  if (timeout) {
    console.log(Date.now());
    if (Date.now() > timeout) {
      this.removeStor(key);
      return;
    }
  }
  let value = wx.getStorageSync(key);
  return value ? value : def;
}

/**
 * 设置缓存
 * @param String $key       key
 * @param String $value     value（支持字符串、json、数组、boolean等等）
 * @param Number $timeout   过期时间（单位：分钟）不设置时间即为永久保存
 * @return value;
 */
function setStor(key, value) {
  // let _timeout = parseInt(timeout);
  let _timeout = 2;
  wx.setStorageSync(key, value);
  if (_timeout) {
    wx.setStorageSync(`${key}__separator__`, Date.now() + 3600000 * _timeout);
  } else {
    wx.removeStorageSync(`${key}__separator__`);
  }

  return value;
}

function removeStor(key) {
  wx.removeStorageSync(key);
  wx.removeStorageSync(`${key}__separator__`);
  wx.removeStorageSync('roomcode');
  wx.removeStorageSync('channel');
  wx.removeStorageSync('movableX');
  wx.removeStorageSync('movableY');
  return undefined;
}

module.exports = {
  formatTime: formatTime,
  contains: contains,
  setStor: setStor,
  getStor: getStor,
  removeStor: removeStor
}