import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
export function createEksSecurityGroupBindings(
  clusterSgId: pulumi.Input<string>,
  nodeSgId: pulumi.Input<string>
) {
  // cluster → node
  new aws.ec2.SecurityGroupRule("cluster-to-node-kubelet", {
    type: "ingress",
    fromPort: 10250,
    toPort: 10250,
    protocol: "tcp",
    securityGroupId: nodeSgId,
    sourceSecurityGroupId: clusterSgId,
  });

  new aws.ec2.SecurityGroupRule("cluster-to-node-apiserver", {
    type: "ingress",
    fromPort: 443,
    toPort: 443,
    protocol: "tcp",
    securityGroupId: nodeSgId,
    sourceSecurityGroupId: clusterSgId,
  });

  // node → cluster
  new aws.ec2.SecurityGroupRule("node-to-cluster-kubelet", {
    type: "ingress",
    fromPort: 10250,
    toPort: 10250,
    protocol: "tcp",
    securityGroupId: clusterSgId,
    sourceSecurityGroupId: nodeSgId,
  });

  new aws.ec2.SecurityGroupRule("node-to-cluster-apiserver", {
    type: "ingress",
    fromPort: 443,
    toPort: 443,
    protocol: "tcp",
    securityGroupId: clusterSgId,
    sourceSecurityGroupId: nodeSgId,
  });
}
