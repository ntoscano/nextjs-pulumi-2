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
  platform: "WEB",
  buildSpec: `version: 1
applications:
  - frontend:
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
      cache:
        paths:
          - .next/cache/**/*
          - node_modules/**/*
      buildPath: /
    appRoot: ""`,
  enableAutoBranchCreation: true,
  autoBranchCreationPatterns: ["main", "feat/*"],
  autoBranchCreationConfig: {
    framework: "Next.js - SSR",
    enableAutoBuild: true,
  },
  environmentVariables: {},
});

const main = new aws.amplify.Branch("main", {
  appId: website.id,
  branchName,
  displayName: "main",
  framework: "Next.js - SSR",
  stage: "PRODUCTION",
});
