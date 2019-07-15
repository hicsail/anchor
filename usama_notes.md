# Using Anchor

<!-- ### Maybe read these but don't follow
- [Anchor README](https://github.com/hicsail/anchor/blob/50aaab8543d81442a1e9a58ea9d4ee5328fb5787/README.md)

- [Sarah's notes](https://github.com/hicsail/anchor/blob/7ecb0f5f42731391e35fdf87de7d707da13ef6fc/learn-anchor-notes.md)

- [HAPI Tutorial](https://web.archive.org/web/20161118230700/http://hapijs.com/tutorials)

- [HAPI Plugins](https://web.archive.org/web/20161121002607/http://hapijs.com/tutorials/plugins) -->

### Getting Started
1. `git clone https://github.com/hicsail/anchor.git`

1. `cd [folder-name]`
1. Update `package.json`
    ```diff
    -  "bcrypt": "1.x.x"
    +  "bcryptjs": "2.x.x"
    ```
1. Update require statements
    ```diff
    -  const Bcrypt = require('bcrypt');
    +  const Bcrypt = require('bcryptjs');
    ```
    in files
    - `server/api/login.js`
    - `server/models/session.js`
    - `server/models/user.js`

1. `npm install`
1. `npm run first-time-setup`
    <!-- TODO -->
    1. I kept it default
    1. I made email `root`
    1. I made password `Root1234`
1. Have a Mongo server running
1. Run using `npm start`

### Models
- These lines in manifest.js tell anchor there exists a model
    ```js
        plugin: {
            register: 'hicsail-hapi-mongo-models',
            options: {
                ...
                NewThing: './server/models/new-thing', // The actual model file
                ...
                },
            autoIndex: Config.get('/hapiMongoModels/autoIndex')
        },
        ...

        {
            plugin: './server/api/new-thing', // The api calls registered with the model
            options: {
                routes: { prefix: '/api' }
            }
        },
        {
            plugin: './server/web/routes/new-thing' // Where the frontend for the backend is
        },
    ```
- These files define `new-thing`
    1. `server/api/new-thing.js`
    1. `server/models/new-thing.js`
    1. `server/web/routes/new-thing.js`

- These files are a template to use to make new models and they have helpful comments in them
    1. `server/api/templates.js`
    1. `server/models/templates.js`
    1. `server/web/routes/templates.js`

### Making the frontend for the backend
- Add a link to the new model in `server/web/partials/dashboardNav.handlebars` under the `h6` Collections
- Copy `server/web/routes/templates.js` to `server/web/routes/new-thing.js` and change the contents accordingly
- Copy `server/web/templates/templates/` to `server/web/templates/new-thing/` and change the contents accordingly
- Copy `server/web/public/scripts/templates/` to `server/web/public/scripts/new-thing/` and change contents accordingly
- The templates files have helpful comments in them

### Using the Backend
1. Login with a POST call to `http://localhost:9000/api/login` with the username and password in the body
1. Save the field called `authHeader` from the result (Not necessary if it's saved in a cookie automatically)
1. Put the `authHeader` in the header like `"Authorization": [authHeader]` to make calls requiring authorization
