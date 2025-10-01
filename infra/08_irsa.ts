import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { buildTags } from "../utils/buildTags";

interface IrsaArgs {
  clusterName: pulumi.Input<string>;
  oidcProviderArn: pulumi.Input<string>;
  oidcProviderUrl: pulumi.Input<string>;
}

export function createIrsaRoles(args: IrsaArgs) {
  const { clusterName, oidcProviderArn, oidcProviderUrl } = args;

  const assumeRolePolicy = (sa: string, ns: string) =>
    pulumi.all([oidcProviderUrl]).apply(([url]) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Federated: oidcProviderArn },
            Action: "sts:AssumeRoleWithWebIdentity",
            Condition: {
              StringEquals: {
                [`${url.replace("https://", "")}:sub`]: `system:serviceaccount:${ns}:${sa}`,
              },
            },
          },
        ],
      })
    );

  const autoscalerRole = new aws.iam.Role("irsa-cluster-autoscaler", {
    assumeRolePolicy: assumeRolePolicy("cluster-autoscaler", "kube-system"),
    tags: buildTags("irsa-cluster-autoscaler"),
  });

  new aws.iam.RolePolicyAttachment("irsa-ca-policy", {
    role: autoscalerRole.name,
    policyArn: "arn:aws:iam::aws:policy/AutoScalingFullAccess",
  });

  const albRole = new aws.iam.Role("irsa-aws-lb-controller", {
    assumeRolePolicy: assumeRolePolicy("aws-load-balancer-controller", "kube-system"),
    tags: buildTags("irsa-aws-lb-controller"),
  });

  new aws.iam.RolePolicyAttachment("irsa-alb-policy", {
    role: albRole.name,
    policyArn: "arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess",
  });

  const externalDnsRole = new aws.iam.Role("irsa-externaldns", {
    assumeRolePolicy: assumeRolePolicy("external-dns", "kube-system"),
    tags: buildTags("irsa-externaldns"),
  });

  new aws.iam.RolePolicyAttachment("irsa-externaldns-policy", {
    role: externalDnsRole.name,
    policyArn: "arn:aws:iam::aws:policy/AmazonRoute53FullAccess",
  });

  return {
    autoscalerRoleArn: autoscalerRole.arn,
    albRoleArn: albRole.arn,
    externalDnsRoleArn: externalDnsRole.arn,
  };
}
