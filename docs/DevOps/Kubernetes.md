# Kubernetes basic

## rootless kubectl
```bash
mkdir -p $HOME/.kube
sudo rm -f $HOME/.kube/config
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

## check coreDNS logs
```bash
kubectl -n kube-system edit configmap coredns
```
add `log` here
```
kind: ConfigMap
apiVersion: v1
data:
  Corefile: |
    .:53 {
        log    # Enabling CoreDNS Logging
        errors
        health
        kubernetes cluster.local in-addr.arpa ip6.arpa {
          pods insecure
          upstream
          fallthrough in-addr.arpa ip6.arpa
        }
        ...
...
```
check logs
```bash
kubectl logs --follow -n kube-system --selector 'k8s-app=kube-dns'
```
