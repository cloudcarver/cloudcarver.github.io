## Create a Postgresql Databse
```bash
docker run -ti -d -p 5432:5432 -e POSTGRES_USER=mik -e POSTGRES_PASSWORD=123 -e POSTGRES_DB=dev --name test-pg postgres:14.1-alpine
```
