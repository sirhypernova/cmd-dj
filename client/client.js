const { Client } = require('discord.js');
const CMDHandler = require('../commands').Handler;
const ModuleHandler = require('../modules').Handler;
const path = require('path');
const conf = require('./conf');

class DJClient extends Client {
    constructor(dj = {}, discord = {}) {
        super(discord);
        this.dj = new conf(path.resolve('dj-conf.db'),dj);
        this.discord = new conf(path.resolve('ds-conf.db'),discord);
        this.roles = new conf(path.resolve('roles.db'));
        this.commands = new CMDHandler(this);
        this.modules = new ModuleHandler(this);
        this.data = {};
        this.ready = false;
    }
    
    run() {
        return new Promise((resolve,reject) => {
           this.dj.defer().then(() => {
               super.login(this.dj.get('token'));

               super.on('ready', () => {
                  this.ready = true;
                  this.commands.ready();
                  this.modules.ready();
                  resolve();
               });
               super.once('error', reject);
           });
        });
    }
}

module.exports = DJClient;