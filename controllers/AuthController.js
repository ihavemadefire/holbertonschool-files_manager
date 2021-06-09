import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(request, response) {
    if (!request.headers.authorization) {
      return response.status(401).json({ message: 'Missing Auth Header' });
    }
    const rawCred = request.headers.authorization;
    const sliceBounce = rawCred.slice(6);
    const stringCreds = Buffer.from(sliceBounce, 'base64').toString();
    const [email, pwd] = stringCreds.split(':');
    if (!email || !pwd) return response.status(401).json({ error: 'Unauthorized' });
    const finishedCreds = { email, password: sha1(pwd) };
    const user = await dbClient.db.collection('users').findOne(finishedCreds);
    if (!user) { return response.status(401).json({ error: 'Unauthorized' }); }
    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 86400);
    return response.status(200).json({ token });
  }

  static async getDisconnect(request, response) {
    const token = request.headers['x-token'];
    const user = await redisClient.get(`auth_${token}`);
    if (!user) { return response.status(401).json({ error: 'Unauthorized' }); }
    await redisClient.del(`auth_${token}`);
    response.status(204).end();
    return null;
  }
}

export default AuthController;
