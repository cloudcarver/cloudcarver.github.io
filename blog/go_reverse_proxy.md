---
title: Go HTTP Reverse Proxy
description: go reverseproxy in httputils
authors: [mike]
tags: [go]
hide_table_of_contents: false
---

### Code

`http_proxy.go`

```go
package proxy

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"sync"

	"github.com/gorilla/mux"
	"github.com/pkg/errors"
)

type HTTPProxy struct {
	router    *mux.Router
	listeners map[string]*ProxyListener
	mu        sync.RWMutex

	listener net.Listener
}

func NewHTTPProxy() (*HTTPProxy, error) {
	return &HTTPProxy{
		router:    mux.NewRouter(),
		listeners: make(map[string]*ProxyListener),
	}, nil
}

func (p *HTTPProxy) AddListener(namespace string, name string, backendURL string) error {
	base := fmt.Sprintf("/%s/%s", namespace, name)

	listener, err := NewHTTPListener(
		base,
		backendURL,
	)
	if err != nil {
		return errors.Wrapf(err, "failed to create listener, base: %s, backend: %s", base, backendURL)
	}

	p.mu.Lock()
	defer p.mu.Unlock()
	p.listeners[base] = listener

	return nil
}

func (p *HTTPProxy) RemoveListener(namespace string, name string) {
	p.mu.Lock()
	defer p.mu.Unlock()

	base := fmt.Sprintf("/%s/%s", namespace, name)

	delete(p.listeners, base)
}

func (p *HTTPProxy) Serve(netListener net.Listener) error {
	p.router.PathPrefix("/{namespace}/{name}").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p.mu.RLock()
		defer p.mu.RUnlock()

		vars := mux.Vars(r)
		base := fmt.Sprintf("/%s/%s", vars["namespace"], vars["name"])

		listener, ok := p.listeners[base]
		if !ok {
			w.WriteHeader(http.StatusNotFound)
			return
		}

		listener.ServeHTTP(w, r)
	})

	p.listener = netListener

	return http.Serve(netListener, p.router)
}

func (p *HTTPProxy) Close() error {
	return p.listener.Close()
}

type ProxyListener struct {
	base    *url.URL
	backend *url.URL
}

func NewHTTPListener(basePathRaw, backendRaw string) (*ProxyListener, error) {
	basePath, err := url.Parse(basePathRaw)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to parse base path, raw: %s", basePathRaw)
	}
	backend, err := url.Parse(backendRaw)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to parse backend url, raw: %s", backendRaw)
	}
	return &ProxyListener{
		base:    basePath,
		backend: backend,
	}, nil
}

func removeBasePathFromRequest(base *url.URL, req *url.URL) (string, string) {
	if base.Path == "/" {
		return req.Path, req.RawPath
	}
	bpath := base.Path
	if strings.HasSuffix(base.Path, "/") {
		bpath = base.Path[:len(base.Path)-1]
	}
	return req.Path[len(bpath):], req.EscapedPath()[len(bpath):]
}

func rewriteRequestURL(req *http.Request, target *url.URL, base *url.URL) {
	targetQuery := target.RawQuery
	req.URL.Scheme = target.Scheme
	req.URL.Host = target.Host
	req.URL.Path, req.URL.RawPath = removeBasePathFromRequest(base, req.URL)
	if targetQuery == "" || req.URL.RawQuery == "" {
		req.URL.RawQuery = targetQuery + req.URL.RawQuery
	} else {
		req.URL.RawQuery = targetQuery + "&" + req.URL.RawQuery
	}
}

func (h *ProxyListener) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	proxy := &httputil.ReverseProxy{
		Director: func(r *http.Request) {
			rewriteRequestURL(r, h.backend, h.base)
		},
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		},
	}
	proxy.ServeHTTP(rw, req)
}

```


`http_proxy_test.go`


```go
package proxy

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/net/nettest"
)

func getTestCertificate() (*x509.CertPool, tls.Certificate, error) {
	const caPEM = `-----BEGIN CERTIFICATE-----
MIIDLzCCAhegAwIBAgIUAQHLhZGIh0u+p9b6+hEdpfR07kMwDQYJKoZIhvcNAQEL
BQAwJzELMAkGA1UEBhMCVVMxGDAWBgNVBAMMD0V4YW1wbGUtUm9vdC1DQTAeFw0y
MzA2MDUwODE4MzlaFw0yNjAzMjUwODE4MzlaMCcxCzAJBgNVBAYTAlVTMRgwFgYD
VQQDDA9FeGFtcGxlLVJvb3QtQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEK
AoIBAQDxDadnQbgaPOaAdqu8ClNoAiLTl4BaLMKqU5qbjkmQKIaq/Naa97FYv6Ng
Cspx85U4SUcOKxDnLH4+oiwZ/ob5M3I30M+SJSzm8xPAeWNyE5HTZIgH5L+Rx0Yn
JVeK1lYc6Dna6b0BcfEzW2V3uJ9ZFU7ixuRXV3DJdocN+HpGtPvjn3zYHQaCRhxk
ans9psdFncANjyU6P2vLY0yuny3qMZUJXSOuVUKqM2IwRZku9EDARra4JVx5TBiV
LXGxPj69wHdYloVu2fuFJS/Vf3V40or+bH3PRJF1brwqS28oNuOpcjo8Q+9brpbK
9u/2ViFBfwrxcabobY7x/MpxtPm1AgMBAAGjUzBRMB0GA1UdDgQWBBS3G2Bc5HqV
I6YLnnBgzUWsddWZCTAfBgNVHSMEGDAWgBS3G2Bc5HqVI6YLnnBgzUWsddWZCTAP
BgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQDMOF5IpSFwINyvUK+r
RRT5mVEG3GKuG0leQJWFe5WuD2ksxTM4CKV6V0u+gY0R6uKtd/Z37ie/OLqXJq9H
Q0zVqp6pen1GwgIWqtcVYVKxbRNO6OY3RBrFRwmeNjGzw3eP4676qCcckSQHqqVM
/3b3Jxdvq9sjfdpp2XiIG1kRFLGFBouwzaEwfMADVdSLiI3JN2A19YhHwc6QrTCI
WRmsEMe54OZqLtYU2Lgwzz9HT2aPaWVBV0ftMOd3LtJ9JjPSefqBLyWnWFunIaNi
94x0TvZdlfspj5jfK/07tukC2Iz83f3D8z0qHJ9Vp6V7Fw+MtU5Ak3JDPx18XZzJ
HDPL
-----END CERTIFICATE-----`
	const certPEM = `-----BEGIN CERTIFICATE-----
MIIDjTCCAnWgAwIBAgIUXc2UkcCEjOerIOmkCe2EUHou8vcwDQYJKoZIhvcNAQEL
BQAwJzELMAkGA1UEBhMCVVMxGDAWBgNVBAMMD0V4YW1wbGUtUm9vdC1DQTAeFw0y
MzA2MDUwODE4MzlaFw0yNjAzMjUwODE4MzlaMG0xCzAJBgNVBAYTAlVTMRIwEAYD
VQQIDAlZb3VyU3RhdGUxETAPBgNVBAcMCFlvdXJDaXR5MR0wGwYDVQQKDBRFeGFt
cGxlLUNlcnRpZmljYXRlczEYMBYGA1UEAwwPbG9jYWxob3N0LmxvY2FsMIIBIjAN
BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtV1EDl/Hr3wJkxgKExqGGliXoO1v
+m0SPtGo4ORuSTWiHQFuSd12QzXtc0HPeiKwC5echrJ8TgcKKwT10MTDGvb3sxvO
Z4fdxh+B4SP9H6qNubBI+EOixGhNZq/iPzzZe9zEfLlTu+REscjrIbWvpWxSkto7
KIgVbelOoTJoXjLNKt5QVfE9ME7+Amxgz5pqIVRz/k1ogDFcGhrXulms+YPS+y+L
vAwaMqn2fO82XkEQgSRHe6krXPjMX+0oYysBkHdLaDvolRzE7iS8boLAFmiSL8ce
qEdl0LLbiRsmwRTq6sRDHU88mLrDiGDWrSeQh4cZ1+jXX3p/84XyNtjTqQIDAQAB
o2swaTAfBgNVHSMEGDAWgBS3G2Bc5HqVI6YLnnBgzUWsddWZCTAJBgNVHRMEAjAA
MAsGA1UdDwQEAwIE8DAuBgNVHREEJzAlgglsb2NhbGhvc3SCC2Zha2UxLmxvY2Fs
ggtmYWtlMi5sb2NhbDANBgkqhkiG9w0BAQsFAAOCAQEA0Suhn7RuEsVkLOsc+Wkr
UMdjYeijcZz81W8yAwwa/mSqzp/bZnJBLRSeCLZ0RScxd08CFOSJPQ5shl9j6TPU
Mrbm3djH0WepsGlbVj3HWM2A1XmZvKA7Q48ZZf6uBo9qkka29diqMzqBVYsV4lmB
EbsaxGItrAhxdgLus2UubVMtLj6MN88lmbpW8O3P53rYkX5nFlEzJUhNySGFxPBq
NjXxtv1h65+CGawNBoD0vz0QBYa7BW0IVXRb+WlIVSf3r2iEShSwz4mr389SgHk0
+0axUYUyVJ5/oB9ZMxyTSaXcl7k+KRT/M70KgAxm3dHri6uPjRM2AWrM3Bor/fJw
7w==
-----END CERTIFICATE-----`
	const priPEM = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1XUQOX8evfAmT
GAoTGoYaWJeg7W/6bRI+0ajg5G5JNaIdAW5J3XZDNe1zQc96IrALl5yGsnxOBwor
BPXQxMMa9vezG85nh93GH4HhI/0fqo25sEj4Q6LEaE1mr+I/PNl73MR8uVO75ESx
yOshta+lbFKS2jsoiBVt6U6hMmheMs0q3lBV8T0wTv4CbGDPmmohVHP+TWiAMVwa
Gte6Waz5g9L7L4u8DBoyqfZ87zZeQRCBJEd7qStc+Mxf7ShjKwGQd0toO+iVHMTu
JLxugsAWaJIvxx6oR2XQstuJGybBFOrqxEMdTzyYusOIYNatJ5CHhxnX6Ndfen/z
hfI22NOpAgMBAAECggEALcLSoS3ZnJWXdN3j7N4MaCliWOCQGIfcyqzsB5KboS0/
MkJiKZEPffXla+d3CkImWUZv4Cy44Jc2IZSm0X5UHEGkTjT953GIq6zXgI8sFwlZ
qTipsLqgHx6SKQ7H71zTI0WY7j90uTvneVRQv7iwEPU8AIG/24I6pfjwNgwZ+Wo7
HN4QcNn8qdWIerOiqTa/hxuKwTeofspaI1jgaw1PCXGXTYZ2furULUMF4IQVbQZA
UU9ZptXZTIO2i95Ne+LRAc75GGKmzV74XCaEiY7ySpeerq0Wbo1f3YDF9fcxjHHr
zgnM0/o/au+XB2vBuwOmAZonUSXAyvKX34v0ucFCYQKBgQDknrVgZ+wwUQBjGtsJ
6ySPyLD1oUudDnnYIWkHXs8ibSj+QVqB/ANX+PJhq5kaEZnswWujAInVob0PjN/Q
LWmNaFKrN4SBRxsiHOJQqlXH1PQsU0uKJUbIAAbif+yHZPMGinDqxYu99GXeBKIT
+3dnKS+xJFliGYFPjSJ/INpGWwKBgQDLFb156qNezXBBumwZ4fYmq/Fd9uqbqWfd
bXB8cxuph8M5zU+2UKvyRzqw4Ioo6kIeTmcaSpSepJ1onLr2dSmpF+s83yoaJSuI
Y4t7foR5CXHG/KApM06qxmHbNRHF0juGf3MBrnlBYRiM+frPeEMId3sQWDQmXpE8
AkHxkr5VSwKBgQCsuohY9UuK2bhMKF8zqDgwdjXU7298kxJVzDBZRDWFUio1p1Tl
fm1cSxd92bNL8d509VIIjoCVKqT4GbyDwbvM/fPvrntrXTjP1jjbL0auO2PcFXau
QimvM+3/tR0U0p2W5IQZrPU+qGdKjf+Sz1xQUdrZoJfzuUdsvjpBCKZBnwKBgQCA
Gb+B9qKEezvTCf+EOAcnj4/ZgJWuCKaugojQx17siel4PWyJiMtdMNbxmUEs289H
BJd+ewrSIu3zfeFk8rSLp73HkNEi2s1h48Co7j4rhuyQ4us38dguWqKBPjFuwdSw
WxY1OlPcDJ4K1ugBFE/cOFmVDr4eccpUuuvTsIeEjwKBgE9Bn4zuQO9wGLNoEl6G
PMPeNsqJL0tL/AfcQ9XYZIIkDa9Ed/PSWPhQNWzJbt44rug5nre25WqWS3uDG2p4
RnJlN9UjHPvwBWK3VL6is+bFpWSylZeSibbQwKq8MYfBV0EsJCMMvwaAc5mb50iH
oIkpaySJ6Bk+O6pK+ul2Ywzk
-----END PRIVATE KEY-----`
	pool := x509.NewCertPool()
	caBlock, _ := pem.Decode([]byte(caPEM))
	ca, err := x509.ParseCertificate(caBlock.Bytes)
	if err != nil {
		return nil, tls.Certificate{}, errors.Wrap(err, "failed to parse root certificate")
	}
	pool.AddCert(ca)

	cert, err := tls.X509KeyPair([]byte(certPEM), []byte(priPEM))
	if err != nil {
		return nil, tls.Certificate{}, errors.Wrap(err, "failed to parse certificate")
	}
	return pool, cert, nil
}

func getTestTLSListener() (net.Listener, error) {
	listener, err := nettest.NewLocalListener("tcp")
	if err != nil {
		return nil, err
	}

	pool, cert, err := getTestCertificate()
	if err != nil {
		return nil, err
	}

	tlsListener := tls.NewListener(listener, &tls.Config{
		Certificates: []tls.Certificate{cert},
		RootCAs:      pool,
		NextProtos:   []string{"h2"},
	})

	return tlsListener, nil
}

func prepareProxyAndBackends(t *testing.T) (net.Listener, net.Listener) {
	// prepare tls backend
	tlsBackendListener, err := getTestTLSListener()
	require.NoError(t, err)
	go http.Serve(tlsBackendListener, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(r.URL.String()))
	}))

	// prepare tcp backend
	backendListener, err := nettest.NewLocalListener("tcp")
	require.NoError(t, err)
	go http.Serve(backendListener, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(r.URL.String()))
	}))

	// wait for listening
	time.Sleep(10 * time.Millisecond)
	return tlsBackendListener, backendListener
}

func getPort(l net.Listener) string {
	return strings.Split(l.Addr().String(), ":")[1]
}

func testProxy(t *testing.T, proxy *HTTPProxy, proxyURL string) {
	tlsListener, tcpListener := prepareProxyAndBackends(t)

	tlsBackendURL := fmt.Sprintf("https://localhost:%s", getPort(tlsListener))
	defer tlsListener.Close()

	tcpBackendURL := fmt.Sprintf("http://localhost:%s", getPort(tcpListener))
	defer tcpListener.Close()

	var (
		tlsNamespace = "tls"
		tlsName      = "tls_service"
		tlsBase      = fmt.Sprintf("/%s/%s", tlsNamespace, tlsName)
		tcpNamespace = "tcp"
		tcpName      = "tcp_service"
		tcpBase      = fmt.Sprintf("/%s/%s", tcpNamespace, tcpName)
		path         = "/api/v1"
	)

	// add listeners
	err := proxy.AddListener(tlsNamespace, tlsName, tlsBackendURL)
	require.NoError(t, err)
	err = proxy.AddListener(tcpNamespace, tcpName, tcpBackendURL)
	require.NoError(t, err)

	// send request to TLS backend
	addr := fmt.Sprintf("%s%s%s", proxyURL, tlsBase, path)
	httpClient := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		},
	}
	res, err := httpClient.Get(addr)
	require.NoError(t, err)
	b, err := io.ReadAll(res.Body)
	require.NoError(t, err)
	assert.Equal(t, path, string(b))

	// send request to TCP backend
	addr = fmt.Sprintf("%s%s%s", proxyURL, tcpBase, path)
	res, err = httpClient.Get(addr)
	require.NoError(t, err)
	b, err = io.ReadAll(res.Body)
	require.NoError(t, err)
	assert.Equal(t, path, string(b))
}

func TestProxy_https_tls_and_tcp_backend(t *testing.T) {
	proxyListener, err := getTestTLSListener()
	require.NoError(t, err)
	proxy, err := NewHTTPProxy()
	require.NoError(t, err)
	go proxy.Serve(proxyListener)
	defer proxy.Close()
	time.Sleep(10 * time.Millisecond)

	testProxy(t, proxy, fmt.Sprintf("https://localhost:%s", getPort(proxyListener)))
}

func TestProxy_http_tls_and_tcp_backend(t *testing.T) {
	proxyListener, err := nettest.NewLocalListener("tcp")
	require.NoError(t, err)
	proxy, err := NewHTTPProxy()
	require.NoError(t, err)
	go proxy.Serve(proxyListener)
	defer proxy.Close()
	time.Sleep(10 * time.Millisecond)

	testProxy(t, proxy, fmt.Sprintf("http://localhost:%s", getPort(proxyListener)))
}

func TestRemoveListener(t *testing.T) {
	// prepare backend
	backendListener, err := nettest.NewLocalListener("tcp")
	require.NoError(t, err)
	go http.Serve(backendListener, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(r.URL.String()))
	}))
	backendURL := fmt.Sprintf("http://localhost:%s", getPort(backendListener))

	// proxy
	proxyListener, err := nettest.NewLocalListener("tcp")
	require.NoError(t, err)
	proxy, err := NewHTTPProxy()
	require.NoError(t, err)
	go proxy.Serve(proxyListener)
	defer proxy.Close()
	time.Sleep(10 * time.Millisecond)
	proxyURL := fmt.Sprintf("http://localhost:%s", getPort(proxyListener))

	// add listener
	err = proxy.AddListener("test", "test", backendURL)
	require.NoError(t, err)

	// send request
	res, err := http.DefaultClient.Get(fmt.Sprintf("%s/test/test/api/v1", proxyURL))
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, res.StatusCode)
	b, err := io.ReadAll(res.Body)
	require.NoError(t, err)
	assert.Equal(t, "/api/v1", string(b))

	// remove listener
	proxy.RemoveListener("test", "test")
	require.NoError(t, err)

	// send request
	res, err = http.DefaultClient.Get(fmt.Sprintf("%s/test/test/api/v1", proxyURL))
	require.NoError(t, err)
	require.Equal(t, http.StatusNotFound, res.StatusCode)
}

```