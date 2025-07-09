// Query Parameter Builder - Single Responsibility: Query string building
export class QueryParameterBuilder {
  static build(filters = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (this.isValidValue(value)) {
        queryParams.append(key, value.toString());
      }
    });
    
    return queryParams.toString();
  }
  
  static isValidValue(value) {
    return value !== undefined && value !== null && value !== '';
  }
} 