import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { buildTags } from "../utils/buildTags";

export function createNodeSecurityGroup(vpcId: pulumi.Input<string>) {
  return new aws.ec2.SecurityGroup("tms-eks-node-sg", {
    vpcId,
    description: "EKS worker nodes security group",
    egress: [{
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"],
    }],
    ingress: [
      {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        self: true,
      },
      {
        protocol: "tcp",
        fromPort: 30000,
        toPort: 32767,
        cidrBlocks: ["0.0.0.0/0"],
      },
      {
        protocol: "tcp",
        fromPort: 22,
        toPort: 22,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
    tags: buildTags("tms-eks-node-sg"),
  });
}
