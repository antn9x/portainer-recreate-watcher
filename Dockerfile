FROM node:16.13.1-alpine

# node app port
EXPOSE 3000

WORKDIR /app/

COPY src ./src
COPY index.js ./index.js

COPY package.json process.yml ./
# RUN ls -alh

# RUN yarn install
# RUN yarn global add pm2

ENV NODE_ENV=staging
ENV PORT=3000

CMD yarn deploy-cluster
