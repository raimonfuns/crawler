'use strict'

var Promise = require('bluebird')
var async = require('async')

// 异步并发请求url，返回一个Promise
exports.asyncMapLimit = function (list, limit, iteratee, callback) {
	return new Promise(function(resolve, reject) {
    async.mapLimit(list, limit, iteratee,
      function (err) {
        if (err) reject(err)

        resolve(callback())
      }
    )
  })
}