FROM  node:10.15-alpine
WORKDIR /bingo
COPY . :/bingo
RUN   npm install -D
CMD [ "npm run buildDev",  "npm start" ] 