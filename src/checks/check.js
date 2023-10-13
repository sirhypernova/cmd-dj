import { Client } from "../index.js";

export default class Check {
  /**
   * Check base class
   * @param {Client} client
   */
  constructor(client) {
    this.client = client;
    this.name = "";
  }

  /**
   * Test the check
   * @param {CommandContext} ctx
   */
  test(ctx) {}
}
