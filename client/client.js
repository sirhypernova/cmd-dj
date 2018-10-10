const { Client } = require('discord.js');
const CMDHandler = require('../commands').Handler;
const ModuleHandler = require('../modules').Handler;
const ChecksHandler = require('../checks').Handler;
const path = require('path');
const conf = require('./conf');

class DJClient extends Client {
    constructor(dj = {}, discord = {}) {
        super(discord);
        this.dj = new conf(dj);
        this.commands = new CMDHandler(this);
        this.modules = new ModuleHandler(this);
        this.checks = new ChecksHandler(this);
        this.data = {};
        this.ready = false;
    }
    
    run() {
        return new Promise((resolve,reject) => {
           super.login(this.dj.get('token'));

           super.on('ready', () => {
              this.ready = true;
              this.commands.ready();
              this.modules.ready();
              resolve();
           });
           super.once('error', reject);
        });
    }
}

module.exports = DJClient;