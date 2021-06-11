import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import rc from '../utils/redis';
import db from '../utils/db';

class FilesController {
  static async postUpload(request, response) {
    const token = request.headers['x-token'];
    if (!token) { return response.status(401).json({ error: 'Unauthorized' }); }
    const keyID = await rc.get(`auth_${token}`);
    if (!keyID) { return response.status(401).json({ error: 'Unauthorized' }); }
    const user = await db.db.collection('users').findOne({ _id: ObjectId(keyID) });
    if (!user) { return response.status(401).json({ error: 'Unauthorized' }); }

    const { name } = request.body;
    if (!name) { return response.status(400).json({ error: 'Missing name' }); }
    const { type } = request.body;
    if (!type || !['folder', 'file', 'image'].includes(type)) { return response.status(400).json({ error: 'Missing type' }); }
    const isPublic = request.body.isPublic || false;
    const parentId = request.body.parentId || 0;
    const { data } = request.body;
    if (!data && !['folder'].includes(type)) { return response.status(400).json({ error: 'Missing data' }); }
    if (parentId !== 0) {
      const path = await db.db.collection('files').findOne({ _id: ObjectId(parentId) });
      if (!path) { return response.status(400).json({ error: 'Parent not found' }); }
      if (!['folder'].includes(path.type)) {
        return response.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileAttrs = {
      userId: user._id, name, type, isPublic, parentId,
    };

    if (['folder'].includes(type)) {
      await db.db.collection('files').insertOne(fileAttrs);
      return response.status(201).json({
				id: fileAttrs._id, userId: fileAttrs.userId, name: fileAttrs.name,
        type: fileAttrs.type, isPublic: fileAttrs.isPublic, parentId: fileAttrs.parentId,
      });
    }

    const tmpdir = process.env.FOLDER_PATH || '/tmp/files_manager';
    await fs.mkdir(tmpdir, { recursive: true }, (error) => {
      if (error) { return response.status(400).json({ error: error.message }); }
      return true;
    });

    const uuid = uuidv4();
    const localPath = `${tmpdir}/${uuid}`;
    const buff = Buffer.from(data, 'base64');

    await fs.writeFile(localPath, buff, (error) => {
      if (error) { return response.status(400).json({ error: error.message }); }
      return true;
    });

    fileAttrs.localPath = localPath;
    await db.db.collection('files').insertOne(fileAttrs);

    return response.status(201).json({
      id: fileAttrs._id, userId: fileAttrs.user, name: fileAttrs.name,
      type: fileAttrs.type, isPublic: fileAttrs.isPublic, parentId: fileAttrs.parentId,
    });
  }
}
module.exports = FilesController;
