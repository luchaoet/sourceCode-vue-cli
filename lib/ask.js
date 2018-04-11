// 作用：将meta.js 或者 meta.json中的prompts字段解析成对应的问题询问

const async = require('async') // 异步处理工具
const inquirer = require('inquirer') // 命令行与用户之间的交互
const evaluate = require('./eval') // 返回某作用下表达式的值

// Support types from prompt-for which was used before
const promptMapping = {
  string: 'input',
  boolean: 'confirm'
}

/**
 * Ask questions, return results.
 *
 * @param {Object} prompts
 * @param {Object} data
 * @param {Function} done
 */

 /**
 * prompts meta.js 或者 meta.json 中prompts字段
 * data metalsmith.metadata()
 * done 交于下一个metalsmith插件处理
 *
 */

module.exports = function ask (prompts, data, done) {
  // 遍历prompts下的每一个字段
  async.eachSeries(Object.keys(prompts), (key, next) => {
    prompt(data, key, prompts[key], next)
  }, done)
}

/**
 * Inquirer prompt wrapper.
 *
 * @param {Object} data
 * @param {String} key
 * @param {Object} prompt
 * @param {Function} done
 */

function prompt (data, key, prompt, done) {
  // skip prompts whose when condition is not met
  if (prompt.when && !evaluate(prompt.when, data)) {
    return done()
  }
  // 获取默认值
  let promptDefault = prompt.default
  if (typeof prompt.default === 'function') {
    promptDefault = function () {
      return prompt.default.bind(this)(data)
    }
  }
  // 设置问题 具体使用方法可去https://github.com/SBoudrias/Inquirer.js上面查看
  inquirer.prompt([{
    type: promptMapping[prompt.type] || prompt.type,
    name: key,
    message: prompt.message || prompt.label || key,
    default: promptDefault,
    choices: prompt.choices || [],
    validate: prompt.validate || (() => true)
  }]).then(answers => {
    if (Array.isArray(answers[key])) {
      // 当答案是一个数组时
      data[key] = {}
      answers[key].forEach(multiChoiceAnswer => {
        data[key][multiChoiceAnswer] = true
      })
    } else if (typeof answers[key] === 'string') {
      // 当答案是一个字符串时
      data[key] = answers[key].replace(/"/g, '\\"')
    } else {
      // 其他情况
      data[key] = answers[key]
    }
    done()
  }).catch(done)
}
