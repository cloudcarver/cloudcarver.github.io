---
title: A Glimpse of the Kubernetes Scheduler
description: A Glimpse of the Kubernetes Scheduler
authors: [mike]
tags: [Kubernetes]
hide_table_of_contents: false
---

## Scheduler
`kube-scheduler` is the key component to schedule new pods to existing nodes. It uses "informer" to listen 
for new pod that it is responsible for and new node.

When there is a new pod, the pod will be added to the scheduling queue. `ScheduleOne` is called in every iteration, 
it is responsible to try to schedule one of the pod in the scheduling queue to nodes in the "node cache". 

When there is a new node, the node will be added to the "node cache", all unschedulable pods will immdiately be 
traversed to use `scheduler.AdmissionCheck` to know if it can be scheduled to this new node. 

## Autoscaler
Cluster autoscaler is responsible for scaling up/down the cluster. Note that it is coupled with the cloud provider 
since only the cloud provider can provide API to manipulate your nodes (e.g. ec2 instances).

Autoscaler lists all unschedulable pods in every iteration. When scaling up is needed, it will call `ComputeExpansionOption` 
to get feasible plans for scaling up. This function leverage estimator and traverse the valid node groups to get the result.
`binpacking_estimator` uses the simulator to simulate the schenario that the node was added to the cluster. This "scenario" 
is described as `ClusterSnapshot`. The estimator will use `CheckPredicates` to know if the pods are okay 
to be placed in this node. `CheckPredicates` will further call `scheduler.AdmissionCheck` to do the job.

Note that the valid node groups is directly fetched by `(*ScaleUpOrchestrator).autoscalingContext.CloudProvider.NodeGroups()`. 
`(*ScaleUpOrchestrator).autoscalingContext.CloudProvider` is initalized by `buildCloudProvider` in 
`cloudprovider/builder/builder_aws.go`.

In AWS autoscaler, it retrives all cached ASGs (autoscaling groups), which implement the `NodeGroup` interface. The ASGs are
cached in `Refresh` function in every iteration. The ASGs are fetched and filterd by setting `--node-group-auto-discovery=asg:tag=xxx`. 
