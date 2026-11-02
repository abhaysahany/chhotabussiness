/**
 * Legacy adminSalesService.js
 * Re-exports everything from adminOrdersService.js for 100% backward compatibility.
 */
export * from './adminOrdersService';
import * as adminOrdersService from './adminOrdersService';
export default adminOrdersService;
