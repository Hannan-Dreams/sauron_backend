const { DynamoDBClient, ListTablesCommand, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

async function checkAndCreateTable() {
    const tableName = process.env.DSA_TABLE_NAME || 'dsa-problems';

    console.log('='.repeat(60));
    console.log('DynamoDB Table Check & Setup');
    console.log('='.repeat(60));
    console.log();

    // Step 1: Check AWS credentials
    console.log('📋 Step 1: Checking AWS Configuration...');
    console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log(`   Access Key: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log();

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.error('❌ ERROR: AWS credentials not found in .env file!');
        console.log();
        console.log('Please add to your .env file:');
        console.log('AWS_REGION=us-east-1');
        console.log('AWS_ACCESS_KEY_ID=your_access_key');
        console.log('AWS_SECRET_ACCESS_KEY=your_secret_key');
        process.exit(1);
    }

    // Step 2: List all tables
    try {
        console.log('📋 Step 2: Listing all DynamoDB tables...');
        const listCommand = new ListTablesCommand({});
        const listResult = await client.send(listCommand);

        console.log(`   Found ${listResult.TableNames.length} table(s):`);
        listResult.TableNames.forEach(name => {
            console.log(`   - ${name} ${name === tableName ? '✅ (DSA Table)' : ''}`);
        });
        console.log();

        // Step 3: Check if our table exists
        if (listResult.TableNames.includes(tableName)) {
            console.log(`✅ Table "${tableName}" already exists!`);

            // Get table details
            const describeCommand = new DescribeTableCommand({ TableName: tableName });
            const describeResult = await client.send(describeCommand);

            console.log();
            console.log('Table Details:');
            console.log(`   Status: ${describeResult.Table.TableStatus}`);
            console.log(`   Items: ${describeResult.Table.ItemCount || 0}`);
            console.log(`   Created: ${new Date(describeResult.Table.CreationDateTime).toLocaleString()}`);
            console.log();
            console.log('✅ Everything looks good! You can use the DSA management system.');

        } else {
            console.log(`⚠️  Table "${tableName}" does NOT exist.`);
            console.log();
            console.log('Creating table now...');

            // Step 4: Create the table
            const createCommand = new CreateTableCommand({
                TableName: tableName,
                KeySchema: [
                    { AttributeName: 'problemId', KeyType: 'HASH' }
                ],
                AttributeDefinitions: [
                    { AttributeName: 'problemId', AttributeType: 'S' }
                ],
                BillingMode: 'PAY_PER_REQUEST'
            });

            await client.send(createCommand);
            console.log('✅ Table created successfully!');
            console.log();
            console.log('Waiting for table to become active...');

            // Wait for table to be active
            let attempts = 0;
            while (attempts < 30) {
                const describeCommand = new DescribeTableCommand({ TableName: tableName });
                const describeResult = await client.send(describeCommand);

                if (describeResult.Table.TableStatus === 'ACTIVE') {
                    console.log('✅ Table is now ACTIVE!');
                    console.log();
                    console.log('🎉 Setup complete! You can now:');
                    console.log('   1. Restart your backend server');
                    console.log('   2. Login as admin');
                    console.log('   3. Go to /admin/dsa');
                    console.log('   4. Add DSA problems');
                    return;
                }

                process.stdout.write('.');
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;
            }

            console.log();
            console.log('⚠️  Table creation is taking longer than expected.');
            console.log('   Check AWS Console to verify table status.');
        }

    } catch (error) {
        console.error();
        console.error('❌ ERROR:', error.message);
        console.error();

        if (error.name === 'CredentialsProviderError') {
            console.error('Problem: Invalid AWS credentials');
            console.error('Solution: Check your .env file has correct AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
        } else if (error.name === 'UnrecognizedClientException') {
            console.error('Problem: Invalid AWS credentials or region');
            console.error('Solution: Verify your AWS credentials and region in .env file');
        } else if (error.name === 'AccessDeniedException') {
            console.error('Problem: IAM user lacks DynamoDB permissions');
            console.error('Solution: Add DynamoDB permissions to your IAM user');
        } else {
            console.error('Full error:', error);
        }

        process.exit(1);
    }
}

console.log();
checkAndCreateTable()
    .then(() => {
        console.log();
        console.log('='.repeat(60));
        process.exit(0);
    })
    .catch(error => {
        console.error();
        console.error('Fatal error:', error);
        console.error('='.repeat(60));
        process.exit(1);
    });
