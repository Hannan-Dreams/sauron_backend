const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();

/**
 * Script to create TechProducts table in DynamoDB
 */

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const TABLE_NAME = process.env.TECH_PRODUCTS_TABLE_NAME || 'TechProducts';

async function createTechProductsTable() {
    try {
        // Check if table already exists
        try {
            const describeCommand = new DescribeTableCommand({
                TableName: TABLE_NAME,
            });
            await client.send(describeCommand);
            console.log(`✅ Table ${TABLE_NAME} already exists`);
            return;
        } catch (error) {
            if (error.name !== 'ResourceNotFoundException') {
                throw error;
            }
            // Table doesn't exist, proceed to create it
        }

        // Create table
        const createTableCommand = new CreateTableCommand({
            TableName: TABLE_NAME,
            KeySchema: [
                { AttributeName: 'productId', KeyType: 'HASH' }, // Partition key
            ],
            AttributeDefinitions: [
                { AttributeName: 'productId', AttributeType: 'S' },
                { AttributeName: 'category', AttributeType: 'S' },
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'CategoryIndex',
                    KeySchema: [
                        { AttributeName: 'category', KeyType: 'HASH' },
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
        });

        await client.send(createTableCommand);
        console.log(`✅ Table ${TABLE_NAME} created successfully`);
        console.log('\nTable Details:');
        console.log('- Primary Key: productId (String)');
        console.log('- Global Secondary Index: CategoryIndex (category)');
        console.log('\nTable Schema:');
        console.log('- productId: String (Primary Key)');
        console.log('- name: String');
        console.log('- brand: String');
        console.log('- category: String (GSI)');
        console.log('- price: String');
        console.log('- rating: Number');
        console.log('- specs: List');
        console.log('- description: String');
        console.log('- imageUrl: String');
        console.log('- createdAt: String (ISO timestamp)');
        console.log('- updatedAt: String (ISO timestamp)');
    } catch (error) {
        console.error('❌ Error creating table:', error);
        throw error;
    }
}

// Run the script
createTechProductsTable()
    .then(() => {
        console.log('\n✅ Setup complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Setup failed:', error);
        process.exit(1);
    });
