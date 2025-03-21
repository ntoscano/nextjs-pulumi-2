import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const githubRepo = config.require("githubRepo");
const githubToken = config.requireSecret("githubToken");
const branchName = config.get("branchName") || "main";

const website = new aws.amplify.App("website", {
  name: pulumi.getProject(),
  repository: `https://github.com/${githubRepo}`,
  oauthToken: githubToken,
  platform: "WEB_COMPUTE",
  buildSpec: `version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - pnpm install
    build:
      commands:
        - pnpm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
      - '../public/**/*'
      - '../package.json'
      - '../pnpm-lock.yaml'
  cache:
    paths:
      - node_modules/**/*`,
  enableAutoBranchCreation: true,
  autoBranchCreationPatterns: ["main", "feat/*"],
  autoBranchCreationConfig: {
    framework: "Next.js - SSR",
    enableAutoBuild: true,
  },
  environmentVariables: {
    NODE_ENV: "production"
  },
});

const main = new aws.amplify.Branch("main", {
  appId: website.id,
  branchName,
  displayName: "main",
  framework: "Next.js - SSR",
  stage: "PRODUCTION",
});
