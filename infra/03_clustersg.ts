import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { buildTags } from "../utils/buildTags";

export function createClusterSecurityGroup(
  vpcId: pulumi.Input<string>,
  nodeSgId?: pulumi.Input<string> // optionally wire in node SG
) {
  const clusterSg = new aws.ec2.SecurityGroup("tms-eks-cluster-sg", {
    vpcId,
    description: "EKS cluster security group",
    egress: [
      {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
    ingress: [
      // Allow kubectl/API access from anywhere (lock down in prod if needed)
      {
        protocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ["0.0.0.0/0"],
      },
      // Allow control plane -> kubelet communication if node SG provided
      ...(nodeSgId
        ? [
            {
              protocol: "tcp",
              fromPort: 10250,
              toPort: 10250,
              securityGroups: [nodeSgId],
            },
            {
              protocol: "tcp",
              fromPort: 443,
              toPort: 443,
              securityGroups: [nodeSgId],
            },
          ]
        : []),
    ],
    tags: buildTags("tms-eks-cluster-sg"),
  });

  return clusterSg;
}
