import { Client, Module } from "../index.js";
import Command from "../commands/command.js";
import CommandContext from "../commands/context.js";
import { resolve as _resolve } from "path";
import { existsSync, stat, readdir } from "fs";
import { Collection } from "discord.js";

export default class CommandHandler {
  /**
   * Command handler
   * @param {Client} client
   */
  constructor(client) {
    this.client = client;
    this.commands = {};
    this.aliases = {};
    this._collection = null;

    client.on("messageCreate", async (msg) => {
      if (msg.author.bot || msg.author.system) return;
      let cmdName;
      const prefix = client.prefix(msg);
      let usedPrefix = prefix;
      if (prefix instanceof Array) {
        let realPrefix = "";
        for (let str of prefix) {
          if (!msg.content.startsWith(str)) continue;
          usedPrefix = realPrefix = str;
          break;
        }
        if (!realPrefix.length) return;
        cmdName = msg.content.slice(realPrefix.length).split(/ +/)[0];
      } else {
        if (!msg.content.startsWith(prefix)) return;
        cmdName = msg.content.slice(prefix.length).split(/ +/)[0];
      }
      if (!this.exists(cmdName)) return;
      const cmd = this.get(cmdName);
      // TODO: checks - maybe do with middleware
      const ctx = new CommandContext(client, msg, cmdName, usedPrefix);
      if (cmd.args.length) {
        const args = await this.client.arguments.getArgs(ctx);
        if (args.valid === false) {
          return client.emit("command", cmd, args.error, ctx);
        }
        client.emit("command", cmd, false, ctx, args.args);
      } else {
        client.emit("command", cmd, false, ctx);
      }
    });

    client.on("command", async (cmd, error, ctx, args) => {
      if (cmd.module && !cmd.module.enabled) return;
      let checkTest = await client.checks.test(cmd, ctx);
      if (checkTest !== true) return cmd.failedCheck(ctx, checkTest);
      if (error) return cmd.badArgs(ctx, error);
      cmd.execute(ctx, args);
    });
  }

  /**
   * Register a command
   * @param {Object} cmd
   * @param {{
   *  location?: String
   *  module?: Module
   * }} options
   */
  async add(cmd, { location = false, module = false }) {
    if (this._collection !== null) this._collection = null;
    if (!(cmd.prototype instanceof Command))
      throw new Error("Command is not valid.");
    /** @type {Command} */
    const command = new cmd(this.client);
    if (location) {
      command.fileLocation = location;
    }
    if (module) {
      command.module = module;
    }
    if (command.aliases) {
      command.aliases.forEach((alias) => {
        this.aliases[alias] = command.name;
      });
    }
    this.commands[command.name] = command;
    if (command.args.length)
      this.client.arguments.addArgs(command.name, command.args);
  }

  remove(name) {
    if (this._collection !== null) this._collection = null;
    if (this.exists(name)) {
      delete this.commands[name];
    }
  }

  removeWhere(fn) {
    if (this._collection !== null) this._collection = null;
    for (var key in this.commands) {
      if (fn(this.commands[key], key)) {
        delete this.commands[key];
        break;
      }
    }
  }

  removeAllWhere(fn) {
    if (this._collection !== null) this._collection = null;
    for (var key in this.commands) {
      if (fn(this.commands[key], key)) {
        delete this.commands[key];
      }
    }
  }

  /**
   * Reload a command
   * @param {String} command
   */
  reload(command) {
    if (!this.exists(command)) return false;
    if (this._collection !== null) this._collection = null;
    let cmd = this.get(command);
    if (!cmd.fileLocation) return false;
    if (!existsSync(cmd.fileLocation)) return false;
    /** @type {Command} */
    let newCommand;
    try {
      delete require.cache[require.resolve(cmd.fileLocation)];
      newCommand = require(cmd.fileLocation);
    } catch (e) {
      return e;
    }
    cmd.aliases.forEach((al) => {
      delete this.aliases[al];
    });
    delete this.commands[command];
    this.add(newCommand, { location: cmd.fileLocation });
    return true;
  }

  /**
   * Scan a directory to load commands from
   * @param {String} directory
   * @param {Module} module
   */
  scan(directory, module = false) {
    return new Promise((resolve, reject) => {
      var dir = _resolve(directory);
      stat(dir, (err) => {
        if (err) return reject("Invalid Path");
        readdir(dir, (err, files) => {
          if (err) return reject(err);
          files.forEach(async (file) => {
            if (!file.endsWith(".js")) return;
            var cmd = (await import(_resolve(dir, file))).default;
            this.add(cmd, { location: _resolve(dir, file), module });
          });
          resolve();
        });
      });
    });
  }

  /**
   * Get a command
   * @param {String} command
   * @returns {Command}
   */
  get(command) {
    if (command in this.aliases) return this.commands[this.aliases[command]];
    return this.commands[command];
  }

  /**
   * Checks if a command exists
   * @param {String} command
   */
  exists(command) {
    if (this.commands.hasOwnProperty(command)) {
      return true;
    } else {
      return command in this.aliases;
    }
  }

  /**
   * Get a collection of commands
   * @returns {Collection<String,Command>}
   */
  get collection() {
    if (
      this._collection !== null &&
      Object.keys(this.commands).length == this._collection.size
    )
      return this._collection;
    var array = [];
    for (let key in this.commands) {
      array.push([key, this.commands[key]]);
    }
    return (this._collection = new Collection(array));
  }
}
