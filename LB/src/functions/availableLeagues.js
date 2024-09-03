const { app } = require('@azure/functions');
const sql = require('mssql');

app.http('availableLeagues', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const connString = process.env.DBConnectionString;

        const userId = request.query.get('user_id');

        // Check if user_id is present
        if (!userId) {
            return {
                status: 400,
                body: "Missing user_id query parameter"
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
            const checkAvailableLeagues = await pool.request()
                .input('user_id', sql.VarChar, userId)
                .query(`SELECT * FROM dbo.Leagues WHERE id NOT IN (SELECT league_id FROM LeagueMembers WHERE user_id = @user_id)`);

            return {
                status: 200,
                body: JSON.stringify(checkAvailableLeagues.recordset)
            };
        } catch (error) {
            return {
                status: 500,
                body: 'An error occurred while searching for available leagues'
            };
        }
    }
});
