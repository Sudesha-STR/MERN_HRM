import boto3

def create_dynamodb_table(dynamodb):
    try:
        # Create the DynamoDB table
        table = dynamodb.create_table(
            TableName='Employees',
            KeySchema=[
                {
                    'AttributeName': 'id',
                    'KeyType': 'HASH'  # Partition key
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'id',
                    'AttributeType': 'S'  # String type
                }
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            }
        )

        # Wait until the table exists
        table.meta.client.get_waiter('table_exists').wait(TableName='Employees')

        print(f"Table '{table.table_name}' created successfully.")
    except dynamodb.meta.client.exceptions.ResourceInUseException:
        print("Table already exists. Skipping creation.")

def add_employee(dynamodb, employee_data):
    # Reference the Employees table
    table = dynamodb.Table('Employees')

    # Add an employee to the table
    table.put_item(Item=employee_data)
    print(f"Employee with ID {employee_data['id']} added successfully.")

def main():
    # Initialize a session using Amazon DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name='us-east-2')

    # Create the table (if not already created)
    create_dynamodb_table(dynamodb)

    # Example employee data
    employee_data = {
        'id': '1',
        'name': 'John Doe',
        'email': 'john.doe@example.com',
        'password': 'hashed-password',
        'address': '123 Main St',
        'salary': '50000',
        'image': 'image-url'
    }

    # Add the employee
    add_employee(dynamodb, employee_data)

if __name__ == "__main__":
    main()
