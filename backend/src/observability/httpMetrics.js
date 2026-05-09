const metrics = new Map();

const getKey = (method, route, statusCode) => `${method}|${route}|${statusCode}`;

const normalizeRoute = (req) => {
  if (req.route?.path) {
    return `${req.baseUrl || ''}${req.route.path}`;
  }

  return req.originalUrl?.split('?')[0] || req.path || 'unknown';
};

const recordRequest = ({ method, route, statusCode, durationMs }) => {
  const key = getKey(method, route, statusCode);
  const current = metrics.get(key) || { count: 0, sum: 0 };
  current.count += 1;
  current.sum += durationMs;
  metrics.set(key, current);
};

const createHttpMetricsMiddleware = () => (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    recordRequest({
      method: req.method,
      route: normalizeRoute(req),
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
};

const formatLabels = (labels) => Object.entries(labels)
  .map(([key, value]) => `${key}="${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
  .join(',');

const getMetricsText = () => {
  const lines = [
    '# HELP workflow_builder_http_requests_total Total HTTP requests',
    '# TYPE workflow_builder_http_requests_total counter',
    '# HELP workflow_builder_http_request_duration_ms_sum Total HTTP request duration in milliseconds',
    '# TYPE workflow_builder_http_request_duration_ms_sum counter',
    '# HELP workflow_builder_http_request_duration_ms_count Total HTTP request observations',
    '# TYPE workflow_builder_http_request_duration_ms_count counter',
  ];

  for (const [key, value] of metrics.entries()) {
    const [method, route, statusCode] = key.split('|');
    const labels = formatLabels({ method, route, status: statusCode });
    lines.push(`workflow_builder_http_requests_total{${labels}} ${value.count}`);
    lines.push(`workflow_builder_http_request_duration_ms_sum{${labels}} ${value.sum.toFixed(3)}`);
    lines.push(`workflow_builder_http_request_duration_ms_count{${labels}} ${value.count}`);
  }

  return `${lines.join('\n')}\n`;
};

module.exports = {
  createHttpMetricsMiddleware,
  getMetricsText,
};