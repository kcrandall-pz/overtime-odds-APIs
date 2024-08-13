const { app, input } = require('@azure/functions');
const sql = require('mssql');
const bcrypt = require('bcryptjs');

app.http('register', {
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

        if (!requestBody.email || !requestBody.password || !requestBody.displayName) {
            return {
                status: 400,
                body: "Please provide all required fields (email, password, displayName)"
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

        const hashedPassword = await bcrypt.hash(requestBody.password, 10);
        
        try {
            const checkResult = await pool.request()
                .input('email', sql.VarChar, requestBody.email)
                .query('SELECT * FROM dbo.users WHERE email = @Email');
            
            if (checkResult.recordset.length > 0) {
                return {
                    status: 400,
                    body: "User already exists"
                };
            }

            await pool.request()
                .input('email', sql.VarChar, requestBody.email)
                .input('passwordHash', sql.VarChar, hashedPassword)
                .input('displayName', sql.VarChar, requestBody.displayName)
                .input('profilePictureUrl', sql.VarChar, requestBody.profilePic || null)
                .query('INSERT INTO dbo.users (email, password_hash, display_name, profile_picture_url) VALUES (@Email, @PasswordHash, @DisplayName, @ProfilePictureUrl)');

            return {
                status: 201,
                body: "New user registered successfully"
            };
        } catch (error) {
            return {
                status: 500,
                body: `An error occurred while registering the user: ${error.message}. Please try again`
            };
        }
    }
});
