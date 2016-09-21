'use strict'

var Koa = require('koa')
var cheerio = require('cheerio')
var superagent = require('superagent')
var utils = require('../../utils')
var url = require('url')

var app = Koa()

var CNODE_URL = 'https://cnodejs.org/'
var PAGE_SUM = 1
var ASYNC_LIMIT = 5

// 获取公司列表页面
app.use(function *(next) {
  var pages = yield getPagesList()
  var topicUrls = getUrlsList(pages)  
  var infoList = yield getInfoList(topicUrls)

  this.body = infoList
})

// 获取要所有要抓取的网页的url
function getPageUrlsList(count) {
  var result = []

  for (var i = 1; i <= count; i++) {
    result.push(CNODE_URL + '?tab=all&page=' + i)
  }

  return result
}

// 获取所有要抓取网页的内容
function getPagesList() {
  var pages = []
  var urls = getPageUrlsList(PAGE_SUM)

  console.log('要抓取的网页: \n', urls)
  return utils.asyncMapLimit(urls, ASYNC_LIMIT, 
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

// 获取所有要抓取的文章的url
function getUrlsList(pages) {
  var topicUrls = []

  for (var i = 0, len = pages.length; i < len; i++) {
    var $ = cheerio.load(pages[i])
    $('#topic_list .topic_title').each(function (idx, element) {
      var $element = $(element)
      var href = url.resolve(CNODE_URL, $element.attr('href'))
      topicUrls.push(href)
    })
  }

  return topicUrls
}

// 获取所有公司的网页详情
function getInfoList(topicUrls) {
  var infoList = []

  console.log('要抓取的文章的url: \n', topicUrls)
  return utils.asyncMapLimit(topicUrls, ASYNC_LIMIT, 
    function (topicUrl, callback) {
      superagent
        .get(topicUrl)
        .end(function(err, res){  
          console.log('fetch ' + topicUrl + ' successful');
          infoList.push(getInfo(res.text, topicUrl))
          callback(null, topicUrl)
        })
    }, 
    function () {
      return infoList
    }
  )
}

// 获取公司的产品、名称、地址、招聘url
function getInfo(text, topicUrl) {
  var $ = cheerio.load(text)

  return {
    title: $('.topic_full_title').text().trim(),
    href: topicUrl,
    comment1: $('.reply_content').eq(0).text().trim()
  }
}

app.listen(3000, function () {
  console.log('爬虫程序开始运行......');
  console.log('app is listening at port 3000')
})
