const { Client, Command, CommandContext } = require("..");
const Check = require("./check");
const path = require("path");
const fs = require("fs");
const { Collection } = require("discord.js");

module.exports = class ChecksHandler {
  /**
   * Checks handler
   * @param {Client} client
   */
  constructor(client) {
    this.client = client;
    this.checks = {};
    this.add(OwnerCheck);
  }

  /**
   * Register a check
   * @param {Object} check
   */
  async add(check) {
    if (this._collection !== null) this._collection = null;
    if (!(check.prototype instanceof Check))
      throw new Error("Check is not valid.");
    /** @type {Check} */
    const theCheck = new check(this.client);
    this.checks[theCheck.name] = theCheck;
  }

  /**
   * Scan a directory to load checks from
   * @param {String} directory
   */
  scan(directory) {
    return new Promise((resolve, reject) => {
      var dir = path.resolve(directory);
      fs.stat(dir, (err) => {
        if (err) return reject("Invalid Path");
        fs.readdir(dir, (err, files) => {
          if (err) return reject(err);
          files.forEach((file) => {
            if (!file.endsWith(".js")) return;
            var check = require(path.resolve(dir, file));
            this.add(check);
          });
          resolve();
        });
      });
    });
  }

  /**
   * Test a check
   * @param {Command} command
   * @param {CommandContext} ctx
   */
  async test(command, ctx) {
    if (!command.checks.length) return true;
    for (let check of command.checks) {
      if (!this.exists(check)) continue;
      let result = this.get(check).test(ctx);
      if (result instanceof Promise) result = await result;
      if (!result) return check.name;
    }
    return true;
  }

  /**
   * Get a check
   * @param {String} check
   * @returns {check}
   */
  get(check) {
    return this.checks[check];
  }

  /**
   * Checks if a check exists
   * @param {String} check
   */
  exists(check) {
    return this.checks.hasOwnProperty(check);
  }

  /**
   * Get a collection of checks
   * @returns {Collection<String,Check>}
   */
  get collection() {
    if (
      this._collection !== null &&
      Object.keys(this.checks).length == this._collection.size
    )
      return this._collection;
    var array = [];
    for (let key in this.checks) {
      array.push([key, this.checks[key]]);
    }
    return (this._collection = new Collection(array));
  }
};

class OwnerCheck extends Check {
  constructor(client) {
    super(client);
    this.name = "dj.owner";
  }

  test(ctx) {
    if (!this.client.config.owners) return false;
    if (!(this.client.config.owners instanceof Array)) return false;
    return this.client.config.owners.includes(ctx.msg.author.id);
  }
}
