# ACME Internal Package Registry

## Purpose
We've developed an AWS hosted package registry for ACME Corp  to privately store, organize, and verify open source projects for their software development team.

This registry provides several features that a large scale but general use registry (such as npm) couldn’t, while maintaining the most necessary features they provide. For example, we maintain the ability to search through packages, filter by versions, and upload and download new packages at will.

One major advantage over traditional registeries is that our product is internally hosted. This gives ACME Corp complete control over securoty and upgrade schedules to fit their unique development cycle. 

In addition to an API to accompany this registry, we've developed several endpoints that public registries do not offer. Such as the ability to rate packages based on the quality of development work that’s gone into them, only allow quality packages to be added to the registry, and a recommendation endpoint in our API that uses an OpenAI call to search through READMEs in the registry to recommend packages for specific use cases that may arise.

## Configuration
Our tool is configured for deployment using an AWS EC2 instance, and an RDS database.

In order to set it up you'll want to ssh into the EC2 instance, preferably using a secure `.pem` key file. From there we utilize nginx and pm2 to handle requests to and from ourside s;ources to manage access to our servers

### Deployment Steps
*After the project is cloned into the EC2 instance follow these to set up nginx*

#### Installs
Each EC2 instance needs these installed to work, only necessary the first time
```
sudo curl https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
nvm install node
npm install
sudo apt install nginx
```

#### Configuration

The nginx configuration file is located in `/etc/nginx/sites-enabled/registry_app`
```
server {
    listen PORT;
    server_name <DNS NAME>;  # Replace with your domain or public IP

    location / {

        root <PATH TO FRONTEND/SRC/PUBLIC DIRECTORY>
        index index.html
        try_files $uri  /index.html;    # Handle client-side routing
    }

    location /api {
        proxy_pass http://localhost:3000/; # Backend API
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        rewrite ^/api(/.*)$ $1 break;
    }
}
```

This file has some values left to be filled in for the specific instance being deployed to and needs to be updated each time the values change
server_name -> instance public DNS (changes each time we restart the instance)

After making said changes, use these commands to propogate them
```
sudo rm /etc/nginx/sites-available/registry_app
sudo ln -s /etc/nginx/sites-enabled/registry_app /etc/nginx/
sites-available/registry_app
```

Also 

**Update the api.ts file inside `frontend/src/services` so that the CONST_BASE_URL reflects the DNS name as well**

#### Nginx Commands
Quality of life commands for nginx

see nginx logs (nglogs)

`sudo tail -f /var/log/nginx/error.log`

test nginx

`sudo nginx -t`

get nginx status (replace with start, stop, reset for other functionality)

`sudo systemctl status nginx`

#### Running the Project

After completing the nginx configuration the frontend project should be compiled using `npm run build`, following a restart of nginx (using the above commands) the frontend ui should be available at `http://<DNS name>`

In order to run the backend simply use the same `npm run build` command, and use `pm2 restart 0` to restart our watcher system to keep it running in the instance.

### Environmental Variables
Security values are all stored within a `.env` file inside of the `backend` directory. This file contains the following data to ensure the api and package rating modules function as expected.
```
AWS_RDS_ENDPOINT = 
AWS_RDS_USERNAME = 
AWS_RDS_PASSWORD = 
AWS_RDS_DATABASE_NAME = 
AWS_RDS_PORT = 

GITHUB_TOKEN = 
LOG_LEVEL = 
LOG_FILE = 
```


## Use

Our UI will be accessible at `http://<PUBLIC DNS NAME>`, the api at `http://<PUBLIC DNS NAME>/api`

The different tabs in the UI each correspond to API endpoints and function in exactly the same way.
