// index.ts
import { createVpc } from "./infra/01_vpc";
import { createIamRoles } from "./infra/02_iam";
import { createClusterSecurityGroup } from "./infra/03_clustersg";
import { createEksCluster } from "./infra/04_eks";
import { createNodeSecurityGroup } from "./infra/05_nodesg";
import { createManagedNodeGroups } from "./infra/06_mng";

// VPC
const vpc = createVpc();

// IAM Roles
const roles = createIamRoles();

// Security Groups
const clusterSg = createClusterSecurityGroup(vpc.vpcId);
const nodeSg = createNodeSecurityGroup(vpc.vpcId, clusterSg.id);

// EKS Cluster (control plane)
const eksCluster = createEksCluster({
  vpcId: vpc.vpcId,
  privateSubnets: vpc.privateSubnets,
  clusterRoleArn: roles.clusterRole.arn,
  clusterSgId: clusterSg.id,
});

// Managed Node Groups (on-demand + spot), attached to node SG via Launch Templates
const nodeGroups = createManagedNodeGroups({
  clusterName: eksCluster.cluster.name,
  nodeRoleArn: roles.nodeRole.arn,
  privateSubnets: vpc.privateSubnets,
  nodeSgId: nodeSg.id,
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
