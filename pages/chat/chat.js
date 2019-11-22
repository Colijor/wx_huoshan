// pages/chat/chat.js
const app = getApp()
var websocket = require('../../utils/websocket.js');
var utils = require('../../utils/util.js');
var windowHeight = wx.getSystemInfoSync().windowHeight;
var keyHeight = 0; //软盘高度
var inputHeight = 55; //input宽高度
var tabarHeight = 66; //底部导航高度
var timer = null;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    bapingword: "",
    focus: false,
    fastMessage: false,
    newslist: [],
    userInfo: {},
    scrollTop: 0,
    message: "",
    previewImgList: [],
    ip: "",
    scrollHeight: windowHeight - 50 + 'px',
    fastList: [{
        text: "祝你生日快乐！！！！"
      },
      {
        text: "有一种朋友叫做“铁哥们”，有一种关系叫做“志同道合”，有一种友谊叫做“知心如意”，有一种感情叫做“情同手足”"
      },
      {
        text: "勤奋成就理想，自信铸造辉煌，祝你生意兴隆，万事如意。"
      },
      {
        text: "不管未来有多长，请记住成长的路上有你有我，不管经历多少春夏秋冬，请铭记共度的青春年华。"
      }
    ],
    menuWidth: 0,
    menuHeight: 0,
    inputBottom: '0px',
    toView: "msg-0",
    notScanCode: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    //this.onWebsocket();
  },
  onShow: function() {
    console.log('onShow');
    var that = this;
    console.log(app.globalData.userInfo);
    var connectData = utils.getStor('connectData') || '';
    if (connectData == '' || connectData == undefined) {
      this.setData({
        newslist: []
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
    }
    this.setData({
      userInfo: app.globalData.userInfo,
      ip: connectData
    });
    //调通接口
    websocket.connect(this.data.ip, function(res) {
      console.log("服务器返回的消息：");
      // console.log(res);
      // 服务器主动断开连接
      if (res.data == "_sclose_") {
        clearInterval(timer);
      } else if (res.data == "ok") {
        console.log("心跳发送成功");
      } else {
        var jsonObj = JSON.parse(res.data);
        console.log(jsonObj.command);

        if (jsonObj.command == "sendctrl") {
          return;
        }

        if (jsonObj.command == "login") {
          if (jsonObj.result == "SUCCESS") {
            // 5秒发送一次心跳
            timer = setInterval(function() {
              websocket.send("_m");
            }, 5000);
          }else{
            wx.showToast({
              title: jsonObj.message,
              icon: "none",
              duration: 2000
            })
          }
        }

        //播放器有没有显示弹幕
        if (jsonObj.command == "chat") {
          if (jsonObj.result == "SUCCESS") {
            console.log('播放器弹幕显示成功');
          } else if (jsonObj.result == "FAILED") {
            wx.showToast({
              title: jsonObj.message,
              icon: "none",
              duration: 2000
            })
          }
        }

        //接收广播消息
        if (jsonObj.command == "_chat") {
          var list = [];
          list = that.data.newslist;
          var item = {};
          item.nickName = jsonObj.nickName;
          item.avatarUrl = jsonObj.avatarUrl;
          item.content = jsonObj.content;
          item.date = jsonObj.date;
          item.type = jsonObj.type;
          console.log(item);
          list.push(item);
          var scrollTop = list.length * 130;
          that.setData({
            newslist: list
          });
          that.setData({
            toView: 'msg-' + (that.data.newslist.length - 1),
          })
          console.log(that.data.newslist.length);
        }
      }
    }, function(res) {
      console.log('{ "command": "login", "nickName": "' + app.globalData.userInfo.nickName + '", "avatarUrl": "' + app.globalData.userInfo.avatarUrl + '","code":"' + app.globalData.authcode + '","iv":"' + app.globalData.iv + '","encryptedData":"' + app.globalData.encryptedData + '" ,"roomcode":"' + app.globalData.roomcode + '"}');
      websocket.send('{ "command": "login", "nickName": "' + app.globalData.userInfo.nickName + '", "avatarUrl": "' + app.globalData.userInfo.avatarUrl + '","code":"' + app.globalData.authcode + '","iv":"' + app.globalData.iv + '","encryptedData":"' + app.globalData.encryptedData + '" ,"roomcode":"' + app.globalData.roomcode + '"}');
    })
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

  //事件处理函数
  send: function() {
    console.log("点击发送");
    // this.setData({
    //   focus: true
    // })
    var message = this.data.message.trim();
    console.log(message);
    var that = this;
    if (message == "") {
      wx.showToast({
        title: '消息不能为空哦~',
        icon: "none",
        duration: 2000
      })
    } else {
      wx.request({
        url: app.globalData.serverUrl + '/wx/user/' + app.globalData.appid + '/senstive?words=' + encodeURIComponent(message),
        method: "get",
        data: '',
        header: {
          'content-type': 'application/json'
        },
        success: function(res) {
          console.log(res);
          if (res.data.code === 0) {
            websocket.send('{"command": "chat", "content": "' + that.data.message + '", "date": "' + utils.formatTime(new Date()) + '","type":"text", "nickName": "' + app.globalData.userInfo.nickName + '", "avatarUrl": "' + app.globalData.userInfo.avatarUrl + '" }');
            that.setData({
              message: ''
            })
          } else {
            wx.showToast({
              title: '请规范您的用语',
              icon: "none",
              duration: 2000
            });
          }
        }
      })
    }
  },
  //监听input值的改变
  bindChange(res) {
    this.setData({
      message: res.detail.value
    });
  },
  chooseImage() {
    var that = this
    wx.chooseImage({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success: function(res) {

        wx.getFileSystemManager().readFile({
          filePath: res.tempFilePaths[0],
          encoding: 'base64',
          success: res1 => {
            //返回临时文件路径
            var index = res.tempFiles[0].path.lastIndexOf(".");
            var suffix = res.tempFiles[0].path.substr(index + 1);

            // console.log('{"command":"baping","nickName":"' + app.globalData.userInfo.nickName + '","size":"' + res.tempFiles[0].size + '","suffix":"' + suffix + '","data":"' + res1.data + '"}');
            // websocket.send('{"command":"baping","nickName":"' + app.globalData.userInfo.nickName + '","size":"' + res.tempFiles[0].size + '","duration":0,"suffix":"' + suffix + '","data":"' + res1.data + '"}');
          },
          fail: console.error
        })
        return;
      }
    })
  },
  /**
   * 获取聚焦
   */
  focus: function(e) {
    var keyHeight = e.detail.height;
    console.log("获取焦点");
    this.setData({
      scrollHeight: (windowHeight - keyHeight - 46) + 'px'
    });
    this.setData({
      toView: 'msg-' + (this.data.newslist.length - 1),
      inputBottom: (keyHeight - 46) + 'px'
    })
    console.log("scrollHeight" + this.data.scrollHeight);
    console.log("toView: " + this.data.newslist.length);
    //计算msg高度
    // calScrollHeight(this, keyHeight);

  },
  //失去聚焦(软键盘消失)
  blur: function(e) {
    console.log("失去聚焦");
    this.setData({
      scrollHeight: (windowHeight - 50) + 'px'
    });
    this.setData({
      // toView: 'msg-' + (this.data.newslist.length - 1),
      inputBottom: '0px'
    })
    console.log(this.data.scrollHeight, this.data.newslist.length);
  },
  //图片预览
  previewImg(e) {
    var that = this
    //必须给对应的wxml的image标签设置data-set=“图片路径”，否则接收不到
    var res = e.target.dataset.src
    var list = this.data.previewImgList //页面的图片集合数组

    //判断res在数组中是否存在，不存在则push到数组中, -1表示res不存在
    if (list.indexOf(res) == -1) {
      this.data.previewImgList.push(res)
    }
    wx.previewImage({
      current: res, // 当前显示图片的http链接
      urls: that.data.previewImgList // 需要预览的图片http链接列表
    })

  },
  //点击空白隐藏message下选框
  outbtn() {
    this.setData({
      fastMessage: false
    })
  },
  inputbaping: function(e) {
    this.setData({
      bapingword: e.detail.value
    })
  },
  fastKeyboard: function() {
    this.setData({
      fastMessage: !this.data.fastMessage
    })
  },
  fastSend: function(e) {
    var message = e.currentTarget.dataset.text;
    websocket.send('{"command": "chat", "content": "' + message + '", "date": "' + utils.formatTime(new Date()) + '","type":"text", "nickName": "' + app.globalData.userInfo.nickName + '", "avatarUrl": "' + app.globalData.userInfo.avatarUrl + '" }');
    this.setData({
      fastMessage: false
    })
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
              app.globalData.roomcode = arr[1];
            } else {
              utils.setStor('connectData', arr);
              wx.setStorageSync('roomcode', '12345');
              app.globalData.roomcode = '12345';
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
  }
})