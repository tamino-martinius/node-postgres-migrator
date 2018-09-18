const pg = require('pg');

/**
 * Description of the Migration
 */
module.exports = {
  parent: undefined,
  /**
   * Method to apply migration
   * @param {pg.Pool} client
   * @returns {Promise<void>}
   */
  async up(client) {

    // Code for Migration

  },
  /**
   * Method to rollback migration
   * @param {pg.Pool} client
   * @returns {Promise<void>}
   */
  async down(client) {

    // Code for Rollback

  },
}
