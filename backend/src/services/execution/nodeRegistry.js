const axios = require('axios');
const Jexl = require('jexl');
const env = require('../../config/environment');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getNodeType = (node) => String(node?.data?.nodeType || node?.type || '').toLowerCase();

const resolveValue = (value, payload, context) => {
  if (typeof value !== 'string') return value;

  return value.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expr) => {
    const path = expr.trim();
    if (path.startsWith('payload.')) {
      const keys = path.slice('payload.'.length).split('.');
      return keys.reduce((acc, key) => (acc == null ? '' : acc[key]), payload) ?? '';
    }
    if (path.startsWith('context.')) {
      const keys = path.slice('context.'.length).split('.');
      return keys.reduce((acc, key) => (acc == null ? '' : acc[key]), context) ?? '';
    }
    return '';
  });
};

const executeHttpNode = async (node, payload, context) => {
  const config = node?.data || {};
  const method = (config.method || 'GET').toUpperCase();
  const url = resolveValue(config.url || '', payload, context);
  const headers = config.headers && typeof config.headers === 'object' ? config.headers : {};
  const requestData = config.body && typeof config.body === 'object' ? config.body : undefined;

  if (!url) {
    throw new Error('HTTP Request node requires a URL');
  }

  const response = await axios({
    method,
    url,
    headers,
    data: requestData,
    timeout: env.http.requestTimeout,
    validateStatus: () => true,
  });

  const output = {
    status: response.status,
    headers: response.headers,
    data: response.data,
  };

  return { output, payload: response.data };
};

const executeConditionNode = async (node, payload, context) => {
  const config = node?.data || {};
  const expression = String(config.expression || 'true').trim();

  if (!expression) {
    return { output: { expression: 'true', result: true }, payload };
  }

  try {
    const evalResult = await Jexl.eval(expression, { payload, context });
    return { output: { expression, result: !!evalResult }, payload };
  } catch (err) {
    throw new Error(`Condition evaluation failed: ${err.message}`);
  }
};

const executeDelayNode = async (node, payload) => {
  const config = node?.data || {};
  const delayMs = Number(config.delayMs || config.ms || 1000);
  const clampedDelayMs = Math.max(0, Math.min(delayMs, 60000));
  await sleep(clampedDelayMs);
  return { output: { delayMs: clampedDelayMs }, payload };
};

const executeNotifyNode = async (node, payload, context) => {
  const config = node?.data || {};
  const provider = String(config.provider || config.channel || 'slack').toLowerCase();
  const webhookUrl = config.slackWebhookUrl || config.webhookUrl || config.url;
  const message = resolveValue(config.message || config.text || 'Workflow notification', payload, context);

  if (provider === 'slack') {
    if (!webhookUrl) {
      throw new Error('Slack notify node requires webhookUrl or slackWebhookUrl');
    }

    const response = await axios.post(webhookUrl, { text: message }, {
      timeout: env.slack.notifyTimeout,
      validateStatus: () => true,
    });

    if (response.status >= 400) {
      throw new Error(`Slack notification failed with status ${response.status}`);
    }

    return { output: { provider: 'slack', sent: true, status: response.status, message }, payload };
  }

  throw new Error(`Unsupported notify provider: ${provider}`);
};

const executeNode = async (node, payload, context) => {
  const type = getNodeType(node);

  if (type.includes('http')) return executeHttpNode(node, payload, context);
  if (type.includes('condition')) return executeConditionNode(node, payload, context);
  if (type.includes('delay')) return executeDelayNode(node, payload, context);
  if (type.includes('notify')) return executeNotifyNode(node, payload, context);

  return { output: { skipped: true, reason: `Unsupported node type: ${type}` }, payload };
};

const chooseNextNodeIds = (node, allEdges, nodeResult) => {
  const outgoing = allEdges.filter((e) => e.source === node.id);
  if (outgoing.length === 0) return [];

  const type = getNodeType(node);
  if (!type.includes('condition')) {
    return outgoing.map((e) => e.target);
  }

  const result = !!nodeResult?.output?.result;
  const trueRegex = /true|yes|pass|success|then/i;
  const falseRegex = /false|no|fail|else/i;

  const matched = outgoing.find((e) => {
    const label = String(e.label || '');
    return result ? trueRegex.test(label) : falseRegex.test(label);
  });

  if (matched) return [matched.target];

  if (!result) {
    const err = new Error('Condition not met');
    err.statusCode = 400;
    throw err;
  }

  if (outgoing.length === 1) return [outgoing[0].target];
  return [outgoing[0].target];
};

const validateConditionExpression = (expression) => {
  const expr = String(expression || '').trim();
  if (!expr) return true;
  Jexl.compile(expr);
  return true;
};

module.exports = {
  getNodeType,
  executeNode,
  chooseNextNodeIds,
  validateConditionExpression,
};
