const path = require('path') // node自带的路径处理工具

module.exports = {
  // UNIX (以“.”或者"/"开头) WINDOWS(以形如：“C：”的方式开头)
  isLocalPath (templatePath) {
    return /^[./]|(^[a-zA-Z]:)/.test(templatePath)
  },
  // templatePath是否为绝对路径，是则返回templatePath 否则转换成绝对路径并规范化
  getTemplatePath (templatePath) {
    return path.isAbsolute(templatePath)
      ? templatePath
      : path.normalize(path.join(process.cwd(), templatePath))
  }
}
