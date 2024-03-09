# Sqlc model layer with transaction

To generate mocking module for the model layer using sqlc and transaction, 
we can use interface to bind all methods of querier to the model. 
The generated mocking model can also assert if the `RunTransaction` is called.

```go
package model

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pkg/errors"
	"github.com/xich-dev/backbone/pkg/config"
	"github.com/xich-dev/backbone/pkg/model/querier"
)

var (
	ErrAlreadyInTransaction = errors.New("already in transaction")
)

type ModelInterface interface {
	querier.Querier
	RunTransaction(ctx context.Context, f func(model ModelInterface) error) error
}

type Model struct {
	querier.Querier
	beginTx func(ctx context.Context) (pgx.Tx, error)
}

func (m *Model) RunTransaction(ctx context.Context, f func(model ModelInterface) error) error {
	tx, err := m.beginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if err := f(
		&Model{
			Querier: querier.New(tx),
			beginTx: func(ctx context.Context) (pgx.Tx, error) {
				return nil, ErrAlreadyInTransaction
			},
		},
	); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func NewModel(cfg *config.Config) (ModelInterface, error) {
	dsn := fmt.Sprintf(`host=%s user=%s password=%s dbname=%s port=%d connect_timeout=15 TimeZone=Asia/Shanghai`,
		cfg.Pg.Host,
		cfg.Pg.User,
		cfg.Pg.Password,
		cfg.Pg.Db,
		cfg.Pg.Port,
	)
	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to parse pgxpool config: %s", dsn)
	}

	ctx, cancel := context.WithTimeout(context.TODO(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, errors.Wrap(err, "failed to init pgxpool")
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, errors.Wrap(err, "failed to ping db")
	}

	return &Model{Querier: querier.New(pool), beginTx: pool.Begin}, nil
}

```