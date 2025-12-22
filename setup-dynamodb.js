const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const USERS_TABLE = process.env.USERS_TABLE_NAME || 'Users';

async function createUsersTable() {
    const params = {
        TableName: USERS_TABLE,
        KeySchema: [
            { AttributeName: 'email', KeyType: 'HASH' }, // Partition key
        ],
        AttributeDefinitions: [
            { AttributeName: 'email', AttributeType: 'S' },
            { AttributeName: 'userId', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'UserIdIndex',
                KeySchema: [
                    { AttributeName: 'userId', KeyType: 'HASH' },
                ],
                Projection: {
                    ProjectionType: 'ALL',
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5,
                },
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    };

    try {
        // Check if table already exists
        try {
            const describeCommand = new DescribeTableCommand({ TableName: USERS_TABLE });
            await client.send(describeCommand);
            console.log(`✅ Table "${USERS_TABLE}" already exists!`);
            return;
        } catch (error) {
            if (error.name !== 'ResourceNotFoundException') {
                throw error;
            }
            // Table doesn't exist, proceed with creation
        }

        // Create table
        const command = new CreateTableCommand(params);
        const response = await client.send(command);

        console.log('🎉 Table created successfully!');
        console.log('📊 Table Details:');
        console.log(`   - Table Name: ${USERS_TABLE}`);
        console.log(`   - Status: ${response.TableDescription.TableStatus}`);
        console.log(`   - Region: ${process.env.AWS_REGION || 'us-east-1'}`);
        console.log('\n⏳ Waiting for table to become active...');

        // Wait for table to be active
        await waitForTableActive();

        console.log('✅ Table is now active and ready to use!');
    } catch (error) {
        console.error('❌ Error creating table:', error);
        throw error;
    }
}

async function waitForTableActive() {
    let isActive = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!isActive && attempts < maxAttempts) {
        try {
            const command = new DescribeTableCommand({ TableName: USERS_TABLE });
            const response = await client.send(command);

            if (response.Table.TableStatus === 'ACTIVE') {
                isActive = true;
            } else {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                attempts++;
            }
        } catch (error) {
            console.error('Error checking table status:', error);
            throw error;
        }
    }

    if (!isActive) {
        throw new Error('Table did not become active within the expected time');
    }
}

// Run the script
console.log('🚀 Starting DynamoDB table creation...\n');
createUsersTable()
    .then(() => {
        console.log('\n✨ Setup complete! You can now start your server.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Setup failed:', error.message);
        process.exit(1);
    });
