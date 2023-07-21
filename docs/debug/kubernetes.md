## kubernetes client-go fake client cannot create cluster scoped objects

### Problem

I tried to use fake client to create cluster scoped objects:
```go
import "k8s.io/client-go/kubernetes/fake"
...
client := fake.NewSimpleClientset(&rbacv1.ClusterRole{
	ObjectMeta: metav1.ObjectMeta{
		Name:      "role-name",
		Namespace: "ns",
	},
})
client.RbacV1().ClusterRoles().Create(context.Background(), &rbacv1.ClusterRoleBinding{
    ObjectMeta: metav1.ObjectMeta{
		Name:      saName,
		Namespace: saNamespace,
	},
	Subjects: []v1.Subject{
		{
			Namespace: saNamespace,
			Name:      saName,
			Kind:      "ServiceAccount",
		},
	},
	RoleRef: v1.RoleRef{
		APIGroup: "rbac.authorization.k8s.io",
		Kind:     "ClusterRole",
		Name:     "role-name",
	},
})
```
But it failed with the following error:
```
request namespace does not match object namespace, request: "" object: "xxx"
```

### Solution

It turns out `ClusterRoleBinding` should be created without the namespace field because it is a cluster scoped object. However, the real Kubernetes API server will not reject the request with namespace field. So what happened here?


### Mechanism
1. Fake client will first use the corresponding resource client to create the object, in this case, the following method in [this file](
https://github.com/kubernetes/client-go/blob/master/kubernetes/typed/rbac/v1/fake/fake_clusterrolebinding.go#L82) is called:
```
func (c *FakeClusterRoleBindings) Create(ctx context.Context, clusterRoleBinding *v1.ClusterRoleBinding, opts metav1.CreateOptions) (result *v1.ClusterRoleBinding, err error) {
	obj, err := c.Fake.
		Invokes(testing.NewRootCreateAction(clusterrolebindingsResource, clusterRoleBinding), &v1.ClusterRoleBinding{})
	if obj == nil {
		return nil, err
	}
	return obj.(*v1.ClusterRoleBinding), err
}
```

2. Check the `NewRootCreateSubresourceAction` function [here](https://github.com/kubernetes/client-go/blob/master/testing/actions.go#L114):
```
func NewRootCreateSubresourceAction(resource schema.GroupVersionResource, name, subresource string, object runtime.Object) CreateActionImpl {
	action := CreateActionImpl{}
	action.Verb = "create"
	action.Resource = resource
	action.Subresource = subresource
	action.Name = name
	action.Object = object

	return action
}
```
Note that `action.Namespace` is not set comparing with `NewCreateAction`, this is the main cause.

3. `Invokes` method will use a list of reactor to do the corresponding operation.
```
func (c *Fake) Invokes(action Action, defaultReturnObj runtime.Object) (runtime.Object, error) {
	c.Lock()
	defer c.Unlock()

	actionCopy := action.DeepCopy()
	c.actions = append(c.actions, action.DeepCopy())
	for _, reactor := range c.ReactionChain {
		if !reactor.Handles(actionCopy) {
			continue
		}

		handled, ret, err := reactor.React(actionCopy)
		if !handled {
			continue
		}

		return ret, err
	}

	return defaultReturnObj, nil
}
```

4. Accoriding to `CreateActionImpl` [here](https://github.com/kubernetes/client-go/blob/master/testing/fixture.go#L97), we can know it tries to compare the namespace of the object and the namespace of the action, which is empty in this case.
