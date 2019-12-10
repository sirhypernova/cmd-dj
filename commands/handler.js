const command = require("./command");
const path = require("path");
const fs = require("fs");
const { Collection } = require("discord.js");

class CMDHandler {
  constructor(dj) {
    this.dj = dj;
    this._commands = {};
    this._collection = null;
  }

  async add(cmdconf) {
    if (this._collection !== null) this._collection = null;
    var { name } = cmdconf;
    var checks = cmdconf.checks || [];
    var { handler } = cmdconf;
    var onLoad = cmdconf.onLoad || function() {};
    var checkFail = cmdconf.checkFail || function() {};
    var usage = cmdconf.usage || "None Provided";
    var help = cmdconf.help || "None Provided";
    var path = cmdconf.path || false;
    var module = cmdconf.module || false;
    var subCommands = cmdconf.subCommands || {};
    var aliases = cmdconf.aliases || [];

    if (!this.exists(name))
      return (this._commands[name] = new command({
        name,
        checks,
        handler,
        checkFail,
        subCommands,
        path,
        onLoad,
        usage,
        help,
        dj: this.dj,
        module,
        aliases
      }));
  }

  remove(name) {
    if (this._collection !== null) this._collection = null;
    if (this.exists(name)) {
      delete this._commands[name];
    }
  }

  removeWhere(fn) {
    if (this._collection !== null) this._collection = null;
    for (var key in this._commands) {
      if (fn(this._commands[key], key)) {
        delete this._commands[key];
        return;
      }
    }
  }

  removeAllWhere(fn) {
    if (this._collection !== null) this._collection = null;
    for (var key in this._commands) {
      if (fn(this._commands[key], key)) {
        delete this._commands[key];
      }
    }
  }

  reload(command) {
    if (!this.exists(command)) return false;
    if (this._collection !== null) this._collection = null;
    var cmd = this.get(command);
    if (!cmd._path) return false;
    delete require.cache[require.resolve(cmd._path)];
    delete this._commands[command];
    if (!fs.existsSync(cmd._path + ".js")) return false;
    var rcmd = require(cmd._path);
    rcmd.name = cmd._name;
    rcmd.path = cmd._path;
    rcmd.module = cmd.module;
    this.add(rcmd);
    return true;
  }

  reloadDir(directory) {
    var commands = this.collection.filter(cmd => {
      var cmdpath = cmd._path.slice(0, -cmd._name.length - 1);
      return cmdpath == path.resolve(directory);
    });
    commands.map(cmd => {
      this.reload(cmd._name);
    });
  }

  scan(directory, module) {
    return new Promise((resolve, reject) => {
      var dir = path.resolve(directory);
      fs.stat(dir, err => {
        if (err) return reject("Invalid Path");
        fs.readdir(dir, (err, files) => {
          if (err) return reject(err);
          files.forEach(file => {
            if (!file.endsWith(".js")) return;
            var name = file.slice(0, -3);
            var cmd = require(path.resolve(dir, name));
            cmd.name = name;
            cmd.path = path.resolve(dir, name);
            if (module) {
              cmd.module = module;
              module._modifier(cmd);
            }
            this.add(cmd);
          });
          resolve();
        });
      });
    });
  }

  get(command) {
    return this._commands[command];
  }

  get collection() {
    if (
      this._collection !== null &&
      Object.keys(this._commands).length == this._collection.size
    )
      return this._collection;
    var array = [];
    for (let key in this._commands) {
      array.push([key, this._commands[key]]);
    }
    return (this._collection = new Collection(array));
  }

  async parseContent(content) {
    var prefix = this.dj.dj.get("prefix");
    var argsRegex = this.dj.dj.get("argsRegex") || / +/g;
    var args;

    var currentPrefix = false;
    if (prefix instanceof Array) {
      var realPrefix = "";
      for (var str of prefix) {
        if (!content.startsWith(str)) continue;
        realPrefix = str;
        break;
      }
      if (!realPrefix.length) return false;
      currentPrefix = realPrefix;
      args = content.slice(realPrefix.length).split(argsRegex);
    } else {
      if (!content.startsWith(prefix)) return false;
      currentPrefix = prefix;
      args = content.slice(prefix.length).split(argsRegex);
    }

    var cmd = args.shift();
    if (this._collection !== null) this._collection = null;
    let exists = this.exists(cmd);
    if (!exists) return false;

    return { args: args, cmd: cmd, realCmd: exists, currentPrefix };
  }

  exists(command) {
    if (this._commands.hasOwnProperty(command)) {
      return true;
    } else {
      return this.collection.find(cmd => cmd.aliases.includes(command));
    }
  }

  async canRun(msg, args, cmd) {
    if (!cmd.checks.length) return true;
    var errors = {};
    for (let name of checks) {
      if (!this.dj.checks.exists(name)) return;
      var check = this.dj.checks.get(name);
      var result = check.check(msg, args, this.dj, cmd);
      var can = false;
      if (result instanceof Promise) {
        can = await result;
      } else {
        can = result;
      }
      if (can !== true) errors[name] = check.error;
    }

    return Object.keys(errors).length ? errors : true;
  }

  ready() {
    for (var command in this._commands) {
      this._commands[command]._onLoad(this._commands[command]);
    }
    this.dj.on("message", async msg => {
      if (msg.author.bot) return;
      var data = await this.parseContent(msg.content);
      if (!data) return;
      var cmd =
        data.realCmd instanceof require("./command")
          ? data.realCmd
          : this.get(data.cmd);
      var errors = await this.canRun(msg, data.args, cmd);
      if (errors !== true)
        return cmd.checkFail(msg, data.args, errors) || false;
      msg.currentPrefix = data.currentPrefix;
      cmd.run(msg, data.args);
    });
  }
}

module.exports = CMDHandler;
