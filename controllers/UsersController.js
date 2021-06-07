import crypto from 'crypto';
import db from '../utils/db';

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
    const collection = await db.collection('users');
    const search = collection.find({ email }).toArray();
    if (await search.length > 0) {
      return response.status(400).json({ error: 'Already exist' });
    }

    const hash = crypto.createHash('sha1');
    const hashedPwd = hash.update(password);
    const hashDigestPwd = hashedPwd.digest('hex');
    const user = await collection.insertOne({ email, password: hashDigestPwd });
    response.status(201);
    return response.json({ email, id: user._id });
  }
}
export default UsersController;
