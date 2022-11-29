# Terraform

## Start a Kubernetes cluster with Terraform and AWS EC2
Check [here](https://learn.hashicorp.com/tutorials/terraform/aws-build?in=terraform/aws-get-started) to know the basic.
```bash
export AWS_ACCESS_KEY_ID="<YOUR_AWS_ACCESS_KEY_ID>"
export AWS_SECRET_ACCESS_KEY="<YOUR_AWS_SECRET_ACCESS_KEY>"
export AWS_DEFAULT_REGION="<YOUR_AWS_DEFAULT_REGION>"
terraform init # download dependencies
terraform plan # for checking
terraform apply # apply changes to the provider
terraform destroy # destroy resources created by `terraform apply`
```
### Terraform resource definition
```yaml
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.27"
    }
  }

  required_version = ">= 0.14.9"
}

# Note that if you change the region and 
# run `terraform apply`. The resources in 
# the original region will not be destroyed
# Because the region is defined in `provider`
# instead of `resource`
provider "aws" {
  profile = "default"
  region  = "ap-southeast-1"
}

# Get default vpc and load it as a terraform resource
# Every region has a default VPC. Note that this default
# VPC will not be deleted in `terraform destroy`
resource "aws_default_vpc" "default" {
  tags = {
    Name = "Default VPC"
  }
}

# Declare a variable
variable "num_workers" {
  type = number
}

# A security group that map all  
resource "aws_security_group" "cluster_node_internal" {
  name        = "terraform-cluster-node-internal"
  description = "allow communication between k8s nodes"

  ingress {
    description = "ssh"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "node-10250"
    from_port   = 10250
    to_port     = 10250
    protocol    = "tcp"
    cidr_blocks = [aws_default_vpc.default.cidr_block]
  }

  ingress {
    description = "control-plane-6443"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = [aws_default_vpc.default.cidr_block]
  }

  ingress {
    description = "worker-node-pod"
    from_port   = 30000
    to_port     = 36767
    protocol    = "tcp"
    cidr_blocks = [aws_default_vpc.default.cidr_block]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_instance" "control_plane" {
  instance_type = "t2.medium"
  # The AMI is different in different regions
  ami           = "ami-0750a20e9959e44ff"
  key_name      = "custom-cluster"

  tags = {
    Name = "terraform-k8s-control-plane"
  }

  security_groups = [
    aws_security_group.cluster_node_internal.name
  ]
  
  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = file("custom-cluster.pem")
    host        = self.public_ip
    timeout     = "5m"
  }

  provisioner "remote-exec" {
    inline = [
      "curl -s https://raw.githubusercontent.com/mikechesterwang/setup-kubeadm/main/control-plane-ubuntu20.04.sh | sudo ENDPOINT_IP=${self.private_dns} bash"
    ]
  }
}

# `external` will run external script and 
# get the result. Note that the input 
# and output are all json. It is better to
# install `jq` to parse input in your script 
data "external" "kubeadm_secret" {

  depends_on = [
    aws_instance.control_plane
  ]

  program = ["bash", "get_join_info.sh"]

  query = {
    ip               = aws_instance.control_plane.public_ip
    user             = "ubuntu"
    private_key_path = "custom-cluster.pem"
  }
}

# `output` is for debugging. It will print variables
output "token" {
  value = data.external.kubeadm_secret.result.token
}

output "cert" {
  value = data.external.kubeadm_secret.result.cert
}

resource "aws_instance" "worker_node" {
  # Just like a for loop. If `num_workers` is 3, it will 
  # create 3 resources like according to the definition.
  # You can use ${count.index} to distinguish between them. 
  count = var.num_workers

  instance_type = "t2.medium"
  ami = "ami-0750a20e9959e44ff"
  key_name = "custom-cluster"

  tags = {
    Name = "terraform-k8s-worker-node-${count.index}"
  }

  security_groups = [
    aws_security_group.cluster_node_internal.name
  ]

  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = file("custom-cluster.pem")
    host        = self.public_ip
    timeout     = "5m"
  }

  provisioner "remote-exec" {
    inline = [
      "curl -s https://raw.githubusercontent.com/mikechesterwang/setup-kubeadm/main/setup-ubuntu20.04.sh | sudo bash",
      "sudo kubeadm join ${aws_instance.control_plane.private_dns}:6443 --cri-socket unix:///var/run/crio/crio.sock --token ${data.external.kubeadm_secret.result.token} --discovery-token-ca-cert-hash sha256:${data.external.kubeadm_secret.result.cert}"
    ]
  }
}

```   

### External data script
Since we cannot get the output of `remote-exec`, we will use `external` to run script and get the data from the remote server.
```bash
# Need to use `jq` to parse input
if ! [ -x "$(command -v jq)" ]; then
    echo "jq not found, please install jq at first: https://stedolan.github.io/jq/download/" 
    exit 1
fi

# parse input
eval "$(jq -r '@sh "user=\(.user) ip=\(.ip) private_key_path=\(.private_key_path)"')"

# Get `token` and `cert hash` for `kubeadm join`
jq -n --arg token "$(ssh -o "StrictHostKeyChecking no" $user@$ip -i $private_key_path "sudo kubeadm token create")" --arg cert "$(ssh $user@$ip -i $private_key_path "openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //'")" '{"token": $token, "cert": $cert}'
```

### Add external-dns add-on in EKS
```hcl
locals {
    external_dns_iam_role = "${var.remote_workspace}-${local.cluster_id}-external-dns"
}

resource "helm_release" "external_dns" {
  name       = "external-dns"
  repository = "https://kubernetes-sigs.github.io/external-dns/"
  chart      = "external-dns"
  namespace  = "kube-system"
  depends_on = [
    kubernetes_service_account.external_dns
  ]

  set {
    name  = "serviceAccount.create"
    value = "false"
  }

  set {
    name  = "serviceAccount.name"
    value = "aws-external-dns-sa"
  }
}

module "external_dns_role" {
  source    = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"

  role_name = local.external_dns_iam_role
  attach_external_dns_policy = true

  oidc_providers = {
    main = {
      provider_arn               = local.cluster_oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-external-dns-sa"]
    }
  }
}

resource "kubernetes_service_account" "external_dns" {
  metadata {
    name = "aws-external-dns-sa"
    namespace = "kube-system"
    labels = {
        "app.kubernetes.io/name"= "aws-external-dns-sa"
    }
    annotations = {
      "eks.amazonaws.com/role-arn" = module.external_dns_role.iam_role_arn
    }
  }
}

```
