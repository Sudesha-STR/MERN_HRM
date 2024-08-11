import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import AWS from 'aws-sdk';
import { exec } from 'child_process';

AWS.config.update({
  region: 'us-east-1', // Update this to your region
  accessKeyId: 'your-access-key-id',
  secretAccessKey: 'your-secret-access-key',
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const app = express();
app.use(cors({
  origin: ["http://localhost:5173"],
  methods: ["POST", "GET", "PUT", "DELETE"],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.static('E:/employeesys/frontend/public'));

// Python script execution example
exec('python generate_graph.py', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'E:/employeesys/frontend/public/images');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Helper function for DynamoDB operations
const dynamoGet = (params) => {
  return dynamodb.get(params).promise();
};

const dynamoPut = (params) => {
  return dynamodb.put(params).promise();
};

const dynamoScan = (params) => {
  return dynamodb.scan(params).promise();
};

const dynamoUpdate = (params) => {
  return dynamodb.update(params).promise();
};

const dynamoDelete = (params) => {
  return dynamodb.delete(params).promise();
};

app.get('/getEmployee', async (req, res) => {
  const params = {
    TableName: 'EmployeeTable',
  };

  try {
    const result = await dynamoScan(params);
    res.json({ Status: 'Success', Result: result.Items });
  } catch (err) {
    res.json({ Error: 'Get employee error in DynamoDB' });
  }
});

app.get('/employeedetail/:id', async (req, res) => {
  const params = {
    TableName: 'EmployeeTable',
    Key: {
      id: parseInt(req.params.id, 10),
    },
  };

  try {
    const result = await dynamoGet(params);
    if (!result.Item) {
      res.status(404).json({ Error: 'Employee not found' });
      return;
    }
    res.json({ Status: 'Success', Result: result.Item });
  } catch (err) {
    res.json({ Error: 'Get employee error in DynamoDB' });
  }
});

app.put('/update/:id', async (req, res) => {
  const params = {
    TableName: 'EmployeeTable',
    Key: { id: parseInt(req.params.id, 10) },
    UpdateExpression: 'set salary = :s, #nm = :n, email = :e, address = :a, image = :i',
    ExpressionAttributeNames: {
      '#nm': 'name',
    },
    ExpressionAttributeValues: {
      ':s': req.body.salary,
      ':n': req.body.name,
      ':e': req.body.email,
      ':a': req.body.address,
      ':i': req.body.filename,
    },
  };

  try {
    await dynamoUpdate(params);
    res.json({ Status: 'Success' });
  } catch (err) {
    res.json({ Error: 'Update employee error in DynamoDB' });
  }
});

app.delete('/delete/:id', async (req, res) => {
  const params = {
    TableName: 'EmployeeTable',
    Key: { id: parseInt(req.params.id, 10) },
  };

  try {
    await dynamoDelete(params);
    res.json({ Status: 'Success' });
  } catch (err) {
    res.json({ Error: 'Delete employee error in DynamoDB' });
  }
});

app.post('/login', async (req, res) => {
  const params = {
    TableName: 'UserTable',
    Key: {
      email: req.body.email.toString(),
    },
  };

  try {
    const result = await dynamoGet(params);
    const user = result.Item;

    if (!user || req.body.password !== user.password) {
      return res.json({ Status: 'Error', Error: 'Wrong Email or Password' });
    }

    const token = jwt.sign({ role: user.role }, 'jwt-secret-key', { expiresIn: '1d' });
    res.cookie('token', token);
    res.json({ Status: 'Success' });
  } catch (err) {
    res.json({ Error: 'Login error in DynamoDB' });
  }
});

app.post('/employeelogin', async (req, res) => {
  const params = {
    TableName: 'EmployeeTable',
    Key: {
      email: req.body.email.toString(),
    },
  };

  try {
    const result = await dynamoGet(params);
    const user = result.Item;

    if (!user || req.body.password !== user.password) {
      return res.json({ Status: 'Error', Error: 'Wrong Email or Password' });
    }

    const token = jwt.sign({ role: user.role }, 'jwt-secret-key', { expiresIn: '1d' });
    res.cookie('token', token);
    res.json({ Status: 'Success', id: user.id });
  } catch (err) {
    res.json({ Error: 'Employee login error in DynamoDB' });
  }
});

app.get('/adminCount', async (req, res) => {
  const params = {
    TableName: 'UserTable',
    Select: 'COUNT',
  };

  try {
    const result = await dynamoScan(params);
    res.json({ adminCount: result.Count });
  } catch (err) {
    res.json({ Error: 'Error in running query' });
  }
});

app.get('/employeeCount', async (req, res) => {
  const params = {
    TableName: 'EmployeeTable',
    Select: 'COUNT',
  };

  try {
    const result = await dynamoScan(params);
    res.json({ employeeCount: result.Count });
  } catch (err) {
    res.json({ Error: 'Error in running query' });
  }
});

app.get('/salary', async (req, res) => {
  const params = {
    TableName: 'EmployeeTable',
  };

  try {
    const result = await dynamoScan(params);
    const sumOfSalary = result.Items.reduce((sum, item) => sum + item.salary, 0);
    res.json({ sumOfSalary });
  } catch (err) {
    res.json({ Error: 'Error retrieving salary data' });
  }
});

app.post('/create', upload.single('image'), async (req, res) => {
  const { name, email, password, address, salary } = req.body;
  const image = req.file.filename;
  const id = parseInt(req.body.id);

  const hash = await bcrypt.hash(password, 10);

  const params = {
    TableName: 'EmployeeTable',
    Item: {
      id,
      name,
      email,
      password: hash,
      address,
      salary,
      image,
    },
  };

  try {
    await dynamoPut(params);
    res.json({ Status: 'Success' });
  } catch (err) {
    res.json({ Error: 'Error in creating employee in DynamoDB' });
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ Status: 'Success' });
});

app.listen(8081, () => {
  console.log("Running");
});
