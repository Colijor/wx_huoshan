// components/menu/menu.js
var app = getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // mainmodel: {
    //   type: Object,
    //   value: {}
    // },
    // menulist: {
    //   type: Object,
    //   value: []
    // }
  },

  /**
   * 组件的初始数据
   */
  data: {
    areaWidth: wx.getSystemInfoSync().windowWidth - 30,
    areaHeight: wx.getSystemInfoSync().windowHeight - 130,
    showmenus: true,
    isChange: false,
    x: app.globalData.x,
    y: app.globalData.y,
    moveX: 0,
    moveY: 0,
    absolute: "right",
    absolute2: "bottom",
    menulist: [{
        "id": "1",
        "ico": "icon-jia",
        "title": "音量",
      },
      {
        "id": "2",
        "ico": "icon-jian",
        "title": "音量",
      },
      {
        "id": "3",
        "ico": "icon-play",
        "title": "播放",
      },
      {
        "id": "4",
        "ico": "icon-zanting",
        "title": "暂停",
      },
      {
        "id": "5",
        "ico": "icon-quanping",
        "title": "全屏",
      },
      {
        "id": "6",
        "ico": "icon-iconfontsaoyisao-copy",
        "title": "扫码",
      },
      {
        "id": "7",
        "ico": "icon-beijing",
        "title": "背景",
      }
    ],
    mainmodel: {
      "ico": "iconfonts icon-shouqi",
    },
  },
  pageLifetimes: {
    // 组件所在页面的生命周期函数
    show() {
      console.log('pageLifetimes');
      let x = app.globalData.x;
      let y = app.globalData.y;
      console.log(x,y)
      this.setData({
        x: x,
        y: y,
        showmenus: true
      })
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    showclick: function() {
      console.log("showclick")
      let isshow = !this.data.showmenus;
      console.log(isshow);
      this.setData({
        showmenus: isshow,
      });
      if (this.data.x == 0) {
        if(this.data.y == 0){
          this.setData({
            absolute: "left",
            absolute2: "top"
          })
        }else{
          this.setData({
            absolute: "left",
            absolute2: "bottom"
          })
        }
      } else {
        if (this.data.y == 0) {
          this.setData({
            absolute: "right",
            absolute2: "top"
          })
        } else {
          this.setData({
            absolute: "right",
            absolute2: "bottom"
          })
        }
      }
    },
    itemclick: function(e) {
      // this.showclick();
      // console.log(e.currentTarget.dataset);
      let info = e.currentTarget.dataset.item;
      if (info) {
        this.triggerEvent('menuItemClick', {
          "iteminfo": info
        });
        if(info.id == 6){
          this.setData({
            showmenus: true,
          });
        }
      }
    },
    movableChange: function (e) {
      console.log("bindchange");
      console.log(e.detail);
      if(this.data.showmenus == false){
        this.setData({ showmenus: true})
      }
      this.setData({
        moveX: e.detail.x,
        moveY: e.detail.y,
        isChange: true
      })
    },
    movableTochend: function() {
      console.log("movableTochend");
      console.log(this.data.moveX);
      console.log(this.data.moveY);
      if (this.data.isChange) {
        var areaY = wx.getSystemInfoSync().windowHeight / 2;
        this.setData({
          x: this.data.moveX,
          isChange: false
        });
        if (this.data.moveY < areaY) {
          this.setData({
            y: 0,
            moveY: 0
          });
        } else {
          this.setData({
            y: wx.getSystemInfoSync().windowHeight,
            moveY: wx.getSystemInfoSync().windowHeight
          });
        }
        console.log("movableTochend");
        app.globalData.x = this.data.x;
        app.globalData.y = this.data.y;
      }else{
        console.log("按钮被点击");
        if (this.data.x == 0) {
          if (this.data.y == 0) {
            this.setData({
              absolute: "left",
              absolute2: "top"
            })
          } else {
            this.setData({
              absolute: "left",
              absolute2: "bottom"
            })
          }
        } else {
          if (this.data.y == 0) {
            this.setData({
              absolute: "right",
              absolute2: "top"
            })
          } else {
            this.setData({
              absolute: "right",
              absolute2: "bottom"
            })
          }
        }
      }
    }
  }
})