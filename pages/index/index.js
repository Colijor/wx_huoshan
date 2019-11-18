//index.js
//获取应用实例
const app = getApp();
var websocket = require('../../utils/websocket.js');
var utils = require('../../utils/util.js');
Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    loginMsg: ' ♥ 扫码进入',
    //connectData: '',
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  //事件处理函数
  // bindViewTap: function() {
  //   wx.navigateTo({
  //     url: '../chat/chat'
  //   })
  // },
  toChat: function() {
    var that = this;
    var connectData = utils.getStor('connectData') || '';
    console.log(connectData);
    if (app.globalData.userInfo == null) {
      wx.showToast({
        title: '请先登录后，再进入。',
        icon: "none",
        duration: 2000
      });
      return;
    }

    if (connectData) {
      app.globalData.roomcode = wx.getStorageSync('roomcode')||'12345';
      app.globalData.channel = wx.getStorageSync('channel') || '-1';
      this.connectSocket();
    } else {
      wx.scanCode({
        success: (res) => {
          var arr = res.result.split(",");
          console.log(arr);
          if(arr.length > 1){
            utils.setStor('connectData', arr[0]);
            wx.setStorageSync('roomcode', arr[1]);
            wx.setStorageSync('channel', arr[2]);
            app.globalData.roomcode = arr[1];
            app.globalData.channel = arr[2];
          }
          this.connectSocket();
        },
        fail: (res) => {
          wx.showToast({
            title: '失败',
            icon: 'success',
            duration: 2000
          })
        },
        complete: (res) => {}
      });
    }
  },
  connectSocket: function(){
    var that = this;
    var connectData = utils.getStor('connectData');
    var url = 'ws://' + connectData + ':2860';
    wx.connectSocket({
      url: url,
      header: {
        'content-type': 'application/json'
      },
      success: function () {
        console.log('信道连接成功~');
        wx.showToast({
          title: '连接中...',
          icon: "none",
          duration: 100000
        });
      },
      fail: function () {
        console.log('信道连接失败~');
      }
    });
    wx.onSocketOpen(function (res) {
      console.log('连接打开');
      wx.switchTab({
        url: '../material/material',
      })
    });
    wx.onSocketError(function (res) {
      utils.removeStor('connectData');
      that.setData({
        loginMsg: ' ♥ 扫码进入'
      });
      wx.showToast({
        title: '连接设备失败，请联系工作人员！',
        icon: "none",
        duration: 2000
      });
    });
    // 监听WebSocket关闭
    wx.onSocketClose(res => {
      console.log('监听到 WebSocket 已关闭！');
    });
  },
  onLoad: function() {
    var connectData = utils.getStor('connectData') || '';
    // 获取用户信息后，判断缓存里的ip地址是否过期，没过期就直接进入，过期扫码再加入
    if (connectData) {
      this.setData({
        loginMsg: ' ♥ 点击进入'
      })
    }
    // 登录
    wx.login({
      success: res => {
        // ------ 获取凭证 ------
        var code = res.code;
        if (code) {
          console.log(res);
          console.log('获取用户登录凭证：' + code);
          app.globalData.authcode = code;
          wx.request({
            url: app.globalData.serverUrl + '/wx/user/' + app.globalData.appid + '/login',
            method: "get",
            data: {
              appid: app.globalData.appid,
              code: code
            },
            header: {
              "Content-Type": "application/json"
            },
            success: res => {
              console.log("获取sessionkey");
              console.log(res);
              if (res.data.code === 0) {
                app.globalData.sessionKey = res.data.data.sessionKey;
                app.globalData.id = res.data.data.id;
                console.log(app.globalData.id);
              }
            }
          });
        } else {
          console.log('获取用户登录失败：' + res.errMsg);
        }
      }
    })

    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      });
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        console.log("userInfoReadyCallback");
        app.globalData.encryptedData = res.encryptedData;
        app.globalData.iv = res.iv;
        app.globalData.rawData = res.rawData;
        app.globalData.signature = res.signature;
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          });
        }
      })
    }
  },
  onHide: function() {
    console.log("index--onHide");
    wx.closeSocket();
  },
  onUnload: function() {
    console.log("index--onUnload");
    wx.closeSocket();
  },
  getUserInfo: function(e) {
    console.log(e);
    if (e.detail.userInfo == undefined) {
      return;
    }
    app.globalData.userInfo = e.detail.userInfo;
    app.globalData.encryptedData = e.detail.encryptedData;
    app.globalData.iv = e.detail.iv;
    app.globalData.rawData = e.detail.rawData;
    app.globalData.signature = e.detail.signature;
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    });
  }
})