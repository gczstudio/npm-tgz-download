// status manager

class Store {
  static files = [];
  static total = 0;
  static finishCount = 0;
  static config = {};
  static date = "";

  static setFiles(files) {
    Store.files = files;
    Store.setTotal(files.length);
  }

  static setTotal(total) {
    Store.total = total;
  }

  static setFinishCount(finishCount) {
    Store.finishCount = finishCount;
  }

  static setConfig(config) {
    Store.config = config;
  }

  static setDate(date) {
    Store.date = date;
  }
}

module.exports = Store;
