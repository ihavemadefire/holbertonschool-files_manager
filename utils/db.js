const { MongoClient } = require('mongodb');

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const db = process.env.DB_DATABASE || 'files_manager';

class DBClient {
  constructor() {
    this.conn = false;
    MongoClient.connect(
      `mongodb://${host}:${port}/${db}`,
      { useNewUrlParser: true, useUnifiedTopology: true },
      (err, client) => {
        if (!err) {
          this.db = client.db(db);
          this.files = this.db.collection('files');
          this.users = this.db.collection('users');
          this.conn = true;
        } else {
          console.log(err);
        }
      },
    );
  }

  isAlive() {
    return (this.conn);
  }

  async nbFiles() {
    const number = this.files.countDocuments();
    return number;
  }

  async nbUsers() {
    const number = this.users.countDocuments();
    return number;
  }
}

const dbClient = new DBClient();
export default dbClient;
