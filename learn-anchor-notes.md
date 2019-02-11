#Notes on Learning Anchor

The notes below were written for the Power Market project. Examples are available at:
https://github.com/hicsail/power-market/tree/master/server.

## Add a New Database Object (here, a "capacitor") 
1. Edit the **manifest.js** file.
    * Add the model.
    
        Example:  
        ```
            Capacitor: './server/models/capacitor',
        ```
    * Add the api route.
    
        Example:
        ```
            {
                plugin: './server/api/capacitors',
                options: {
                    routes: { prefix: '/api' }
                }
            },
        ```
     * Add the web route.
     
        Example:
        ```
            {
                plugin: './server/web/routes/capacitors'
            },
        ```
2. Add a JavaScript file to the **server/api** folder.
    * Add attributes to the **POST** and **PUT** sections.
    
        Example file:
    ```
            server/api/capacitors.js
    ```
    * Register the DER in the last line.
    
        Example:
    ```
            exports.register.attributes = {
                name: 'capacitors'
            };
    ```
3. Add a JavaScript file to the **server/models** folder.
    * Use the correct attributes throughout.
    
        Example file:
        ```
           server/models/capacitor.js 
        ```
    * The "indexes" section near the bottom lists the database index values.
    
        Example:
        ```
           Capacitor.indexes = [
             { key: { line: 1 } },
             { key: { userId: 1 } }
           ];
        ```
4. Add a line to the **web/partials/dashboardNav.handlebars** file.

    Example:
    ```
        <a class="nav-link text-light" href="../capacitors">Capacitors</a>
    ```
5. Add a new JavaScript file to the **web/routes** folder.

    Example file:
     ```
        web/routes/capacitors.js
     ```
6. Add a new subfolder to **web/templates** with three files:
      1. create.handlebars
      2. edit.handlebars
      3. index.handlebars
      
    Example subfolder: 
    ```
        web/templates/capacitors/
    ```
7. Add a new subfolder to **web/public/scripts** with three files:
      1. create.js
      2. edit.js
      3. index.js
    
    Example subfolder:
    ```
        web/public/scripts/
    ```
    
## Add/Edit an EXISTING Database Object in Anchor (here, edit the "capacitor" object)
1. Edit the JavaScript file in the **server/models** folder.

    Example file:
    ```
       server/models/capacitor.js 
    ```
2. Edit the file in the **server/api** folder.

    Example file:
    ```
       server/api/capacitors.js
    ```
3. Change the **web/templates/** files.

    Example subfolder:
    ```
       web/templates/capacitors/
    ```
4. Adjust the **web/public/scripts/** files.

    Example subfolder:
    ```
       web/public/scripts/capacitors/
    ```

