"use strict";(self.webpackChunkmikechesterwang_github_io=self.webpackChunkmikechesterwang_github_io||[]).push([[618],{3905:function(e,n,r){r.d(n,{Zo:function(){return u},kt:function(){return m}});var t=r(7294);function a(e,n,r){return n in e?Object.defineProperty(e,n,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[n]=r,e}function o(e,n){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var t=Object.getOwnPropertySymbols(e);n&&(t=t.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),r.push.apply(r,t)}return r}function s(e){for(var n=1;n<arguments.length;n++){var r=null!=arguments[n]?arguments[n]:{};n%2?o(Object(r),!0).forEach((function(n){a(e,n,r[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(r,n))}))}return e}function i(e,n){if(null==e)return{};var r,t,a=function(e,n){if(null==e)return{};var r,t,a={},o=Object.keys(e);for(t=0;t<o.length;t++)r=o[t],n.indexOf(r)>=0||(a[r]=e[r]);return a}(e,n);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(t=0;t<o.length;t++)r=o[t],n.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var c=t.createContext({}),l=function(e){var n=t.useContext(c),r=n;return e&&(r="function"==typeof e?e(n):s(s({},n),e)),r},u=function(e){var n=l(e.components);return t.createElement(c.Provider,{value:n},e.children)},p={inlineCode:"code",wrapper:function(e){var n=e.children;return t.createElement(t.Fragment,{},n)}},d=t.forwardRef((function(e,n){var r=e.components,a=e.mdxType,o=e.originalType,c=e.parentName,u=i(e,["components","mdxType","originalType","parentName"]),d=l(r),m=a,f=d["".concat(c,".").concat(m)]||d[m]||p[m]||o;return r?t.createElement(f,s(s({ref:n},u),{},{components:r})):t.createElement(f,s({ref:n},u))}));function m(e,n){var r=arguments,a=n&&n.mdxType;if("string"==typeof e||a){var o=r.length,s=new Array(o);s[0]=d;var i={};for(var c in n)hasOwnProperty.call(n,c)&&(i[c]=n[c]);i.originalType=e,i.mdxType="string"==typeof e?e:a,s[1]=i;for(var l=2;l<o;l++)s[l]=r[l];return t.createElement.apply(null,s)}return t.createElement.apply(null,r)}d.displayName="MDXCreateElement"},1997:function(e,n,r){r.r(n),r.d(n,{assets:function(){return u},contentTitle:function(){return c},default:function(){return m},frontMatter:function(){return i},metadata:function(){return l},toc:function(){return p}});var t=r(7462),a=r(3366),o=(r(7294),r(3905)),s=["components"],i={},c="Terraform",l={unversionedId:"DevOps/Terraform",id:"DevOps/Terraform",title:"Terraform",description:"Start a Kubernetes cluster with Terraform and AWS EC2",source:"@site/docs/DevOps/Terraform.md",sourceDirName:"DevOps",slug:"/DevOps/Terraform",permalink:"/docs/DevOps/Terraform",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Makefile",permalink:"/docs/DevOps/Makefile"},next:{title:"convenient_script",permalink:"/docs/DevOps/convenient_script"}},u={},p=[{value:"Start a Kubernetes cluster with Terraform and AWS EC2",id:"start-a-kubernetes-cluster-with-terraform-and-aws-ec2",level:2},{value:"Terraform resource definition",id:"terraform-resource-definition",level:3},{value:"External data script",id:"external-data-script",level:3},{value:"Add external-dns add-on in EKS",id:"add-external-dns-add-on-in-eks",level:3}],d={toc:p};function m(e){var n=e.components,r=(0,a.Z)(e,s);return(0,o.kt)("wrapper",(0,t.Z)({},d,r,{components:n,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"terraform"},"Terraform"),(0,o.kt)("h2",{id:"start-a-kubernetes-cluster-with-terraform-and-aws-ec2"},"Start a Kubernetes cluster with Terraform and AWS EC2"),(0,o.kt)("p",null,"Check ",(0,o.kt)("a",{parentName:"p",href:"https://learn.hashicorp.com/tutorials/terraform/aws-build?in=terraform/aws-get-started"},"here")," to know the basic."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},'export AWS_ACCESS_KEY_ID="<YOUR_AWS_ACCESS_KEY_ID>"\nexport AWS_SECRET_ACCESS_KEY="<YOUR_AWS_SECRET_ACCESS_KEY>"\nexport AWS_DEFAULT_REGION="<YOUR_AWS_DEFAULT_REGION>"\nterraform init # download dependencies\nterraform plan # for checking\nterraform apply # apply changes to the provider\nterraform destroy # destroy resources created by `terraform apply`\n')),(0,o.kt)("h3",{id:"terraform-resource-definition"},"Terraform resource definition"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-yaml"},'terraform {\n  required_providers {\n    aws = {\n      source  = "hashicorp/aws"\n      version = "~> 3.27"\n    }\n  }\n\n  required_version = ">= 0.14.9"\n}\n\n# Note that if you change the region and \n# run `terraform apply`. The resources in \n# the original region will not be destroyed\n# Because the region is defined in `provider`\n# instead of `resource`\nprovider "aws" {\n  profile = "default"\n  region  = "ap-southeast-1"\n}\n\n# Get default vpc and load it as a terraform resource\n# Every region has a default VPC. Note that this default\n# VPC will not be deleted in `terraform destroy`\nresource "aws_default_vpc" "default" {\n  tags = {\n    Name = "Default VPC"\n  }\n}\n\n# Declare a variable\nvariable "num_workers" {\n  type = number\n}\n\n# A security group that map all  \nresource "aws_security_group" "cluster_node_internal" {\n  name        = "terraform-cluster-node-internal"\n  description = "allow communication between k8s nodes"\n\n  ingress {\n    description = "ssh"\n    from_port   = 22\n    to_port     = 22\n    protocol    = "tcp"\n    cidr_blocks = ["0.0.0.0/0"]\n  }\n\n  ingress {\n    description = "node-10250"\n    from_port   = 10250\n    to_port     = 10250\n    protocol    = "tcp"\n    cidr_blocks = [aws_default_vpc.default.cidr_block]\n  }\n\n  ingress {\n    description = "control-plane-6443"\n    from_port   = 6443\n    to_port     = 6443\n    protocol    = "tcp"\n    cidr_blocks = [aws_default_vpc.default.cidr_block]\n  }\n\n  ingress {\n    description = "worker-node-pod"\n    from_port   = 30000\n    to_port     = 36767\n    protocol    = "tcp"\n    cidr_blocks = [aws_default_vpc.default.cidr_block]\n  }\n\n  egress {\n    from_port        = 0\n    to_port          = 0\n    protocol         = "-1"\n    cidr_blocks      = ["0.0.0.0/0"]\n    ipv6_cidr_blocks = ["::/0"]\n  }\n}\n\nresource "aws_instance" "control_plane" {\n  instance_type = "t2.medium"\n  # The AMI is different in different regions\n  ami           = "ami-0750a20e9959e44ff"\n  key_name      = "custom-cluster"\n\n  tags = {\n    Name = "terraform-k8s-control-plane"\n  }\n\n  security_groups = [\n    aws_security_group.cluster_node_internal.name\n  ]\n  \n  connection {\n    type        = "ssh"\n    user        = "ubuntu"\n    private_key = file("custom-cluster.pem")\n    host        = self.public_ip\n    timeout     = "5m"\n  }\n\n  provisioner "remote-exec" {\n    inline = [\n      "curl -s https://raw.githubusercontent.com/mikechesterwang/setup-kubeadm/main/control-plane-ubuntu20.04.sh | sudo ENDPOINT_IP=${self.private_dns} bash"\n    ]\n  }\n}\n\n# `external` will run external script and \n# get the result. Note that the input \n# and output are all json. It is better to\n# install `jq` to parse input in your script \ndata "external" "kubeadm_secret" {\n\n  depends_on = [\n    aws_instance.control_plane\n  ]\n\n  program = ["bash", "get_join_info.sh"]\n\n  query = {\n    ip               = aws_instance.control_plane.public_ip\n    user             = "ubuntu"\n    private_key_path = "custom-cluster.pem"\n  }\n}\n\n# `output` is for debugging. It will print variables\noutput "token" {\n  value = data.external.kubeadm_secret.result.token\n}\n\noutput "cert" {\n  value = data.external.kubeadm_secret.result.cert\n}\n\nresource "aws_instance" "worker_node" {\n  # Just like a for loop. If `num_workers` is 3, it will \n  # create 3 resources like according to the definition.\n  # You can use ${count.index} to distinguish between them. \n  count = var.num_workers\n\n  instance_type = "t2.medium"\n  ami = "ami-0750a20e9959e44ff"\n  key_name = "custom-cluster"\n\n  tags = {\n    Name = "terraform-k8s-worker-node-${count.index}"\n  }\n\n  security_groups = [\n    aws_security_group.cluster_node_internal.name\n  ]\n\n  connection {\n    type        = "ssh"\n    user        = "ubuntu"\n    private_key = file("custom-cluster.pem")\n    host        = self.public_ip\n    timeout     = "5m"\n  }\n\n  provisioner "remote-exec" {\n    inline = [\n      "curl -s https://raw.githubusercontent.com/mikechesterwang/setup-kubeadm/main/setup-ubuntu20.04.sh | sudo bash",\n      "sudo kubeadm join ${aws_instance.control_plane.private_dns}:6443 --cri-socket unix:///var/run/crio/crio.sock --token ${data.external.kubeadm_secret.result.token} --discovery-token-ca-cert-hash sha256:${data.external.kubeadm_secret.result.cert}"\n    ]\n  }\n}\n\n')),(0,o.kt)("h3",{id:"external-data-script"},"External data script"),(0,o.kt)("p",null,"Since we cannot get the output of ",(0,o.kt)("inlineCode",{parentName:"p"},"remote-exec"),", we will use ",(0,o.kt)("inlineCode",{parentName:"p"},"external")," to run script and get the data from the remote server."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-bash"},'# Need to use `jq` to parse input\nif ! [ -x "$(command -v jq)" ]; then\n    echo "jq not found, please install jq at first: https://stedolan.github.io/jq/download/" \n    exit 1\nfi\n\n# parse input\neval "$(jq -r \'@sh "user=\\(.user) ip=\\(.ip) private_key_path=\\(.private_key_path)"\')"\n\n# Get `token` and `cert hash` for `kubeadm join`\njq -n --arg token "$(ssh -o "StrictHostKeyChecking no" $user@$ip -i $private_key_path "sudo kubeadm token create")" --arg cert "$(ssh $user@$ip -i $private_key_path "openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed \'s/^.* //\'")" \'{"token": $token, "cert": $cert}\'\n')),(0,o.kt)("h3",{id:"add-external-dns-add-on-in-eks"},"Add external-dns add-on in EKS"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-hcl"},'locals {\n    external_dns_iam_role = "${var.remote_workspace}-${local.cluster_id}-external-dns"\n}\n\nresource "helm_release" "external_dns" {\n  name       = "external-dns"\n  repository = "https://kubernetes-sigs.github.io/external-dns/"\n  chart      = "external-dns"\n  namespace  = "kube-system"\n  depends_on = [\n    kubernetes_service_account.external_dns\n  ]\n\n  set {\n    name  = "serviceAccount.create"\n    value = "false"\n  }\n\n  set {\n    name  = "serviceAccount.name"\n    value = "aws-external-dns-sa"\n  }\n}\n\nmodule "external_dns_role" {\n  source    = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"\n\n  role_name = local.external_dns_iam_role\n  attach_external_dns_policy = true\n\n  oidc_providers = {\n    main = {\n      provider_arn               = local.cluster_oidc_provider_arn\n      namespace_service_accounts = ["kube-system:aws-external-dns-sa"]\n    }\n  }\n}\n\nresource "kubernetes_service_account" "external_dns" {\n  metadata {\n    name = "aws-external-dns-sa"\n    namespace = "kube-system"\n    labels = {\n        "app.kubernetes.io/name"= "aws-external-dns-sa"\n    }\n    annotations = {\n      "eks.amazonaws.com/role-arn" = module.external_dns_role.iam_role_arn\n    }\n  }\n}\n\n')))}m.isMDXComponent=!0}}]);