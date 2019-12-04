// pages/chat/chat.js
const app = getApp()
var websocket = require('../../utils/websocket.js');
var utils = require('../../utils/util.js');
var page = 1;
var hadLastPage = false;
var cloundLists = []; //云端素材
var localsrcs = []; //本地素材
var timer = null;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    hiddenmodalput: false,
    items: [], //后台霸屏效果
    materialList: [],
    newslist: [],
    userInfo: {},
    scrollTop: 0,
    increase: true, //霸屏图片是否显示
    isdisabled: false, //禁止霸屏文字输入
    bapingid: '', //选中的id
    aniStyle: true, //动画效果
    previewImgList: [],
    selectTime: false, //控制显示时长价格，false隐藏、true显示
    selectShow: false, //控制显示时长下拉，false隐藏、true显示
    selectData: [], //下拉列表的数据
    screenId: '',
    //index: 0, //时长下标
    ip: "",
    free: 0, //默认0收费
    bpImg: "",
    bpZhuti: "",
    // 霸屏发送内容
    theme: "", //主题霸屏名称
    bapingword: "", //霸屏文字
    size: "", //霸屏图片大小
    suffix: "", //图片后缀
    data: "", //图片base64
    duration: 0, //免费默认6秒，霸屏时长
    price: 0, //价格
    itemsIndex: 0, //被点击的主题下标
    notScanCode: true,
    state: "-1"
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    //this.onWebsocket();
  },
  onShow: function() {
    console.log('onShow');
    page = 1;
    hadLastPage = false;

    var that = this;
    console.log(app.globalData.userInfo);
    var connectData = utils.getStor('connectData') || '';
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
    }
    this.setData({
      ip: connectData
    });
    //调通接口，调用的是机顶盒本地素材
    websocket.connect(this.data.ip, function(res) {
        //接受服务器返回来的消息
        console.log("这里是后台返回的数据");
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
            if (jsonObj.data.command == "_changresstate" && jsonObj.data.type == 3) {
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
              return;
            }
            if (jsonObj.command == "login") {
              if (jsonObj.result == "SUCCESS") {
                // 5秒发送一次心跳
                timer = setInterval(function() {
                  websocket.send("_m");
                }, 5000);
                that.getScreen();
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
                // var data = app.globalData.bapData;
                var item = page > 1 ? that.data.items : [];
                console.log(data);
                console.log(item);
                data.forEach((items, index, arr) => {
                  // console.log(items.state);
                  // console.log(that.data.state);
                  // if (items.state == that.data.state || that.data.state == "-1") {
                  item.push(items);
                  // }
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
            // if (jsonObj.command == "changresstate" && jsonObj.type == 3) {
            //   if (jsonObj.result == "SUCCESS") {
            //     var id = jsonObj.id;
            //     var data = that.data.items;
            //     console.log(data);
            //     for (let i = 0; i < data.length; i++) {
            //       if (data[i].id == id) {
            //         var state = 'items[' + i + '].state';
            //         that.setData({
            //           [state]: jsonObj.state
            //         });
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
        console.log("在这里连接成功后，可以发送消息");
        websocket.send('{ "command": "login", "nickName": "' + app.globalData.userInfo.nickName + '", "avatarUrl": "' + app.globalData.userInfo.avatarUrl + '","code":"' + app.globalData.authcode + '","iv":"' + app.globalData.iv + '","encryptedData":"' + app.globalData.encryptedData + '" ,"roomcode":"' + app.globalData.roomcode + '"}');

      });
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
  getScreen: function() {
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
    data.type = "3";
    data.classify = "-1";
    data.state = "-1";
    data.current = page;
    data.size = 8;
    data.channel = app.globalData.channel;
    console.log(JSON.stringify(data));
    websocket.send(JSON.stringify(data));
  },
  getClassify: function() {
    var that = this;
    wx.request({
      url: app.globalData.serverUrl + '/time_price/list',
      method: "get",
      data: '',
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        console.log("获取时长+价格下拉选项");
        console.log(res);
        let classify = [];
        let items = [];
        // let items = [{
        //     "id": 0,
        //     "text": "请选择",
        //     "price": ''
        //   }];
        var arr = res.data;
        classify = arr.map((item) => {
          let json = {};
          json.id = item.id;
          json.text = item.time;
          json.price = item.price;
          return json;
        });
        classify.forEach((item, classify) => {
          items.push(item);
        })
        console.log(items);
        that.setData({
          selectData: items,
          // duration: classify[0].time,
          // price: classify[0].price
        })
      }
    })
  },
  //事件处理函数
  send: function() {
    var that = this
    var message = this.data.bapingword.trim();
    var bpImg = this.data.bpImg;
    var theme = this.data.theme;
    var duration = this.data.duration;
    console.log(duration);
    console.log(theme);
    if (duration == 0) {
      wx.showToast({
        title: '请选择霸屏时长',
        icon: "none",
        duration: 2000
      })
    } else {
      if (bpImg == "") {
        wx.request({
          url: app.globalData.serverUrl + '/wx/user/' + app.globalData.appid + '/senstive?words=' + encodeURIComponent(message),
          method: "get",
          data: '',
          header: {
            'content-type': 'application/json'
          },
          success: function(res) {
            that.setData({
              focus: true
            })
            console.log(res);
            if (res.data.code === 0) {
              setTimeout(function() {
                that.setData({
                  hiddenmodalput: false
                })
              }, 500);
              var data = {};
              data.command = "bapingword",
                data.nickName = app.globalData.userInfo.nickName,
                data.theme = theme,
                data.bapingword = message,
                data.duration = duration
              console.log(JSON.stringify(data));
              websocket.send(JSON.stringify(data));
              // 发送后清空霸屏内容
              that.cleanInput();
            } else {
              wx.showToast({
                title: '请规范您的用语',
                icon: "none",
                duration: 2000
              });
            }
          }
        });
      } else {
        //霸屏图片
        var data = {};
        data.command = "bapingpic";
        data.nickName = app.globalData.userInfo.nickName;
        data.size = that.data.size;
        data.suffix = that.data.suffix;
        data.pic = that.data.data;
        data.theme = theme;
        data.duration = duration;

        console.log("霸屏图片");
        console.log(JSON.stringify(data));
        websocket.send(JSON.stringify(data));
        setTimeout(function() {
          that.setData({
            hiddenmodalput: false
          })
        }, 500);
        // 发送后清空霸屏内容
        that.cleanInput();
      }
    }
  },
  /**
   * 获取聚焦
   */
  focus: function (e) {
    var keyHeight = e.detail.height;
    console.log("获取焦点" + e.detail.height);
    this.setData({
      inputBottom: keyHeight + 'px'
    })
    console.log(this.data.inputBottom);
  },
  //失去聚焦(软键盘消失)
  blur: function (e) {
    console.log("失去聚焦");
    this.setData({
      inputBottom: '120rpx'
    })
    console.log(this.data.inputBottom);
  },
  //监听input值的改变
  bindChange: function(e) {
    if (e.detail.value == '') {
      this.setData({
        increase: true
      });
    } else {
      this.setData({
        increase: false
      });
    }
    this.setData({
      bapingword: e.detail.value
    });
  },
  cleanInput() {
    //button会自动清空，所以不能再次清空而是应该给他设置目前的input值
    this.setData({
      bpImg: '',
      theme: '',
      bapingword: '',
      size: '',
      suffix: '',
      data: '',
      duration: '',
      isdisabled: false,
      increase: true
    })
  },
  increase(e) {
    var baping = e.currentTarget.dataset.baping;
    var itemsIndex = e.currentTarget.dataset.index;
    console.log("获取霸屏数据");
    console.log(baping);
    this.setData({
      hiddenmodalput: false,
      bapingid: baping.id,
      itemsIndex: itemsIndex,
      theme: baping.name,
      bpZhuti: 'https://huoshan.szhssj.com.cn/baping/' + baping.id+'/frame_compact.png',
      free: baping.free,
      showId: baping.id,
      price: 0
    })
    if (baping.state == 0) {
      //未下载
      var data = {};
      data.command = "changresstate";
      data.id = baping.id;
      data.type = "3";

      // var state = 'items[' + itemsIndex + '].state';
      // this.setData({
      //   [state]: 2
      // });

      console.log(JSON.stringify(data));
      websocket.send(JSON.stringify(data));
    } else if (baping.state == 1) {
      //已下载,可以设置霸屏内容了
      this.setData({
        hiddenmodalput: true
      });
      if (baping.free == 0) {
        this.setData({
          selectTime: true
        });
        this.getClassify();
      } else {
        this.setData({
          selectData: [],
          duration: 6, //免费默认6秒
          price: 0,
          selectTime: false
        });
      }
    } else {
      //下载中
      this.closeBpSet();
      wx.showToast({
        title: '下载中，请稍后',
        icon: "none",
        duration: 2000
      })
    }
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
            // var base64ImgUrl = "data:image/png;base64," + res1.data.toString();
            // console.log(base64ImgUrl);
            that.setData({
              bpImg: res.tempFilePaths[0],
              theme: that.data.theme,
              bapingword: that.data.bapingword,
              size: res.tempFiles[0].size,
              suffix: suffix,
              data: res1.data,
              duration: that.data.duration,
              isdisabled: true
            });
            console.log('bpImg:' + that.data.bpImg + 'theme:' + that.data.theme + 'bapingword:' + that.data.bapingword + 'size:' + that.data.size + 'suffix:' + that.data.suffix + 'duration:' + that.data.duration);
          },
          fail: console.error
        })
        return;
      }
    })
  },
  // 点击下拉显示框
  selectTap() {
    if (this.data.free == 0) {
      this.setData({
        selectShow: !this.data.selectShow
      });
    } else {
      this.setData({
        selectShow: false
      });
    }
  },
  // 点击下拉列表
  selectClick: function(res) {
    //获取点击事件的信息
    let clickInfo = res.detail.iteminfo
    console.log(clickInfo);
    this.setData({
      screenId: clickInfo.id,
      duration: clickInfo.text,
      price: clickInfo.price
    });
  },
  // 关闭霸屏设置
  closeBpSet() {
    this.cleanInput();
    this.setData({
      hiddenmodalput: false
    });
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

    this.getScreen();

    // 隐藏导航栏加载框
    wx.hideNavigationBarLoading();

    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    console.log("执行上拉");
    this.getScreen();
  },

})