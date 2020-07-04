const { CommandContext } = require("..");
const { Message } = require("discord.js");

module.exports = class ReactionMenu {
  /**
   * @param {CommandContext} ctx
   * @param {Message} message
   */
  constructor(ctx, message) {
    this.ctx = ctx;
    this.message = message;
    this.handlers = [];
    this.emojis = [];
    this.started = false;
    this.collector = null;
    this.timeout = null;
    this.idleTimeout = null;
    this.clear = false;
  }

  /**
   * Add a button to the menu
   * @param {string} reaction
   * @param {*} callback
   */
  addButton(reaction, callback = () => {}) {
    this.emojis.push(reaction);
    this.handlers[reaction] = callback;
    return this;
  }

  /**
   * Clear reactions when menu is closed
   */
  clearOnFinish() {
    this.clear = true;
    return this;
  }

  /**
   * Close menu
   */
  async close() {
    if (!this.started) return;
    this.started = false;
    this.collector.stop();
    if (this.clear) await this.message.reactions.removeAll();
  }

  /**
   * Create the menu
   * @param {Number} timeout Default: 15000
   * @param {Number} idleTimeout Default: 10000
   */
  async run(timeout = 15000, idleTimeout = 10000) {
    this.timeout = timeout;
    this.idleTimeout = idleTimeout;
    return new Promise(async (res) => {
      for (let emoji of this.emojis) {
        await this.message.react(emoji);
      }
      const filter = (reaction, user) =>
        user.id == this.ctx.msg.author.id &&
        this.emojis.includes(reaction.emoji.name);
      const collector = (this.collector = this.message.createReactionCollector(
        filter,
        {
          time: timeout,
          idle: idleTimeout,
          dispose: true,
        }
      ));
      collector.on("collect", (r) => {
        r.users.remove(this.ctx.msg.author);
        this.handlers[r.emoji.name]();
      });
      collector.on("end", (col, reason) => {
        res(reason);
        if (this.clear) this.message.reactions.removeAll();
      });
      this.started = true;
    });
  }
};
