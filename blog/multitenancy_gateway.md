---
title: Multi-tenancy Gateway
description: ingress-nginx
authors: [mike]
tags: [Kubernetes]
hide_table_of_contents: false
---

## Goal
Route traffic to the backend according to the request path.
```
                                       -----------
http://gatewat.com/ns1/svc1/api/v1 --> |         | --> http://sv1.t1/api/v1
                                       | Gateway |
http://gatewat.com/ns2/svc2/api/v1 --> |         | --> http://sv2.t2/api/v2
                                       -----------
```

## Key Takeaways
1. Ingress is just a set of routing rules. It can be placed in the namespace of the tenant. 
2. Ingress-nginx supports `rewrite-target` annotation. It can be used to rewrite the request path.


## Example
1. Create `KIND` cluster using the following configuration. 

```bash
kind create cluster --name test --config config.yml
```

config.yml:

```yml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
networking:
  apiServerAddress: "0.0.0.0"
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 32443
    hostPort: 32443
  - containerPort: 32080
    hostPort: 32080

```

2. Install ingress-nginx
```shell
helm upgrade \
  --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx \
  --set "controller.service.type=NodePort" \
  --set "controller.service.nodePorts.http=32080" \
  --set "controller.service.nodePorts.https=32443" \
  --create-namespace
```

3. Create HTTP applications for testing.
```yml
apiVersion: v1
kind: Namespace
metadata:
  name: ns1
  labels:
    name: ns1
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app1
  namespace: ns1
  labels:
    app: app1
spec:
  replicas: 1
  selector:
    matchLabels:
      app: app1
  template:
    metadata:
      labels:
        app: app1
    spec:
      containers:
      - name: app1
        image: mendhak/http-https-echo:30
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: svc1
  namespace: ns1
spec:
  selector:
    app: app1
  ports:
    - protocol: TCP
      port: 8080
---
apiVersion: v1
kind: Namespace
metadata:
  name: ns2
  labels:
    name: ns2
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app2
  namespace: ns2
  labels:
    app: app2
spec:
  replicas: 1
  selector:
    matchLabels:
      app: app2
  template:
    metadata:
      labels:
        app: app2
    spec:
      containers:
      - name: app2
        image: mendhak/http-https-echo:30
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: svc2
  namespace: ns2
spec:
  selector:
    app: app2
  ports:
    - protocol: TCP
      port: 8080
```


4. Create routing rules
```yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/rewrite-target: /$2
  name: rewrite
  namespace: ns1
spec:
  ingressClassName: nginx
  rules:
  - http:
      paths:
      - path: /ns1/svc1(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: svc1
            port: 
              number: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/rewrite-target: /$2
  name: rewrite
  namespace: ns2
spec:
  ingressClassName: nginx
  rules:
  - http:
      paths:
      - path: /ns2/svc2(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: svc2
            port: 
              number: 8080

```

5. Test
```shell
curl http://localhost:32080/ns1/svc1/api/v1
curl http://localhost:32080/ns2/svc2/api/v1
curl http://localhost:32080/ns3/svc3/api/v1
```
