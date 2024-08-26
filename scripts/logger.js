const chalk = require("chalk");

class Logger {
  static log(message, color) {
    switch (color) {
      case "red":
        console.log(chalk.red(message));
        break;
      case "green":
        console.log(chalk.green(message));
        break;
      case "yellow":
        console.log(chalk.yellow(message));
        break;
      default:
        console.log(message);
    }
  }

  static info(message) {
    this.log(message, "green");
  }

  static warn(message) {
    this.log(message, "yellow");
  }

  static error(message) {
    this.log(message, "red");
  }
}

module.exports = Logger;
