"use strict";(self.webpackChunkmikechesterwang_github_io=self.webpackChunkmikechesterwang_github_io||[]).push([[8181],{3905:function(e,n,t){t.d(n,{Zo:function(){return c},kt:function(){return g}});var a=t(7294);function r(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function s(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);n&&(a=a.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,a)}return t}function o(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?s(Object(t),!0).forEach((function(n){r(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):s(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function i(e,n){if(null==e)return{};var t,a,r=function(e,n){if(null==e)return{};var t,a,r={},s=Object.keys(e);for(a=0;a<s.length;a++)t=s[a],n.indexOf(t)>=0||(r[t]=e[t]);return r}(e,n);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(a=0;a<s.length;a++)t=s[a],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(r[t]=e[t])}return r}var p=a.createContext({}),l=function(e){var n=a.useContext(p),t=n;return e&&(t="function"==typeof e?e(n):o(o({},n),e)),t},c=function(e){var n=l(e.components);return a.createElement(p.Provider,{value:n},e.children)},u={inlineCode:"code",wrapper:function(e){var n=e.children;return a.createElement(a.Fragment,{},n)}},m=a.forwardRef((function(e,n){var t=e.components,r=e.mdxType,s=e.originalType,p=e.parentName,c=i(e,["components","mdxType","originalType","parentName"]),m=l(t),g=r,k=m["".concat(p,".").concat(g)]||m[g]||u[g]||s;return t?a.createElement(k,o(o({ref:n},c),{},{components:t})):a.createElement(k,o({ref:n},c))}));function g(e,n){var t=arguments,r=n&&n.mdxType;if("string"==typeof e||r){var s=t.length,o=new Array(s);o[0]=m;var i={};for(var p in n)hasOwnProperty.call(n,p)&&(i[p]=n[p]);i.originalType=e,i.mdxType="string"==typeof e?e:r,o[1]=i;for(var l=2;l<s;l++)o[l]=t[l];return a.createElement.apply(null,o)}return a.createElement.apply(null,t)}m.displayName="MDXCreateElement"},2354:function(e,n,t){t.r(n),t.d(n,{assets:function(){return c},contentTitle:function(){return p},default:function(){return g},frontMatter:function(){return i},metadata:function(){return l},toc:function(){return u}});var a=t(7462),r=t(3366),s=(t(7294),t(3905)),o=["components"],i={title:"Multi-tenancy Gateway",description:"ingress-nginx",authors:["mike"],tags:["Kubernetes"],hide_table_of_contents:!1},p=void 0,l={permalink:"/blog/multitenancy_gateway",source:"@site/blog/multitenancy_gateway.md",title:"Multi-tenancy Gateway",description:"ingress-nginx",date:"2024-12-27T04:37:35.000Z",formattedDate:"December 27, 2024",tags:[{label:"Kubernetes",permalink:"/blog/tags/kubernetes"}],readingTime:1.835,truncated:!1,authors:[{name:"Mike Wang",title:"Software Engineer",url:"https://github.com/mikechesterwang",imageURL:"https://avatars.githubusercontent.com/u/52522981",key:"mike"}],frontMatter:{title:"Multi-tenancy Gateway",description:"ingress-nginx",authors:["mike"],tags:["Kubernetes"],hide_table_of_contents:!1},prevItem:{title:"A Glimpse of the Kubernetes Scheduler",permalink:"/blog/kubernetes_scheduler"}},c={authorsImageUrls:[void 0]},u=[{value:"Goal",id:"goal",level:2},{value:"Key Takeaways",id:"key-takeaways",level:2},{value:"Example",id:"example",level:2}],m={toc:u};function g(e){var n=e.components,t=(0,r.Z)(e,o);return(0,s.kt)("wrapper",(0,a.Z)({},m,t,{components:n,mdxType:"MDXLayout"}),(0,s.kt)("h2",{id:"goal"},"Goal"),(0,s.kt)("p",null,"Route traffic to the backend according to the request path."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre"},"                                       -----------\nhttp://gatewat.com/ns1/svc1/api/v1 --\x3e |         | --\x3e http://sv1.t1/api/v1\n                                       | Gateway |\nhttp://gatewat.com/ns2/svc2/api/v1 --\x3e |         | --\x3e http://sv2.t2/api/v2\n                                       -----------\n")),(0,s.kt)("h2",{id:"key-takeaways"},"Key Takeaways"),(0,s.kt)("ol",null,(0,s.kt)("li",{parentName:"ol"},"Ingress is just a set of routing rules. It can be placed in the namespace of the tenant. "),(0,s.kt)("li",{parentName:"ol"},"Ingress-nginx supports ",(0,s.kt)("inlineCode",{parentName:"li"},"rewrite-target")," annotation. It can be used to rewrite the request path.")),(0,s.kt)("h2",{id:"example"},"Example"),(0,s.kt)("ol",null,(0,s.kt)("li",{parentName:"ol"},"Create ",(0,s.kt)("inlineCode",{parentName:"li"},"KIND")," cluster using the following configuration. ")),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-bash"},"kind create cluster --name test --config config.yml\n")),(0,s.kt)("p",null,"config.yml:"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-yml"},'kind: Cluster\napiVersion: kind.x-k8s.io/v1alpha4\nnetworking:\n  apiServerAddress: "0.0.0.0"\nnodes:\n- role: control-plane\n  extraPortMappings:\n  - containerPort: 32443\n    hostPort: 32443\n  - containerPort: 32080\n    hostPort: 32080\n\n')),(0,s.kt)("ol",{start:2},(0,s.kt)("li",{parentName:"ol"},"Install ingress-nginx")),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-shell"},'helm upgrade \\\n  --install ingress-nginx ingress-nginx \\\n  --repo https://kubernetes.github.io/ingress-nginx \\\n  --namespace ingress-nginx \\\n  --set "controller.service.type=NodePort" \\\n  --set "controller.service.nodePorts.http=32080" \\\n  --set "controller.service.nodePorts.https=32443" \\\n  --create-namespace\n')),(0,s.kt)("ol",{start:3},(0,s.kt)("li",{parentName:"ol"},"Create HTTP applications for testing.")),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-yml"},"apiVersion: v1\nkind: Namespace\nmetadata:\n  name: ns1\n  labels:\n    name: ns1\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: app1\n  namespace: ns1\n  labels:\n    app: app1\nspec:\n  replicas: 1\n  selector:\n    matchLabels:\n      app: app1\n  template:\n    metadata:\n      labels:\n        app: app1\n    spec:\n      containers:\n      - name: app1\n        image: mendhak/http-https-echo:30\n        imagePullPolicy: IfNotPresent\n        ports:\n        - containerPort: 8080\n---\napiVersion: v1\nkind: Service\nmetadata:\n  name: svc1\n  namespace: ns1\nspec:\n  selector:\n    app: app1\n  ports:\n    - protocol: TCP\n      port: 8080\n---\napiVersion: v1\nkind: Namespace\nmetadata:\n  name: ns2\n  labels:\n    name: ns2\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: app2\n  namespace: ns2\n  labels:\n    app: app2\nspec:\n  replicas: 1\n  selector:\n    matchLabels:\n      app: app2\n  template:\n    metadata:\n      labels:\n        app: app2\n    spec:\n      containers:\n      - name: app2\n        image: mendhak/http-https-echo:30\n        imagePullPolicy: IfNotPresent\n        ports:\n        - containerPort: 8080\n---\napiVersion: v1\nkind: Service\nmetadata:\n  name: svc2\n  namespace: ns2\nspec:\n  selector:\n    app: app2\n  ports:\n    - protocol: TCP\n      port: 8080\n")),(0,s.kt)("ol",{start:4},(0,s.kt)("li",{parentName:"ol"},"Create routing rules")),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-yml"},'apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  annotations:\n    nginx.ingress.kubernetes.io/use-regex: "true"\n    nginx.ingress.kubernetes.io/rewrite-target: /$2\n  name: rewrite\n  namespace: ns1\nspec:\n  ingressClassName: nginx\n  rules:\n  - http:\n      paths:\n      - path: /ns1/svc1(/|$)(.*)\n        pathType: ImplementationSpecific\n        backend:\n          service:\n            name: svc1\n            port: \n              number: 8080\n---\napiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  annotations:\n    nginx.ingress.kubernetes.io/use-regex: "true"\n    nginx.ingress.kubernetes.io/rewrite-target: /$2\n  name: rewrite\n  namespace: ns2\nspec:\n  ingressClassName: nginx\n  rules:\n  - http:\n      paths:\n      - path: /ns2/svc2(/|$)(.*)\n        pathType: ImplementationSpecific\n        backend:\n          service:\n            name: svc2\n            port: \n              number: 8080\n\n')),(0,s.kt)("ol",{start:5},(0,s.kt)("li",{parentName:"ol"},"Test")),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-shell"},"curl http://localhost:32080/ns1/svc1/api/v1\ncurl http://localhost:32080/ns2/svc2/api/v1\ncurl http://localhost:32080/ns3/svc3/api/v1\n")))}g.isMDXComponent=!0}}]);