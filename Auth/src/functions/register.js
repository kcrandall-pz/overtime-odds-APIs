const { app, input } = require('@azure/functions');
// const sql = require('mssql');
// const bcrypt = require('bcryptjs');

// const emailCheck = input.sql({
//     commandText: `SELECT * from dbo.users WHERE email = ${requestBody.email}`,
//     commandType: 'Text',
//     connectionStringSetting: 'DBConnectionString',
// });

app.http('register', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        // const connString = process.env.DBConnectionString;

        // const requestBody = await request.json();
        // let pool = await sql.connect(connString);
        // const req = new sql.Request(pool);

        // const hashedPassword = await bcrypt.hash(requestBody.password, 10);

        // if (!requestBody.email || !requestBody.password || !requestBody.displayName) {
        //     context.res = {
        //       status: 400,
        //       body: "Please provide all required fields (email, password, displayName)"
        //     };
        //     return;
        //   }
        
        //   try {
            
        //     const check = context.extraInputs.get(emailCheck);
        //     if (check > 0) {
        //       context.res = {
        //         status: 400,
        //         body: "User already exists"
        //       };
        //       return;
        //     }

        //     await req.query(`INSERT INTO dbo.users VALUES ('${requestBody.email}', '${hashedPassword}', '${requestBody.displayName}', '${requestBody.profilePic}')`);
        //     return {
        //         status: 200,
        //         body: "New user registered successfully",
        //     }
        //   }
        //   catch (err) {
        //     context.res = {
        //       status: 500,
        //       body: "An error occurred while registering the user"
        //     };
        //   }

        const name = request.query.get('name') || await request.text() || 'world';

        return { body: `Hello, ${name}!` };
    }
});
