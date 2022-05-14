# Makefile

## Get go version in makefile
```makefile
GO_VERSION := $(shell echo `go version | sed 's|.*\(1\.[0-9][0-9]\).*$$|\1|'`)
```
**Filter the string you want** 

Using `\(xxx\)` to wrap the content you want to find in a string, `sed` would know this is the first place you are interested in, and then use `\1` to get the string you want.

**escape dollar**
`$` is a keyword in makefile, using `$$` instead

## Function
A function can be called like
```makefile
$(call func,param1,param2)
```

The definition of the function is like (Using `$<number>` to get the parameters)
```makefile
define go-get
if [ "$(GO_VERSION)" == "1.18" ]; then \
GOBIN=$(PROJECT_DIR)/bin go install $(2); \
else\
....\
fi
endef
```

Note that the content is a shell command. One command should be terminated by a `;`, and use `\` to break lines. 