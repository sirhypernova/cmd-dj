const command = require('./command');
const path = require('path');
const fs = require('fs');
const { Collection } = require('discord.js');

class CMDHandler {
    constructor(dj) {
        this.dj = dj;
        this._commands = {};
    }
    
    async add(cmdconf) {
        var { name } = cmdconf;
        var checks = cmdconf.checks || [];
        var { handler } = cmdconf;
        var onLoad = cmdconf.onLoad || function () {};
        var checkFail = cmdconf.checkFail || function () {};
        var usage = cmdconf.usage || 'None Provided';
        var help = cmdconf.help || 'None Provided';
        var path = cmdconf.path || false;
        var module = cmdconf.module || false;
        var subCommands = cmdconf.subCommands || {};
        
        if (!this.exists(name)) return this._commands[name] = new command({
            name: name,
            checks: checks,
            handler: handler,
            checkFail: checkFail,
            subCommands: subCommands,
            path: path,
            onLoad: onLoad,
            usage: usage,
            help: help,
            dj: this.dj,
            module: module
        });
    }
    
    remove(name) {
        if (this.exists(name)) {
            delete this._commands[name];
        }
    }
    
    removeWhere(fn) {
        for (var key in this._commands) {
            if (fn(this._commands[key],key)) {
                delete this._commands[key];
                return;
            }
        }
    }
    
    removeAllWhere(fn) {
        for (var key in this._commands) {
            if (fn(this._commands[key],key)) {
                delete this._commands[key];
            }
        }
    }
    
    reload(command) {
        if (!this.exists(command)) return false;
        var cmd = this.get(command);
        if (!cmd._path) return false;
        delete require.cache[require.resolve(cmd._path)];
        delete this._commands[command];
        if (!fs.existsSync(cmd._path+'.js')) return false;
        var rcmd = require(cmd._path);
        rcmd.name = cmd._name;
        rcmd.path = cmd._path;
        this.add(rcmd).then(() => {
            this.get(command)._onLoad(this.get(command));
        })
        return true;
    }
    
    reloadDir(directory) {
        var commands = this.collection.filter(cmd => {
            var cmdpath = cmd._path.slice(0,-cmd._name.length-1);
            return cmdpath == path.resolve(directory);
        });
        commands.map(cmd => {
           this.reload(cmd._name);
        });
    }
    
    scan(directory,module) {
        return new Promise((resolve,reject) => {
            var dir = path.resolve(directory);
            fs.stat(dir,
            (err) => {
               if (err) return reject('Invalid Path');
               fs.readdir(dir, (err,files) => {
                   if (err) return reject(err);
                   files.forEach(file => {
                      if (!file.endsWith('.js')) return;
                      var name = file.slice(0,-3);
                      var cmd = require(path.resolve(dir,name));
                      cmd.name = name;
                      cmd.path = path.resolve(dir,name);
                      cmd.module = module;
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
        var array = [];
        for (var key in this._commands) {
            array.push([key,this._commands[key]]);
        }
        return new Collection(array);
    }
    
    exists(command) {
        return this._commands.hasOwnProperty(command);
    }
    
    async parseContent(content) {
        var prefix = this.dj.dj.get('prefix');
        var argsRegex = this.dj.dj.get('argsRegex') || / +/g;
        
        if (!content.startsWith(prefix)) return false;
        var args = content.slice(prefix.length).split(argsRegex);
        var cmd = args.shift(1);
        
        if (!this.exists(cmd)) return false;
        
        return {args: args, cmd: cmd};
    }
    
    canRun(msg,args,cmd) {
        if (!cmd.checks.length) return true;
        var errors = {};
        cmd.checks.forEach((name) => {
            if (!this.dj.checks.exists(name)) return;
            var check = this.dj.checks.get(name);
            
            if (check.check(msg,args,this.dj) !== true) errors[name] = check.error;
        });
        
        
        return Object.keys(errors).length ? errors : true;
    }
    
    ready() {
        for (var command in this._commands) {
            this._commands[command]._onLoad(this._commands[command]);
        }
        this.dj.on('message', async (msg) => {
            if (msg.author.bot) return;
            var data = await this.parseContent(msg.content);
            if (!data) return;
            var cmd = this.get(data.cmd);
            var errors = this.canRun(msg,data.args,cmd);
            if (errors !== true) return cmd.checkFail(msg,data.args,errors) || false;
            cmd.run(msg,data.args);
        });
    }
}

module.exports = CMDHandler;