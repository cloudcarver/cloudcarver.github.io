# Setup Kubernetes 1.21
Setup Kubernetes 1.21 in ubuntu 20.04 with Kubeadm and crio 1.23.

## Script
### control plane (worker node script + kubeadm init)
```bash
curl -s https://raw.githubusercontent.com/mikechesterwang/setup-kubeadm/main/control-plane-ubuntu20.04.sh | sudo bash
```
And then apply network model.
e.g.
```bash
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
```

### woker node
```bash
curl -s https://raw.githubusercontent.com/mikechesterwang/setup-kubeadm/main/setup-ubuntu20.04.sh | sudo bash
```
And then run `kubeadm join`

## Details
```bash
# install crio 1.23
OS=xUbuntu_20.04
CRIO_VERSION=1.23
echo "deb https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/$OS/ /"|sudo tee /etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list 
echo "deb http://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable:/cri-o:/$CRIO_VERSION/$OS/ /"|sudo tee /etc/apt/sources.list.d/devel:kubic:libcontainers:stable:cri-o:$CRIO_VERSION.list

curl -L https://download.opensuse.org/repositories/devel:kubic:libcontainers:stable:cri-o:$CRIO_VERSION/$OS/Release.key | sudo apt-key add - 
curl -L https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/$OS/Release.key | sudo apt-key add - 

sudo apt update
sudo apt install -y cri-o cri-o-runc

sudo systemctl enable crio.service
sudo systemctl start crio.service

sudo apt install -y cri-tools

# iptables
sudo modprobe overlay
sudo modprobe br_netfilter

cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sudo sysctl --system

# kubeadm
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl

sudo curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
sudo apt-get install -y kubelet=1.21.0-00 kubeadm=1.21.0-00 kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```
