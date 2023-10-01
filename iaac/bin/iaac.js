#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { IaacStack } = require('../lib/iaac-stack');

const app = new cdk.App();
const region = process.env.CDK_DEFAULT_REGION || 'ap-south-1';
new IaacStack(app, 'IaacStack', {
    env: { region: region },
});
