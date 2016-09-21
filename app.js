'use strict'

var Koa = require('koa')
var cheerio = require('cheerio')
var superagent = require('superagent')
var utils = require('./utils')

var app = Koa()

// 获取公司列表页面
app.use(function *(next) {
  var pages = yield getPagesList()
  var urlList = getUrlsList(pages)  
  var infoList = yield getInfoList(urlList)

  this.body = infoList
})

// 获取要所有要抓取的网页的url
function getPageUrlsList(count) {
  var result = []
  var url = 'http://www.itjuzi.com/company'

  for (var i = 1; i <= count; i++) {
    result.push(url + '?page=' + i)
  }

  return result
}

// 获取所有要抓取网页的内容
function getPagesList() {
  var pages = []
  var urls = getPageUrlsList(100)

  console.log('要抓取的网页: \n', urls)

  return utils.asyncMapLimit(urls, 1000, 
    function (url, callback) {
      superagent
        .get(url)
        .end(function(err, res){  
          pages.push(res.text)
          callback(null, url);
        })
    }, 
    function () {
      return pages
    }
  )
}

// 获取所有要抓取的公司的url
function getUrlsList(pages) {
  var items = []

  for (var i = 0, len = pages.length; i < len; i++) {
    var $ = cheerio.load(pages[i])
    $('.main .list-main-icnset .pic a').each(function (idx, element) {
      items.push($(element).attr('href'))
    })
  }

  return items
}

// 获取所有公司的网页详情
function getInfoList(urlList) {
  var infoList = []

  console.log('要抓取的公司网址: \n', urlList)
  return utils.asyncMapLimit(urlList, 10, 
    function (url, callback) {
      superagent
        .get(url)
        .end(function(err, res){  
          infoList.push(getInfo(res.text))
          callback(null, url);
        })
    }, 
    function () {
      return infoList
    }
  )
}

// 获取公司的产品、名称、地址、招聘url
function getInfo(text) {
  var result = {}
  var $ = cheerio.load(text)

  result.product = $('.title b').children()[0].prev.data.replace(/\n|\t/g, '')
  result.name = $('.block-inc-info .block').eq(2).find('span').eq(0).text().replace('公司全称：', '')
  result.location = $('.aboutus').eq(0).find('li').eq(2).find('span').text()
  result.hrUrl = '' // 由于访问www.itjuzi.com太多次，IP被禁了，访问不了，无法继续下去，所以这一步没有完成。

  return result
}

app.listen(3000, function () {
  console.log('爬虫程序开始运行......');
  console.log('app is listening at port 3000')
})
