# Express Boilerplate!

This is a boilerplate project used for starting new projects!

## How do set up?

Complete the following steps to start a new project (NEW-PROJECT-NAME):

1. Clone this repository to your local machine `git clone BOILERPLATE-URL NEW-PROJECTS-NAME`
2. `cd` into the cloned repository
3. Make a fresh start of the git history for this project with `rm -rf .git && git init`
4. Install the node dependencies `npm install`
5. Move the example Environment file to `.env` that will be ignored by git and read by the express server `mv example.env .env`
6. Edit the contents of the `package.json` to use NEW-PROJECT-NAME instead of `"name": "express-boilerplate",`
7. Create the database in psql
8. In the .env file, change the MIGRATION_DB_NAME to match the newly created database in step 7

## Scripts

Start the application `npm start`

Start nodemon for the application `npm run dev`

Run the tests in watch mode `npm test`

## Deploying

When your new project is ready for deployment, add a new heroku application.
In the command line type:
`heroku create` -- wait to finish 
`git push  heroku master` --wait to finish

To provision postgres, type in the command line: 
`heroku addons:create heroku-postgresql:hobby-dev` -- this creates a new empty database

To get all of the .env variable for production, type: 
`pg:credentials:url` -- this will display the values for the .env production variables. 

Includes the following:
*PROD_MIGRATION_DB_NAME=GET NAME FROM HEROKU
*PROD_MIGRATION_DB_HOST=GET HOST FROM HEROKU
*PROD_MIGRATION_DB_PORT=GET PORT FROM HEROKU
*PROD_MIGRATION_DB_USER=GET USER FROM HEROKU
*PROD_MIGRATION_DB_PASS=GET DB FROM HEROKU

To run psql commands on the database created in heroku, type: 
`heroku pg:psql` 
-- this drops you into the heroku database
-- you can type psql commands directly from the command line


Make sure the following scripts are part of the "script" object in package.json
  "scripts": {
    "test": "mocha --require test/setup.js",
    "dev": "nodemon src/server.js",
    "migrate": "postgrator --config postgrator-config.js",
    "migrate-production": "postgrator --config postgrator-production-config.js",
    "start": "node src/server.js",
    "predeploy": "npm audit && npm run migrate-production",
    "deploy": "git push heroku master"
  },

This will make a new git remote called "heroku" and you can then `npm run deploy` which will push to this remote's master branch.
# bookmarks-server-updated
