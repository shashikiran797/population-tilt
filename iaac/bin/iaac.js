#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { IaacStack } = require('../lib/iaac-stack');

const app = new cdk.App();
new IaacStack(app, 'IaacStack', {
    env: { region: 'ap-south-1' },
});
