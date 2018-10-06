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
        await this.dj.dj.defer();
        var { name } = cmdconf;
        var roles = cmdconf.roles || ['everyone'];
        var { handler } = cmdconf;
        var onLoad = cmdconf.onLoad || function () {};
        var falseHandler = cmdconf.falseHandler || function () {};
        var usage = cmdconf.usage || 'None Provided';
        var help = cmdconf.help || 'None Provided';
        var path = cmdconf.path || false;
        var module = cmdconf.module || false;
        var subCommands = cmdconf.subCommands || {};
        
        if (!this.exists(name)) return this._commands[name] = new command({
            name: name,
            roles: roles,
            handler: handler,
            falseHandler: falseHandler,
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
        await this.dj.dj.defer();
        await this.dj.roles.defer();
        var prefix = this.dj.dj.get('prefix');
        var argsRegex = this.dj.dj.get('argsRegex') || / +/g;
        
        if (!content.startsWith(prefix)) return false;
        var args = content.slice(prefix.length).split(argsRegex);
        var cmd = args.shift(1);
        
        if (!this.exists(cmd)) return false;
        
        return {args: args, cmd: cmd};
    }
    
    canRun(id,cmdroles) {
        var roles = this.dj.roles.get(id);
        if (roles == undefined) {
            roles = [];
            var owners = this.dj.dj.get('owners');
            if (owners.includes(id)) roles.push('owner');
            roles.push('everyone');
            this.dj.roles.set(id,roles);
        }
        if (cmdroles.filter(role => roles.includes(role)).length || roles.includes('owner'))
            return true;
        else
            return false;
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
            if (!this.canRun(msg.author.id,cmd._roles)) return cmd.falseRun(msg,data.args) || false;
            cmd.run(msg,data.args);
        });
    }
}

module.exports = CMDHandler;