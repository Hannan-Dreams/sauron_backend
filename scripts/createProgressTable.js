const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

async function createProgressTable() {
    const tableName = process.env.USER_PROGRESS_TABLE_NAME || 'user-progress';

    console.log('============================================================');
    console.log('Creating User Progress Table');
    console.log('============================================================\n');

    try {
        console.log(`Creating table: ${tableName}...`);

        const command = new CreateTableCommand({
            TableName: tableName,
            KeySchema: [
                { AttributeName: 'userId', KeyType: 'HASH' },
            ],
            AttributeDefinitions: [
                { AttributeName: 'userId', AttributeType: 'S' },
            ],
            BillingMode: 'PAY_PER_REQUEST',
        });

        await client.send(command);
        console.log('✅ Table created successfully!\n');

        console.log('Waiting for table to become ACTIVE...');
        await waitForTableActive(tableName);

        console.log('\n✅ Table is now ACTIVE and ready to use!');
        console.log('\nTable Details:');
        console.log(`  - Table Name: ${tableName}`);
        console.log(`  - Primary Key: userId (String)`);
        console.log(`  - Billing: On-demand`);
        console.log('\n🎉 User progress tracking is now enabled!');

    } catch (error) {
        if (error.name === 'ResourceInUseException') {
            console.log(`ℹ️  Table "${tableName}" already exists!`);
            console.log('No action needed. Progress tracking is ready to use.');
        } else {
            console.error('❌ Error creating table:', error.message);
            throw error;
        }
    }
}

async function waitForTableActive(tableName, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const command = new DescribeTableCommand({ TableName: tableName });
            const result = await client.send(command);

            if (result.Table.TableStatus === 'ACTIVE') {
                return true;
            }

            process.stdout.write('.');
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error('\nError checking table status:', error.message);
            throw error;
        }
    }

    throw new Error('Table did not become ACTIVE within expected time');
}

createProgressTable()
    .then(() => {
        console.log('\n============================================================');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Setup failed:', error.message);
        console.log('\n============================================================');
        process.exit(1);
    });
