import { connectMySQL, disconnectMySQL } from '../../config/database/mysql.js';
import { createUsersTable } from '../../models/User.js';
import { createStreamsTable } from '../../models/Stream.js';
import { createDonationsTable } from '../../models/Donation.js';
import { createTokensTable } from '../../models/Token.js';


const run = async () => {
  try {
    await connectMySQL();
    console.log('📋 Creating tables...');
    await createUsersTable();
    await createStreamsTable();
    await createDonationsTable();
    await createTokensTable();
    console.log('✅ All tables ready');
    await disconnectMySQL();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
};

run();