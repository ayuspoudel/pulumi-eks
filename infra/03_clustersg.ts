import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { buildTags } from "../utils/buildTags";

export function createClusterSecurityGroup(vpcId: pulumi.Input<string>) {
  return new aws.ec2.SecurityGroup("tms-eks-cluster-sg", {
    vpcId,
    description: "EKS cluster security group",
    egress: [{
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"],
    }],
    ingress: [{
      protocol: "tcp",
      fromPort: 443,
      toPort: 443,
      cidrBlocks: ["0.0.0.0/0"],
    }],
    tags: buildTags("tms-eks-cluster-sg"),
  });
}
