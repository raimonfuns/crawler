var express = require('express')
var cheerio = require('cheerio')
var superagent = require('superagent')
var async = require('async')

var app = express()

function getCompanysPage() {
  app.get('/', function (req, res, next) {
    superagent
      .get('http://www.itjuzi.com/company')
      .end(function (err, sres) {
        if (err) {
          return next(err)
        }

        console.log('已获取公司列表页面')
        var companyUrlList = getCompanysUrlList(sres.text)
        getCompanysInfoList(companyUrlList, res, next)
      })
  })
}
getCompanysPage() 

function getCompanysUrlList(text) {
  var $ = cheerio.load(text)
  var items = []
  $('.main .list-main-icnset .pic a').each(function (idx, element) {
    items.push($(element).attr('href'))
  })
  return items
}

function getCompanysInfoList(companyUrlList, res, next) {
  companyUrlList = companyUrlList.slice(0, 2)

  var result = []

  async.mapLimit(companyUrlList, 4, 
    function (companyUrl, callback) {
      fetchInfo(companyUrl, callback);
    }, 
    function (err, result) {
      console.log(companysInfoList)
      console.log('抓取数：' + companyUrlList.length);
      res.send('抓取数：' + companyUrlList.length)
    }
  )
}

var companysInfoList = []
var concurrencyCount = 0; // 当前并发数记录
var fetchInfo = function(companyUrl, callback) {
  concurrencyCount++;
  console.log("...正在抓取"+ companyUrl + "...当前并发数记录：" + concurrencyCount);

  superagent
      .get(companyUrl)
      .end(function(err, sres){  
        companysInfoList.push(getCompanyInfo(sres.text))
        concurrencyCount--;
        callback(null, companyUrl);
      });
}

function getCompanyInfo(text) {
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
