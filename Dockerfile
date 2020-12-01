FROM  node:10.15-alpine
WORKDIR /bingo
COPY . /bingo
RUN npm install && npm run buildDev
EXPOSE 8080

