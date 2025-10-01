### To-Do for Prod-Grade EKS Infra

1. **Security Groups**

   * Restrict `ssh` (22) from `0.0.0.0/0` → only from bastion/VPN CIDR.
   * Restrict API server (`443`) from `0.0.0.0/0` → only trusted CIDRs.

2. **Cluster Config**

   * In `vpcConfig`: set `publicAccessCidrs` to office/VPN CIDRs.
   * Consider `endpointPrivateAccess: true` and disable public if possible.

3. **Secrets & Storage**

   * Add KMS encryption for Kubernetes secrets (`encryptionConfig`).
   * Encrypt node volumes (`encrypted: true` in launch templates).
   * Tag volumes with `buildTags`.

4. **Networking**

   * Add a 3rd subnet/AZ for HA.
   * NAT Gateway per AZ (instead of single NAT in one AZ).

5. **Consistency**

   * Fix tag naming (your cluster tag says `v133` while `version` is 1.30).
   * Keep tags aligned for easier billing/cost reporting.

Current state: infra is functional and modular (VPC, IAM, SGs, Cluster, NodeGroups, OIDC + IRSA).
Next: apply these polish items, then move to ArgoCD for addons (Cluster Autoscaler, ALB Controller, ExternalDNS, etc.).

