const { Message } = require("discord.js");
const { Client } = require("..");
const ReactionMenu = require("../utilities/reactionMenu");

module.exports = class CommandContext {
  /**
   * @param {Client} client
   * @param {Message} msg
   * @param {String} command
   */
  constructor(client, msg, command) {
    this.msg = msg;
    this.client = client;
    this.command = command;

    this.prefix = client.prefix(msg);
    this.rawArgs = msg.content
      .replace(this.prefix + command, "")
      .trim()
      .split(/ +/);
  }

  /**
   * Create a reaction menu
   * @param {Message} msg
   */
  createReactionMenu(msg) {
    return new ReactionMenu(this, msg);
  }
};
