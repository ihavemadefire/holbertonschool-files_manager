import db from '../utils/db';
import redis from '../utils/redis';

class AppController {
  static getStatus(request, response) {
    const jsonObj = { redis: redis.isAlive(), db: redis.isAlive() };
    return response.status(200).send(jsonObj);
  }

  static async getStats(request, response) {
    const numUsers = await db.nbUsers();
    const numFiles = await db.ndfiles();
    const jsonObj = { users: numUsers, files: numFiles };
    return response.status(200).send(jsonObj);
  }
}
module.exports = AppController;
