import * as pulumi from "@pulumi/pulumi";
import { createVpc } from "./infra/01_vpc";
import { createIamRoles } from "./infra/02_iam";

// Call the VPC module
const vpc = createVpc();
const roles = createIamRoles();
// Export useful values for later (and visibility in Pulumi UI)
export const vpcId = vpc.vpcId;
export const publicSubnets = vpc.publicSubnets;
export const privateSubnets = vpc.privateSubnets;
export const clusterRoleArn = roles.clusterRole.arn;
export const nodeRoleArn = roles.nodeRole.arn;