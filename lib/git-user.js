// node 自带模块child_process中的execSync方法用于新开一个shell并执行相应的command，并返回相应的输出
// 作用 用于获取本地git配置的用户和邮件 并返回 姓名<邮箱>的字符串
const exec = require('child_process').execSync 

module.exports = () => {
  let name
  let email

  try {
    name = exec('git config --get user.name')
    email = exec('git config --get user.email')
  } catch (e) {}

  name = name && JSON.stringify(name.toString().trim()).slice(1, -1)
  email = email && (' <' + email.toString().trim() + '>')
  return (name || '') + (email || '')
}
