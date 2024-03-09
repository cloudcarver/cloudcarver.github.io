# Go Web development Starter Template

`fiber` + `sqlc` + `wire` + `OpenAPI`

`scripts/install-oapi-codegen.sh`
```shell
#!/bin/bash

echo "checking $VERSION for $DIR/oapi-codegen"

$DIR/oapi-codegen --version | grep $VERSION

if [ $? -eq 0 ]; then
    exit 0
fi

echo "installing $VERSION for $DIR/oapi-codegen"

GOBIN=$DIR go install github.com/deepmap/oapi-codegen/v2/cmd/oapi-codegen@$VERSION
```

`scrips/install-wire.sh`
```shell
#!/bin/bash

stat $DIR/wire

if [ $? -eq 0 ]; then
    exit 0
fi

echo "installing $VERSION for $DIR/wire"

GOBIN=$DIR go install github.com/google/wire/cmd/wire@$VERSION
```

Note that you need to delete the wire binary to upgrade the version since it 
does not have command to show version.


`Makefile`
```makefile
PROJECT_DIR=$(shell pwd)

###################################################
### OpenAPI         
###################################################

OAPI_CODEGEN_VERSION=v2.0.0
OAPI_CODEGEN_BIN=$(PROJECT_DIR)/bin/oapi-codegen
OAPI_GEN_DIR=$(PROJECT_DIR)/pkg/apigen

install-oapi-codegen:
	DIR=$(PROJECT_DIR)/bin VERSION=${OAPI_CODEGEN_VERSION} ./scripts/install-oapi-codegen.sh

prune-spec:
	@rm -f $(OAPI_GEN_DIR)/spec_gen.go

gen-spec: install-oapi-codegen prune-spec
	$(OAPI_CODEGEN_BIN) -generate types,fiber -o $(OAPI_GEN_DIR)/spec_gen.go -package apigen $(PROJECT_DIR)/api/openapi-v1.yaml

###################################################
### Wire
###################################################

WIRE_VERSION=v0.6.0

install-wire:
	DIR=$(PROJECT_DIR)/bin VERSION=${WIRE_VERSION} ./scripts/install-wire.sh

WIRE_GEN=$(PROJECT_DIR)/bin/wire
gen-wire: install-wire
	$(WIRE_GEN) ./wire

###################################################
### SQL  
###################################################

SQLC_VERSION=1.25.0
QUERIER_DIR=$(PROJECT_DIR)/pkg/model/querier

clean-querier:
	@rm -f $(QUERIER_DIR)/*sql.gen.go
	@rm -f $(QUERIER_DIR)/copyfrom_gen.go   
	@rm -f $(QUERIER_DIR)/db_gen.go
	@rm -f $(QUERIER_DIR)/models_gen.go
	@rm -f $(QUERIER_DIR)/querier_gen.go

gen-querier: clean-querier
	docker run --rm -v $(PROJECT_DIR):/src -w /src sqlc/sqlc:$(SQLC_VERSION) generate

###################################################
### Common
###################################################

gen: gen-spec gen-querier gen-wire
	@go mod tidy
```
