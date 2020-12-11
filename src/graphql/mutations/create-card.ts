import { v4 as uuid } from "uuid";

import { getRepository } from "typeorm";
import { Card } from "../../entities/card";
import { CARD_ADDED, pubsub } from "../../initializers/graphql";
import { logger } from "../../logger";

export const createCardMutation = {
  async createCard(obj, { card: attrs }, context, info) {
    const repository = getRepository(Card);
    const card = {
      id: uuid(),
      ...attrs,
    };
    await repository.insert(card);
    pubsub
      .publish(CARD_ADDED, { cardAdded: card })
      .catch((err) => logger.error("Could not publish new card message", { err }));
    return card;
  },
};
