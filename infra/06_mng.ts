import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { buildTags } from "../utils/buildTags";

interface MngArgs {
  clusterName: pulumi.Input<string>;
  nodeRoleArn: pulumi.Input<string>;
  privateSubnets: pulumi.Input<string>[];
  nodeSgId: pulumi.Input<string>;
}

export function createManagedNodeGroups(args: MngArgs) {
  const { clusterName, nodeRoleArn, privateSubnets, nodeSgId } = args;

  const baseLaunchTemplate = new aws.ec2.LaunchTemplate("tms-eks-base-lt", {
    namePrefix: "tms-eks-base-lt-",
    vpcSecurityGroupIds: [nodeSgId],
    tagSpecifications: [
      {
        resourceType: "instance",
        tags: buildTags("tms-eks-node"),
      },
    ],
  });

  const baseNodeGroup = new aws.eks.NodeGroup("tms-eks-ng-base", {
    clusterName,
    nodeRoleArn,
    subnetIds: privateSubnets,
    scalingConfig: { desiredSize: 2, minSize: 2, maxSize: 4 },
    instanceTypes: ["t3.medium"],
    amiType: "AL2_x86_64",
    diskSize: 20,
    capacityType: "ON_DEMAND",
    labels: {
      "node.lifecycle": "on-demand",
      workload: "critical",
    },
    taints: [
      {
        key: "dedicated",
        value: "critical",
        effect: "NO_SCHEDULE",
      },
    ],
    launchTemplate: {
      id: baseLaunchTemplate.id,
      version: "$Latest",
    },
    tags: buildTags("tms-eks-ng-base"),
  });

  const spotLaunchTemplate = new aws.ec2.LaunchTemplate("tms-eks-spot-lt", {
    namePrefix: "tms-eks-spot-lt-",
    vpcSecurityGroupIds: [nodeSgId],
    tagSpecifications: [
      {
        resourceType: "instance",
        tags: buildTags("tms-eks-spot-node"),
      },
    ],
  });

  const spotNodeGroup = new aws.eks.NodeGroup("tms-eks-ng-spot", {
    clusterName,
    nodeRoleArn,
    subnetIds: privateSubnets,
    scalingConfig: { desiredSize: 0, minSize: 0, maxSize: 10 },
    instanceTypes: ["t3.large", "m5.large", "c5.large"],
    amiType: "AL2_x86_64",
    diskSize: 20,
    capacityType: "SPOT",
    labels: {
      "node.lifecycle": "spot",
      workload: "ephemeral",
    },
    taints: [
      {
        key: "dedicated",
        value: "ephemeral",
        effect: "NO_SCHEDULE",
      },
    ],
    launchTemplate: {
      id: spotLaunchTemplate.id,
      version: "$Latest",
    },
    tags: buildTags("tms-eks-ng-spot"),
  });

  return { baseNodeGroup, spotNodeGroup };
}
