import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {buildTags} from "../utils/buildTags";
interface EksArgs {
  vpcId: pulumi.Input<string>;
  privateSubnets: pulumi.Input<string>[];
  clusterRoleArn: pulumi.Input<string>;
  clusterSgId: pulumi.Input<string>;
}

export function createEksCluster(args: EksArgs){
    const {vpcId, privateSubnets, clusterRoleArn, clusterSgId} = args;

    const cluster = new aws.eks.Cluster("tms-eks-cluster",{
        roleArn: clusterRoleArn,
        version: "1.30",
        enabledClusterLogTypes:[
            "api", "audit", "authenticator", "controllerManager", "scheduler"
        ],
        vpcConfig: {
            subnetIds: privateSubnets,
            securityGroupIds: [clusterSgId],
            endpointPrivateAccess: false, 
            endpointPublicAccess: true,
        },
        tags: buildTags("tms-eks-cluster-v133")
    })

    const kubeconfig = pulumi
    .all([cluster.endpoint, cluster.certificateAuthority, cluster.name])
    .apply(([endpoint, cert, name]) => ({
      apiVersion: "v1",
      clusters: [
        {
          cluster: {
            server: endpoint,
            "certificate-authority-data": cert.data,
          },
          name: "kubernetes",
        },
      ],
      contexts: [
        {
          context: {
            cluster: "kubernetes",
            user: "aws",
          },
          name: "aws",
        },
      ],
      "current-context": "aws",
      kind: "Config",
      users: [
        {
          name: "aws",
          user: {
            exec: {
              apiVersion: "client.authentication.k8s.io/v1beta1",
              command: "aws",
              args: ["eks", "get-token", "--cluster-name", name],
            },
          },
        },
      ],
    }));

    return {cluster, kubeconfig}
}
