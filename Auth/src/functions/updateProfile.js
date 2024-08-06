const { app, input } = require('@azure/functions');
const sql = require('mssql');

app.http('updateProfile', {
    methods: ['PATCH'],
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

        const { email, displayName, profilePic } = requestBody;

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
            // Check if user exists
            const checkResult = await pool.request()
                .input('email', sql.VarChar, email)
                .query('SELECT * FROM dbo.users WHERE email = @Email');

            if (checkResult.recordset.length === 0) {
                return {
                    status: 404,
                    body: "User not found"
                };
            }

            // Update user profile
            await pool.request()
                .input('email', sql.VarChar, email)
                .input('displayName', sql.VarChar, displayName)
                .input('profilePictureUrl', sql.VarChar, profilePic || null)
                .query('UPDATE dbo.users SET display_name = @DisplayName, profile_picture_url = @ProfilePictureUrl WHERE email = @Email');

            return {
                status: 200,
                body: "User profile updated successfully"
            };
        } catch (error) {
            return {
                status: 500,
                body: `An error occurred while updating the user profile: ${error.message}`
            };
        }
    }
});
