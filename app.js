var Koa = require('koa')
var cheerio = require('cheerio')
var superagent = require('superagent')
var Promise = require('bluebird')
var async = require('async')

var app = Koa()

// 获取公司列表页面
app.use(function *(next) {
  var res = yield getPage()
  var urlList = getUrlList(res.text)  
  var infoList = yield getInfoList(urlList)

  // console.log(res.text)
  // console.log(urlList)
  // console.log(infoList)

  this.body = infoList
})

function getPage() {
  return superagent.get('http://www.itjuzi.com/company')
}

function getUrlList(text) {
  var $ = cheerio.load(text)
  var items = []
  $('.main .list-main-icnset .pic a').each(function (idx, element) {
    items.push($(element).attr('href'))
  })
  return items
}

function getInfoList(urlList) {
  var infoList = []
  var concurrencyCount = 0; // 当前并发数记录

  urlList = urlList.slice(0, 30)

  return new Promise(function(resolve, reject) {
    async.mapLimit(urlList, 30, 
      function (url, callback) {
        concurrencyCount++;
        console.log("...正在抓取"+ url + "...当前并发数记录：" + concurrencyCount);

        superagent
          .get(url)
          .end(function(err, res){  
            infoList.push(getInfo(res.text))
            concurrencyCount--;
            callback(null, url);
          });
      }, 
      function (err, result) {
        if (err) reject(err)

        console.log('抓取数：' + urlList.length);
        resolve(infoList)
      }
    )
  })
}

function getInfo(text) {
  var result = {}
  var $ = cheerio.load(text)

  result.product = $('.title b').children()[0].prev.data.replace(/\n|\t/g, '')
  result.name = $('.block-inc-info .block').eq(2).find('span').eq(0).text().replace('公司全称：', '')
  result.location = $('.aboutus').eq(0).find('li').eq(2).find('span').text()
  result.hrUrl = ''

  return result
}

app.listen(3000, function () {
  console.log('爬虫程序开始运行......');
  console.log('app is listening at port 3000')
})
