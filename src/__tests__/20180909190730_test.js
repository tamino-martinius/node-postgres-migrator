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

    // remove async keyword when you are using a node version before 8

  },
  /**
   * Method to rollback migration
   * @param {pg.Pool} client
   * @returns {Promise<void>}
   */
  async down(client) {

    // remove async keyword when you are using a node version before 8

  },
}
