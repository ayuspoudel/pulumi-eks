import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {buildTags} from "../utils/buildTags"


export function createVpc() {
  const config = new pulumi.Config("pulumi-eks");
  const vpcCidr = config.get("vpcCidr") || "10.0.0.0/16";
  const enableNat = config.getBoolean("enableNat") ?? true;
  const enablePrivateSubnets = config.getBoolean("enablePrivateSubnets") ?? true;

  const vpc = new aws.ec2.Vpc("tms-eks-vpc", {
    cidrBlock: vpcCidr,
    enableDnsSupport: true,
    enableDnsHostnames: true,
    tags: buildTags("tms-eks-vpc"),
  });

  const igw = new aws.ec2.InternetGateway("tms-eks-igw", {
    vpcId: vpc.id,
    tags: buildTags("tms-eks-igw"),
  });

  const publicSubnet1 = new aws.ec2.Subnet("tms-eks-pub-01", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "us-east-1a",
    mapPublicIpOnLaunch: true,
    tags: buildTags("tms-eks-pub-01"),
  });

  const publicSubnet2 = new aws.ec2.Subnet("tms-eks-pub-02", {
    vpcId: vpc.id,
    cidrBlock: "10.0.2.0/24",
    availabilityZone: "us-east-1b",
    mapPublicIpOnLaunch: true,
    tags: buildTags("tms-eks-pub-02"),
  });

  const publicRouteTable = new aws.ec2.RouteTable("tms-eks-public-rt", {
    vpcId: vpc.id,
    routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: igw.id }],
    tags: buildTags("tms-eks-public-rt"),
  });

  new aws.ec2.RouteTableAssociation("tms-eks-public-rt-1", {
    subnetId: publicSubnet1.id,
    routeTableId: publicRouteTable.id,
  });

  new aws.ec2.RouteTableAssociation("tms-eks-public-rt-2", {
    subnetId: publicSubnet2.id,
    routeTableId: publicRouteTable.id,
  });

  // Private subnets 
  let privateSubnets: pulumi.Output<string>[] = [];
  if (enablePrivateSubnets) {
    const privateSubnet1 = new aws.ec2.Subnet("tms-eks-priv-01", {
      vpcId: vpc.id,
      cidrBlock: "10.0.101.0/24",
      availabilityZone: "us-east-1a",
      tags: buildTags("tms-eks-priv-01"),
    });

    const privateSubnet2 = new aws.ec2.Subnet("tms-eks-priv-02", {
      vpcId: vpc.id,
      cidrBlock: "10.0.102.0/24",
      availabilityZone: "us-east-1b",
      tags: buildTags("tms-eks-priv-02"),
    });

    privateSubnets = [privateSubnet1.id, privateSubnet2.id];

    if (enableNat) {
      const eip = new aws.ec2.Eip("tms-eks-nat-eip", { tags: buildTags("tms-eks-nat-eip") });
      const natGw = new aws.ec2.NatGateway("tms-eks-nat", {
        allocationId: eip.id,
        subnetId: publicSubnet1.id,
        tags: buildTags("tms-eks-nat"),
      });

      const privateRouteTable = new aws.ec2.RouteTable("tms-eks-private-rt", {
        vpcId: vpc.id,
        routes: [{ cidrBlock: "0.0.0.0/0", natGatewayId: natGw.id }],
        tags: buildTags("tms-eks-private-rt"),
      });

      new aws.ec2.RouteTableAssociation("tms-eks-private-rt-1", {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable.id,
      });

      new aws.ec2.RouteTableAssociation("tms-eks-private-rt-2", {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable.id,
      });
    }
  }

  return {
    vpcId: vpc.id,
    publicSubnets: [publicSubnet1.id, publicSubnet2.id],
    privateSubnets,
  };
}
