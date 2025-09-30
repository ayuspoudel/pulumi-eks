import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { buildTags } from "../utils/buildTags";

export function createNodeSecurityGroup(
  vpcId: pulumi.Input<string>,
  clusterSgId: pulumi.Input<string>
) {
  const nodeSg = new aws.ec2.SecurityGroup("tms-eks-node-sg", {
    vpcId,
    description: "EKS worker nodes security group",
    egress: [
      {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
    ingress: [
      // Node-to-node communication
      {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        self: true,
      },
      // Control plane -> kubelet
      {
        protocol: "tcp",
        fromPort: 10250,
        toPort: 10250,
        securityGroups: [clusterSgId],
      },
      // Control plane -> nodes (API server -> kube-proxy / overlay networking)
      {
        protocol: "tcp",
        fromPort: 443,
        toPort: 443,
        securityGroups: [clusterSgId],
      },
      // Allow NodePort range for LoadBalancer services
      {
        protocol: "tcp",
        fromPort: 30000,
        toPort: 32767,
        cidrBlocks: ["0.0.0.0/0"],
      },
      // SSH access to worker nodes
      {
        protocol: "tcp",
        fromPort: 22,
        toPort: 22,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
    tags: buildTags("tms-eks-node-sg"),
  });

  return nodeSg;
}
