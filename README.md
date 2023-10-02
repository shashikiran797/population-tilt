# Readme

## Demo
[Swagger documentation](http://iaacs-popul-j05rxoib8kz5-1471534576.ap-south-1.elb.amazonaws.com/api-docs)

[GET /states](http://iaacs-popul-j05rxoib8kz5-1471534576.ap-south-1.elb.amazonaws.com/states)

[GET /states/:id/people/fast](http://iaacs-popul-j05rxoib8kz5-1471534576.ap-south-1.elb.amazonaws.com/states/6/people/fast)

[GET /states/:id/people](http://iaacs-popul-j05rxoib8kz5-1471534576.ap-south-1.elb.amazonaws.com/states/6/people)



## Pre-requisites

### Install docker

#### Install docker on mac

```
brew install --cask docker
```

#### Install docker on linux

```
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io
```

### Install docker on windows

```
https://docs.docker.com/docker-for-windows/install/
```

### Install nvm


```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
```

### Postgres (with Postgis)

```bash
docker run -d --restart=always --name dev-postgres -v ~/docker_data/postgres:/var/lib/postgresql/data -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=test -d -p 5432:5432 postgis/postgis:14-3.3
```


---


### Running in local


#### Node server without docker
```bash
nvm install v20.8.0
yarn start
```

#### Node server with docker

```bash
yarn docker:build && yarn docker:start

# to stop the docker container
yarn docker:stop
```

#### Starting in local with auto reload

```bash
yarn dev:start
```


### IaaC - Running in cloud

1. Create a new user in AWS, ignore if you already have one
2. Generate access key and secret key, ignore if you already have one
3. Create a new profile in ~/.aws/credentials
4. Make sure to have relevant permissions for aws user
    EC2, ECS, RDS, SSM, S3, CloudFormation, CodeDeploy, Lambda, IAM
5. Go to `iaac` fodler, run `npm install` and then run `cdk bootstrap` to create the bucket for the cdk toolkit, this only needs to be done once per account
6. Run `cdk synth` to synthesize the stack, this will generate the cloudformation template. This step is not mandatory but it is good to do it to make sure everything is working as expected
7. Run `cdk deploy` to deploy the stack
8. Once done, you can access the api from the url in the output
9. Run `psql -h <host> -U postgres -d postgres` to connect to the database. Password is in iaac/lib/iaac-stack.js. Check debugging section if you are not able to connect
10. Run `sh scripts/load_data.sh` to load the data into the database. This will take some time depending on the network speed and the size of the db instance. I have chosen db.t2.micro which is the smallest instance for cost optimization. This will take around 30 minutes to load the data.
10. Run `cdk destroy` to destroy the stack once you are done with it

## Loading data

```bash
# Make sure to update the db host, username and password in load_data.sh
sh load_data.sh
```

## Architecture

### Database schema

<img width="504" alt="image" src="https://github.com/shashikiran797/population-tilt/assets/16119169/6e02ab65-8bce-41ab-bed0-55f9322ff96c">


### System interaction in cloud

<img width="648" alt="image" src="https://github.com/shashikiran797/population-tilt/assets/16119169/0e8a9d40-b9e2-4481-8e5a-ea742143c5a2">


### Folder structure

<pre>
iaac
    |-- bin
        |-- iaac.js
    |-- lib
        |-- iaac-stack.js   # Has all the cloud infra related code
scripts
    |-- load-data.sh        # Script to load the data in to the database
    |-- csv-to-json.js      # Script to convert csv to json
src
    |-- database
        |-- config.js       # Database configuration
        |-- postgres-client.js  # Database client
        |-- repositories    # Contains the logic to query the data for each table
            |-- people-repository.js
            |-- state-repository.js
    |-- server.js           # Entry point for the api
    |-- service.js          # Contains the business logic for the api
    |-- swagger-config.js   # Swagger configuration
</pre>

### Debugging

1. If you are not able to access the dB from local. Add inbound rules to rds vpc through AWS console


### Caveats

1. Since I am not sure if the system is read heavy or write heavy. I have created 2 apis to get people by state id
    1. One derives the people in the state in the real time. This is good if the database is expected to be write heavy and the data is real time. Upside here is that when we are adding new person, we don't have to recompute the state id for all the persons. Downside here is that, we will have to compute the state id for all the persons every time we query. This is not good if the database is expected to be read heavy
    2. Other one uses the precomputed data. Loading data script loads the data and derives state id for all the persons. One more assumption is that, one person can be in only one state. Downside here is that, we will have to recompute the state id for all the persons if the state geometry changes. This is good if the database is expected to be read heavy
2. iaac/lib/iaac-stack.js has password exposed as plain text. This is not a good practice. I have done this for the sake of simplicity. In real world, we can use AWS secrets manager to store the password and retrieve it from there.
3. I have not added any authentication to the api. This is not a good practice. In real world, we will have to add authentication to the api.
4. RDS is exposed to the internet. This is not a good practice. In real world, we will have to make sure that the RDS is not exposed to the internet. We will have to make it private after loading data or we should load it from a private subnet or VPN.
5. Not returning geometry of states, as the data is huge and can run into MegaBytes. If we need geoemtrise, We should use tile server to get the geometry of the states and visualize.
6. I have chosen AWS CDK to create the infrastructure. This IaaC takes care of the infrastructure and also take care of CI/CD. This is only for simplicity sake. In real world, I would choose Kubernetes for running the containers and not merge CI/CD with the infrastructure code.