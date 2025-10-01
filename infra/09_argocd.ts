import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

// Bootstrap Argo CD into the cluster
export function bootstrapArgoCd(args: {
  kubeconfig: pulumi.Input<string>;
  useNLB?: boolean; // default false, set true for NLB
}) {
  const { kubeconfig, useNLB } = args;

  // K8s provider pointing at our EKS cluster
  const provider = new k8s.Provider("k8s-argo-provider", { kubeconfig });

  // Namespace for Argo CD
  const ns = new k8s.core.v1.Namespace(
    "argocd-namespace",
    {
      metadata: {
        name: "argocd",
        labels: { "app.kubernetes.io/name": "argocd" },
      },
    },
    { provider }
  );

  // Service annotations (Classic ELB by default, NLB if asked)
  const svcAnnotations = useNLB
    ? {
        "service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
        "service.beta.kubernetes.io/aws-load-balancer-scheme": "internet-facing",
        "service.beta.kubernetes.io/aws-load-balancer-nlb-target-type": "ip",
      }
    : {};

  // Common toleration for your tainted nodes
  const tolerations = [
    {
      key: "dedicated",
      operator: "Equal",
      value: "critical",
      effect: "NoSchedule",
    },
  ];

  // Install Argo CD via Helm chart with tolerations for all components
  const argoCd = new k8s.helm.v3.Release(
    "argocd",
    {
      chart: "argo-cd",
      version: "7.4.0", // pin a version
      repositoryOpts: { repo: "https://argoproj.github.io/argo-helm" },
      namespace: ns.metadata.name,
      values: {
        installCRDs: true,
        server: {
          service: {
            type: "LoadBalancer",
            annotations: svcAnnotations,
          },
          tolerations,
        },
        controller: { tolerations },
        repoServer: { tolerations },
        redis: {
          tolerations,
          secretInitContainer: { 
            tolerations,
          },
        },
      },
    },
    { provider, dependsOn: [ns] }
  );

  // Reference the server service to export LB details
  const serverSvc = argoCd.status.apply(() =>
    k8s.core.v1.Service.get(
      "argocd-server",
      pulumi.interpolate`${ns.metadata.name}/argocd-server`,
      { provider }
    )
  );

  const lbHostname = serverSvc.status.apply(
    (s) => s?.loadBalancer?.ingress?.[0]?.hostname
  );
  const lbIp = serverSvc.status.apply(
    (s) => s?.loadBalancer?.ingress?.[0]?.ip
  );

  // Initial admin password (Pulumi will mark as secret automatically)
  const adminSecret = argoCd.status.apply(() =>
    k8s.core.v1.Secret.get(
      "argocd-initial-admin-secret",
      pulumi.interpolate`${ns.metadata.name}/argocd-initial-admin-secret`,
      { provider }
    )
  );

  const adminPassword = adminSecret.data.apply((d) =>
    Buffer.from(d["password"], "base64").toString("utf8")
  );

  return {
    provider,
    namespace: ns.metadata.name,
    lbHostname,
    lbIp,
    adminPassword: pulumi.secret(adminPassword),
  };
}
