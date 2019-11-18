// 聊天室
// var utils = require('./util.js');
const app = getApp();

function connect(ip, func, initfunc) {
  var url = 'ws://' + ip + ':2860';
  wx.connectSocket({
    url: url,
    header: {
      'content-type': 'application/json'
    },
    success: function() {
      console.log('信道连接成功~');
    },
    fail: function() {
      console.log('信道连接失败~')
    }
  });

  wx.onSocketOpen(function(res) {
    /*wx.showToast({
      title: '连接成功~',
      icon: "success",
      duration: 2000
    });*/
    initfunc();
    //接受服务器消息
    wx.onSocketMessage(func); //func回调可以拿到服务器返回的数据
  });
  wx.onSocketError(function(res) {
    console.log(res);
    // 隐藏导航栏加载框
    wx.hideNavigationBarLoading();
    wx.showToast({
      title: '连接设备失败，请联系工作人员！',
      icon: "none",
      duration: 2000
    });
  });
  // 监听WebSocket关闭
  wx.onSocketClose(function(res) {
    console.log('监听到 WebSocket 已关闭！');
  });
}
//发送消息
function send(msg) {
  wx.sendSocketMessage({
    data: msg
  });
}

module.exports = {
  connect: connect,
  send: send
}