/**
 * lib文件夹下最重要的文件 是构建项目中最重要的一环 根据模板渲染成我们需要的项目
 * 
 */
const chalk = require('chalk') // 用于高亮终端打印出来的信息
const Metalsmith = require('metalsmith') // 静态网站生成器
const Handlebars = require('handlebars') // 知名的模板引擎
const async = require('async') // 非常强大的异步处理工具
const render = require('consolidate').handlebars.render // consolidate 支持各种模板引擎的渲染
const path = require('path') // node自带path模块，用于路径的处理
const multimatch = require('multimatch') // 可以支持多个条件的匹配
const getOptions = require('./options') // 自定义工具-用于获取模板配置
const ask = require('./ask') // 自定义工具-用于询问开发者
const filter = require('./filter') // 自定义工具-用于文件过滤
const logger = require('./logger') // 自定义工具-用于日志打印

// register handlebars helper 注册handlebars的helper
Handlebars.registerHelper('if_eq', function (a, b, opts) {
  return a === b
    ? opts.fn(this)
    : opts.inverse(this)
})

Handlebars.registerHelper('unless_eq', function (a, b, opts) {
  return a === b
    ? opts.inverse(this)
    : opts.fn(this)
})

/**
 * Generate a template given a `src` and `dest`.
 *
 * @param {String} name
 * @param {String} src
 * @param {String} dest
 * @param {Function} done
 */

module.exports = function generate (name, src, dest, done) {
  // 获取配置
  const opts = getOptions(name, src)
  //初始化Metalsmith对象
  const metalsmith = Metalsmith(path.join(src, 'template'))
  //添加一些变量至metalsmith中，并获取metalsmith中全部变量
  const data = Object.assign(metalsmith.metadata(), {
    destDirName: name,
    inPlace: dest === process.cwd(),
    noEscape: true
  })
  //注册配置对象中的helper
  opts.helpers && Object.keys(opts.helpers).map(key => {
    Handlebars.registerHelper(key, opts.helpers[key])
  })

  const helpers = { chalk, logger }

  //配置对象是否有before函数，是则执行
  if (opts.metalsmith && typeof opts.metalsmith.before === 'function') {
    opts.metalsmith.before(metalsmith, opts, helpers)
  }

  // 询问问题
  metalsmith.use(askQuestions(opts.prompts))
    // 过滤文件
    .use(filterFiles(opts.filters))
    // 渲染模板文件
    .use(renderTemplateFiles(opts.skipInterpolation))
  //配置对象是否有after函数，是则执行
  if (typeof opts.metalsmith === 'function') {
    opts.metalsmith(metalsmith, opts, helpers)
  } else if (opts.metalsmith && typeof opts.metalsmith.after === 'function') {
    opts.metalsmith.after(metalsmith, opts, helpers)
  }

  metalsmith.clean(false)
    .source('.') // start from template root instead of `./src` which is Metalsmith's default for `source`
    .destination(dest)
    .build((err, files) => {
      done(err)
      // 配置对象中有complete函数则执行
      if (typeof opts.complete === 'function') {
        const helpers = { chalk, logger, files }
        opts.complete(data, helpers)
      } else {
        //配置对象有completeMessage，执行logMessage函数
        logMessage(opts.completeMessage, data)
      }
    })

  return data
}

/**
 * Create a middleware for asking questions.
 *
 * @param {Object} prompts
 * @return {Function}
 */

function askQuestions (prompts) {
  return (files, metalsmith, done) => {
    ask(prompts, metalsmith.metadata(), done)
  }
}

/**
 * Create a middleware for filtering files.
 *
 * @param {Object} filters
 * @return {Function}
 */

function filterFiles (filters) {
  return (files, metalsmith, done) => {
    filter(files, filters, metalsmith.metadata(), done)
  }
}

/**
 * Template in place plugin.
 *
 * @param {Object} files
 * @param {Metalsmith} metalsmith
 * @param {Function} done
 */

function renderTemplateFiles (skipInterpolation) {
  // 保证skipInterpolation是一个数组
  skipInterpolation = typeof skipInterpolation === 'string'
    ? [skipInterpolation]
    : skipInterpolation
  return (files, metalsmith, done) => {
    // 获取files的所有key
    const keys = Object.keys(files)
    // 获取metalsmith的所有变量
    const metalsmithMetadata = metalsmith.metadata()
    // 异步处理所有files
    async.each(keys, (file, next) => {
      // skipping files with skipInterpolation option
      // 跳过符合skipInterpolation的要求的file
      if (skipInterpolation && multimatch([file], skipInterpolation, { dot: true }).length) {
        return next()
      }
      // 获取文件的文本内容
      const str = files[file].contents.toString()
      // do not attempt to render files that do not have mustaches
      // 跳过符合skipInterpolation的要求的file
      if (!/{{([^{}]+)}}/g.test(str)) {
        return next()
      }
      // 渲染文件
      render(str, metalsmithMetadata, (err, res) => {
        if (err) {
          err.message = `[${file}] ${err.message}`
          return next(err)
        }
        files[file].contents = new Buffer(res)
        next()
      })
    }, done)
  }
}

/**
 * Display template complete message.
 *
 * @param {String} message
 * @param {Object} data
 */

function logMessage (message, data) {
  // 没有message直接退出函数
  if (!message) return
  render(message, data, (err, res) => {
    // 错误打印错误信息 成功则打印最终的渲染结果
    if (err) {
      console.error('\n   Error when rendering template complete message: ' + err.message.trim())
    } else {
      console.log('\n' + res.split(/\r?\n/g).map(line => '   ' + line).join('\n'))
    }
  })
}


/*
  主逻辑

  获取模板配置 -->初始化Metalsmith -->添加一些变量至Metalsmith 
  -->handlebars模板注册helper -->配置对象中是否有before函数，有则执行 
  -->询问问题 -->过滤文件 -->渲染模板文件 -->配置对象中是否有after函数，有则执行 
  -->最后构建项目内容 -->构建完成，成功若配置对象中有complete函数则执行，否则打印配置对象中的completeMessage信息，如果有错误，执行回调函数done(err)

*/