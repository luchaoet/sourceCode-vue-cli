const chalk = require('chalk') // 用于高亮终端打印出来的信息

module.exports = {
  v2SuffixTemplatesDeprecated (template, name) {
    const initCommand = 'vue init ' + template.replace('-2.0', '') + ' ' + name

    console.log(chalk.red('  This template is deprecated, as the original template now uses Vue 2.0 by default.'))
    console.log()
    console.log(chalk.yellow('  Please use this command instead: ') + chalk.green(initCommand))
    console.log()
  },
  v2BranchIsNowDefault (template, name) {
    const vue1InitCommand = 'vue init ' + template + '#1.0' + ' ' + name

    console.log(chalk.green('  This will install Vue 2.x version of the template.'))
    console.log()
    console.log(chalk.yellow('  For Vue 1.x use: ') + chalk.green(vue1InitCommand))
    console.log()
  }
}
/**
 * 比较重点的文件就是vue-init、generate.js、options.js、ask.js、filter.js,这五个文件构成了vue-cli构建项目的主流程
 */