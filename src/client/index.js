const { Client, Message } = require("discord.js");
const CommandHandler = require("../commands/handler");
const ModuleHandler = require("../modules/handler");
const ChecksHandler = require("../checks/handler");
const CommandArguments = require("../commands/arguments");

module.exports = class DJClient extends Client {
  constructor(discord = {}) {
    super(discord);

    // TODO: modules, checks
    this.ready = false;
    this.config = {};

    this.dynamicPrefix = () => this.config.prefix;

    this.eventMiddleware = {};

    this.arguments = new CommandArguments();
    this.commands = new CommandHandler(this);
    this.modules = new ModuleHandler(this);
    this.checks = new ChecksHandler(this);
  }

  /**
   * Middleware wrapper for EventEmitter
   */
  emit(t, ...d) {
    let value = d;
    if (t in this.eventMiddleware) {
      let self = this;
      (function middleware(index) {
        let val = self.eventMiddleware[t][index](...value);
        if (val !== false) {
          value = val === undefined ? d : val instanceof Array ? val : [val];
          if (self.eventMiddleware[t].length - 1 > index) middleware(index + 1);
        } else {
          value = false;
        }
      })(0);
    }
    if (!value) return;
    this.modules.collection
      .filter((c) => c.enabled && c.eventNames().includes(t))
      .each((m) => m.emit(t, ...value));
    return super.emit(t, ...value);
  }

  /**
   * Add middleware to an event
   * @param {String} event
   * @param {Function} func
   */
  addMiddleware(event, func) {
    if (!(event in this.eventMiddleware)) this.eventMiddleware[event] = [];
    this.eventMiddleware[event].push(func);
  }

  /**
   * Set's the bot config
   * @param {*} config
   */
  setConfig(config) {
    this.config = config;
  }

  enableInlineCommands(suffix = "~") {
    this.addMiddleware("message", (msg) => {
      if (!msg.content.endsWith(suffix)) return msg;
      let potentialCommand = msg.content.split("`");
      if (potentialCommand.length < 3) return msg;
      let command = potentialCommand[1];
      msg.content = command;
      return msg;
    });
  }

  /**
   *
   * @callback prefixFunction
   * @param {Message} msg
   * @returns {String|String[]}
   */

  /**
   * Dynamic Prefix Function
   * @param {prefixFunction} func
   */
  setPrefix(func) {
    this.dynamicPrefix = func;
  }

  /**
   * Gets the prefix for the current context
   * @param {Message} msg
   * @returns {String}
   */
  prefix(msg) {
    return this.dynamicPrefix(msg);
  }

  /**
   * Run the bot
   */
  run() {
    return new Promise((resolve, reject) => {
      super.once("ready", async () => {
        await this.modules.loadModules();
        this.ready = true;
        resolve();
      });
      super.once("error", reject);

      // TODO: Ensure modules loaded BEFORE or AFTER login
      super.login(this.config.token);
    });
  }
};
