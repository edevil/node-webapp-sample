# node-webapp-sample

Experimental starter pack for Node.JS webapps

## TODO

1. Helm package
1. CD Cloud Build script `helm upgrade noder --namespace noder-develop noder --set image.tag=master_64043b960381a66740d9199ebf81c649d40e0797`
1. Accept X- headers (app.proxy = true)
1. stackdriver-friendly http context in request logs
1. File uploads
1. Websockets
1. TSLint, tslint-config-prettier ?
1. Include linter in CI
1. Global error handler
1. camelCase <-> snake_case

# Migrations

## Create migrations

    npm run typeorm -- migration:generate -n Initial

## Run migrations

    npm run typeorm -- migration:run

# Helm package

    noder/
