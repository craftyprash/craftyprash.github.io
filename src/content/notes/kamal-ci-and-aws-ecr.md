---
title: Kamal CI and AWS ECR
date: 2024-03-01T00:00:00.000Z
tags:
  - kamal
  - ci
  - aws
description: Setting up Kamal with AWS ECR
---
# Kamal Config

![Drawing 2026-03-01 16.50.36](/images/drawing-2026-03-01-16-50-36.png)

This is the common settings such as service and image names, registry, ssh user, and secrets that are keys required for the service. It also includes builder section.

config/deploy.yml
```yaml
service: <%= ENV.fetch("KAMAL_SERVICE", "lendz-central") %>
image: lendz-central

registry:
  server: 166000650019.dkr.ecr.ap-south-1.amazonaws.com

ssh:
  user: operations

env:
  secret:
    # Database
    - DB_USERNAME
    - DB_PASSWORD

builder:
  arch: arm64
  secrets:
    - MAVEN_USERNAME
    - MAVEN_PASSWORD
```

In test or staging we can have this as a destination with specific server and ECR reference, along with any proxy settings. Here, the healthcheck is specific to the application. Labels are for docker metadata.

config/deploy.staging.yml
```yaml
registry:
  server: 166000650019.dkr.ecr.ap-south-1.amazonaws.com
  username: AWS
  password: <%= %x(aws ecr get-login-password --region ap-south-1).strip %>

servers:
  web:
    - test-server

proxy:
   ssl: false
   hosts:
     - apiz.test.mintifi.com
     - apiz.int.test.mintifi.com
   path_prefix: <%= ENV.fetch("KAMAL_PATH_PREFIX", "/central") %>
   response_timeout: 60
   app_port: 8080
   healthcheck:
     path: /q/health/live
     interval: 5
     timeout: 5

env:
  clear:
    QUARKUS_PROFILE: staging
    SCHEDULER_ENABLED: "false"

# Add labels for tracking deployment metadata
labels:
  app: lendz-central
  env: staging
```

For production we can pick named servers and have its own proxy settings (DNS) along with any env overrides per server if desired.

config/deploy.production.yml
```yaml
registry:
  server: 166000650019.dkr.ecr.ap-south-1.amazonaws.com
  username: AWS
  password: <%= %x(aws ecr get-login-password --region ap-south-1).strip %>
  
servers:
  web:
    - blue: blue-server
    - red: red-server

proxy:
  ssl: false
  hosts:
    - apiz.mintifi.com
    - apiz.int.mintifi.com
  path_prefix: /central
  response_timeout: 60
  app_port: 8080
  healthcheck:
    path: /q/health/live
    interval: 5
    timeout: 5

env:
  clear:
    QUARKUS_PROFILE: production

  tags:
    blue-server:
      clear:
        SCHEDULER_ENABLED: "true"
    red-server:
      clear:
        SCHEDULER_ENABLED: "false"

# Add labels for tracking deployment metadata
labels:
  app: lendz-central
  env: production
```

The DR site is same as production, but mainly the servers are different.

config/deploy.dr.yml
```yaml
registry:
  server: 166000650019.dkr.ecr.ap-south-2.amazonaws.com
  username: AWS
  password: <%= %x(aws ecr get-login-password --region ap-south-2).strip %>
  
servers:
  web:
    - black: black-server
    - gray: gray-server

proxy:
  ssl: false
  hosts:
    - apiz.mintifi.com
    - apiz.int.mintifi.com
  path_prefix: /central
  response_timeout: 60
  app_port: 8080
  healthcheck:
    path: /q/health/live
    interval: 5
    timeout: 5

env:
  clear:
    QUARKUS_PROFILE: production

  tags:
    black-server:
      clear:
        SCHEDULER_ENABLED: "true"
    gray-server:
      clear:
        SCHEDULER_ENABLED: "false"

# Add labels for tracking deployment metadata
labels:
  app: lendz-central
  env: dr
```

### Maven and Docker
For Dockerfile its important to use --mount=type=secret when passing any builder secrets.

Dockerfile
```Dockerfile
# Stage 1: Build stage with Maven
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build

# Create Maven settings.xml with credentials from secrets
RUN --mount=type=secret,id=MAVEN_USERNAME \
    --mount=type=secret,id=MAVEN_PASSWORD \
    mkdir -p /root/.m2 && \
    printf '%s\n' \
    '<settings>' \
    '  <servers>' \
    '    <server>' \
    '      <id>forgejo</id>' \
    "      <username>$(cat /run/secrets/MAVEN_USERNAME)</username>" \
    "      <password>$(cat /run/secrets/MAVEN_PASSWORD)</password>" \
    '    </server>' \
    '    <server>' \
    '      <id>forgejo-snapshots</id>' \
    "      <username>$(cat /run/secrets/MAVEN_USERNAME)</username>" \
    "      <password>$(cat /run/secrets/MAVEN_PASSWORD)</password>" \
    '    </server>' \
    '  </servers>' \
    '  <activeProfiles>' \
    '    <activeProfile>forgejo</activeProfile>' \
    '  </activeProfiles>' \
    '  <profiles>' \
    '    <profile>' \
    '      <id>forgejo</id>' \
    '      <repositories>' \
    '        <repository>' \
    '          <id>central</id>' \
    '          <url>https://repo1.maven.org/maven2</url>' \
    '        </repository>' \
    '        <repository>' \
    '          <id>forgejo</id>' \
    '          <url>https://forgejo.mintifi.com/api/packages/mintifi-tech/maven</url>' \
    '          <snapshots>' \
    '            <enabled>true</enabled>' \
    '          </snapshots>' \
    '        </repository>' \
    '      </repositories>' \
    '    </profile>' \
    '  </profiles>' \
    '</settings>' \
    > /root/.m2/settings.xml

# Copy pom.xml first for better layer caching
COPY pom.xml .

# Download dependencies with cache mount
RUN --mount=type=cache,target=/root/.m2/repository \
    mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build with cache mount
RUN --mount=type=cache,target=/root/.m2/repository \
    mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM 166000650019.dkr.ecr.ap-south-1.amazonaws.com/lendz-base:latest

USER root

# Copy the built application from builder stage
COPY --from=builder --chown=185 /build/target/quarkus-app/lib/ /deployments/lib/
COPY --from=builder --chown=185 /build/target/quarkus-app/*.jar /deployments/
COPY --from=builder --chown=185 /build/target/quarkus-app/app/ /deployments/app/
COPY --from=builder --chown=185 /build/target/quarkus-app/quarkus/ /deployments/quarkus/

# Create the directory and set the ownership
RUN mkdir -p /opt/upload && chown -R 185:185 /opt/upload

EXPOSE 8080
USER 185

ENV JAVA_OPTS_APPEND="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"
ENV JAVA_APP_JAR="/deployments/quarkus-run.jar"

ENTRYPOINT [ "sh", "-c", "java $JAVA_OPTS $JAVA_OPTS_APPEND -jar $JAVA_APP_JAR" ]
```

### Forgejo CI

.github/workflows/deploy-staging.yml
```yaml
name: Deploy to Staging
on:
  workflow_dispatch:
    inputs:
      deployment_type:
        description: "Deploy from branch or tag"
        required: true
        type: choice
        options:
          - branch
          - tag
      ref:
        description: "Branch name (feature/foo, main) OR tag (v1.2.3, v1.2.3-rc.1)"
        required: true
        type: string
      use_dynamic_service:
        description: "Create separate service for feature/hotfix branches"
        required: false
        type: boolean
        default: false

jobs:
  deploy:
    runs-on: [test,kamal]
    environment: staging
    steps:
      - name: Derive service & path
        shell: bash
        run: |
          # Use Forgejo/GitHub built-in env var
          REF="${{ github.ref_name }}"
          SERVICE="lendz-central"
          PATH_PREFIX="/central"

          if [ "${{ inputs.use_dynamic_service }}" == "true" ](/notes/inputs-use-dynamic-service-true) && [| "$REF" == hotfix/* ](/notes/ref-feature); then
            TYPE="${REF%%/*}"           # Extracts 'feature' or 'hotfix'
            SAFE_REF="${REF#*/}"        # Strips the prefix
            # Sanitize for Docker/Kamal (lowercase, replace / and _ with -)
            SAFE_REF="${SAFE_REF//\//-}"
            SAFE_REF="${SAFE_REF//_/-}"
            SAFE_REF="${SAFE_REF// /}"
             
            SERVICE="lendz-central-${TYPE}-${SAFE_REF}"
            PATH_PREFIX="/central-${TYPE}-${SAFE_REF}"
          fi

          echo "Kamal service: $SERVICE"
          echo "Path prefix: $PATH_PREFIX"
          echo "KAMAL_SERVICE=$SERVICE" >> $GITHUB_ENV
          echo "KAMAL_PATH_PREFIX=$PATH_PREFIX" >> $GITHUB_ENV

          # Kamal looks for 'VERSION'. 
          # Using the short SHA (7 chars) makes the container name readable.
          SHORT_SHA="${GITHUB_SHA::7}"
          echo "VERSION=$SHORT_SHA" >> $GITHUB_ENV

      - name: "🚀 Deploying to Staging"
        run: |
          echo "Deploying ${{ inputs.ref }} as ${{ inputs.deployment_type }} to staging environment"

      - name: Checkout repository (default)
        uses: actions/checkout@v4

      - name: Validate staging input
        run: |
          set -e

          if [ "${{ inputs.deployment_type }}" = "tag" ]; then
            TAG="${{ inputs.ref }}"

            # Relaxed semver: allow prerelease
            if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-.+)?$ ]]; then
              echo "❌ Invalid tag format for staging: ${TAG}"
              exit 1
            fi

            git fetch --tags

            if ! git tag -l | grep -q "^${TAG}$"; then
              echo "❌ Tag ${TAG} does not exist"
              exit 1
            fi

            TAG_COMMIT_SHORT=$(git rev-parse --short "$TAG")
            echo "✅ Tag ${TAG} exists at commit ${TAG_COMMIT_SHORT}"
          fi

      - name: Checkout requested ref
        uses: actions/checkout@v4
        with:
          ref: ${{ inputs.ref }}
            
      - name: Prepare Kamal secrets (staging)
        run: |
          mkdir -p .kamal
          cat <<EOF > .kamal/secrets.staging
          # Maven build-time credentials
          MAVEN_USERNAME=${{ github.repository_owner }}
          MAVEN_PASSWORD=${{ secrets.REGISTRY_TOKEN }}
          
          # Database
          DB_USERNAME=${{ secrets.DB_USERNAME }}
          DB_PASSWORD=${{ secrets.DB_PASSWORD }}
          EOF
          
      - name: Deploy to Staging via Kamal
        shell: bash
        run: |
          echo "🚀 Deploying ${{ inputs.ref }} to staging"
          kamal lock release -d staging || true
          kamal deploy -d staging

      - name: Cleanup secrets
        if: always()
        run: |
          rm -f .kamal/secrets.*
```

.github/workflows/deploy-production.yml
```yaml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      deployment_type:
        description: "Deploy from main or semantic tag (v1.0.0)"
        required: true
        type: choice
        options:
          - main
          - tag
      ref:
        description: "main OR semantic tag (v1.2.3)"
        required: true
        type: string
      deploy_dr:
        description: "Also deploy to DR"
        required: false
        type: boolean
        default: false

jobs:
  deploy:
    runs-on: [kamal,prod]
    environment: production

    steps:
      - name: Checkout repository (default)
        uses: actions/checkout@v4

      - name: Validate production rules
        run: |
          set -e

          if [ "${{ inputs.deployment_type }}" = "main" ]; then
            if [ "${{ inputs.ref }}" != "main" ]; then
              echo "❌ Production branch deploy must be exactly 'main'"
              exit 1
            fi
            echo "✅ Production deploy from main branch"
          fi

          if [ "${{ inputs.deployment_type }}" = "tag" ]; then
            TAG="${{ inputs.ref }}"

            echo "🔎 Validating production tag ${TAG}"

            # Strict semantic versioning
            if ! [[ "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
              echo "❌ Production tags must be strict semver (v1.2.3)"
              exit 1
            fi

            # Ensure tags are available
            git fetch --tags

            # Verify tag exists
            if ! git tag -l | grep -q "^${TAG}$"; then
              echo "❌ Tag ${TAG} does not exist"
              exit 1
            fi

            TAG_COMMIT=$(git rev-list -n 1 "$TAG")
            TAG_COMMIT_SHORT=$(git rev-parse --short "$TAG_COMMIT")

            echo "✅ Tag ${TAG} exists at commit ${TAG_COMMIT_SHORT}"
          fi

      - name: Checkout correct ref
        uses: actions/checkout@v4
        with:
          ref: ${{ inputs.ref }}

      - name: Prepare Kamal secrets
        run: |
          mkdir -p .kamal
          cat <<EOF > .kamal/secrets.production
          # Maven build-time credentials
          MAVEN_USERNAME=${{ github.repository_owner }}
          MAVEN_PASSWORD=${{ secrets.REGISTRY_TOKEN }}
          
          # Database
          DB_USERNAME=${{ secrets.PROD_DB_USERNAME }}
          DB_PASSWORD=${{ secrets.PROD_DB_PASSWORD }}
          EOF
          
          if [ "${{ inputs.deploy_dr }}" = "true" ]; then
            cp .kamal/secrets.production .kamal/secrets.dr
          fi

      - name: Deploy to Production via Kamal
        run: |
          REF="${{ inputs.ref }}"
          # Sanitize for Docker/Kamal (lowercase, replace invalid chars with -)
          SAFE_REF="${REF//\//-}"
          SAFE_REF="${SAFE_REF//_/-}"
          SAFE_REF="${SAFE_REF// /}"
          SAFE_REF="${SAFE_REF,,}"

          if [ "${{ inputs.deployment_type }}" = "main" ]; then
            SHORT_SHA="${GITHUB_SHA::7}"
            VERSION="main-${SHORT_SHA}"
          else
            VERSION="${SAFE_REF#v}"
          fi
          export VERSION
          echo "VERSION=${VERSION}" >> $GITHUB_ENV

          echo "🚀 Deploying version ${VERSION} to production"
          kamal lock release -d production || true
          kamal deploy -d production

      - name: Deploy to DR
        if: success() && inputs.deploy_dr
        continue-on-error: true
        run: |
          set -e

          ATTEMPTS=3
          INITIAL_DELAY=30
          RETRY_DELAY=60

          echo "⏳ Waiting ${INITIAL_DELAY}s before first DR deploy attempt..."
          sleep $INITIAL_DELAY

          for i in $(seq 1 $ATTEMPTS); do
            echo "🟡 DR deploy attempt ${i}/${ATTEMPTS} using VERSION=${VERSION}"

            kamal lock release -d dr || true
            if kamal deploy -d dr --skip-push; then
              echo "✅ DR deploy succeeded"
              exit 0
            fi

            if [ "$i" -lt "$ATTEMPTS" ]; then
              echo "⏳ DR deploy failed, retrying in ${RETRY_DELAY}s..."
              sleep $RETRY_DELAY
            fi
          done

          echo "❌ DR deploy failed after ${ATTEMPTS} attempts"
          exit 1


      - name: Cleanup secrets
        if: always()
        run: |
          rm -f .kamal/secrets.*
```

.github/workflows/deploy-dr.yml
```yaml
name: Deploy to DR

on:
  workflow_dispatch:
    inputs:
      deployment_type:
        description: "Deploy from main or semantic tag (v1.0.0)"
        required: true
        type: choice
        options:
          - main
          - tag
      ref:
        description: "main OR semantic tag (v1.2.3)"
        required: true
        type: string

jobs:
  deploy:
    runs-on: [kamal,prod]
    environment: production

    steps:
      - name: Checkout repository (default)
        uses: actions/checkout@v4

      - name: Validate production rules
        run: |
          set -e

          if [ "${{ inputs.deployment_type }}" = "main" ]; then
            if [ "${{ inputs.ref }}" != "main" ]; then
              echo "❌ Production branch deploy must be exactly 'main'"
              exit 1
            fi
            echo "✅ Production deploy from main branch"
          fi

          if [ "${{ inputs.deployment_type }}" = "tag" ]; then
            TAG="${{ inputs.ref }}"

            echo "🔎 Validating production tag ${TAG}"

            # Strict semantic versioning
            if ! [[ "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
              echo "❌ Production tags must be strict semver (v1.2.3)"
              exit 1
            fi

            # Ensure tags are available
            git fetch --tags

            # Verify tag exists
            if ! git tag -l | grep -q "^${TAG}$"; then
              echo "❌ Tag ${TAG} does not exist"
              exit 1
            fi

            TAG_COMMIT=$(git rev-list -n 1 "$TAG")
            TAG_COMMIT_SHORT=$(git rev-parse --short "$TAG_COMMIT")

            echo "✅ Tag ${TAG} exists at commit ${TAG_COMMIT_SHORT}"
          fi

      - name: Checkout correct ref
        uses: actions/checkout@v4
        with:
          ref: ${{ inputs.ref }}

      - name: Prepare Kamal secrets
        run: |
          mkdir -p .kamal
          cat <<EOF > .kamal/secrets.dr
          # Maven build-time credentials
          MAVEN_USERNAME=${{ github.repository_owner }}
          MAVEN_PASSWORD=${{ secrets.REGISTRY_TOKEN }}
          
          # Database
          DB_USERNAME=${{ secrets.PROD_DB_USERNAME }}
          DB_PASSWORD=${{ secrets.PROD_DB_PASSWORD }}
          EOF

      - name: Deploy to DR via Kamal
        run: |
          REF="${{ inputs.ref }}"
          # Sanitize for Docker/Kamal (lowercase, replace invalid chars with -)
          SAFE_REF="${REF//\//-}"
          SAFE_REF="${SAFE_REF//_/-}"
          SAFE_REF="${SAFE_REF// /}"
          SAFE_REF="${SAFE_REF,,}"

          if [ "${{ inputs.deployment_type }}" = "main" ]; then
            SHORT_SHA="${GITHUB_SHA::7}"
            VERSION="main-${SHORT_SHA}"
          else
            VERSION="${SAFE_REF#v}"
          fi
          export VERSION
          echo "VERSION=${VERSION}" >> $GITHUB_ENV

          echo "🚀 Deploying version ${VERSION} to DR"
          kamal lock release -d dr || true
          kamal deploy -d dr

      - name: Cleanup secrets
        if: always()
        run: |
          rm -f .kamal/secrets.*
```

.github/workflows/rollback-production.yml
```yaml
name: Rollback Production

on:
  workflow_dispatch:
    inputs:
      rollback_type:
        description: "Rollback method"
        required: true
        type: choice
        options:
          - previous
          - specific_version
      version:
        description: "Specific version (only if rollback_type is specific_version)"
        required: false
        type: string
      rollback_dr:
        description: "Also rollback DR"
        required: false
        type: boolean
        default: false

env:
  AWS_REGION: ap-south-1
  ECR_REGISTRY: 166000650019.dkr.ecr.ap-south-1.amazonaws.com
  SERVICE_NAME: lendz-central

jobs:
  rollback:
    runs-on: [kamal,prod]
    environment: production

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Validate rollback inputs
        run: |
          if [ "${{ inputs.rollback_type }}" = "specific_version" ] && [ -z "${{ inputs.version }}" ]; then
            echo "❌ Version required for specific_version rollback"
            exit 1
          fi

      - name: Login to ECR
        run: |
          aws ecr get-login-password --region $AWS_REGION | \
            docker login --username AWS \
            --password-stdin $ECR_REGISTRY

      - name: Validate image exists in registry
        if: inputs.rollback_type == 'specific_version'
        run: |
          VERSION="${{ inputs.version }}"
          IMAGE_URI="$ECR_REGISTRY/$SERVICE_NAME:$VERSION"
          
          echo "🔍 Checking if image exists: $IMAGE_URI"
          
          if aws ecr describe-images \
            --repository-name $SERVICE_NAME \
            --image-ids imageTag=$VERSION \
            --region $AWS_REGION >/dev/null 2>&1; then
            echo "✅ Image $IMAGE_URI exists in registry"
          else
            echo "❌ Image $IMAGE_URI not found in registry"
            echo "Available tags:"
            aws ecr describe-images \
              --repository-name $SERVICE_NAME \
              --region $AWS_REGION \
              --query 'imageDetails[*].imageTags[0]' \
              --output table || echo "No images found"
            exit 1
          fi

      - name: Prepare Kamal secrets
        run: |
          mkdir -p .kamal
          cat <<EOF > .kamal/secrets.production
          # Maven build-time credentials
          MAVEN_USERNAME=${{ github.repository_owner }}
          MAVEN_PASSWORD=${{ secrets.REGISTRY_TOKEN }}
          
          # Database
          DB_USERNAME=${{ secrets.PROD_DB_USERNAME }}
          DB_PASSWORD=${{ secrets.PROD_DB_PASSWORD }}
          EOF
          
          if [ "${{ inputs.rollback_dr }}" = "true" ]; then
            cp .kamal/secrets.production .kamal/secrets.dr
          fi

      - name: Rollback Production
        run: |
          if [ "${{ inputs.rollback_type }}" = "previous" ]; then
            echo "🔄 Rolling back to previous version"
            kamal rollback -d production
          else
            VERSION="${{ inputs.version }}"
            echo "🔄 Rolling back to version ${VERSION}"
            VERSION=${VERSION} kamal rollback -d production
          fi

      - name: Rollback DR
        if: success() && inputs.rollback_dr
        continue-on-error: true
        run: |
          if [ "${{ inputs.rollback_type }}" = "previous" ]; then
            kamal rollback -d dr
          else
            VERSION="${{ inputs.version }}"
            VERSION=${VERSION} kamal rollback -d dr
          fi

      - name: Cleanup secrets
        if: always()
        run: |
          rm -f .kamal/secrets.*
```

.github/workflows/update-env-staging.yml
```yaml
name: Update Environment Variables - Staging

on:
  workflow_dispatch:
    inputs:
      service_name:
        description: "Service name (lendz-central or feature/hotfix variant)"
        required: true
        type: string
        default: "lendz-central"

jobs:
  update-env:
    runs-on: [test,kamal]
    environment: staging

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Prepare Kamal secrets
        run: |
          mkdir -p .kamal
          cat <<EOF > .kamal/secrets.staging
          # Maven build-time credentials
          MAVEN_USERNAME=${{ github.repository_owner }}
          MAVEN_PASSWORD=${{ secrets.REGISTRY_TOKEN }}
          
          # Database
          DB_USERNAME=${{ secrets.DB_USERNAME }}
          DB_PASSWORD=${{ secrets.DB_PASSWORD }}
          EOF

      - name: Update environment variables
        run: |
          export KAMAL_SERVICE="${{ inputs.service_name }}"
          echo "🔄 Updating env vars for service: ${KAMAL_SERVICE}"
          kamal env push -d staging

      - name: Restart containers with new env
        run: |
          export KAMAL_SERVICE="${{ inputs.service_name }}"
          kamal app restart -d staging

      - name: Cleanup secrets
        if: always()
        run: |
          rm -f .kamal/secrets.*
```

.github/workflows/update-env-production.yml
```yaml
name: Update Environment Variables

on:
  workflow_dispatch:
    inputs:
      target_hosts:
        description: "Target hosts (all, red, blue)"
        required: true
        type: choice
        options:
          - all
          - red
          - blue

jobs:
  update-env:
    runs-on: [kamal,prod]
    environment: production

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Prepare Kamal secrets
        run: |
          mkdir -p .kamal
          cat <<EOF > .kamal/secrets.production
          # Maven build-time credentials
          MAVEN_USERNAME=${{ github.repository_owner }}
          MAVEN_PASSWORD=${{ secrets.REGISTRY_TOKEN }}
          
          # Database
          DB_USERNAME=${{ secrets.PROD_DB_USERNAME }}
          DB_PASSWORD=${{ secrets.PROD_DB_PASSWORD }}
          EOF

      - name: Update environment variables
        run: |
          if [ "${{ inputs.target_hosts }}" = "all" ]; then
            echo "🔄 Updating env vars on all hosts"
            kamal env push -d production
          else
            echo "🔄 Updating env vars on ${{ inputs.target_hosts }}"
            kamal env push -d production --hosts ${{ inputs.target_hosts }}
          fi

      - name: Restart containers with new env
        run: |
          if [ "${{ inputs.target_hosts }}" = "all" ]; then
            kamal app restart -d production
          else
            kamal app restart -d production --hosts ${{ inputs.target_hosts }}
          fi

      - name: Cleanup secrets
        if: always()
        run: |
          rm -f .kamal/secrets.*
```

.github/workflows/update-env-dr.yml
```yaml
name: Update Environment Variables - DR

on:
  workflow_dispatch:
    inputs:
      target_hosts:
        description: "Target hosts (all, black, gray)"
        required: true
        type: choice
        options:
          - all
          - black
          - gray

jobs:
  update-env:
    runs-on: [kamal,prod]
    environment: production

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Prepare Kamal secrets
        run: |
          mkdir -p .kamal
          cat <<EOF > .kamal/secrets.dr
          # Maven build-time credentials
          MAVEN_USERNAME=${{ github.repository_owner }}
          MAVEN_PASSWORD=${{ secrets.REGISTRY_TOKEN }}
          
          # Database
          DB_USERNAME=${{ secrets.PROD_DB_USERNAME }}
          DB_PASSWORD=${{ secrets.PROD_DB_PASSWORD }}
          EOF

      - name: Update environment variables
        run: |
          if [ "${{ inputs.target_hosts }}" = "all" ]; then
            echo "🔄 Updating env vars on all DR hosts"
            kamal env push -d dr
          else
            echo "🔄 Updating env vars on ${{ inputs.target_hosts }}"
            kamal env push -d dr --hosts ${{ inputs.target_hosts }}
          fi

      - name: Restart containers with new env
        run: |
          if [ "${{ inputs.target_hosts }}" = "all" ]; then
            kamal app restart -d dr
          else
            kamal app restart -d dr --hosts ${{ inputs.target_hosts }}
          fi

      - name: Cleanup secrets
        if: always()
        run: |
          rm -f .kamal/secrets.*
```
