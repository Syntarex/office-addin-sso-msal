# Zeit365

## Prerequisites

### Installation

You need some software to build, develop or deploy this project.

- Azure CLI: [How to install](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- Turso CLI: [How to install](https://docs.turso.tech/cli/introduction)
- Node 18+: [Download](https://nodejs.org/en/download)
- pnpm: `npm install -g pnpm`
- Install dependencies: `pnpm install`

### Task Master

[Task Master](https://github.com/eyaltoledano/claude-task-master) can be used to develop with AI. Check out there docs on how to configure the MCP for your Editor of choice.

### Azure Subscription

This app is meant to be hosted in Azure. You need a Azure Subscription with the following resource providers registered:

- Microsoft.AAD
- Microsoft.ManagedIdentity
- Microsoft.Token
- Microsoft.Blueprint
- Microsoft.ResourceHealth
- Microsoft.Insights
- Microsoft.Monitor
- Microsoft.OperationalInsights
- Microsoft.Cdn
- Microsoft.ManagedNetwork
- Microsoft.Network
- Microsoft.ImportExport
- Microsoft.Storage
- Microsoft.StorageSync
- Microsoft.DomainRegistration
- Microsoft.Web

Also make sure you are at least `Contributer` in your Azure Subscription, so you got enough permissions to create/manage resources.

### Azure App Service

The app runs at a Azure App Service instance.

1. Login to azure and select your subscription: `az login`
2. Find your correct server location: `az account list-locations` (or just use `germanywestcentral`)
3. Create a resource group if neccessary: `az group create --name zeit365 --location <location>`
    - You may don't need a new resource group. It's a best practice to group all our machines in one resource group, so it's easier to manage them.
4. Create an app service plan if neccessary: `az appservice plan create --name zeit365-plan-<name> --resource-group zeit365 --sku B3 --is-linux`
    - You may don't need a new plan. It's possible to run multiple instances in one plan. A plan represents one machine.
    - Attention: This step will cost you money!
5. Create an app service: `az webapp create --name <name> --resource-group zeit365 --plan zeit365-plan-<name> --runtime 'NODE:22-lts'`
6. Check your app service is running: `az webapp show --name <name> --resource-group zeit365`

### Azure DevOps

The app's code is saved in an Azure DevOps repository. That way we can use all capabilities of Azure Pipelines.

To allow the Azure Pipeline to deploy the app, you need to add a service connection targeting your Azure Subscription.

### Turso

The app uses [`@astro/db`](https://docs.astro.build/en/guides/astro-db/) which is a ORM for sqlite databases.

We recommend hosting your database at [`turso`](https://turso.tech). Astro provides first-party support and the free tier is pretty generous.

Make sure you have a database group setup. The app will deploy its database to it:

1. Authenticate: `turso auth login`
2. Create the database group: `turso group create zeit365 --wait`
3. Create an api token: `turso auth api-tokens mint <name>`
4. Take a note of the token, you will need it later as environment variable.

This repository provides an easy-to-use helper script to create a database: `pnpm run dev:turso`

## How to deploy

### Using CLI

It's not recommended to deploy manually but for testing or development purposes it might be required.

1. Sync your local `/.env`-file with the app service settings: `az webapp config appsettings set --resource-group zeit365 --name <name> --settings $(grep -v '^#' .env | xargs)`
2. Zip files for deployment: `zip -r ./deploy.zip ./db ./public ./src ./astro.config.mjs ./package.json ./tsconfig.json ./db.config.ts`
3. Deploy to app service: `az webapp deploy --resource-group zeit365 --name <name> --type zip --src-path ./deploy.zip --clean`
    - The installation of npm packages is taking so long, that your cli might run into a timeout.
    - You can check the deployment logs within the Azure Portal.

### Using Azure Pipeline

This is the default deployment method of this app. The pipeline is built in a way that you can deploy for one tenant each. Run the pipeline and pass the tenant id as parameter.

Make sure you created the following before running the pipeline:

- A variable group called `_common` (Azure DevOps)
- A variable group the tenant's id as name (Azure DevOps)
- An environment with the tenant's id as name (Azure DevOps)
- The resource group to deploy to (Azure Portal)
- The app service to deploy to (Azure Portal)

The variable groups are used to manage environment variables for each tenant. The `_common` variable group is shared between all deployments. Variables within a tenant's variable group will override a variable within the `_common` variable group.

Make sure you set all environment variables before running the Azure Pipeline.

In addition to the environment variables the app needs to run, there are some that the pipeline uses to determinate how and where to deploy:
| Variable | Description | Example |
| ------------------------- | --------------------------------------------------------------------------------- | -------------------------------------- |
| AZURE_SUBSCRIPTION_ID | The unique identifier of your Azure Subscription where resources will be deployed | `123e4567-e89b-12d3-a456-426614174000` |
| AZURE_RESOURCE_GROUP_NAME | The name of the Azure Resource Group containing your application resources | `zeit365` |
| AZURE_APP_SERVICE_NAME | The name of the Azure App Service instance where the application is deployed | `zeit365-app-prod` |

TODO: Link environment variables headline

## How to develop

### Middleware

Due to the project structure being modular, middleware is primarily used to inject stuff into `Astro.locals`, so it's useable within dynamic routes (pages, endpoints and server islands).

- Your code lives in a module (e.g. `./src/analytics/middleware/report.middleware.ts`)
- Add your middleware to the sequence in [`src/middleware.ts`](./src/middleware.ts)
- Extend [`./src/env.d.ts`](./src/env.d.ts) by your module's data
- Prefer using the request's data over `context.locals` to make it more generic

## FAQs

### Why DaisyUI?

It's best to go with **DaisyUI**.
The Theme Engine allows us to make things look like Microsoft365 if we want to.
Due to the fact that components are css-only, it's very easy to use in astro and react components.
It's very close to web standards and it's framework agnostic (except tailwind).

|                     | shadcn/ui | DaisyUI | HyperUI | FluentUI (v9) | PrimeReact | Preline | Flowbite |
| ------------------- | --------- | ------- | ------- | ------------- | ---------- | ------- | -------- |
| Tailwind support    | 🟢        | 🟢      | 🟢      | 🟡            | 🟢         | 🟢      | 🟢       |
| Microsoft Style     | 🔴        | 🔴      | 🔴      | 🟢            | 🟢         | 🔴      | 🔴       |
| Theme Engine        | 🟢        | 🟢      | 🔴      | 🟢            | 🟢         | 🟢      | 🟢       |
| React components    | 🟢        | 🟡      | 🔴      | 🟢            | 🟢         | 🔴      | 🔴       |
| AI Generation       | 💰        | 🟢      | 🔴      | 🔴            | 🔴         | 🔴      | 🔴       |
| Ready-to-use blocks | 🟢        | 💰      | 🟢      | 🔴            | 💰         | 💰      | 💰       |
| Many components     | 🟢        | 🟢      | 🟢      | 🟡            | 🟢         | 🟢      | 🟢       |
| Charts              | 🟢        | 🔴      | 🔴      | 🔴            | 🟢         | 🟡      | 🟡       |
| Our Code            | 🟢        | 🟢      | 🟢      | 🔴            | 🔴         | 🟢      | 🟢       |
| Vanilla Components  | 🔴        | 🟢      | 🟢      | 🔴            | 🔴         | 🟡      | 🟡       |
