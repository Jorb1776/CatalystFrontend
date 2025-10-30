import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocs() {
  return <SwaggerUI url="https://localhost:7280/swagger/v1/swagger.json" />;
}