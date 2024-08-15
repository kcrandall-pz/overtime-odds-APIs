const { app } = require('@azure/functions');
const sql = require('mssql');
require('dotenv').config();

app.http('joinLeague', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const connString = process.env.DBConnectionString;

        const userId = request.query.get('user_id');
        const leagueId = request.query.get('league_id');

        console.log('params', userId, leagueId)

        // Check if user_id and league_id are present
        if (!userId || !leagueId) {
            return {
                status: 400,
                body: "Missing user_id or league_id query parameter"
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
            // Check if the user is already in the league
            const checkUsersLeagues = await pool.request()
                .input('user_id', sql.Int, userId)
                .input('league_id', sql.Int, leagueId)
                .query(`SELECT * FROM dbo.LeagueMembers 
                        WHERE user_id = @user_id AND league_id = @league_id`);

            if (checkUsersLeagues.recordset.length > 0) {
                return {
                    status: 400,
                    body: "User is already a member of this league"
                };
            }

            // Add user to the league
            await pool.request()
                .input('user_id', sql.Int, userId)
                .input('league_id', sql.Int, leagueId)
                .query(`INSERT INTO dbo.LeagueMembers (user_id, league_id, joined_at) 
                        VALUES (@user_id, @league_id, GETDATE())`);

            // Instantiate a new entry in UserTotal table
            const startingBalance = 100000.00;
            await pool.request()
                .input('user_id', sql.Int, userId)
                .input('league_id', sql.Int, leagueId)
                .input('current_total', sql.Decimal(10, 2), startingBalance)
                .input('total_wins', sql.Decimal(10, 2), 0.00)
                .input('total_losses', sql.Decimal(10, 2), 0.00)
                .input('correct_bets', sql.Int, 0)
                .input('incorrect_bets', sql.Int, 0)
                .query(`INSERT INTO dbo.UserTotal (user_id, league_id, current_total, total_wins, total_losses, correct_bets, incorrect_bets) 
                        VALUES (@user_id, @league_id, @current_total, @total_wins, @total_losses, @correct_bets, @incorrect_bets)`);

            return {
                status: 200,
                body: "User successfully joined the league"
            };
        } catch (error) {
            return {
                status: 500,
                body: 'An error occurred while joining the league'
            };
        } finally {
            pool.close(); // Close the database connection
        }
    }
});
