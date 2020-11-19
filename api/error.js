module.exports = {
  def: function(msg,stack) {
    return {
      "err": msg + "\n(For more information, check the documentation.)",
      "data": stack
    }
  }
}