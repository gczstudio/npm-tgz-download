const fs = require("fs");
const path = require("path");

function checkFilesExist(files) {
  return new Promise((resolve, reject) => {
    let checkCount = 0;
    let existFiles = [];
    for (let file of files) {
      const filePath = path.join(process.cwd(), file);
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (!err) {
          existFiles.push(file);
        }

        if (++checkCount === files.length) {
          resolve(existFiles);
        }
      });
    }
  });
}

function formatDateTime(date) {
  function padZero(num) {
    return num < 10 ? "0" + num : num;
  }

  var year = date.getFullYear();
  var month = padZero(date.getMonth() + 1);
  var day = padZero(date.getDate());
  var hours = padZero(date.getHours());
  var minutes = padZero(date.getMinutes());
  var seconds = padZero(date.getSeconds());

  return `${year}-${month}-${day} ${hours}${minutes}${seconds}`;
}

module.exports = {
  checkFilesExist,
  formatDateTime,
};
