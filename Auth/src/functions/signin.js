const { app } = require('@azure/functions');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET_KEY; // Ensure you have a secret key set in your environment variables

app.http('signin', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const connString = process.env.DBConnectionString;

        let requestBody;
        try {
            requestBody = await request.json();
        } catch (error) {
            return {
                status: 400,
                body: "Invalid JSON input"
            };
        }

        if (!requestBody.email || !requestBody.password) {
            return {
                status: 400,
                body: "Please provide both email and password"
            };
        }

        let pool;
        try {
            pool = await sql.connect(connString);
        } catch (error) {
            return {
                status: 500,
                body: "Database connection failed"
            };
        }

        try {
            const result = await pool.request()
                .input('email', sql.VarChar, requestBody.email)
                .query('SELECT * FROM dbo.users WHERE email = @Email');

            if (result.recordset.length === 0) {
                return {
                    status: 401,
                    body: "Invalid email or password"
                };
            }

            const user = result.recordset[0];
            const isPasswordValid = await bcrypt.compare(requestBody.password, user.password_hash);

            if (!isPasswordValid) {
                return {
                    status: 401,
                    body: "Invalid email or password"
                };
            }

            const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });

            return {
                status: 200,
                body: {
                    message: "Login successful",
                    token: token
                }
            };
        } catch (error) {
            return {
                status: 500,
                body: `An error occurred during login: ${error.message}`
            };
        }
    }
});
