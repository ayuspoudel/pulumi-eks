// index.ts
import * as aws from "@pulumi/aws";

import { createVpc } from "./infra/01_vpc";
import { createIamRoles } from "./infra/02_iam";
import { createClusterSecurityGroup } from "./infra/03_clustersg";
import { createEksCluster } from "./infra/04_eks";
import { createNodeSecurityGroup } from "./infra/05_nodesg";
import { createEksSecurityGroupBindings } from "./infra/06_sgBindings";
import { createManagedNodeGroups } from "./infra/07_mng";
import { createIrsaRoles } from "./infra/08_irsa";

// VPC
const vpc = createVpc();

// IAM Roles
const roles = createIamRoles();

// Security Groups
const clusterSg = createClusterSecurityGroup(vpc.vpcId);
const nodeSg = createNodeSecurityGroup(vpc.vpcId);
createEksSecurityGroupBindings(clusterSg.id, nodeSg.id);

// EKS Cluster (control plane)
const eksCluster = createEksCluster({
  vpcId: vpc.vpcId,
  privateSubnets: vpc.privateSubnets,
  clusterRoleArn: roles.clusterRole.arn,
  clusterSgId: clusterSg.id,
});

// Managed Node Groups (on-demand + spot)
const nodeGroups = createManagedNodeGroups({
  clusterName: eksCluster.cluster.name,
  nodeRoleArn: roles.nodeRole.arn,
  privateSubnets: vpc.privateSubnets,
  nodeSgId: nodeSg.id,
});

// OIDC provider for IRSA
const oidcProvider = new aws.iam.OpenIdConnectProvider("eks-oidc", {
  url: eksCluster.cluster.identities[0].oidcs[0].issuer,
  clientIdLists: ["sts.amazonaws.com"],
  thumbprintLists: ["9e99a48a9960b14926bb7f3b02e22da0ecd4e4c3"],
});

// IRSA roles (Autoscaler, ALB Controller, ExternalDNS)
const irsa = createIrsaRoles({
  clusterName: eksCluster.cluster.name,
  oidcProviderArn: oidcProvider.arn,
  oidcProviderUrl: oidcProvider.url,
});

// Exports
export const vpcId = vpc.vpcId;
export const publicSubnets = vpc.publicSubnets;
export const privateSubnets = vpc.privateSubnets;

export const clusterRoleArn = roles.clusterRole.arn;
export const nodeRoleArn = roles.nodeRole.arn;

export const clusterSgId = clusterSg.id;
export const nodeSgId = nodeSg.id;

export const clusterName = eksCluster.cluster.name;
export const clusterEndpoint = eksCluster.cluster.endpoint;
export const kubeconfig = eksCluster.kubeconfig;

export const baseNodeGroupName = nodeGroups.baseNodeGroup.nodeGroupName;
export const spotNodeGroupName = nodeGroups.spotNodeGroup.nodeGroupName;

export const autoscalerRoleArn = irsa.autoscalerRoleArn;
export const albRoleArn = irsa.albRoleArn;
export const externalDnsRoleArn = irsa.externalDnsRoleArn;
