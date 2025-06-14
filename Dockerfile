FROM node:22-slim


# Create app directory
WORKDIR /usr/src/app

COPY dist ./dist/
COPY package*.json ./
COPY views ./views/

RUN mkdir ./image-debug

RUN npm install --omit=dev  && npm cache clean --force

EXPOSE 3000

# Run as non-root user ('node' is provided by node base image)
# https://docs.docker.com/scout/policy/#default-non-root-user
# https://www.docker.com/blog/understanding-the-docker-user-instruction/
# https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#non-root-user
USER node

# Onit launch command
CMD [ "node", "./dist/index.js" ]