const fs = require("fs");
const Logger = require("./logger");
const path = require("path");
const Store = require("./store");

const superagent = require("superagent");
const cliProgress = require("cli-progress");

// note: you have to install this dependency manually since it's not required by cli-progress
const colors = require("ansi-colors");

// create new progress bar
const progressBar = new cliProgress.SingleBar({
  format:
    "CLI Progress |" +
    colors.cyan("{bar}") +
    "| {percentage}% || {value}/{total} Chunks",
  barCompleteChar: "\u2588",
  barIncompleteChar: "\u2591",
  hideCursor: true,
});

function getFileName(pathname) {
  const paths = pathname.split("/");
  return paths[paths.length - 1];
}

function isExistDirOrFile(path) {
  try {
    fs.accessSync(path, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

// Binary parser
function binaryParser(res, callback) {
  res.setEncoding("binary");
  let chunks = [];
  res.on("data", (chunk) => {
    chunks.push(chunk);
  });
  res.on("end", () => {
    let buffer = Buffer.concat(chunks);
    callback(null, buffer);
  });
}

/**
 * Delete the partially written files
 */
function deleteFile() {
  const path = Store.addType === "append" ? dateFilePath : filePath;
  fs.unlink(path, (err) => {
    if (err) throw err;
  });
  progressBar.stop();
}

function updateFinishCount() {
  const current = ++Store.finishCount;
  Store.setFinishCount(current);
  progressBar.increment();
  progressBar.update(current);
  if (Store.finishCount === Store.total) {
    progressBar.stop();
  }
}

/**
 * batch downlod file
 * @param {*} files
 */
async function downloadFiles() {
  const { files, config } = Store;
  progressBar.start(Store.total, 0);
  if (config.downloadType === "parallel") {
    for (let file of files) {
      download(file, config);
    }
  } else {
    const requests = files.map((file) => () => download(file, config));
    for (let request of requests) {
      const res = await request();
    }
  }
}

/**
 * download
 * @param {*} file
 * @param {*} config  command config
 */
function download(file, config) {
  const { username, password } = config;
  const filename = getFileName(file);
  const fileDir = path.join(process.cwd(), "npmtgz");
  const filePath = path.join(fileDir, filename);
  const dateDirPath = path.join(fileDir, Store.date);
  const dateFilePath = path.join(dateDirPath, filename);
  /**
   * 1.Judge whether the file exists, it exists, do not repeat the request
   * 2.Determine whether the npmtgz directory exists, and is created
   */
  let fileStream = null;

  if (isExistDirOrFile(filePath)) {
    updateFinishCount();
    return;
  }

  if (config.addType === "append") {
    // create current Date dir
    if (isExistDirOrFile(dateFilePath)) {
      updateFinishCount();
      return;
    }
    if (!isExistDirOrFile(dateDirPath)) {
      try {
        fs.mkdirSync(dateDirPath, { recursive: true });
        fileStream = fs.createWriteStream(dateFilePath);
      } catch (mkdirErr) {
        Logger.error("create date dir error:" + mkdirErr);
      }
    } else {
      fileStream = fs.createWriteStream(dateFilePath);
    }
  } else {
    if (!isExistDirOrFile(fileDir)) {
      try {
        fs.mkdirSync(fileDir, { recursive: true });
        fileStream = fs.createWriteStream(filePath);
      } catch (mkdirErr) {
        Logger.error("create dir error:" + mkdirErr);
      }
    } else {
      fileStream = fs.createWriteStream(filePath);
    }
  }

  return new Promise((resolve, reject) => {
    superagent
      .get(file)
      .set(
        "Authorization",
        "Basic " + Buffer.from(`${username}:${password}}`).toString("base64")
      )
      .buffer(false) // Prohibit the buffer conversion
      .parse(binaryParser)
      .on("error", (err) => {
        Logger.error(err);
        deleteFile();
        reject(err);
      })
      .pipe(fileStream)
      .on("finish", () => {
        resolve(file);
        updateFinishCount();
      });

    fileStream.on("error", (err) => {
      // Error writing file
      deleteFile();
      Logger.error("save file error: ", err.message);
      reject(err);
    });
  });
}

module.exports = {
  downloadFiles,
  download,
};
