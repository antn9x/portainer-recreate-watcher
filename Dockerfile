FROM node:16.13.1-alpine

# node app port
EXPOSE 3000

COPY build ./app/src
COPY docs ./app/docs

WORKDIR /app/

COPY package.json process.yml ./
# RUN ls -alh

# RUN yarn install
# RUN yarn global add pm2

ENV NODE_ENV=staging
ENV PORT=3000
ENV REDIS_URI=redis://host.docker.internal:6379
ENV JWT_SECRET=firjfufguewitghidsf
ENV DATABASE_URI=mongodb://host.docker.internal:27017/meta-cana
ENV TELEGRAM_ISLOG=false

CMD yarn deploy-cluster
