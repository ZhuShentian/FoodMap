const app = getApp();
const config = require('../../config.js');
const db = wx.cloud.database()
const store = db.collection('store');
const userInfo = db.collection('userInfo');
const myApi = require('../../utils/myApi')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    setting: {
      skew: 0,
      rotate: 0,
      showLocation: true,
      showScale: true,
      subKey: '',
      layerStyle: -1,
      enableZoom: true,
      enableScroll: true,
      enableRotate: true,
      showCompass: true,
      enable3D: false,
      enableOverlooking: false,
      enableSatellite: false,
      enableTraffic: false,
    },
    longitude: config.center_longitude,
    latitude: config.center_latitude,
    windowHeight: 600,
    mapSubKey: config.mapSubKey,
    hideMe: true,
    showAdmin: false,
  },
  toAdd(e) {
    wx.navigateTo({
      url: '../add/add',
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {

    var that = this
    setTimeout(() => {
      this.setData({
        hideMe: true
      })
    }, 3000);
    this.setData({
      windowHeight: app.globalData.windowHeight,
      defaultScale: config.default_scale
    })
  },
  async initMap() {
    var that = this
    wx.getLocation({
      type: 'gcj02', //返回可以用于wx.openLocation的经纬度
      altitude: 'true',
      isHighAccuracy: 'true',
      success(res) {
        //console.log(res)
        const latitude = res.latitude
        const longitude = res.longitude
        that.setData({
          latitude: latitude,
          longitude: longitude,
        })

      }
    })

    //获取openid,然后从云端获取该id的数据
    var openId = wx.getStorageSync('openID')
    var storesArr = []
    //如果id为空
    if (openId == '') {
      //初始化
      var info = {
        time: myApi.formatDate(new Date())
      }
      await wx.cloud.callFunction({
        name: "getUserOpenId",
        data: {
          action: 'initInfo',
          info: info,
          shareCode: myApi.getRandomCode(6)
        }
      }).then(res => {
        console.log(res)
        app.globalData.openId = res.result.openId
        wx.setStorageSync('openID', res.result.openId)
        wx.setStorageSync('shareCode', res.result.shareCode);
      })
    } else {
      console.log(openId)
      var info = await userInfo.where({
        openId: openId
      }).get()
      console.log(info)
      if (info.data.length != 0) {
        storesArr = info.data[0].stores
        wx.setStorageSync('shareCode', info.data[0].shareCode);
      }
    }
    wx.setStorageSync('storesArr', storesArr)
    console.log(storesArr)
    this.setData({
      stores: storesArr,
    })
  },

  onShow: function () {
    this.initMap()
  },

  viewAll: function () {
    wx.navigateTo({
      url: '../list/list?action=viewSelf',
    })
  },
  toList:function(){
    wx.navigateTo({
      url: '../list/list?action=viewOthers',
    })
  },
  //TODO 获取用户信息
  getUserInfo: function (e) {

    if (e.detail.userInfo) {
      var info = e.detail.userInfo
      var userInfo = wx.getStorageSync('userInfo')
      if (userInfo == '' || userInfo == undefined) {
        wx.setStorageSync('userInfo', info)
        //console.log(info)
        wx.cloud.callFunction({
          name: "getUserOpenId",
          data: {
            action: 'initInfo',
            info: info
          }
        }).then(res => {
          console.log(res)
          app.globalData.openId = res.result.openId
          wx.setStorageSync('openID', res.result.openId)
        })
      }
      wx.navigateTo({
        url: '../add/add',
      })
    } else {
      // 处理未授权的场景
      wx.showModal({
        title: '授权失败',
        content: '您尚未授权获取您的用户信息，是否开启授权界面？',
        success: res => {
          if (res.confirm) {
            wx.openSetting({})
          }
        }
      })
    }


  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '我在' + config.appName + '上发现了好吃的，你也看看吧！',
      path: '/pages/map/map',
      imageUrl: "/images/share.jpg"
    }
  },
  onMarkerTap: function (event) {
    console.log(event)
    wx.navigateTo({
      url: '../info/info?id=' + event.markerId,
    })
  },
  getOpenID: function (event) {
    wx.cloud.callFunction({
      name: "getUserOpenId"
    }).then(res => {
      wx.setClipboardData({
        data: res.result.openid,
        success: res => {
          wx.showToast({
            title: 'openID已复制',
          })
        }
      })
    })
  },
  hideMe: function (res) {
    this.setData({
      hideMe: true
    })
  },
  showAdmin: function (res) {
    wx.setStorage({
      key: 'showAdmin',
      data: !this.data.showAdmin,
    })
    this.setData({
      showAdmin: !this.data.showAdmin
    })
  },
  search: function () {
    wx.navigateTo({
      url: '../search/search',
    })
  }
})