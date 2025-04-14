/**
 * Decorator to measure the execution time of a method
 */
export function measureExecutionTime() {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;
  
      descriptor.value = async function (...args: any[]) {
        const start = process.hrtime();
        
        try {
          return await originalMethod.apply(this, args);
        } finally {
          const end = process.hrtime(start);
          const executionTime = (end[0] * 1000 + end[1] / 1000000).toFixed(2);
          console.log(`Execution time for ${propertyKey}: ${executionTime}ms`);
        }
      };
  
      return descriptor;
    };
  }