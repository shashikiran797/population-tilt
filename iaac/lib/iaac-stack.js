const cdk = require('aws-cdk-lib');
const { Construct } = require('constructs');
const ecs = require('aws-cdk-lib/aws-ecs');
const ecsp = require('aws-cdk-lib/aws-ecs-patterns');
const cdk_assets = require('aws-cdk-lib/aws-ecr-assets');
const rds = require('aws-cdk-lib/aws-rds');
const ec2 = require('aws-cdk-lib/aws-ec2');

class IaacStack extends cdk.Stack {
    constructor(scope = Construct, id = string, props = cdk.StackProps) {
        super(scope, id, props);
        const asset = new cdk_assets.DockerImageAsset(this, 'population-tilt-image', {
            directory: '../',
        });

        const vpc = new ec2.Vpc(this, 'population-tilt-vpc', {
            maxAzs: 2,
        });
        const plainTextPasswordRds = 'RU6hhtAivyMLHr';
        const password = cdk.SecretValue.unsafePlainText(plainTextPasswordRds);
        const rdsInstance = new rds.DatabaseInstance(this, 'population-tilt-rds', {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_14,
            }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
            publiclyAccessible: true,
            securityGroups: [],
            allocatedStorage: 10,
            storageType: rds.StorageType.GP2,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
            credentials: {
                username: 'postgres',
                password,
            }
        });
        new cdk.CfnOutput(this, 'RDSInstanceEndpoint', {
            value: rdsInstance.dbInstanceEndpointAddress,
        });
        new ecsp.ApplicationLoadBalancedFargateService(this, 'population-tilt-web-server', {
            taskImageOptions: {
                image: ecs.ContainerImage.fromDockerImageAsset(asset),
                environment: {
                    DB_HOST: rdsInstance.dbInstanceEndpointAddress,
                    DB_PASSWORD: plainTextPasswordRds,
                }
            },
            publicLoadBalancer: true,
        });
    }
}

module.exports = { IaacStack }
