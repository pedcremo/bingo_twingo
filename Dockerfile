FROM  node:10.15-alpine
WORKDIR /bingo
COPY . /bingo
RUN npm install 
EXPOSE 8080

