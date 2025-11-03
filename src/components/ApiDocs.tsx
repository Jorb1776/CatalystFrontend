// src/components/ApiDocs.tsx
import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

const ApiDocs: React.FC = () => {
  return <SwaggerUI url="https://localhost:7280/swagger/v1/swagger.json" />;
};

export default ApiDocs;