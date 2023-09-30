# Readme


## Pre-requisites

## Install docker

### Install docker on mac

```
brew install --cask docker
```

### Install docker on linux

```
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io
```

### Install docker on windows

```
https://docs.docker.com/docker-for-windows/install/
```

## Install nvm


```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
```
### Postgres (with Postgis)

```bash
docker run -d --restart=always --name dev-postgres -v ~/docker_data/postgres:/var/lib/postgresql/data -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=test -d -p 5432:5432 postgis/postgis:14-3.3
```


---


### Running in local


### Node server without docker
```bash
nvm install v20.8.0
yarn start
```

### Node server with docker

```bash
yarn docker-build && yarn docker-start
```

### Starting in local with auto reload

```bash
yarn dev-start
```


### Enhancements

- If the system is read heavy, we could compute the result of /states/:id/people before hand and store it in postgres. This way, we would not have to compute it every time a request is made. The downside is that it would take more space in the database and we would have to update it every time a person is added or removed from a state or state geographical area is changed.

## IaaC

1. Create a new user in AWS
2. Generate access key and secret key
3. Create a new profile in ~/.aws/credentials
4. Make sure to have relevant permissions for aws user
    EC2, ECS, RDS, SSM, S3, CloudFormation, CodeDeploy, Lambda, IAM
5. Run `cdk bootstrap` to create the bucket for the cdk toolkit, this only needs to be done once per account
6. Run `cdk synth` to synthesize the stack, this will generate the cloudformation template. This step is not mandatory but it is good to do it to make sure everything is working as expected
7. Run `cdk deploy` to deploy the stack
8. Run `cdk destroy` to destroy the stack once you are done with it


