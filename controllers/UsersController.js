import sha1 from 'sha1';
import db from '../utils/db';
import redis from '../utils/redis';

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;
    // check for email and password
    if (!email) {
      return response.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return response.status(400).json({ error: 'Missing password' });
    }
    // Search for existing user in db
    const exists = await db.users.find({ email }).count();
    if (exists > 0) {
      return response.status(400).json({ error: 'Already exist' });
    }
    // Insert new user
    const hashedPwd = sha1(password);
    const user = await db.users.insertOne({ email, password: hashedPwd });
    response.status(201);
    return response.json({ email, id: user.insertedId });
  }

  static async getMe(request, response) {
    const token = request.headers['x-token'];
    const key = `auth_${token}`;
    const ID = await redis.get(key);
    const userObj = await db.users.collection('users').findOne({ _id: ID });
    if (!userObj) { return response.status(401).json({ error: 'Unauthorized' }); }
    return response.json({ ID, email: userObj.email });
  }
}
export default UsersController;
