---
title: A Glimpse of the Kubernetes Pod Exec Interface
description: A Glimpse of the Kubernetes Pod Exec Interface
authors: [mike]
tags: [Kubernetes]
hide_table_of_contents: false
---

## User-facing Interface
With `go-client`, users can run command in a container using the following code
```go
var (
    podName      = "pod-name"
    podNamespace = "pod-namespace"
    cmd          = []string{"echo", "1"}
)

// build RESTful request
req := t.kc.
	CoreV1().
	RESTClient().
	Post().
	Resource("pods").
	Name(podName).
	Namespace(podNamespace).
	SubResource("exec")
execOption := &corev1.PodExecOptions{
	Command: cmd,
	Stdout:  true,
	Stderr:  true,
    // we only care about not tty case in this example.
	TTY:     false,
    Stdin:   false,
}
req.VersionedParams(execOption, scheme.ParameterCodec)

// execute command in container using SPDYExecutor
exec, err := t.newSPDYExecutor(t.kc.GetRestCfg(), "POST", req.URL())
if err != nil {
	return "", errors.Wrapf(err, "failed to build SPDY Executor: %v", option)
}

outBuf := new(bytes.Buffer)
errBuf := new(bytes.Buffer)

err = exec.StreamWithContext(ctx, remotecommand.StreamOptions{
	Stdin:  nil,
	Stdout: outBuf,
	Stderr: errBuf,
})

if err != nil {
	return "", errors.Wrapf(err, "failed to execute command: %v, stderr: %s", option, errBuf.String())
}
```

In the above example, we use SPDYExecutor (note that SPDY is a protocol that is deprecated in favor of HTTP/2) to execute the command in the container. The `StreamWithContext` method will send a request to the kube-apiserver, and the kube-apiserver will forward the request to the kubelet. 

The user interface is very clean. But we don't know if this method will return error when the command exuected in the container returns a non-zero exit code! So we'd better to take a deeper look. Of course, you can also verify it by executing a command in a container that will return a non-zero exit code like `exit 1`.

Let's look at the `StreamWithContext` method:

```go
func (e *streamExecutor) StreamWithContext(ctx context.Context, options StreamOptions) error {
	conn, streamer, err := e.newConnectionAndStream(ctx, options)
	if err != nil {
		return err
	}
	defer conn.Close()

	panicChan := make(chan any, 1)
	errorChan := make(chan error, 1)
	go func() {
		defer func() {
			if p := recover(); p != nil {
				panicChan <- p
			}
		}()
		errorChan <- streamer.stream(conn)
	}()

	select {
	case p := <-panicChan:
		panic(p)
	case err := <-errorChan:
		return err
	case <-ctx.Done():
		return ctx.Err()
	}
}
```

The logic is simple: if the error stream is not empty (also not EOF), it will be decoded and sent to the channel `errorChan`. Otherwise, nil will be sent to the channel.

In normal situation (no timeout and no panic), this method will be blocked by the channel `errorChan`, where the error or nil comes out.  

Following the method `streamer.stream(conn)`, we can find where the channel is created in `k8s.io/client-go/tools/remotecommand/errorstream.go`:
```go
func watchErrorStream(errorStream io.Reader, d errorStreamDecoder) chan error {
	errorChan := make(chan error)

	go func() {
		defer runtime.HandleCrash()

		message, err := io.ReadAll(errorStream)
		switch {
		case err != nil && err != io.EOF:
			errorChan <- fmt.Errorf("error reading from error stream: %s", err)
		case len(message) > 0:
			errorChan <- d.decode(message)
		default:
			errorChan <- nil
		}
		close(errorChan)
	}()

	return errorChan
}
```

Note that when the error stream is not empty, it does not neccessary to be an error. Because `d.decode(message)` is used to parse the error instead of something like `json.Unmarshal`. In `errorDecoderV4`, you can find the following code segment:
```go
func (d *errorDecoderV4) decode(message []byte) error {
	...
	case metav1.StatusSuccess:
		return nil
	...
```

But where is the `errorStream`? It is in `k8s.io/client-go/tools/remotecommand/v2.go`.
```go
func (p *streamProtocolV2) createStreams(conn streamCreator) error {
	var err error
	headers := http.Header{}
	// set up error stream
	headers.Set(v1.StreamType, v1.StreamTypeError)
	p.errorStream, err = conn.CreateStream(headers)
	if err != nil {
		return err
	}
	// set up stdin stream
	if p.Stdin != nil {
		headers.Set(v1.StreamType, v1.StreamTypeStdin)
		...
	}
	// set up stdout stream
	...
	// set up stderr stream
	...
	return nil
}
```
This method uses `conn.CreateStream` to create a bidirection streaming channel. It uses the header to filter the stream type. For instance, if the header is `v1.StreamTypeStdin`, the stream will be used to send data to the container. So the client will open at most **four** streaming tunnel to the container. 

To find out what kinds of stream frames will be sent from the server side, let's take a look at the Kubelet.

The Kubernetes client (e.g. client go, Kubectl) alwasy send requests to the API Server. In this scenario, API server will forward the request to Kubelet. Kubelet actually acts as a proxy to forward traffic between the client and the container.

## Kubernetes Side
How does Kubelet handle this request? Following the source code, we can quickly find the function `InstallDebuggingHandlers` in `pkg/kubelet/server/server.go`:
```go
// InstallDebuggingHandlers registers the HTTP request patterns that serve logs or run commands/containers
func (s *Server) InstallDebuggingHandlers() {
    ...
    ws = new(restful.WebService)
    ws.
        Path("/exec")
    ws.Route(ws.GET("/{podNamespace}/{podID}/{containerName}").
        To(s.getExec).
        Operation("getExec"))
    ...
}
```
*Accoriding the function name, we know `exec` is actually a debugging feature in Kubelet. More debug features can be found in `InstallDebuggingDisabledHandlers`*

```go
func (s *Server) getExec(request *restful.Request, response *restful.Response) {
	...
	url, err := s.host.GetExec(podFullName, params.podUID, params.containerName, params.cmd, *streamOpts)
	if err != nil {
		streaming.WriteError(err, response.ResponseWriter)
		return
	}
	proxyStream(response.ResponseWriter, request.Request, url)
    ...
}

```
`getExec` will first call `kubeGenericRuntimeManager.GetExec`, which will send an internal gRPC request to the remote runtime service to get a URL. Then `proxyStream` will use this URL to connect to the streaming endpoint.

## Container Runtime Side
The remote runtime service is the container runtime, for instance, in `containerd/pkg/cri/streaming` of the `containerd` repo, it exposes the following streaming interfaces:
```go
type Server interface {
	http.Handler
    ...
	GetExec(*runtimeapi.ExecRequest) (*runtimeapi.ExecResponse, error)
	GetAttach(req *runtimeapi.AttachRequest) (*runtimeapi.AttachResponse, error)
	GetPortForward(*runtimeapi.PortForwardRequest) (*runtimeapi.PortForwardResponse, error)
    ...
}
```

In its source code, we can find the corresponding function for handing the command execution request in `containerd/pkg/cri/streaming/remotecommand/exec.go`:
```go
func ServeExec(w http.ResponseWriter, req *http.Request, executor Executor, podName string, uid types.UID, container string, cmd []string, streamOpts *Options, idleTimeout, streamCreationTimeout time.Duration, supportedProtocols []string) {
	ctx, ok := createStreams(req, w, streamOpts, supportedProtocols, idleTimeout, streamCreationTimeout)
	if !ok {
		// error is handled by createStreams
		return
	}
	defer ctx.conn.Close()

	err := executor.ExecInContainer(podName, uid, container, cmd, ctx.stdinStream, ctx.stdoutStream, ctx.stderrStream, ctx.tty, ctx.resizeChan, 0)
	if err != nil {
		if exitErr, ok := err.(utilexec.ExitError); ok && exitErr.Exited() {
			rc := exitErr.ExitStatus()
			ctx.writeStatus(&apierrors.StatusError{ErrStatus: metav1.Status{
				Status: metav1.StatusFailure,
				Reason: remotecommandconsts.NonZeroExitCodeReason,
				Details: &metav1.StatusDetails{
					Causes: []metav1.StatusCause{
						{
							Type:    remotecommandconsts.ExitCodeCauseType,
							Message: fmt.Sprintf("%d", rc),
						},
					},
				},
				Message: fmt.Sprintf("command terminated with non-zero exit code: %v", exitErr),
			}})
		} else {
			err = fmt.Errorf("error executing command in container: %v", err)
			runtime.HandleError(err)
			ctx.writeStatus(apierrors.NewInternalError(err))
		}
	} else {
		ctx.writeStatus(&apierrors.StatusError{ErrStatus: metav1.Status{
			Status: metav1.StatusSuccess,
		}})
	}
}
```

When the command execution is done in `executor.ExecInContainer`, Kubelet will send a response to the connection by:
```go
ctx.writeStatus(&apierrors.StatusError{ErrStatus: metav1.Status{
	Status: ...,
}})
```
The status describes various situations to the client. For instance, if a non-zero exit code is returned by the command in the pod, the related information (e.g. exit code) is attached to the status reponse. 

But how exactly the command is executed in container? Following the references, we can find the implementation in `containerd/pkg/cri/sbserver/container_execsync.go`:
```go
func (c *criService) execInternal(ctx context.Context, container containerd.Container, id string, opts execOptions) (*uint32, error)
```
More details can be found in this function, but we will not continue to dig into it.

