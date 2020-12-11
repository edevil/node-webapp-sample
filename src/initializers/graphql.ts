import { ApolloError, ApolloServer, gql } from "apollo-server-koa";
import * as depthLimit from "graphql-depth-limit";
import { RedisPubSub } from "graphql-redis-subscriptions";
import * as jwt from "jsonwebtoken";
import { config } from "../config";
import { resolvers } from "../graphql/resolvers";
import { types } from "../graphql/types";
import { Mutation } from "../graphql/types/mutation";
import { Query } from "../graphql/types/query";
import { Subscription } from "../graphql/types/subscription";
import { logger } from "../logger";
import { getNewRedis } from "./redis";

const schemaDefinition = gql`
  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;

export const apolloServer: ApolloServer = new ApolloServer({
  context: ({ ctx, connection }) => {
    if (connection) {
      return { ctx: connection.context };
    }
    return { ctx };
  },
  formatError: (error) => {
    if (error instanceof ApolloError || error.originalError instanceof ApolloError) {
      return error;
    }

    let context: any = {
      gqlmessage: error.message,
    };

    if (error.source) {
      context = {
        ...context,
        query: error.source.body,
      };
    }

    if (error.originalError) {
      context = {
        ...context,
        exception_message: error.originalError.message,
        exception_stack: error.originalError.stack,
      };
    }
    logger.error("Problems executing graphql query", context);
    return error;
  },
  introspection: config.showPlayground,
  playground: config.showPlayground,
  resolvers,
  subscriptions: {
    onConnect: (connectionParams: any, websocket, context) => {
      const token = connectionParams.authToken;
      if (token) {
        let data;
        try {
          data = jwt.verify(token, config.appKeys[0]);
          return { userId: data.userId };
        } catch (err) {
          logger.debug("Could not validate token", { token });
        }
      }
      return {};
    },
  },
  typeDefs: [schemaDefinition, ...types, Query, Mutation, Subscription],
  uploads: {
    maxFileSize: config.gqlMaxFileSize,
    maxFiles: config.gqlMaxFiles,
  },
  validationRules: [depthLimit(config.gqlDepthLimit)],
});

export const graphqlInitializer = (app) => {
  apolloServer.applyMiddleware({ app, path: config.gqlPath, disableHealthCheck: true });
};

export const graphqlInstall = (server) => apolloServer.installSubscriptionHandlers(server);

export const pubsub = new RedisPubSub({
  publisher: getNewRedis(),
  subscriber: getNewRedis(),
});

export const shutdownSubscriptions = () => pubsub.close();

export const CARD_ADDED = "CARD_ADDED";
