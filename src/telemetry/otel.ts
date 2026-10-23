import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export const telemetrySdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'enterprise-checkout-engine',
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'https://otel-collector.internal.fintech.net/v1/traces',
  }),
});

telemetrySdk.start();
