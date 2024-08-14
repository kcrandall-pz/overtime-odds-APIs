const { app, input } = require('@azure/functions');
const sql = require('mssql');
require('dotenv').config();

app.http('usersLeagues', {
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
            const checkUsersLeagues = await pool.request()
                .input('user_id', sql.VarChar, userId)
                .query(`SELECT 
                            l.id AS league_id,
                            l.name AS league_name,
                            l.created_at AS league_creation_date,
                            lm.joined_at AS user_joined_date
                        FROM 
                            dbo.Leagues l
                        INNER JOIN 
                            dbo.LeagueMembers lm ON l.id = lm.league_id
                        WHERE 
                            lm.user_id = @user_id;`
                    );

            return {
                status: 200,
                body: JSON.stringify(checkUsersLeagues.recordset)
            };
        } catch (error) {
            return {
                status: 500,
                body: 'An error occurred while searching for user leagues'
            };
        }
    }
});
