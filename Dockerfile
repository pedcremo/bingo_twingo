FROM  node
COPY ./ ./app
WORKDIR /app
RUN npm install -g
EXPOSE 8080