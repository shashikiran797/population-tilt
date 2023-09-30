const cdk = require('aws-cdk-lib');
const { Construct } = require('constructs');
const ecs = require('aws-cdk-lib/aws-ecs');
const ecsp = require('aws-cdk-lib/aws-ecs-patterns');
const ecr = require('aws-cdk-lib/aws-ecr');
const cdk_core = require('aws-cdk-lib/core');
const cdk_assets = require('aws-cdk-lib/aws-ecr-assets');
const rds = require('aws-cdk-lib/aws-rds');
const ec2 = require('aws-cdk-lib/aws-ec2');

class IaacStack extends cdk.Stack {
    constructor(scope = Construct, id = string, props = cdk.StackProps) {
        super(scope, id, props);
        const ecrRepo = new ecr.Repository(this, 'population-tilt-ecr', {
            removalPolicy: cdk_core.RemovalPolicy.DESTROY,
        });
        const asset = new cdk_assets.DockerImageAsset(this, 'population-tilt-image', {
            directory: '../',
        });
        const rdsInstance = new rds.DatabaseInstance(this, 'population-tilt-rds', {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_14,
            }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
            vpc,
            publiclyAccessible: true,
            securityGroups: [],
            allocatedStorage: 10,
            storageType: rds.StorageType.GP2,
            masterUsername: 'admin',
            masterUserPassword: 'your-password',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        new cdk.CfnOutput(this, 'ECRRepositoryURL', {
            value: ecrRepo.repositoryUri,
        });
        new cdk.CfnOutput(this, 'RDSInstanceEndpoint', {
            value: rdsInstance.dbInstanceEndpointAddress,
        });

        const vpc = new ec2.Vpc(this, 'population-tilt-vpc', {
            maxAzs: 1,
        });

        new ecsp.ApplicationLoadBalancedFargateService(this, 'population-tilt-web-server', {
            taskImageOptions: {
                image: ecs.ContainerImage.fromDockerImageAsset(asset),
                containerPort: 3000,
            },
            publicLoadBalancer: true
        });
    }
}

module.exports = { IaacStack }
