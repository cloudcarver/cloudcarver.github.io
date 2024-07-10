---
title: Golang Web Starter
description: Golang Web Starter
authors: [mike]
tags: [go]
hide_table_of_contents: false
---

Web development with Golang is a hot topic. There are many frameworks and tools to choose from. Essentially, there are several parts you need to set up at the very beginning:

1. **API specification** 
2. **Database access** (no ORM, but with interfaces)
3. **Dependency injection** 
4. **Test framework** (high coverage, even with many external services)
5. **Development environment** (use dev container, instant code reload)

I've been working on web development with Golang for a while. In this article, I will share my experience with you.
The code in this article can be found in here: [https://github.com/xich-dev/go-starter](https://github.com/xich-dev/go-starter) 

## API Specification

API specification is the first thing you need to do. It's the contract between the frontend and the backend. OpenAPI has a good ecosystem. Popular programming languages have libraries to generate code from OpenAPI specification. In Golang, `oapi-codegen` is a good choice. 

You can also define the schemas in the OpenAPI spec, and treat it as the single source of truth of the data model. In this design pattern, you use OpenAPI spec to design your business logic instead of defining the data model in the relational databases. Sounds like a bold move, but it's worth trying. Eventually, you will find that the data model in the relational database is just a subset of the data model in the OpenAPI spec. Since all components in your software, in the web development scenario, the frontend, the backend, both rely on the OpenAPI spec. 

In the following example, I first define the `SignInParams` in the OpenAPI spec. Then I can just use a single method `BodyParser` to get the request body.

```yaml
SignInParams:
  type: object
  required: [phone_number, country_code, verification_code]
  properties:
    phone_number:
      type: string
    country_code:
      type: string
    verification_code:
      type: string
```

```go
func (h *Handler) PostSignIn(c *fiber.Ctx) error {
    var req apigen.SignInParams
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).SendString("invalid request")
    }
    ......
}
```

I like [fiber](https://github.com/gofiber/fiber) because it is concise and fast. Gin is also a good choice if you prefer a more mature framework.
You can generate code for the `security` field with Gin, but not with fiber as fiber is just recently supported by the `openapi-codegen` community. 
I prefer to explicitly handle the security and parameter verification by myself with more powerful tools (I will talk about these in the future). So fiber works for me.

## Database access 

Although ORM tools can save you some time, you still need to write SQL by yourself, but with interfaces in Golang. With `sqlc`, you can generate the interfaces and the SQL code from the SQL files. It can deal with the injection, while providing a more flexible and smooth development experience.

`sqlc` does a simple grammar check for you and generates the interfaces and the SQL code. You can use the interfaces to write the business logic, and the SQL code to write the database access code. Since the generated code are Golang interfaces, that means you can use `gomock` to mock the database access code in unit tests. No more Postgres in docker container for the unit test which is supposed to be a lightweight white box. 

Let's take a look at the code it generates:

```go
type CreateUserParams struct {
	CountryCode string
	PhoneNumber string
}

func (q *Queries) CreateUser(ctx context.Context, arg CreateUserParams) (*User, error) {
	row := q.db.QueryRow(ctx, createUser, arg.CountryCode, arg.PhoneNumber)
	var i User
	err := row.Scan(
		&i.ID,
		&i.Username,
		&i.Password,
		&i.Email,
		&i.CreatedAt,
		&i.UpdatedAt,
		&i.CountryCode,
		&i.PhoneNumber,
	)
	return &i, err
}
```

You can see that the `CreateUser` method is generated with the `CreateUserParams` struct. You can use the `CreateUser` method in the business logic. No db connection and no SQL (or SQL wrapper) in the business logic. 

Then you can make it an interface:

```go
type ModelInterface interface {
	querier.Querier
	RunTransaction(ctx context.Context, f func(model ModelInterface) error) error
	InTransaction() bool
}
```

This allows you to decouple the business logic from the database access code. And you can use `gomock` to mock the database access code in the unit tests. We will talk about it later in this article.


## Dependency Injection

If you are a big fan of mocking and testing, then you will have a lot of interfaces in your code. In that case, you need to inject the implementation of the interfaces into the business logic. [wire](https://github.com/google/wire) is a good choice. What you need to do is writing constructors for the implementations and the business logic, and then `wire` will sort out the dependency graph, and generates a bulletproof initialization code for you.

For instance, you have the following components in your code:

```go
func NewConfig() *Config

func NewModel(cfg *config.Config) (model.ModelInterface, error)  

func NewCloudService(cfg *config.Config, model model.ModelInterface) (service.CloudInterface, error)

func NewTradeService(cfg *config.Config, model model.ModelInterface) (service.TradeInterface, error)

func NewController(cloud service.CloudInterface, trade service.TradeInterface) (controller.ControllerInterface, error)

func NewServer(cfg *config.Config, controller controller.ControllerInterface) *Server
```

To initialize the `Server`, you can just put the constructors in the `wire.go` file:

```go
func InitializeServer() (*Server, error) {
    wire.Build(
        NewConfig,
        NewModel,
        NewCloudService,
        NewTradeService,
        NewController,
        NewServer,
    )
    return &Server{}, nil
}
```

Then run `wire` to generate the initialization code. No need to handle the complex dependency graph by yourself. A single initialize function is not difficult to write. But when the development goes on, the dependency graph is changing and the initialization code is getting more and more complex. You don't need to review and rewrite the dependency graph everytime you change it, `wire` can save you a lot of time.


## Test Framework

Just use [gomock](https://github.com/uber-go/mock). It's powerful and easy to use. That's where you can get the most benefit from the interfaces. 
Remember the `ModelInterface` in the previous section? You can use `gomock` to mock the database access code in the unit tests. 

```go
func TestSignInService(t *testing.T) {
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()

    mockModel := model.NewMockModelInterface(ctrl)
    mockModel.
        EXPECT().
        CreateUser(gomock.Any(), querier.CreateUserParams{
            CountryCode: "+86",
	        PhoneNumber: "123456", 
        }).
        Return(&querier.User{
            ID: uuid.New(),
        }, nil)
    
    service := NewSignInService(mockModel)
    user, err := service.SignIn(context.Background(), "+86", "123456")
    ...
}
```

Here, we are testing the `SignIn` method in the `SignInService`. We mock the `CreateUser` method in the `ModelInterface` and return a fake user. Then we can test the `SignIn` method with the fake user without touching the database. `gomock` can also help you to check if the method is called with the correct parameters.

## Development Environment

Docker-compose can help you to set up a development environment where all your WSL and Mac co-workers can work with. 

Let's have a Dockerfile for our dev container at first.

```Dockerfile
FROM XXX

WORKDIR /app

COPY --from=golang:1.22-alpine /usr/local/go/ /usr/local/go/
 
ENV PATH="/usr/local/go/bin:${PATH}"

ENTRYPOINT []

```

You may wonder why using `COPY --from=golang:1.22-alpine` instead of `FROM golang:1.22-alpine`. Well, you can do that. But if you want to use other image like `jrottenberg/ffmpeg:4.4-alpine` while Golang is also needed, just use the `COPY --from` syntax to get the Golang binary. 

Since containers are nothing but a Linux process, it can be lightweight and fast. You can do "Hot Reload" with `docker-compose`.

```yaml
version: "3.9"
services:
  dev:
    build: 
      dockerfile: ./Dockerfile.dev
    ports:
      - "8000:8000"
    command:
    - go
    - run
    - cmd/main.go
    environment:
      XICFG_PORT: 8000
    volumes:
      - ./:/app
      - dev-go-data:/root/go/pkg/mod
      - dev-go-build-data:/root/.cache/go-build
  db: 
    image: "postgres:latest"
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: postgres
    volumes:
      - db-data:/var/lib/postgresql/data
volumes:
  db-data:
  dev-go-data:
  dev-go-build-data:
```

Here, we mount the go cache to the docker volumes so that everytime the container is restarted, the go cache is still there. The development experience is just like developing on your local machine. You might also have some external services like Postgres, just put them in the docker-compose as well.

With this setup, you can run `docker-compose restart dev` to restart your dev container. I also bind the command to the `Ctrl + S`, so that everytime I save the code, 
the dev container will restart and the code will be recompiled. Since in web development, the states are stored in the database, so it is sort of a hot reload.
