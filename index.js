#!/usr/bin/env node
"use strict";

const inquirer = require("inquirer");
const {
  checkFilesExist,
  formatDateTime,
  getFileName,
} = require("./scripts/utils");
const Logger = require("./scripts/logger");
const fs = require("fs");
const path = require("path");
const { downloadFiles } = require("./scripts/download");
const Store = require("./scripts/store");

// Determine whether the package-lock.json or yarn.lock is present
const files = ["package-lock.json", "yarn.lock"];
checkFilesExist(files).then((existFiles) => {
  if (!existFiles.length) {
    Logger.error("package-lock.json or yarn.lock does not exist");
    return;
  }

  const prompt = inquirer.createPromptModule();
  let config = {};
  prompt([
    {
      type: "list",
      name: "file",
      message: "select a file",
      choices: existFiles,
    },
    {
      type: "list",
      name: "downloadType",
      message: "select a npm download type",
      choices: ["parallel", "serial"],
    },
    {
      type: "list",
      name: "addType",
      message: "select a npm add type",
      choices: ["normal", "append"],
    },
    {
      type: "list",
      name: "type",
      message: "select a npm type",
      choices: ["public", "private"],
    },
  ]).then((config1) => {
    // If it is a private library, you need to enter a user name and password
    config = config1;
    Store.setConfig(config);
    if (config1.type === "private") {
      prompt([
        {
          type: "input",
          name: "username",
          message: "Enter the user name for the private npm library",
        },
        {
          type: "password",
          name: "password",
          message: "Enter the user password for the private npm library",
        },
      ]).then((config2) => {
        config = { ...config, ...config2 };
        Store.setConfig(config);
        resolveUrl();
      });
    } else {
      resolveUrl();
    }
  });
});

function resolveUrl() {
  const { file, addType } = Store.config;
  if (addType === "append") {
    const date = formatDateTime(new Date());
    Logger.info(date);
    Store.setDate(date);
  }

  const regex =
    file === "package-lock.json"
      ? /(?<="resolved": ").+(?=.tgz)/g
      : /(?<=resolved ").+(?=.tgz)/g;

  const filePath = path.join(process.cwd(), file);

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) throw err;
    let urls = data.match(regex).map((item) => item + ".tgz");
    const realUrls = [];
    const fileNames = [];
    urls.map((url) => {
      const fileName = getFileName(url);
      if (!fileNames.includes(fileName)) {
        fileNames.push(fileName);
        realUrls.push(url);
      }
    });

    Store.setFiles(realUrls);
    downloadFiles();
  });
}
