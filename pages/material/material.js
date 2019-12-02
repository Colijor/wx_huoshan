// pages/chat/chat.js
const app = getApp()
var websocket = require('../../utils/websocket.js');
var utils = require('../../utils/util.js');
var page = 1;
var hadLastPage = false;
var allItems = []; //全部素材
var cloundList = []; //云端素材
var localList = []; //本地素材
var timer = null;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    items: [], //素材集合
    userInfo: {},
    scrollTop: 0,
    ip: "",
    state: "-1",
    selected: true,
    selected1: false,
    selected2: false,
    type: 0, //0全部，1云端，2本地
    selectShow: false, //控制下拉列表的显示隐藏，false隐藏、true显示
    selectData: [], //下拉列表的数据
    index: 0, //选择的下拉列表下标
    classifyId: app.globalData.classifyId,
    rawid: 0, //素材id
    rawtypeid: 0, //素材类型id
    itemsIndex: 0, //items下标
    itemIndex: 0, //素材下标
    showId: '', //默认选择的素材
    notScanCode: true,
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 获取小程序用户信息
    if (app.globalData.id === -1) {
      wx.request({
        url: app.globalData.serverUrl + '/wx/user/' + app.globalData.appid + '/info',
        method: "get",
        data: {
          "appid": app.globalData.appid,
          "sessionKey": app.globalData.sessionKey,
          "signature": app.globalData.signature,
          "rawData": app.globalData.rawData,
          "iv": app.globalData.iv,
          "encryptedData": app.globalData.encryptedData
        },
        header: {
          'content-type': 'application/json'
        },
        success: function(res) {
          console.log("获取小程序用户信息");
          console.log(res);
        }
      });
    }
    this.getClassify();
  },
  onShow: function() {
    console.log('onShow');
    console.log(app.globalData.userInfo);

    page = 1;
    hadLastPage = false;

    var connectData = utils.getStor('connectData') || '';
    console.log("ip:" + connectData);
    if (connectData == '' || connectData == undefined) {
      this.setData({
        items: []
      });
      if (this.data.notScanCode) {
        wx.showToast({
          title: '登录已过期，请重新扫码',
          icon: "none",
          duration: 2000
        });
      }
      this.setData({
        notScanCode: true
      });
      return;
    } else {
      this.setData({
        ip: connectData
      });
      var that = this;

      websocket.connect(this.data.ip, function(res) {
          console.log("接受服务器返回来的消息");
          console.log(res);
          // 服务器主动断开连接
          if (res.data == "_sclose_") {
            clearInterval(timer);
          } else if (res.data == "ok") {
            console.log("心跳发送成功");
          } else {
            var jsonObj = JSON.parse(res.data);
            if (jsonObj.command == undefined) {
              //下载中
              if (jsonObj.data.command == "_changresstate" && jsonObj.data.type == 1) {
                var id = jsonObj.data.id;
                var data = that.data.items;
                console.log(id);
                console.log(data);
                for (let i = 0; i < data.length; i++) {
                  if (data[i].id == id) {
                    var state = 'items[' + i + '].state';
                    if (jsonObj.data.state == 1) {
                      setTimeout(function() {
                        that.setData({
                          [state]: jsonObj.data.state
                        });
                      }, 1500);
                    } else {
                      that.setData({
                        [state]: jsonObj.data.state
                      });
                    }
                    break;
                  }
                }
              }
            } else {
              if (jsonObj.command == "sendctrl") {
                if (jsonObj.result == "FAILED") {
                  wx.showToast({
                    title: jsonObj.message,
                    icon: "none",
                    duration: 2000
                  })
                }
                return;
              }
              if (jsonObj.command == "login") {
                if (jsonObj.result == "SUCCESS") {
                  var state = that.data.state;
                  that.getMaterials(state); //全部素材
                  // 5秒发送一次心跳
                  timer = setInterval(function() {
                    websocket.send("_m");
                  }, 5000);
                } else {
                  wx.showToast({
                    title: jsonObj.message,
                    icon: "none",
                    duration: 2000
                  })
                }
              }
              if (jsonObj.command == "getsrc") {
                if (jsonObj.result == "SUCCESS") {
                  var data = jsonObj.datas;
                  var item = page > 1 ? that.data.items : [];
                  console.log(data);
                  console.log(item);
                  data.forEach((items, index, arr) => {
                    if (items.resOwnerType == 1) {
                      var base64 = items.imageContent;
                      items.imageContent = base64.replace(/[\r\n]/g, "");
                    }
                    item.push(items);
                  });
                  console.log(item);
                  that.setData({
                    items: item
                  });
                  if (data.length > 0) {
                    page++;
                  } else {
                    hadLastPage = true;
                  }
                  wx.hideNavigationBarLoading();
                  return;
                } else if (jsonObj.result == "FAILED") {
                  wx.showToast({
                    title: jsonObj.message,
                    icon: "none",
                    duration: 2000
                  })
                }
              }
              //下载
              // if (jsonObj.command == "changresstate" && jsonObj.type == 1) {
              //   if (jsonObj.result == "SUCCESS") {
              //     var id = jsonObj.id;
              //     var data = that.data.items;
              //     console.log(data);
              //     for (let i = 0; i < data.length; i++) {
              //       if (data[i].id == id) {
              //         var state = 'items[' + i + '].state';
              //         setTimeout(function(){
              //           that.setData({
              //             [state]: jsonObj.state
              //           });
              //         },3000);
              //         break;
              //       }
              //     }
              //   } else if (jsonObj.result == "FAILED") {
              //     wx.showToast({
              //       title: '下载失败，请联系工作人员',
              //       icon: "none",
              //       duration: 2000
              //     })
              //   }
              // }
            }
          }
        },
        function(res) {
          // console.log("连接登陆");
          // console.log('{ "command": "login", "nickName": "' + app.globalData.userInfo.nickName + '", "avatarUrl": "' + app.globalData.userInfo.avatarUrl + '","code":"' + app.globalData.authcode + '","iv":"' + app.globalData.iv + '","encryptedData":"' + app.globalData.encryptedData + '","roomcode":"' + app.globalData.roomcode + '"}');
          websocket.send('{ "command": "login", "nickName": "' + app.globalData.userInfo.nickName + '", "avatarUrl": "' + app.globalData.userInfo.avatarUrl + '","code":"' + app.globalData.authcode + '","iv":"' + app.globalData.iv + '","encryptedData":"' + app.globalData.encryptedData + '" ,"roomcode":"' + app.globalData.roomcode + '"}');
        });
    }
  },
  onHide: function() {
    console.log("onhide");
    clearInterval(timer);
    wx.closeSocket();
  },
  onUnload: function() {
    console.log("onUnload");
    clearInterval(timer);
    wx.closeSocket();
  },
  getClassify: function() {
    var that = this;
    wx.request({
      url: app.globalData.serverUrl + '/select/list?code=6',
      method: "get",
      data: '',
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        console.log("获取分类下拉选项");
        console.log(res);
        let classify = [],
          items = [{
            "id": -1,
            "text": "全部分类"
          }];
        var arr = res.data;
        classify = arr.map((item) => {
          let json = {};
          json.id = item.id;
          json.text = item.name;
          return json;
        });
        classify.forEach((item, classify) => {
          items.push(item);
        })
        console.log(items);
        that.setData({
          selectData: items
        })
      }
    })
  },
  getMaterials: function(state) {
    //获取素材
    // 显示加载图标
    wx.showNavigationBarLoading();

    if (hadLastPage != false) {
      wx.hideNavigationBarLoading();
      wx.showToast({
        title: '没有加载的数据了',
      });
      return;
    }

    console.log('默认获取全部数据：');
    var data = {};
    data.command = "getsrc";
    data.type = "1";
    data.classify = app.globalData.classifyId;
    data.state = state;
    data.current = page;
    data.size = 8;
    data.channel = app.globalData.channel;
    console.log(JSON.stringify(data));
    websocket.send(JSON.stringify(data));
  },
  // 下载素材
  downraw: function(e) {
    var items = e.currentTarget.dataset.items;
    var itemsIndex = e.currentTarget.dataset.index;
    this.setData({
      itemsIndex: itemsIndex,
      showId: items.id
    });

    var data = {};
    data.command = "changresstate";
    data.id = items.id;
    data.type = "1";
    if (items.state == 0) {
      //未下载，先下载
      console.log("下载素材");
      console.log(JSON.stringify(data));
      websocket.send(JSON.stringify(data));
    } else if (items.state == 1) {
      //已下载，就播放
      var data = {
        command: "sendctrl",
        v: "17",
        d: {
          k1: items.txtPath,
          classifyName: items.classifyName
        }
      };
      console.log("播放素材");
      console.log(JSON.stringify(data));
      websocket.send(JSON.stringify(data));
    } else {
      //下载中
      wx.showToast({
        title: '下载中，请稍后',
        icon: "none",
        duration: 2000
      })
    }
  },
  selected: function(e) {
    this.setData({
      selected: true,
      selected1: false,
      selected2: false,
      state: -1
    });
    console.log("查询全部素材");
    page = 1;
    hadLastPage = false;
    this.getMaterials(this.data.state); //全部素材
  },
  selected1: function(e) {
    this.setData({
      selected: false,
      selected1: true,
      selected2: false,
      state: 0
    });
    console.log("查询云端素材");
    page = 1;
    hadLastPage = false;
    this.getMaterials(this.data.state); //云端素材
  },
  selected2: function(e) {
    this.setData({
      selected: false,
      selected1: false,
      selected2: true,
      state: 1
    });
    console.log("查询本地素材");
    page = 1;
    hadLastPage = false;
    this.getMaterials(this.data.state); //本地素材
  },
  // 点击下拉显示框
  selectTap() {
    this.setData({
      selectShow: !this.data.selectShow
    });
  },
  selectClick: function(res) {
    //获取点击事件的信息
    let clickInfo = res.detail.iteminfo
    console.log(clickInfo);
    this.setData({
      classifyId: clickInfo.id,
      selectShow: !this.data.selectShow
    });
    app.globalData.classifyId = this.data.classifyId;
    page = 1;
    hadLastPage = false;
    this.getMaterials(this.data.state);
  },
  menuItemClick: function(res) {
    //获取点击事件的信息
    let clickInfo = res.detail.iteminfo
    console.log(clickInfo);
    // 根据不同类型进行判别处理
    //事件的处理 代码
    switch (clickInfo.id) {
      case "1":
        websocket.send('{ "command": "sendctrl","v":"46","d":{"k1":0,"k2":0}}');
        break;
      case "2":
        websocket.send('{ "command": "sendctrl","v":"46","d":{"k1":0,"k2":1}}');
        break;
      case "3":
        websocket.send('{ "command": "sendctrl","v":"47","d":{"k1":0,"k2":0}}');
        break;
      case "4":
        websocket.send('{ "command": "sendctrl","v":"47","d":{"k1":0,"k2":1}}');
        break;
      case "5":
        websocket.send('{ "command": "sendctrl","v":"43","d":{"k1":0,"k2":1}}');
        break;
      case "6":
        this.setData({
          notScanCode: false
        });
        wx.scanCode({
          success: (res) => {
            var arr = res.result.split(",");
            console.log(arr);
            if (arr.length > 1) {
              utils.setStor('connectData', arr[0]);
              wx.setStorageSync('roomcode', arr[1]);
              wx.setStorageSync('channel', arr[2]);
              app.globalData.roomcode = arr[1];
              app.globalData.channel = arr[2];
            } else {
              utils.setStor('connectData', arr);
              wx.setStorageSync('roomcode', '12345');
              app.globalData.roomcode = '12345';
              app.globalData.channel = '-1';
            }
            this.setData({
              connectData: utils.getStor('connectData')
            });
            this.onShow();
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
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    console.log("执行下拉");
    page = 1;
    hadLastPage = false;
    this.setData({
      items: []
    });

    this.getMaterials(this.data.state);

    // 隐藏导航栏加载框
    wx.hideNavigationBarLoading();

    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    console.log("执行上拉");
    this.getMaterials(this.data.state);
  },
})