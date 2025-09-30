import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {buildTags} from "../utils/buildTags"

export function createIamRoles(){


    // Create Cluster Role
    const clusterRole = new aws.iam.Role("tms-eks-cluster-role", {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
            Service: "eks.amazonaws.com",
        }),
        tags: buildTags("tms-eks-cluster-role"),
    });
    //Attach two policies: AmazonEKSClusterPolicy, AmazonEKSServicePolicy to the created Cluster Role

    const cluster_policies = ["arn:aws:iam::aws:policy/AmazonEKSServicePolicy", "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"];

    for (const policy of cluster_policies){
        new aws.iam.RolePolicyAttachment(`tms-eks-cluster-role-${policy.split("/").pop()}`,{
            role: clusterRole.name,
            policyArn: policy,
        })
    }

    
    //Create node group role

    const nodeRole = new aws.iam.Role("tms-eks-node-role", {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
            Service: "ec2.amazonaws.com",
        }), 
        tags: buildTags("tms-eks-node-role")
    });

    const nodePolicies = [
        "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
        "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
        "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
    ]

    for (const policy of nodePolicies ){
        new aws.iam.RolePolicyAttachment(`tms-eks-node-role-${policy.split("/").pop()}`,{
            role: nodeRole.name,
            policyArn: policy,
        })
    }

    return {clusterRole, nodeRole};
    


}