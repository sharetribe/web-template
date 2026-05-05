import { getProcess, getSupportedProcessesInfo, INQUIRY_PROCESS_NAME } from './transaction';

/**
 * Get the status category of a transaction based on its last transition and process.
 *
 * @param {string} processName - e.g. 'default-purchase'
 * @param {string} lastTransition - the lastTransition value from tx.attributes
 * @returns {'completed' | 'pending' | 'cancelled'}
 */
export const getStatusFromLastTransition = (processName, lastTransition) => {
  const process = getProcess(processName);
  if (!process) return 'pending';

  if (process.isCompleted(lastTransition)) return 'completed';
  if (process.isRefunded(lastTransition)) return 'cancelled';
  return 'pending';
};

/**
 * Get all transitions that lead to completed states across all payment processes.
 * Excludes inquiry process (no payment).
 */
export const getCompletedTransitions = () => {
  const transitions = [];
  getSupportedProcessesInfo().forEach(({ name }) => {
    if (name === INQUIRY_PROCESS_NAME) return;
    const process = getProcess(name);
    if (!process) return;
    const { graph } = process;
    Object.values(graph.states).forEach(stateNode => {
      if (!stateNode.on) return;
      Object.keys(stateNode.on).forEach(transition => {
        if (process.isCompleted(transition) && !transitions.includes(transition)) {
          transitions.push(transition);
        }
      });
    });
  });
  return transitions;
};

/**
 * Get all transitions that lead to pending (in-progress) states across all payment processes.
 * These are all transitions that are neither completed nor refunded.
 * Excludes inquiry process (no payment).
 */
export const getPendingTransitions = () => {
  const pendingTransitions = [];
  getSupportedProcessesInfo().forEach(({ name }) => {
    if (name === INQUIRY_PROCESS_NAME) return;
    const process = getProcess(name);
    if (!process) return;
    const { graph } = process;
    Object.values(graph.states).forEach(stateNode => {
      if (!stateNode.on) return;
      Object.keys(stateNode.on).forEach(transition => {
        if (
          !process.isCompleted(transition) &&
          !process.isRefunded(transition) &&
          !pendingTransitions.includes(transition)
        ) {
          pendingTransitions.push(transition);
        }
      });
    });
  });
  return pendingTransitions;
};

/**
 * Get all transitions that lead to refunded/cancelled states across all payment processes.
 * Excludes inquiry process (no payment).
 */
export const getRefundedTransitions = () => {
  const transitions = [];
  getSupportedProcessesInfo().forEach(({ name }) => {
    if (name === INQUIRY_PROCESS_NAME) return;
    const process = getProcess(name);
    if (!process) return;
    const { graph } = process;
    Object.values(graph.states).forEach(stateNode => {
      if (!stateNode.on) return;
      Object.keys(stateNode.on).forEach(transition => {
        if (process.isRefunded(transition) && !transitions.includes(transition)) {
          transitions.push(transition);
        }
      });
    });
  });
  return transitions;
};

/**
 * Build SDK-compatible query params from URL search string for filtered transaction queries.
 *
 * @param {Object} searchParams - parsed URL search params (e.g. { status, dateFrom, dateTo, page })
 * @param {Object} options
 * @param {string} options.only - 'sale' or 'order'
 * @returns {Object} params suitable for sdk.transactions.query()
 */
export const buildFilteredQueryParams = (searchParams, { only = 'sale' } = {}) => {
  const { status, dateFrom, dateTo, page = 1 } = searchParams;

  const params = { page: Number(page) };

  // Filter by status → map to lastTransitions
  if (status === 'completed') {
    params.lastTransitions = getCompletedTransitions();
  } else if (status === 'cancelled') {
    params.lastTransitions = getRefundedTransitions();
  } else if (status === 'pending') {
    params.lastTransitions = getPendingTransitions();
  }

  // Filter by date range
  if (dateFrom) {
    params.createdAtStart = new Date(dateFrom).toISOString();
  }
  if (dateTo) {
    // Set to end of day
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);
    params.createdAtEnd = endDate.toISOString();
  }

  return params;
};
