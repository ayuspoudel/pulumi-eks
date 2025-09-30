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
        cidrBlocks: ["0.0.0.0/0"], // outbound everywhere
      },
    ],
    ingress: [
      // Allow node-to-node communication
      {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        self: true,
      },
      // Allow cluster - nodes communication
      {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        securityGroups: [clusterSgId],
      },
    ],
    tags: buildTags("tms-eks-node-sg"),
  });

  return nodeSg;
}
