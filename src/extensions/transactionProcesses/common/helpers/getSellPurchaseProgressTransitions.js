import {
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
} from '../../../../transactions/transaction';
import { MARK_MACHINE_PLACE_TRANSITION_NAME, MARK_MET_MANAGER_TRANSITION_NAME } from '../constants';

// Function to transform protectedData to pseudo-transition
export const getSellPurchaseProgressTransitions = txMetadata => {
  const { sellerMarkMachinePlaced, buyerMarkMetManager } = txMetadata || {};
  const progressTransitions = [];

  if (sellerMarkMachinePlaced) {
    progressTransitions.push({
      transition: MARK_MACHINE_PLACE_TRANSITION_NAME,
      messageTranslationId: MARK_MACHINE_PLACE_TRANSITION_NAME,
      createdAt: new Date(sellerMarkMachinePlaced),
      by: TX_TRANSITION_ACTOR_PROVIDER,
    });
  }

  if (buyerMarkMetManager) {
    progressTransitions.push({
      transition: MARK_MET_MANAGER_TRANSITION_NAME,
      messageTranslationId: MARK_MET_MANAGER_TRANSITION_NAME,
      createdAt: new Date(buyerMarkMetManager),
      by: TX_TRANSITION_ACTOR_CUSTOMER,
    });
  }

  return progressTransitions;
};
