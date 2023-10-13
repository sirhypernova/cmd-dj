import { Message } from "discord.js";
import { Client } from "../index.js";
import ReactionMenu from "../utilities/reactionMenu.js";

export default class CommandContext {
  /**
   * @param {Client} client
   * @param {Message} msg
   * @param {String} command
   */
  constructor(client, msg, command, usedPrefix) {
    this.msg = msg;
    this.client = client;
    this.command = command;

    this.prefix = usedPrefix ?? client.prefix(msg);
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
}
