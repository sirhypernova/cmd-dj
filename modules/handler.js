const djmodule = require('./module');
const path = require('path');
const fs = require('fs');
const { Collection } = require('discord.js');

class ModuleHandler {
    constructor(dj) {
        this.dj = dj;
        this._modules = {};
    }
    
    async add(modconf) {
        var { name } = modconf;
        var onLoad = modconf.onLoad || function () {};
        var events = modconf.events || {};
        
        if (!this.exists(name)) return this._modules[name] = new djmodule({name: name, events: events, dj: this.dj});
    }
    
    scan(directory) {
        return new Promise((resolve,reject) => {
            var dir = path.resolve(directory);
            fs.stat(dir, (err) => {
               if (err) return reject('Invalid Path');
               fs.readdir(dir, (err,files) => {
                   if (err) return reject(err);
                   files.forEach(file => {
                      if (!file.endsWith('.js')) return;
                      var name = file.slice(0,-3);
                      var module = require(path.resolve(dir,name));
                      module.name = name;
                      this.add(module);
                   });
                   resolve();
               });
            });
        });
    }
    
    get(module) {
        return this._modules[module];
    }
    
    get collection() {
        var array = [];
        for (var key in this._modules) {
            array.push([key,this._modules[key]]);
        }
        return new Collection(array);
    }
    
    exists(module) {
        return this._modules.hasOwnProperty(module);
    }
    
    ready() {
        for (var module in this._modules) {
            this._modules[module].emit('ready');
        }
        this.dj.oldEmit = this.dj.emit;
        this.dj.emit = (t,...d) => {
            for (var module in this._modules) {
                this._modules[module].emit('any',d,t);
                this._modules[module].emit(t,...d);
            }
            this.dj.oldEmit(t,...d);
        }
    }
}

module.exports = ModuleHandler;